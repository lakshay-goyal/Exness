#!/usr/bin/env bash
# First-boot provisioning only. Deploys happen via SSM Run Command, which
# fetches deploy.sh from S3 — so app/config changes never require a new
# instance.
set -euxo pipefail

dnf install -y docker jq

systemctl enable --now docker

# docker compose v2 plugin (not packaged with AL2023's docker)
COMPOSE_VERSION=v2.29.7
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 2G swap — headroom for image pulls and Next.js memory spikes
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

mkdir -p /opt/exness
