import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";
import { Cdn } from "../../.gen/modules/cdn";

export interface CdnModuleProps {
  stage: string;
  domainName: string;
}

export class CdnModule extends Construct {
  public readonly distribution: Cdn;

  constructor(scope: Construct, id: string, props: CdnModuleProps) {
    super(scope, id);

    // CloudFront CDN Module
    this.distribution = new Cdn(this, "cloudfront", {
      createDistribution: true,
      comment: `${props.stage} CloudFront Distribution`,
      enabled: true,

      // 必須: Origin設定（オブジェクト形式）
      origin: {
        "default-origin": {
          domain_name: props.domainName,
          custom_origin_config: {
            http_port: 80,
            https_port: 443,
            origin_protocol_policy: "https-only",
            origin_ssl_protocols: ["TLSv1.2"],
          },
        },
      },

      // 必須: Default Cache Behavior（オブジェクト形式）
      defaultCacheBehavior: {
        target_origin_id: "default-origin",
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
