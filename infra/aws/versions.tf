terraform {
  required_version = ">= 1.10.0"

  # Bucket, key, and region are injected by CI:
  #   terraform init \
  #     -backend-config="bucket=$TF_STATE_BUCKET" \
  #     -backend-config="key=exness/prod.tfstate" \
  #     -backend-config="region=$AWS_REGION"
  backend "s3" {
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.46.0, < 6.0.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.52"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}
