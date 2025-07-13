import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";
import { SqsQueue } from "@cdktf/provider-aws/lib/sqs-queue";
import { SqsQueuePolicy } from "@cdktf/provider-aws/lib/sqs-queue-policy";
import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";

export interface SqsModuleProps {
  stage: string;
  enableDlq: boolean;
  visibilityTimeoutSeconds: number;
  messageRetentionSeconds: number;
  maxReceiveCount: number;
}

export interface SqsModuleOutputs {
  mainQueueUrl: string;
  mainQueueArn: string;
  dlqUrl?: string;
  dlqArn?: string;
}

export class SqsModule extends Construct {
  public readonly outputs: SqsModuleOutputs;

  constructor(scope: Construct, id: string, props: SqsModuleProps) {
    super(scope, id);

    // Get current AWS account ID
    const current = new DataAwsCallerIdentity(this, "current", {});

    // Dead Letter Queue (if enabled)
    let dlq: SqsQueue | undefined;
    if (props.enableDlq) {
      dlq = new SqsQueue(this, "dlq", {
        name: `${props.stage}-dlq-cdktf`,
        messageRetentionSeconds: props.messageRetentionSeconds,
        tags: {
          Name: `${props.stage}-dlq-cdktf`,
          Environment: props.stage,
          ManagedBy: "CDKTF",
        },
      });
    }

    // Main Queue
    const mainQueue = new SqsQueue(this, "main-queue", {
      name: `${props.stage}-main-queue-cdktf`,
      visibilityTimeoutSeconds: props.visibilityTimeoutSeconds,
      messageRetentionSeconds: props.messageRetentionSeconds,
      redrivePolicy:
        props.enableDlq && dlq
          ? JSON.stringify({
              deadLetterTargetArn: dlq.arn,
              maxReceiveCount: props.maxReceiveCount,
            })
          : undefined,
      tags: {
        Name: `${props.stage}-main-queue-cdktf`,
        Environment: props.stage,
        ManagedBy: "CDKTF",
      },
    });

    // Queue Policy
    const queuePolicyDocument = new DataAwsIamPolicyDocument(
      this,
      "queue-policy-document",
      {
        statement: [
          {
            sid: "AllowCurrentAccountAccess",
            effect: "Allow",
            principals: [
              {
                type: "AWS",
                identifiers: ["*"],
              },
            ],
            actions: [
              "sqs:SendMessage",
              "sqs:ReceiveMessage",
              "sqs:DeleteMessage",
              "sqs:GetQueueAttributes",
            ],
            resources: [mainQueue.arn],
            condition: [
              {
                test: "StringEquals",
                variable: "aws:SourceAccount",
                values: [current.accountId],
              },
            ],
          },
        ],
      }
    );

    new SqsQueuePolicy(this, "queue-policy", {
      queueUrl: mainQueue.url,
      policy: queuePolicyDocument.json,
    });

    // Store outputs
    this.outputs = {
      mainQueueUrl: mainQueue.url,
      mainQueueArn: mainQueue.arn,
      dlqUrl: dlq?.url,
      dlqArn: dlq?.arn,
    };

    // Terraform Outputs
    new TerraformOutput(this, "main_queue_url", {
      value: mainQueue.url,
      description: "Main SQS Queue URL",
    });

    new TerraformOutput(this, "main_queue_arn", {
      value: mainQueue.arn,
      description: "Main SQS Queue ARN",
    });

    if (props.enableDlq && dlq) {
      new TerraformOutput(this, "dlq_url", {
        value: dlq.url,
        description: "Dead Letter Queue URL",
      });

      new TerraformOutput(this, "dlq_arn", {
        value: dlq.arn,
        description: "Dead Letter Queue ARN",
      });
    }
  }
}
