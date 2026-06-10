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

echo "==> Fetching nginx config from S3"
aws s3 cp "s3://${artifacts_bucket}/deploy/nginx.conf" "$APP_DIR/nginx.conf" --region "$REGION"

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

echo "==> Pruning unused images to free disk before pull"
docker image prune -af --filter "until=24h" || true

echo "==> Logging in to ECR"
aws ecr get-login-password --region "$REGION" |
  docker login --username AWS --password-stdin "${registry}"

echo "==> Ensuring TLS certificate for ${web_domain}"
mkdir -p "$APP_DIR/letsencrypt" "$APP_DIR/certbot-webroot"
if [ ! -f "$APP_DIR/letsencrypt/live/${web_domain}/fullchain.pem" ]; then
  # First issuance binds port 80 directly; stop nginx from a previous deploy
  # if it holds the port. Renewals run via webroot inside the certbot service.
  docker stop exness-nginx >/dev/null 2>&1 || true
  docker run --rm -p 80:80 \
    -v "$APP_DIR/letsencrypt:/etc/letsencrypt" \
    certbot/certbot certonly --standalone \
    --non-interactive --agree-tos \
    -m "${letsencrypt_email}" \
    -d "${web_domain}"
fi

echo "==> Pulling images ($IMAGE_TAG) and rolling the stack"
docker compose --env-file "$APP_DIR/.env" pull --quiet
docker compose --env-file "$APP_DIR/.env" up -d --remove-orphans

echo "==> Pruning old images"
docker image prune -af --filter "until=24h" || true

echo "==> Deploy complete"
docker compose ps
