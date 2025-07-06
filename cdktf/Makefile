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
	@echo "  diff        Show differences between current and deployed state"
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
	@echo "  make diff STAGE=dev"
	@echo "  make deploy STAGE=stg"
	@echo "  make destroy STAGE=prd"

build: ## Build the project
	npm run build

get: ## Get providers and modules
	npm run get

synth: ## Synthesize Terraform configuration
	STAGE=$(STAGE) npm run synth

diff: ## Show differences between current and deployed state
	STAGE=$(STAGE) cdktf diff

deploy: ## Deploy infrastructure
	STAGE=$(STAGE) cdktf deploy

destroy: ## Destroy infrastructure
	STAGE=$(STAGE) cdktf destroy

clean: ## Clean build artifacts
	rm -rf cdktf.out
	rm -rf node_modules
	rm -rf *.js
	rm -rf *.d.ts
	rm -rf lib/*.js
	rm -rf lib/*.d.ts
