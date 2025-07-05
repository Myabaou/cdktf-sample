import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as e2 from "aws-cdk-lib/aws-ec2";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface VpcStackProps extends cdk.StackProps {
  stage: string;
  cidr: string;
  enableNatGateway: boolean;
  oneNatGatewayPerAz: boolean;
}

export class VpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'VpcQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const vpcCidrMask = Number(props.cidr.split("/")[1]);
    const subnetCidrMask = vpcCidrMask + 4; // 16 subnets, each with a /20 CIDR block

    const subnetConfiguration: e2.SubnetConfiguration[] = [
      {
        name: "Public",
        subnetType: e2.SubnetType.PUBLIC,
        cidrMask: subnetCidrMask,
      },
      {
        name: "Isolated",
        subnetType: e2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: subnetCidrMask,
      },
      // enableNatGateway　が　trueのときのみPRIVATE_WITH_EGRESSのサブネットを追加
      ...(props.enableNatGateway
        ? [
            {
              name: "Private",
              subnetType: e2.SubnetType.PRIVATE_WITH_EGRESS,
              cidrMask: subnetCidrMask,
            },
          ]
        : []),
    ];
    const natGateways = props.enableNatGateway
      ? props.oneNatGatewayPerAz
        ? 3
        : 1
      : 0;

    new e2.Vpc(this, "Vpc", {
      vpcName: `${props.stage}-vpc-cdk`,
      ipAddresses: e2.IpAddresses.cidr(props.cidr),
      subnetConfiguration: subnetConfiguration,
      natGateways: natGateways,
    });
  }
}
