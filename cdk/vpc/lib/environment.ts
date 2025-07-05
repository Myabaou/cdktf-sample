export type Stages = 'dev';

export interface Environment {
  cidr: string;
  enableNatGateway: boolean;
  oneNatGatewayPerAz: boolean;
}

export const environmentProps: {[key in Stages]: Environment} = {
  'dev': {
    cidr: '10.11.0.0/16',
    enableNatGateway: false,
    oneNatGatewayPerAz: false,
  },
};
