import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";

export interface VpcModuleProps {
  stage: string;
  cidr: string;
  enableNatGateway: boolean;
  oneNatGatewayPerAz: boolean;
}

export interface VpcModuleOutputs {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  isolatedSubnetIds: string[];
}

export class VpcModule extends Construct {
  public readonly outputs: VpcModuleOutputs;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    // VPC
    const vpc = new Vpc(this, "vpc", {
      cidrBlock: props.cidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${props.stage}-vpc-cdktf`,
        Environment: props.stage,
        ManagedBy: "CDKTF",
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: {
        Name: `${props.stage}-igw-cdktf`,
        Environment: props.stage,
        ManagedBy: "CDKTF",
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
        Environment: props.stage,
        ManagedBy: "CDKTF",
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
          Environment: props.stage,
          ManagedBy: "CDKTF",
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
            Environment: props.stage,
            ManagedBy: "CDKTF",
          },
        });

        const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
          allocationId: eip.id,
          subnetId: publicSubnets[i].id,
          tags: {
            Name: `${props.stage}-nat-gateway-${i + 1}-cdktf`,
            Environment: props.stage,
            ManagedBy: "CDKTF",
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
            Environment: props.stage,
            ManagedBy: "CDKTF",
          },
        });

        // Route table for private subnet
        const privateRouteTable = new RouteTable(this, `private-rt-${i}`, {
          vpcId: vpc.id,
          tags: {
            Name: `${props.stage}-private-rt-${i + 1}-cdktf`,
            Environment: props.stage,
            ManagedBy: "CDKTF",
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
          Environment: props.stage,
          ManagedBy: "CDKTF",
        },
      });

      isolatedSubnets.push(subnet);
    }

    // Store outputs
    this.outputs = {
      vpcId: vpc.id,
      publicSubnetIds: publicSubnets.map((subnet) => subnet.id),
      privateSubnetIds: privateSubnets.map((subnet) => subnet.id),
      isolatedSubnetIds: isolatedSubnets.map((subnet) => subnet.id),
    };

    // Terraform Outputs
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
