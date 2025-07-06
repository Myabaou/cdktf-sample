import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";

// VPC関連のインポート
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";

// SQS関連のインポート
import { SqsQueue } from "@cdktf/provider-aws/lib/sqs-queue";
import { SqsQueuePolicy } from "@cdktf/provider-aws/lib/sqs-queue-policy";
import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";

export interface InfraStackProps {
  stage: string;
  region: string;
  // VPC設定
  cidr: string;
  enableNatGateway: boolean;
  oneNatGatewayPerAz: boolean;
  // SQS設定
  sqs: {
    enableDlq: boolean;
    visibilityTimeoutSeconds: number;
    messageRetentionSeconds: number;
    maxReceiveCount: number;
  };
}

export class InfraStack extends TerraformStack {
  // VPC関連のプロパティ
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly isolatedSubnetIds: string[];

  // SQS関連のプロパティ
  public readonly mainQueueUrl: string;
  public readonly mainQueueArn: string;
  public readonly dlqUrl?: string;
  public readonly dlqArn?: string;

  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id);

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: props.region,
    });

    // Get current AWS account ID and availability zones
    const current = new DataAwsCallerIdentity(this, "current", {});
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    // ===================
    // VPC リソース
    // ===================

    // VPC
    const vpc = new Vpc(this, "vpc", {
      cidrBlock: props.cidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${props.stage}-vpc-cdktf`,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: {
        Name: `${props.stage}-igw-cdktf`,
      },
    });

    // Calculate subnet CIDRs
    const subnetCidrMask = Number(props.cidr.split("/")[1]) + 4; // 16 subnets

    // Public Subnets
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: vpc.id,
      tags: {
        Name: `${props.stage}-public-rt-cdktf`,
      },
    });

    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    // Create public subnets (2 AZs)
    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: this.calculateSubnetCidr(props.cidr, subnetCidrMask, i),
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${props.stage}-public-subnet-${i + 1}-cdktf`,
          Type: "Public",
        },
      });

      new RouteTableAssociation(this, `public-rt-assoc-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });

      publicSubnets.push(subnet);
    }

    // Private Subnets with NAT Gateway
    if (props.enableNatGateway) {
      const natGateways: NatGateway[] = [];

      // Create NAT Gateways
      const natGatewayCount = props.oneNatGatewayPerAz ? 2 : 1;
      for (let i = 0; i < natGatewayCount; i++) {
        const eip = new Eip(this, `nat-eip-${i}`, {
          domain: "vpc",
          tags: {
            Name: `${props.stage}-nat-eip-${i + 1}-cdktf`,
          },
        });

        const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
          allocationId: eip.id,
          subnetId: publicSubnets[i].id,
          tags: {
            Name: `${props.stage}-nat-gateway-${i + 1}-cdktf`,
          },
        });

        natGateways.push(natGateway);
      }

      // Create private subnets
      for (let i = 0; i < 2; i++) {
        const subnet = new Subnet(this, `private-subnet-${i}`, {
          vpcId: vpc.id,
          cidrBlock: this.calculateSubnetCidr(
            props.cidr,
            subnetCidrMask,
            i + 2
          ),
          availabilityZone: `\${${azs.fqn}.names[${i}]}`,
          tags: {
            Name: `${props.stage}-private-subnet-${i + 1}-cdktf`,
            Type: "Private",
          },
        });

        // Route table for private subnet
        const privateRouteTable = new RouteTable(this, `private-rt-${i}`, {
          vpcId: vpc.id,
          tags: {
            Name: `${props.stage}-private-rt-${i + 1}-cdktf`,
          },
        });

        // Route to NAT Gateway
        const natGatewayIndex = props.oneNatGatewayPerAz ? i : 0;
        new Route(this, `private-route-${i}`, {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: "0.0.0.0/0",
          natGatewayId: natGateways[natGatewayIndex].id,
        });

        new RouteTableAssociation(this, `private-rt-assoc-${i}`, {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        });

        privateSubnets.push(subnet);
      }
    }

    // Isolated Subnets
    const isolatedSubnets: Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `isolated-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: this.calculateSubnetCidr(props.cidr, subnetCidrMask, i + 4),
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        tags: {
          Name: `${props.stage}-isolated-subnet-${i + 1}-cdktf`,
          Type: "Isolated",
        },
      });

      isolatedSubnets.push(subnet);
    }

    // ===================
    // SQS リソース
    // ===================

    // Dead Letter Queue (if enabled)
    let dlq: SqsQueue | undefined;
    if (props.sqs.enableDlq) {
      dlq = new SqsQueue(this, "dlq", {
        name: `${props.stage}-dlq-cdktf`,
        messageRetentionSeconds: props.sqs.messageRetentionSeconds,
        tags: {
          Name: `${props.stage}-dlq-cdktf`,
          Environment: props.stage,
          ManagedBy: "CDKTF",
        },
      });

      this.dlqUrl = dlq.url;
      this.dlqArn = dlq.arn;
    }

    // Main Queue
    const mainQueue = new SqsQueue(this, "main-queue", {
      name: `${props.stage}-main-queue-cdktf`,
      visibilityTimeoutSeconds: props.sqs.visibilityTimeoutSeconds,
      messageRetentionSeconds: props.sqs.messageRetentionSeconds,
      redrivePolicy:
        props.sqs.enableDlq && dlq
          ? JSON.stringify({
              deadLetterTargetArn: dlq.arn,
              maxReceiveCount: props.sqs.maxReceiveCount,
            })
          : undefined,
      tags: {
        Name: `${props.stage}-main-queue-cdktf`,
        Environment: props.stage,
        ManagedBy: "CDKTF",
      },
    });

    // Queue Policy
    const queuePolicyDocument = new DataAwsIamPolicyDocument(
      this,
      "queue-policy-document",
      {
        statement: [
          {
            sid: "AllowCurrentAccountAccess",
            effect: "Allow",
            principals: [
              {
                type: "AWS",
                identifiers: ["*"],
              },
            ],
            actions: [
              "sqs:SendMessage",
              "sqs:ReceiveMessage",
              "sqs:DeleteMessage",
              "sqs:GetQueueAttributes",
            ],
            resources: [mainQueue.arn],
            condition: [
              {
                test: "StringEquals",
                variable: "aws:SourceAccount",
                values: [current.accountId],
              },
            ],
          },
        ],
      }
    );

    new SqsQueuePolicy(this, "queue-policy", {
      queueUrl: mainQueue.url,
      policy: queuePolicyDocument.json,
    });

    // Store values for reference
    this.vpcId = vpc.id;
    this.publicSubnetIds = publicSubnets.map((subnet) => subnet.id);
    this.privateSubnetIds = privateSubnets.map((subnet) => subnet.id);
    this.isolatedSubnetIds = isolatedSubnets.map((subnet) => subnet.id);
    this.mainQueueUrl = mainQueue.url;
    this.mainQueueArn = mainQueue.arn;

    // ===================
    // Terraform Outputs
    // ===================

    // VPC Outputs
    new TerraformOutput(this, "vpc_id", {
      value: vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "public_subnet_ids", {
      value: publicSubnets.map((subnet) => subnet.id),
      description: "Public subnet IDs",
    });

    new TerraformOutput(this, "private_subnet_ids", {
      value: privateSubnets.map((subnet) => subnet.id),
      description: "Private subnet IDs",
    });

    new TerraformOutput(this, "isolated_subnet_ids", {
      value: isolatedSubnets.map((subnet) => subnet.id),
      description: "Isolated subnet IDs",
    });

    // SQS Outputs
    new TerraformOutput(this, "main_queue_url", {
      value: mainQueue.url,
      description: "Main SQS Queue URL",
    });

    new TerraformOutput(this, "main_queue_arn", {
      value: mainQueue.arn,
      description: "Main SQS Queue ARN",
    });

    if (props.sqs.enableDlq && dlq) {
      new TerraformOutput(this, "dlq_url", {
        value: dlq.url,
        description: "Dead Letter Queue URL",
      });

      new TerraformOutput(this, "dlq_arn", {
        value: dlq.arn,
        description: "Dead Letter Queue ARN",
      });
    }
  }

  private calculateSubnetCidr(
    vpcCidr: string,
    subnetMask: number,
    subnetIndex: number
  ): string {
    const [baseIp] = vpcCidr.split("/");
    const [a, b, c, d] = baseIp.split(".").map(Number);

    const subnetSize = Math.pow(2, 32 - subnetMask);
    const subnetIncrement = subnetSize / 256;

    return `${a}.${b}.${c + subnetIndex * subnetIncrement}.${d}/${subnetMask}`;
  }
}
