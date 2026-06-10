variable "aws_region" {
  description = "AWS region for regional Lambda, S3, and supporting resources."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix attached to created AWS resources."
  type        = string
  default     = "exness-web"
}

variable "build_on_apply" {
  description = "When true, runs scripts/build-web-opennext.sh during terraform apply."
  type        = bool
  default     = true
}

variable "force_destroy_bucket" {
  description = "Allow Terraform destroy to empty and remove the static assets S3 bucket."
  type        = bool
  default     = false
}

# ---------------------------------------------------------------------------
# Web service environment
# ---------------------------------------------------------------------------
# NEXT_PUBLIC_* variables are build-time only — they are inlined into the
# client bundle during `next build` / OpenNext packaging. Changing them
# requires a rebuild (set build_on_apply = true or run the build script).
#
# lambda_env is applied at Lambda runtime for server-side code paths.
# The current apps/web app is client-heavy and does not read server env
# vars beyond NODE_ENV, but the map is kept for future SSR/API routes.
# ---------------------------------------------------------------------------

variable "web_env" {
  description = "Environment configuration for the apps/web Next.js service."
  type = object({
    next_public_backend_url = string
    next_public_docs_url    = string
    lambda_env = optional(map(string), {
      NODE_ENV = "production"
    })
  })

  validation {
    condition     = can(regex("^https?://", var.web_env.next_public_backend_url))
    error_message = "web_env.next_public_backend_url must be an http(s) URL reachable from the browser."
  }

  validation {
    condition     = can(regex("^https?://", var.web_env.next_public_docs_url))
    error_message = "web_env.next_public_docs_url must be an http(s) URL reachable from the browser."
  }
}

variable "domain" {
  description = "Optional custom domain for the CloudFront distribution. Leave null to use the default *.cloudfront.net URL."
  type = object({
    hosted_zone_name        = string
    subdomain               = optional(string, "")
    acm_certificate_arn     = string
    include_www             = optional(bool, false)
    create_route53_entries  = optional(bool, true)
  })
  default = null
}

variable "server_function" {
  description = "Override OpenNext server Lambda settings."
  type = object({
    memory_size = optional(number, 1024)
    timeout     = optional(number, 30)
  })
  default = {}
}

variable "image_optimisation_function" {
  description = "Override OpenNext image optimisation Lambda settings."
  type = object({
    enabled     = optional(bool, true)
    memory_size = optional(number, 1536)
    timeout     = optional(number, 25)
  })
  default = {}
}
