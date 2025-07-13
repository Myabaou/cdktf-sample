import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Environment } from "./environment";
import { VpcModule } from "../modules/vpc";
import { SqsModule } from "../modules/sqs";
import { Cdn } from "../.gen/modules/cdn"; // Assuming you have a Cdn module

interface InfraStackProps {
  stage: string;
  environment: Environment;
}

export class InfraStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id);

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: "ap-northeast-1",
    });

    // VPC Module
    new VpcModule(this, "vpc", {
      stage: props.stage,
      cidr: props.environment.cidr,
      enableNatGateway: props.environment.enableNatGateway,
      oneNatGatewayPerAz: props.environment.oneNatGatewayPerAz,
    });

    // SQS Module
    new SqsModule(this, "sqs", {
      stage: props.stage,
      enableDlq: props.environment.sqs.enableDlq,
      visibilityTimeoutSeconds: props.environment.sqs.visibilityTimeoutSeconds,
      messageRetentionSeconds: props.environment.sqs.messageRetentionSeconds,
      maxReceiveCount: props.environment.sqs.maxReceiveCount,
    });

    // Cloudfront CDN Module
    const cloudFront = new Cdn(this, "cdn", {
      createDistribution: true,
      comment: `${props.stage} CloudFront Distribution`,
      enabled: true,

      // 必須: Origin設定（オブジェクト形式）
      origin: {
        "default-origin": {
          domain_name: "1101.com", // 実際のオリジンドメインに変更してください
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
    // Cloudfrontの情報を出力
    new TerraformOutput(this, "cloudfront_distribution_domain_name", {
      value: cloudFront.cloudfrontDistributionDomainNameOutput,
      description: "The domain name of the CloudFront distribution",
    });
  }
}
