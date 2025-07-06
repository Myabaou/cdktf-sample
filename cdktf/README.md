# CDKTF Sample

CDK for Terraform with environment-specific configuration

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
make diff STAGE=dev      # Show differences
make deploy STAGE=stg    # Deploy infrastructure
make destroy STAGE=prd   # Destroy infrastructure

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
