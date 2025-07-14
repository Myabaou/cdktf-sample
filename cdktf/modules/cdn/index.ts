import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";
import { Cdn } from "../../.gen/modules/cdn";
import { S3 } from "../../.gen/modules/s3";
import { S3Object } from "@cdktf/provider-aws/lib/s3-object";
export interface CdnModuleProps {
  stage: string;
  domainName: string;
  aliases: string[];
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

    // S3 Bucket for static assets (プライベート設定)
    const s3Bucket = new S3(this, "s3-bucket", {
      bucket: `${props.stage}-it-sandbox-cdn-assets`,
      forceDestroy: true,
    });

    // S3 Object Upload
    new S3Object(this, "index-html", {
      bucket: s3Bucket.s3BucketIdOutput,
      key: "index.html",
      content: "<html><body><h1>Hello, World!</h1></body></html>",
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
          origin_access_control_id: "E1E8QBCQAMWFD4", // OACのIDを指定
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
      },
      viewerCertificate: props.certificateConfig || {},
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
