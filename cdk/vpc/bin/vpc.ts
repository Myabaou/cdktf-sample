#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { VpcStack } from "../lib/vpc-stack";
import { environmentProps, Stages } from "../lib/environment";
import { Vpc } from "aws-cdk-lib/aws-ec2";

const stage = (process.env.STAGE as Stages) || "dev";
if (!stage) {
  throw new Error("STAGE environment variable is not set");
}

const environment = environmentProps[stage];
if (!environment) {
  throw new Error(`Environment configuration for stage "${stage}" not found`);
}

const app = new cdk.App();

const st = new cdk.Stage(app, stage, {
  env: {
    region: "ap-northeast-1", // 東京リージョン
  },
});

new VpcStack(st, "VpcStack", {
  stage,
  cidr: environment.cidr,
  enableNatGateway: environment.enableNatGateway,
  oneNatGatewayPerAz: environment.oneNatGatewayPerAz,
});
