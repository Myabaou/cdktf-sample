import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Environment } from "./environment";
import { VpcModule } from "../modules/vpc";
import { SqsModule } from "../modules/sqs";
import { CdnModule } from "../modules/cdn";

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
    new CdnModule(this, "cdn", {
      stage: props.stage,
      domainName: "hobonichi.co.jp", // 実際のオリジンドメインに変更してください
      aliases: ["mbs-test.it-sandbox.1101.com"],
    });
  }
}
