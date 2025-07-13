# CDKTF Commands
# Usage: make <subcommand> [STAGE=<stage>]
# Example: make diff STAGE=dev
#          make deploy STAGE=stg

STAGE ?= dev
STACK_NAME = $(STAGE)-infra-stack

# Define CDKTF subcommands
CDKTF_COMMANDS := diff deploy destroy list watch plan apply output

.PHONY: help build get synth clean $(CDKTF_COMMANDS)

help: ## Show help
	@echo "Usage: make <subcommand> [STAGE=<stage>]"
	@echo ""
	@echo "Build Commands:"
	@echo "  build       Build the project"
	@echo "  get         Get providers and modules"
	@echo "  synth       Synthesize Terraform configuration"
	@echo "  clean       Clean build artifacts"
	@echo ""
	@echo "CDKTF Commands:"
	@echo "  diff        Show differences for infrastructure"
	@echo "  deploy      Deploy infrastructure"
	@echo "  destroy     Destroy infrastructure"
	@echo "  list        List all stacks"
	@echo "  watch       Watch for changes and auto-synth"
	@echo "  plan        Show execution plan"
	@echo "  apply       Apply configuration"
	@echo "  output      Show stack outputs"
	@echo ""
	@echo "Parameters:"
	@echo "  STAGE: dev (default), stg, prd"
	@echo ""
	@echo "Examples:"
	@echo "  make diff STAGE=dev      # Show differences for dev"
	@echo "  make deploy STAGE=stg    # Deploy to staging"
	@echo "  make destroy STAGE=prd   # Destroy production"

# Build commands
build: ## Build the project
	NODE_NO_WARNINGS=1 npm run build

get: ## Get providers and modules
	NODE_NO_WARNINGS=1 npm run get

synth: ## Synthesize Terraform configuration
	NODE_NO_WARNINGS=1 STAGE=$(STAGE) npm run synth

clean: ## Clean build artifacts
	rm -rf cdktf.out
	rm -rf node_modules
	rm -rf *.js
	rm -rf *.d.ts
	rm -rf lib/*.js
	rm -rf lib/*.d.ts

# Dynamic rule for CDKTF commands
$(CDKTF_COMMANDS):
	NODE_NO_WARNINGS=1 STAGE=$(STAGE) cdktf $@ $(if $(filter-out list watch,$@),$(STACK_NAME))