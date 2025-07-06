# CDKTF Sample

CDK for Terraform with environment-specific configuration

## Architecture

This project uses a **single stack per environment** approach, where all resources (VPC, SQS, etc.) are managed within a single infrastructure stack. This design provides several benefits:

- **Simplified Management**: One command to deploy/destroy all resources
- **No Makefile Maintenance**: Adding new resources requires no Makefile changes
- **Consistent Lifecycle**: All resources are deployed and destroyed together
- **Environment Isolation**: Each environment (dev/stg/prd) has its own stack

## Setup

- Init CDKTF project

```sh
cdktf init --template=typescript --local
```

- Install dependencies

```sh
npm install
```

- Get providers

```sh
npm run get
```

## Development Commands

Use Makefile for convenient CDKTF operations:

```sh
# Show help
make help

# Build and synthesize
make build               # Build TypeScript
make synth STAGE=dev     # Synthesize Terraform configuration

# Infrastructure management
make diff STAGE=dev      # Show differences for all resources
make deploy STAGE=stg    # Deploy all resources to staging
make destroy STAGE=prd   # Destroy all resources in production

# Default values (STAGE=dev)
make diff                # Same as: make diff STAGE=dev
make deploy              # Same as: make deploy STAGE=dev

# Direct npm commands
npm run diff:dev         # dev environment
npm run deploy:stg       # stg environment
npm run destroy:prd      # prd environment

# Other commands
make get                 # Get providers and modules
make clean               # Clean build artifacts
```

## Direct CDKTF Commands

```sh
# Build
npm run build

# Synthesize
STAGE=dev npm run synth

# Deploy
STAGE=dev cdktf deploy

# Destroy
STAGE=dev cdktf destroy
```

## Environment Configuration

Environment-specific settings are defined in `lib/environment.ts`:

- **dev**: Development environment with minimal NAT Gateway
- **stg**: Staging environment with single NAT Gateway
- **prd**: Production environment with NAT Gateway per AZ

## Current Resources

The infrastructure stack (`InfraStack`) currently manages:

- **VPC**: Virtual Private Cloud with public/private subnets
- **SQS**: Simple Queue Service with optional DLQ

## Adding New Resources

To add new resources (e.g., RDS, Lambda, API Gateway):

1. Import the necessary providers in `lib/infra-stack.ts`
2. Add configuration to `lib/environment.ts`
3. Implement the resource in `InfraStack` class
4. Add outputs if needed for cross-resource references

No Makefile or script changes are required - the same commands work for any number of resources.
