import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Environment } from "./environment";
import { VpcModule } from "../modules/vpc";
import { SqsModule } from "../modules/sqs";

interface InfraStackProps {
  stage: string;
  environment: Environment;
}

export class InfraStack extends TerraformStack {
  public readonly vpcModule: VpcModule;
  public readonly sqsModule: SqsModule;

  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id);

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: "ap-northeast-1",
    });

    // VPC Module
    this.vpcModule = new VpcModule(this, "vpc", {
      stage: props.stage,
      cidr: props.environment.cidr,
      enableNatGateway: props.environment.enableNatGateway,
      oneNatGatewayPerAz: props.environment.oneNatGatewayPerAz,
    });

    // SQS Module
    this.sqsModule = new SqsModule(this, "sqs", {
      stage: props.stage,
      enableDlq: props.environment.sqs.enableDlq,
      visibilityTimeoutSeconds: props.environment.sqs.visibilityTimeoutSeconds,
      messageRetentionSeconds: props.environment.sqs.messageRetentionSeconds,
      maxReceiveCount: props.environment.sqs.maxReceiveCount,
    });
  }
}
