# cdktf-sample

cdktf-sample

## CDK

### Setup

- Init

```sh
npx aws-cdk init -l typescript
```

- Bootstrap (初回のみ)

```sh
make bootstrap
```

### Development Commands

Use Makefile for convenient CDK operations:

```sh
# Show help
make help

# Single stack (default: VpcStack)
make diff STAGE=dev      # Show differences for VpcStack
make deploy STAGE=stg    # Deploy VpcStack
make destroy STAGE=prd   # Destroy VpcStack

# All stacks in environment
make diff-all STAGE=dev      # Show differences for all stacks
make deploy-all STAGE=stg    # Deploy all stacks
make destroy-all STAGE=prd   # Destroy all stacks

# Specific stack
make diff STAGE=dev STACK=VpcStack
make deploy STAGE=stg STACK=ApiStack

# Default values (STAGE=dev, STACK=VpcStack)
make diff                # Same as: make diff STAGE=dev STACK=VpcStack
make diff-all            # Same as: make diff-all STAGE=dev

# Direct npm commands
npm run diff:dev         # All stacks in dev
npm run deploy:stg       # All stacks in stg
npm run destroy:prd      # All stacks in prd

# Other commands
make bootstrap           # Bootstrap CDK
make ls                  # List all stacks
make clean               # Clean build artifacts
```

### Direct CDK Commands

```sh
# Synthesize
npx cdk synth

# Diff
npx cdk diff <stack-name>

# Deploy
npx cdk deploy <stack-name>
```
