# Deploy artifacts (rendered docker-compose + deploy script). The instance
# pulls these on every deploy, so template changes ship without recreating
# the instance.

resource "aws_s3_bucket" "artifacts" {
  bucket        = "${var.project_name}-deploy-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

locals {
  ecr_registry = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"

  backend_url = "http://${aws_eip.app.public_ip}:8000"
  web_url     = "http://${aws_eip.app.public_ip}:3001"
  docs_url    = "http://${aws_eip.app.public_ip}:3000"
}

resource "aws_s3_object" "compose_file" {
  bucket = aws_s3_bucket.artifacts.id
  key    = "deploy/docker-compose.yml"

  content = templatefile("${path.module}/templates/docker-compose.yml.tpl", {
    registry    = local.ecr_registry
    project     = var.project_name
    backend_url = local.backend_url
    web_url     = local.web_url
    docs_url    = local.docs_url
  })

  content_type = "text/yaml"
}

resource "aws_s3_object" "deploy_script" {
  bucket = aws_s3_bucket.artifacts.id
  key    = "deploy/deploy.sh"

  content = templatefile("${path.module}/templates/deploy.sh.tpl", {
    region           = var.aws_region
    registry         = local.ecr_registry
    ssm_prefix       = local.ssm_prefix
    artifacts_bucket = aws_s3_bucket.artifacts.bucket
  })

  content_type = "text/x-shellscript"
}
