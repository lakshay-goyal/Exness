output "tf_state_bucket" {
  description = "S3 bucket for Terraform remote state. Set as the TF_STATE_BUCKET GitHub secret."
  value       = aws_s3_bucket.tf_state.bucket
}

output "github_deploy_role_arn" {
  description = "IAM role assumed by GitHub Actions via OIDC. Set as the AWS_ROLE_ARN GitHub secret."
  value       = aws_iam_role.github_deploy.arn
}
