export type Stages = "dev" | "stg" | "prd";

export interface Environment {
  awsAccountId?: string;
  region: string;
  cidr: string;
  enableNatGateway: boolean;
  oneNatGatewayPerAz: boolean;
  sqs: {
    enableDlq: boolean;
    visibilityTimeoutSeconds: number;
    messageRetentionSeconds: number;
    maxReceiveCount: number;
  };
}

export const environmentProps: { [key in Stages]: Environment } = {
  dev: {
    region: "ap-northeast-1",
    cidr: "10.21.0.0/16",
    enableNatGateway: false,
    oneNatGatewayPerAz: false,
    sqs: {
      enableDlq: false,
      visibilityTimeoutSeconds: 30,
      messageRetentionSeconds: 1209600, // 14 days
      maxReceiveCount: 3,
    },
  },
  stg: {
    region: "ap-northeast-1",
    cidr: "10.22.0.0/16",
    enableNatGateway: true,
    oneNatGatewayPerAz: false,
    sqs: {
      enableDlq: true,
      visibilityTimeoutSeconds: 60,
      messageRetentionSeconds: 1209600, // 14 days
      maxReceiveCount: 3,
    },
  },
  prd: {
    region: "ap-northeast-1",
    cidr: "10.23.0.0/16",
    enableNatGateway: true,
    oneNatGatewayPerAz: true,
    sqs: {
      enableDlq: true,
      visibilityTimeoutSeconds: 120,
      messageRetentionSeconds: 1209600, // 14 days
      maxReceiveCount: 5,
    },
  },
};
