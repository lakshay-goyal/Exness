locals {
  repo_root          = abspath("${path.module}/../..")
  open_next_path     = "${local.repo_root}/apps/web/.open-next"
  build_script       = "${local.repo_root}/scripts/build-web-opennext.sh"
  build_trigger_hash = sha256(jsonencode({
    backend_url = var.web_env.next_public_backend_url
    docs_url    = var.web_env.next_public_docs_url
  }))
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "server_function"
  region = var.aws_region
}

provider "aws" {
  alias  = "iam"
  region = var.aws_region
}

provider "aws" {
  alias  = "dns"
  region = var.aws_region
}

provider "aws" {
  alias  = "global"
  region = "ap-south-1"
}

resource "null_resource" "build_web_opennext" {
  count = var.build_on_apply ? 1 : 0

  triggers = {
    build_hash = local.build_trigger_hash
  }

  provisioner "local-exec" {
    command     = local.build_script
    working_dir = local.repo_root

    environment = {
      NEXT_PUBLIC_BACKEND_URL = var.web_env.next_public_backend_url
      NEXT_PUBLIC_DOCS_URL    = var.web_env.next_public_docs_url
    }
  }
}

module "web_opennext" {
  source  = "RJPearson94/open-next/aws//modules/tf-aws-open-next-zone"
  version = "3.6.2"

  depends_on = [null_resource.build_web_opennext]

  folder_path       = local.open_next_path
  prefix            = var.project_name
  open_next_version = "v3.x.x"

  server_function = {
    memory_size = var.server_function.memory_size
    timeout     = var.server_function.timeout
    additional_environment_variables = var.web_env.lambda_env
  }

  image_optimisation_function = {
    create      = var.image_optimisation_function.enabled
    memory_size = var.image_optimisation_function.memory_size
    timeout     = var.image_optimisation_function.timeout
  }

  # ISR tag cache is disabled in apps/web/open-next.config.ts; keep DynamoDB minimal.
  tag_mapping_db = {
    deployment = "NONE"
  }

  website_bucket = {
    force_destroy = var.force_destroy_bucket
  }

  domain_config = var.domain == null ? null : {
    sub_domain              = var.domain.subdomain
    include_www             = var.domain.include_www
    create_route53_entries  = var.domain.create_route53_entries
    hosted_zones = [
      {
        name = var.domain.hosted_zone_name
      }
    ]
    viewer_certificate = {
      acm_certificate_arn = var.domain.acm_certificate_arn
    }
  }

  providers = {
    aws                = aws
    aws.server_function = aws.server_function
    aws.iam            = aws.iam
    aws.dns            = aws.dns
    aws.global         = aws.global
  }
}
