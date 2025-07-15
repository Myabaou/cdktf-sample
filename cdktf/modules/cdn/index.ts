import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";
import { Cdn } from "../../.gen/modules/cdn";
import { S3 } from "../../.gen/modules/s3";
import { S3Object } from "@cdktf/provider-aws/lib/s3-object";
import { CloudfrontFunction } from "@cdktf/provider-aws/lib/cloudfront-function";
export interface CdnModuleProps {
  stage: string;
  domainName: string;
  aliases: string[];
  s3bucketNameSuffix: string; // オプション: S3バケット名のサフィックス
  ipRestriction?: {
    enabled: boolean;
    allowedIps: string[];
  };
  certificateConfig?: {
    acm_certificate_arn: string;
    minimum_protocol_version?: string;
    ssl_support_method?: string;
    cloudfront_default_certificate?: boolean;
  };
}

export class CdnModule extends Construct {
  public readonly distribution: Cdn;

  constructor(scope: Construct, id: string, props: CdnModuleProps) {
    super(scope, id);

    // IP制限用のCloudFront Function
    let ipRestrictionFunction: CloudfrontFunction | undefined;

    if (props.ipRestriction?.enabled) {
      // ip-restriction.jsを読み込み、allowedIPsを置換
      const fs = require("fs");
      const path = require("path");
      const jsPath = path.join(__dirname, "functions", "ip-restriction.js");
      let jsCode = fs.readFileSync(jsPath, "utf8");
      // allowedIPs = [...] の部分をprops.ipRestriction.allowedIpsで置換
      jsCode = jsCode.replace(
        /var allowedIPs = \[[^\]]*\];/,
        `var allowedIPs = ${JSON.stringify(props.ipRestriction.allowedIps)};`
      );
      ipRestrictionFunction = new CloudfrontFunction(
        this,
        "ip-restriction-function",
        {
          name: `${props.stage}-ip-restriction`,
          runtime: "cloudfront-js-1.0",
          comment: `IP restriction function for ${props.stage} environment`,
          publish: true,
          code: jsCode,
        }
      );
    }

    // S3 Bucket for static assets (プライベート設定)
    const s3Bucket = new S3(this, "s3-bucket", {
      bucket: `${props.stage}${props.s3bucketNameSuffix}`,
      forceDestroy: true,
    });

    // S3 Object Upload
    const fs = require("fs");
    const path = require("path");
    const htmlContent = fs.readFileSync(path.join(__dirname, "content", "index.html"), "utf8");
    
    new S3Object(this, "index-html", {
      bucket: s3Bucket.s3BucketIdOutput,
      key: "index.html",
      content: htmlContent,
      contentType: "text/html", // HTMLとして表示させるためのContent-Type
    });

    // CloudFront CDN Module
    this.distribution = new Cdn(this, "cloudfront", {
      createDistribution: true,
      comment: `${props.stage} CloudFront Distribution`,
      enabled: true,
      httpVersion: "http2and3", // HTTPバージョンをHTTP/2とHTTP/3に設定
      aliases: props.aliases, // ドメイン名をエイリアスとして設定

      // 必須: Origin設定（S3のみをオリジンとして設定）
      origin: {
        s3_origin: {
          domain_name: s3Bucket.s3BucketBucketRegionalDomainNameOutput,
          //   origin_access_control: `${props.stage}-oac`, // OACのIDを指定
          origin_access_control_id: "E1E8QBCQAMWFD4", // OACのIDを指定　origin_access_controlが機能しないため固定の値
        },
      },

      // Origin Access Control設定
      createOriginAccessControl: true,
      originAccessControl: {
        s3_oac: {
          name: `${props.stage}-oac`,
          description: `OAC for ${props.stage} S3 bucket`,
          origin_type: "s3", // 修正: origin_access_control_origin_type → origin_type
          signing_behavior: "always",
          signing_protocol: "sigv4",
        },
      },

      // 必須: Default Cache Behavior（オブジェクト形式）
      defaultCacheBehavior: {
        target_origin_id: "s3_origin", // 修正: オリジンIDと一致させる
        viewer_protocol_policy: "redirect-to-https",
        allowed_methods: [
          "DELETE",
          "GET",
          "HEAD",
          "OPTIONS",
          "PATCH",
          "POST",
          "PUT",
        ],
        cached_methods: ["GET", "HEAD"],
        compress: true,
        query_string: false,
        cookies_forward: "none",
        // IP制限Functionが有効な場合はオブジェクト形式で設定
        function_association:
          props.ipRestriction?.enabled && ipRestrictionFunction
            ? {
                "viewer-request": {
                  function_arn: ipRestrictionFunction.arn,
                },
              }
            : undefined,
      },
      ...(props.certificateConfig ? { viewerCertificate: props.certificateConfig } : {}),
    });

    // CDN関連の出力をすべてここで定義
    new TerraformOutput(this, "cloudfront_distribution_domain_name", {
      value: this.distribution.cloudfrontDistributionDomainNameOutput,
      description: "The domain name of the CloudFront distribution",
    });

    new TerraformOutput(this, "cloudfront_distribution_id", {
      value: this.distribution.cloudfrontDistributionIdOutput,
      description: "The ID of the CloudFront distribution",
    });

    new TerraformOutput(this, "cloudfront_distribution_arn", {
      value: this.distribution.cloudfrontDistributionArnOutput,
      description: "The ARN of the CloudFront distribution",
    });
  }
}
