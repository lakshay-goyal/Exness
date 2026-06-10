variable "aws_region" {
  description = "AWS region for the Terraform state bucket."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix attached to created AWS resources."
  type        = string
  default     = "exness"
}

variable "github_repository" {
  description = "GitHub repository allowed to assume the deploy role, in 'owner/repo' form."
  type        = string

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", var.github_repository))
    error_message = "github_repository must look like 'owner/repo'."
  }
}
