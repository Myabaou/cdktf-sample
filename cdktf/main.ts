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
// VPCモジュールとSQSモジュールが分離されており、コードの可読性と保守性が向上
// 新しいリソースを追加する場合は、新しいモジュールを作成してこのスタックに追加
new InfraStack(app, `${stage}-infra-stack`, {
  stage,
  environment,
});

// 将来的に追加可能なリソース例:
//
// RDS、ElastiCache、Lambda、API Gateway、ALB、
// CloudWatch、X-Ray等を同じinfrra-stackに追加していくことで、
// 環境ごとに単一のスタックでライフサイクルを管理できます
//
// モジュール化により、各リソースタイプの定義は別ファイルに分離され、
// 保守性と可読性が向上します

app.synth();
