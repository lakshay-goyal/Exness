#!/usr/bin/env bash
# Runs ON the EC2 instance via SSM Run Command: deploy.sh <image-tag>
# Pulls secrets from SSM, the compose file from S3, then rolls the stack.
set -euo pipefail

IMAGE_TAG="$${1:-latest}"
APP_DIR=/opt/exness
REGION="${region}"

mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "==> Fetching compose file from S3"
aws s3 cp "s3://${artifacts_bucket}/deploy/docker-compose.yml" "$APP_DIR/docker-compose.yml" --region "$REGION"

echo "==> Fetching secrets from SSM Parameter Store"
umask 077
aws ssm get-parameters-by-path \
  --path "${ssm_prefix}" \
  --with-decryption \
  --region "$REGION" \
  --query "Parameters[*].[Name,Value]" \
  --output text |
  while IFS=$'\t' read -r name value; do
    echo "$${name##*/}=$value"
  done > "$APP_DIR/.env"
echo "IMAGE_TAG=$IMAGE_TAG" >> "$APP_DIR/.env"

echo "==> Logging in to ECR"
aws ecr get-login-password --region "$REGION" |
  docker login --username AWS --password-stdin "${registry}"

echo "==> Pulling images ($IMAGE_TAG) and rolling the stack"
docker compose --env-file "$APP_DIR/.env" pull --quiet
docker compose --env-file "$APP_DIR/.env" up -d --remove-orphans

echo "==> Pruning old images"
docker image prune -af --filter "until=24h" || true

echo "==> Deploy complete"
docker compose ps
