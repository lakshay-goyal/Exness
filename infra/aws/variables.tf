variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Prefix attached to created AWS resources."
  type        = string
  default     = "exness"
}

variable "instance_type" {
  description = "EC2 instance type. The full stack (6 app containers + Postgres/Redis/Mongo) needs ~4 GB RAM. Default is free-tier-eligible on new AWS Free Plan accounts, which reject non-eligible types (t3.medium etc.) until upgraded to a paid plan."
  type        = string
  default     = "c7i-flex.large"
}

variable "root_volume_gb" {
  description = "Root EBS volume size in GB. Holds Docker images and database volumes."
  type        = number
  default     = 30
}

variable "web_domain" {
  description = "Public hostname for the web app, served by the nginx reverse proxy."
  type        = string
  default     = "exness.lakshaygoyal.in"
}

variable "letsencrypt_email" {
  description = "Email registered with Let's Encrypt for certificate expiry notices."
  type        = string
  default     = "lakshaygoyal201@gmail.com"
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS:Edit on the zone. Empty disables Terraform-managed DNS (see dns.tf)."
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for the apex domain. Empty disables Terraform-managed DNS (see dns.tf)."
  type        = string
  default     = ""
}

# ---------------------------------------------------------------------------
# Application secrets — injected by CI as TF_VAR_* from GitHub secrets,
# stored in SSM Parameter Store (SecureString), never exposed as outputs.
# ---------------------------------------------------------------------------

variable "jwt_secret" {
  description = "JWT signing secret for the backend."
  type        = string
  sensitive   = true
}

variable "better_auth_secret" {
  description = "better-auth secret (openssl rand -base64 32)."
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID."
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret."
  type        = string
  sensitive   = true
}

variable "user_email" {
  description = "SMTP sender address used by nodemailer."
  type        = string
  sensitive   = true
}

variable "user_password" {
  description = "SMTP app password used by nodemailer."
  type        = string
  sensitive   = true
}
