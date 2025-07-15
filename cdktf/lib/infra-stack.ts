import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Environment } from "./environment";
import { VpcModule } from "../modules/vpc";
import { SqsModule } from "../modules/sqs";
import { CdnModule } from "../modules/cdn";
import * as fs from "fs";
import * as path from "path";

interface InfraStackProps {
  stage: string;
  environment: Environment;
}

export class InfraStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id);

    // 設定ファイルから値を読み込み（なければダミー値を使用）
    const configPath = path.join(
      __dirname,
      "..",
      "config",
      `${props.stage}.ts`
    );
    let cdnConfig = {
      domainName: "example.com", // ダミー値
      aliases: ["dummy.example.com"], // ダミー値
      s3bucketNameSuffix: "-dummy-cdn-assets", // S3バケット名のサフィックス
      ipRestriction: {
        enabled: false, // ダミー値では無効
        allowedIps: ["127.0.0.1"], // ダミー値
      },
      certificateConfig: {
        cloudfront_default_certificate: true, // ダミー値
        minimum_protocol_version: "TLSv1.2_2021",
        ssl_support_method: "sni-only",
        acm_certificate_arn:
          "arn:aws:acm:us-east-1:123456789012:certificate/dummy-certificate-id", // ダミー値
      },
    };

    // TypeScript設定ファイルが存在する場合は動的インポート
    if (fs.existsSync(configPath)) {
      try {
        // 動的インポートでTypeScript設定ファイルを読み込み
        const configModule = require(configPath);
        if (configModule.cdnConfig) {
          cdnConfig = configModule.cdnConfig;
          console.log(`✅ Loaded CDN config from ${configPath}`);
        }
      } catch (error) {
        console.log(
          `⚠️  Error loading TypeScript config file, using default values:`,
          error
        );
      }
    } else {
      console.log(
        `⚠️  Config file not found (${configPath}), using dummy values for security`
      );
    }

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: "ap-northeast-1",
    });

    // VPC Module
    new VpcModule(this, "vpc", {
      stage: props.stage,
      cidr: props.environment.cidr,
      enableNatGateway: props.environment.enableNatGateway,
      oneNatGatewayPerAz: props.environment.oneNatGatewayPerAz,
    });

    // SQS Module
    new SqsModule(this, "sqs", {
      stage: props.stage,
      enableDlq: props.environment.sqs.enableDlq,
      visibilityTimeoutSeconds: props.environment.sqs.visibilityTimeoutSeconds,
      messageRetentionSeconds: props.environment.sqs.messageRetentionSeconds,
      maxReceiveCount: props.environment.sqs.maxReceiveCount,
    });

    // Cloudfront CDN Module
    new CdnModule(this, "cdn", {
      stage: props.stage,
      domainName: cdnConfig.domainName,
      aliases: cdnConfig.aliases,
      s3bucketNameSuffix: cdnConfig.s3bucketNameSuffix, // S3バケット名のサフィックス
      ipRestriction: cdnConfig.ipRestriction, // IP制限設定
      certificateConfig: cdnConfig.certificateConfig,
    });
  }
}
