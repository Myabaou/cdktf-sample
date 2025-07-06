import { App } from "cdktf";
import { VpcStack } from "./lib/vpc-stack";
import { environmentProps, Stages } from "./lib/environment";

const stage = (process.env.STAGE as Stages) || "dev";
if (!stage) {
  throw new Error("STAGE environment variable is not set");
}

const environment = environmentProps[stage];
if (!environment) {
  throw new Error(`Environment configuration for stage "${stage}" not found`);
}

const app = new App();

new VpcStack(app, `${stage}-vpc-stack`, {
  stage,
  region: environment.region,
  cidr: environment.cidr,
  enableNatGateway: environment.enableNatGateway,
  oneNatGatewayPerAz: environment.oneNatGatewayPerAz,
});

app.synth();
