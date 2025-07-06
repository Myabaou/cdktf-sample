import { App } from "cdktf";
import { InfraStack } from "./lib/infra-stack";
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

// 統合インフラストラクチャスタック - 環境に必要なすべてのリソースを管理
// VPC、SQS、その他のリソースを1つのスタックで管理することで、
// 新しいリソースを追加してもMakefileの修正が不要になります
new InfraStack(app, `${stage}-infra-stack`, {
  stage,
  region: environment.region,
  cidr: environment.cidr,
  enableNatGateway: environment.enableNatGateway,
  oneNatGatewayPerAz: environment.oneNatGatewayPerAz,
  sqs: environment.sqs,
});

// 将来的に追加可能なリソース例:
//
// RDS、ElastiCache、Lambda、API Gateway、ALB、
// CloudWatch、X-Ray等を同じinfrra-stackに追加していくことで、
// 環境ごとに単一のスタックでライフサイクルを管理できます
//
// これにより、新しいリソースを追加してもMakefileやCIの修正が不要になり、
// 運用負荷を軽減できます

app.synth();
