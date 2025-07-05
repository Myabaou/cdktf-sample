# CDK Commands
# Usage: make <command> [STAGE=<stage>] [STACK=<stack>]
# Example: make diff STAGE=dev
#          make deploy STAGE=stg STACK=VpcStack

STAGE ?= dev
STACK ?= VpcStack
STACK_NAME = $(STAGE)/$(STACK)

.PHONY: help bootstrap diff deploy destroy synth ls clean diff-all deploy-all destroy-all

help: ## Show help
	@echo "Usage: make <command> [STAGE=<stage>] [STACK=<stack>]"
	@echo ""
	@echo "Commands:"
	@echo "  diff        Show differences between current and deployed stack"
	@echo "  deploy      Deploy stack"
	@echo "  destroy     Destroy stack"
	@echo "  synth       Synthesize CloudFormation template"
	@echo "  diff-all    Show differences for all stacks"
	@echo "  deploy-all  Deploy all stacks"
	@echo "  destroy-all Destroy all stacks"
	@echo "  bootstrap   Bootstrap CDK (run once per AWS account/region)"
	@echo "  ls          List all stacks"
	@echo "  clean       Clean build artifacts"
	@echo ""
	@echo "Parameters:"
	@echo "  STAGE: dev (default), stg, prd"
	@echo "  STACK: VpcStack (default), or specific stack name"
	@echo ""
	@echo "Examples:"
	@echo "  make diff STAGE=dev                # VpcStack in dev"
	@echo "  make diff-all STAGE=dev            # All stacks in dev"
	@echo "  make deploy STAGE=stg STACK=ApiStack  # Specific stack"
	@echo "  make destroy STAGE=prd             # VpcStack in prd"

bootstrap: ## Bootstrap CDK (run once per AWS account/region)
	npx cdk bootstrap

diff: ## Show differences between current and deployed stack
	STAGE=$(STAGE) npx cdk diff $(STACK_NAME)

deploy: ## Deploy stack
	STAGE=$(STAGE) npx cdk deploy $(STACK_NAME)

destroy: ## Destroy stack
	STAGE=$(STAGE) npx cdk destroy $(STACK_NAME)

synth: ## Synthesize CloudFormation template
	STAGE=$(STAGE) npx cdk synth $(STACK_NAME)

diff-all: ## Show differences for all stacks
	STAGE=$(STAGE) npm run diff

deploy-all: ## Deploy all stacks
	STAGE=$(STAGE) npm run deploy

destroy-all: ## Destroy all stacks
	STAGE=$(STAGE) npm run destroy

ls: ## List all stacks
	STAGE=$(STAGE) npx cdk ls

clean: ## Clean build artifacts
	rm -rf cdk.out
	rm -rf node_modules
	rm -rf *.js
	rm -rf *.d.ts
