export type Stages = "dev" | "stg" | "prd";

export interface Environment {
  awsAccountId?: string;
  region: string;
  cidr: string;
  enableNatGateway: boolean;
  oneNatGatewayPerAz: boolean;
}

export const environmentProps: { [key in Stages]: Environment } = {
  dev: {
    region: "ap-northeast-1",
    cidr: "10.21.0.0/16",
    enableNatGateway: false,
    oneNatGatewayPerAz: false,
  },
  stg: {
    region: "ap-northeast-1",
    cidr: "10.22.0.0/16",
    enableNatGateway: true,
    oneNatGatewayPerAz: false,
  },
  prd: {
    region: "ap-northeast-1",
    cidr: "10.23.0.0/16",
    enableNatGateway: true,
    oneNatGatewayPerAz: true,
  },
};
