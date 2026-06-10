output "cloudfront_url" {
  description = "Public HTTPS URL for the deployed web app."
  value       = module.web_opennext.cloudfront_url
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (use for cache invalidation)."
  value       = module.web_opennext.cloudfront_distribution_id
}

output "website_bucket_name" {
  description = "S3 bucket storing static OpenNext assets."
  value       = module.web_opennext.bucket_name
}

output "web_env_applied" {
  description = "Web environment values wired into the OpenNext build and Lambda."
  value = {
    build_time = {
      NEXT_PUBLIC_BACKEND_URL = var.web_env.next_public_backend_url
      NEXT_PUBLIC_DOCS_URL    = var.web_env.next_public_docs_url
    }
    lambda_runtime = var.web_env.lambda_env
  }
  sensitive = false
}
