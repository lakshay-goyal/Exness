# Database credentials are generated here (URL-safe, no special chars) and
# app secrets come in via TF_VAR_*. Everything lands in SSM Parameter Store
# as SecureString; the instance reads them at deploy time. Nothing is ever
# emitted as a Terraform output.

resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "random_password" "mongo" {
  length  = 32
  special = false
}

locals {
  ssm_prefix = "/${var.project_name}/prod"

  app_secrets = {
    POSTGRES_PASSWORD    = random_password.postgres.result
    MONGO_PASSWORD       = random_password.mongo.result
    JWT_SECRET           = var.jwt_secret
    BETTER_AUTH_SECRET   = var.better_auth_secret
    GOOGLE_CLIENT_ID     = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    USER_EMAIL           = var.user_email
    USER_PASSWORD        = var.user_password
  }
}

resource "aws_ssm_parameter" "app_secret" {
  for_each = local.app_secrets

  name  = "${local.ssm_prefix}/${each.key}"
  type  = "SecureString"
  value = each.value
}
