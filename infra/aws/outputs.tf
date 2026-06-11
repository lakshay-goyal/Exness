# URLs and operational handles only — secrets stay in SSM Parameter Store.

output "web_url" {
  description = "Trading web app."
  value       = local.web_url
}

output "backend_url" {
  description = "Backend API + WebSocket endpoint."
  value       = local.backend_url
}

output "ecr_registry" {
  description = "ECR registry host for docker push."
  value       = local.ecr_registry
}

output "instance_id" {
  description = "EC2 instance ID (target for SSM Run Command / Session Manager)."
  value       = aws_instance.app.id
}

output "artifacts_bucket" {
  description = "S3 bucket holding the rendered docker-compose.yml and deploy.sh."
  value       = aws_s3_bucket.artifacts.bucket
}
