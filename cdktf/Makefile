# CDKTF Commands
# Usage: make <command> [STAGE=<stage>]
# Example: make diff STAGE=dev
#          make deploy STAGE=stg

STAGE ?= dev

.PHONY: help build diff deploy destroy synth get clean

help: ## Show help
	@echo "Usage: make <command> [STAGE=<stage>]"
	@echo ""
	@echo "Commands:"
	@echo "  build       Build the project"
	@echo "  diff        Show differences for infrastructure"
	@echo "  deploy      Deploy infrastructure"
	@echo "  destroy     Destroy infrastructure"
	@echo "  synth       Synthesize Terraform configuration"
	@echo "  get         Get providers and modules"
	@echo "  clean       Clean build artifacts"
	@echo ""
	@echo "Parameters:"
	@echo "  STAGE: dev (default), stg, prd"
	@echo ""
	@echo "Examples:"
	@echo "  make diff STAGE=dev          # Show differences for dev environment"
	@echo "  make deploy STAGE=stg        # Deploy to staging environment"
	@echo "  make destroy STAGE=prd       # Destroy production environment"
	@echo ""
	@echo "Note: All resources (VPC, SQS, etc.) are managed in a single stack"
	@echo "      per environment. Adding new resources requires no Makefile changes."

build: ## Build the project
	npm run build

get: ## Get providers and modules
	npm run get

synth: ## Synthesize Terraform configuration
	STAGE=$(STAGE) npm run synth

diff: ## Show differences between current and deployed state
	STAGE=$(STAGE) cdktf diff $(STAGE)-infra-stack

deploy: ## Deploy infrastructure
	STAGE=$(STAGE) cdktf deploy $(STAGE)-infra-stack --auto-approve

destroy: ## Destroy infrastructure
	STAGE=$(STAGE) cdktf destroy $(STAGE)-infra-stack

clean: ## Clean build artifacts
	rm -rf cdktf.out
	rm -rf node_modules
	rm -rf *.js
	rm -rf *.d.ts
	rm -rf lib/*.js
	rm -rf lib/*.d.ts
