# CDKTF Commands
# Usage: make <subcommand> [STAGE=<stage>]
# Example: make diff STAGE=dev
#          make deploy STAGE=stg

STAGE ?= dev
STACK_NAME = $(STAGE)-infra-stack

# Define CDKTF subcommands
CDKTF_COMMANDS := diff deploy destroy list watch plan apply output

# Define additional Terraform commands that are not part of CDKTF
TERRAFORM_COMMANDS := state show console import refresh validate

.PHONY: help build get synth clean $(CDKTF_COMMANDS) $(TERRAFORM_COMMANDS) tf

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
	@echo "Terraform Commands:"
	@echo "  state       Manage Terraform state (supports: list, show, mv, rm, etc.)"
	@echo "  show        Show current state or specific resource"
	@echo "  console     Interactive console"
	@echo "  import      Import existing infrastructure"
	@echo "  refresh     Refresh state"
	@echo "  validate    Validate configuration"
	@echo "  tf          Run any terraform command (use CMD parameter)"
	@echo ""
	@echo "Parameters:"
	@echo "  STAGE: dev (default), stg, prd"
	@echo "  TF: true (optional) - Use terraform commands directly instead of cdktf"
	@echo "  CMD: terraform command with arguments (for tf target only)"
	@echo ""
	@echo "Examples:"
	@echo "  make diff STAGE=dev      # Show differences for dev"
	@echo "  make deploy STAGE=stg    # Deploy to staging"
	@echo "  make destroy STAGE=prd   # Destroy production"
	@echo "  make TF=true plan        # Run: terraform plan"
	@echo "  make TF=true apply       # Run: terraform apply"
	@echo "  make \"state list\"        # Run: terraform state list"
	@echo "  make \"state mv src dest\" # Run: terraform state mv src dest"
	@echo "  make tf CMD=\"state list\" # Alternative: terraform state list"
	@echo "  make state list STAGE=dev # Run: terraform state list"

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
ifeq ($(TF),true)
	terraform -chdir=./cdktf.out/stacks/$(STACK_NAME) $@ $(filter-out $@,$(MAKECMDGOALS))
else
	NODE_NO_WARNINGS=1 STAGE=$(STAGE) cdktf $@ $(if $(filter-out list watch,$@),$(STACK_NAME))
endif

# Rule for Terraform-only commands
$(TERRAFORM_COMMANDS):
	terraform -chdir=./cdktf.out/stacks/$(STACK_NAME) $@ $(filter-out $@,$(MAKECMDGOALS))

# Generic rule for any terraform command with arguments
# Usage: make tf CMD="state mv src dest"
tf:
	terraform -chdir=./cdktf.out/stacks/$(STACK_NAME) $(CMD)

# Catch-all rule to handle any unmatched targets
# This enables: make "state list", make "state mv src dest", etc.
%:
	@if echo "$(MAKECMDGOALS)" | grep -q "state"; then \
		terraform -chdir=./cdktf.out/stacks/$(STACK_NAME) $(MAKECMDGOALS); \
	else \
		:; \
	fi