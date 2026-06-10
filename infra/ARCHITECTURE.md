# Exness — AWS Architecture & Deployment Guide

Everything you need to understand, set up, and operate the AWS deployment.
Companion to [infra/README.md](README.md) (quick reference).

---

## 1. The Big Picture

```
                                   ┌──────────────────────────────┐
                                   │   GitHub repo  (monorepo)    │
                                   │                              │
                                   │  apps/Backend   apps/web     │
                                   │  apps/Engine    apps/docs    │
                                   │  apps/DBstorage              │
                                   │  packages/snap-shotting      │
                                   │  apps/mobile  ◄── EXCLUDED   │
                                   └──────────────┬───────────────┘
                                                  │  git push → main
                                                  ▼
                                   ┌──────────────────────────────┐
                                   │  GitHub Actions (deploy.yml) │
                                   │  auth: OIDC → AWS_ROLE_ARN   │
                                   │  (no AWS keys stored!)       │
                                   └──────────────┬───────────────┘
                 ┌────────────────────────────────┼────────────────────────────┐
                 ▼                                ▼                            ▼
   ┌──────────────────────-┐        ┌──────────────────────────┐   ┌─────────────────────┐
   │  Terraform (infra/aws)│        │  docker build & push ×6  │   │  SSM Run Command    │
   │  state → S3 bucket    │        │  tag: <git-sha>, latest  │   │  "run deploy.sh"    │
   └──────────┬───────────-┘        └────────────┬─────────────┘   └──────────┬──────────┘
              │ creates/updates                 │ pushes to                  │ executes on
              ▼                                 ▼                            ▼
┌────────────────────────────────────────── AWS ───────────────────────────────────────-───┐
│                                                                                          │
│   ┌────────────-─┐    ┌──────────────────────────────────────────────────────────────┐   │
│   │ ECR ×6 repos │    │  VPC 10.0.0.0/16 — public subnet, NO NAT (saves $32/mo)      │   │
│   │ exness-      │    │                                                              │   │
│   │  backend     │    │   ┌────────────────── EC2 t3.medium ──────────────────┐      │   │
│   │  engine      │───▶│   │  Docker Compose (/opt/exness)                     │      │   │
│   │  snapshotting│    │   │                                                   │      │   │
│   │  dbstorage   │    │   │  ┌─────────┐ ┌────────┐ ┌─────────┐               │      │   │
│   │  web         │    │   │  │ backend │ │  web   │ │  docs   │ ◄── public    │      │   │
│   │  docs        │    │   │  │  :8000  │ │ :3001  │ │ :3000   │     ports     │      │   │
│   └──────-───────┘    │   │  └────┬────┘ └────────┘ └─────────┘               │      │   │
│                       │   │       │                                           │      │   │
│   ┌─────────────--┐    │   │  ┌────┴────┐ ┌──────────────┐ ┌───────────┐      │      │   │
│   │ SSM Param     │    │   │  │ engine  │ │snap-shotting │ │ dbstorage │      │      │   │
│   │ Store         │───▶│   │  └────┬────┘ └──────┬───────┘ └─────┬─────┘      │      │   │
│   │ /exness/prod/*│   │   │       │             │               │             │      │   │
│   │ (SecureString)│   │   │  ┌────┴─────┐ ┌─────┴────┐ ┌────────┴┐            │      │   │
│   └─────────────--┘    │   │  │ postgres  │ │ mongodb  │ │  redis  │(internal)│      │   │
│                       │   │  └──────────┘ └──────────┘ └─────────┘            │      │   │
│   ┌─────────────-┐    │   └───────────────────▲───────────────────────────────┘      │   │
│   │ S3 artifacts │────┼───────────────────────┘  compose file + deploy.sh            │   │
│   └─────────────-┘    │                                                              │   │
│                       │        Elastic IP  ◄── stable public address                 │   │
│   ┌─────────────-┐    └──────────┬───────────────────────────────────────────────────┘   │
│   │ S3 tf-state  │              │                                                        │
│   └─────────────-┘              │                                                        │
└───────────────────-─────────────┼────────────────────────────────────────────────────────┘
                                  ▼
                       Users / Browser
                       http://<EIP>:3001  → Web app
                       http://<EIP>:8000  → Backend API + WebSocket
                       http://<EIP>:3000  → Docs
```

Security group only opens **3000, 3001, 8000**. No port 22 — shell access is
SSM Session Manager. Databases are reachable only inside the Compose network.

---

## 2. Why This Architecture (Cost)

| Component | This setup | Managed alternative |
| --- | --- | --- |
| Compute | 1× EC2 t3.medium ≈ $30/mo | 6× Fargate tasks ≈ $55/mo + ALB $18/mo |
| Postgres | container on EC2 | RDS t4g.micro ≈ $13/mo |
| Redis | container on EC2 | ElastiCache ≈ $12/mo |
| MongoDB | container on EC2 | **DocumentDB ≈ $200+/mo** |
| Networking | EIP (free while attached), no NAT | NAT gateway $32/mo |
| **Total** | **≈ $35/mo** | **≈ $330+/mo** |

Trade-off: single point of failure, data on instance EBS. Fine for this
project; whole stack rebuilds from Terraform + ECR in minutes.

---

## 3. One-Time Setup, Command by Command

### Step 0 — Prerequisites

```sh
brew install terraform awscli        # if not installed
aws configure                        # admin credentials, only needed locally for bootstrap
```

### Step 1 — Bootstrap (creates state bucket + CI role)

```sh
cd infra/bootstrap
terraform init
# owner/repo form — NOT the full https:// URL
terraform apply -var "github_repository=lakshay-goyal/Exness-Kline"
```

Copy the two outputs:

```sh
terraform output tf_state_bucket          # → GitHub secret TF_STATE_BUCKET
terraform output github_deploy_role_arn   # → GitHub secret AWS_ROLE_ARN
```

### Step 2 — GitHub secrets

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.
Or with the `gh` CLI:

```sh
gh secret set AWS_ROLE_ARN         --body "arn:aws:iam::<account>:role/exness-github-deploy"
gh secret set TF_STATE_BUCKET      --body "exness-tfstate-<account>-<suffix>"
gh secret set JWT_SECRET           --body "$(openssl rand -base64 32)"
gh secret set BETTER_AUTH_SECRET   --body "$(openssl rand -base64 32)"
gh secret set GOOGLE_CLIENT_ID     --body "<from Google Cloud Console>"
gh secret set GOOGLE_CLIENT_SECRET --body "<from Google Cloud Console>"
gh secret set USER_EMAIL           --body "<nodemailer sender gmail>"
gh secret set USER_PASSWORD        --body "<gmail app password>"
```

Optional repository **variable** (not secret): `AWS_REGION` — defaults to `us-east-1`.

```sh
gh variable set AWS_REGION --body "ap-south-1"   # example override
```

### Step 3 — First deploy

```sh
git add .
git commit -m "Add AWS infrastructure and CI/CD pipeline"
git push origin main
```

Watch: GitHub repo → **Actions** tab. First run takes ~15–25 min
(instance boot + 6 image builds + first image pulls). Service URLs appear in
the run's **Summary** page when done.

### (Optional) Run Terraform manually instead of CI

```sh
cd infra/aws
export TF_VAR_jwt_secret=... TF_VAR_better_auth_secret=... \
       TF_VAR_google_client_id=... TF_VAR_google_client_secret=... \
       TF_VAR_user_email=... TF_VAR_user_password=...
terraform init \
  -backend-config="bucket=<TF_STATE_BUCKET>" \
  -backend-config="key=exness/prod.tfstate" \
  -backend-config="region=us-east-1"
terraform plan
terraform apply
terraform output        # URLs only — never secrets
```

---

## 4. How Env Files / Secrets Are Managed

**There are no committed .env files for production.** Three layers:

```
 GitHub Secrets                Terraform                    EC2 instance
┌────────────────┐   TF_VAR_*  ┌───────-───────────┐  read    ┌─────────────────────┐
│ JWT_SECRET     │────────────▶│ SSM Parameter     │◀────────-│ deploy.sh writes    │
│ BETTER_AUTH_…  │  (sensitive)│ Store SecureString│ at deploy│ /opt/exness/.env    │
│ GOOGLE_…  ×2   │             │ /exness/prod/*    │  time    │ (chmod 600)         │
│ USER_EMAIL/PASS│             │                   │          │        │            │
└────────────────┘             │ + Terraform-      │          │        ▼            │
                               │ generated:        │          │ docker compose      │
                               │ POSTGRES_PASSWORD │          │ --env-file .env     │
                               │ MONGO_PASSWORD    │          │ injects into        │
                               │ (random_password) │          │ containers          │
                               └──────────────────-┘          └─────────────────────┘
```

| Variable | Source | Where it ends up |
| --- | --- | --- |
| `JWT_SECRET`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `USER_EMAIL`, `USER_PASSWORD` | GitHub secret → `TF_VAR_*` → SSM | backend container env |
| `POSTGRES_PASSWORD`, `MONGO_PASSWORD` | generated by Terraform (`random_password`), never typed by you | SSM → DB containers + connection URLs |
| `DATABASE_URL`, `REDIS_URL`, `MONGODB_URL` | composed inside `docker-compose.yml.tpl` (internal hostnames `postgres`, `redis`, `mongodb`) | all app containers |
| `FRONTEND_URL`, `BACKEND_URL` | derived from Elastic IP by Terraform | backend/workers |
| `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_DOCS_URL` | Terraform outputs → docker **build args** in CI (baked into web bundle) | web image at build time |
| `IMAGE_TAG` | git SHA, appended to `.env` by deploy.sh | selects ECR image version |

Guarantees:

- Terraform **outputs contain zero secrets** (URLs, instance ID, bucket names only).
- All secret variables are `sensitive = true` → masked in `terraform plan` logs.
- CI logs never echo secret values (GitHub also masks registered secrets).
- The instance fetches secrets at deploy time over IAM-authorized SSM calls;
  `.env` on the box is root-only (`umask 077`).

Local development is unchanged: `docker-compose.yml` + `apps/docker/env/.env.*`
files keep working exactly as before.

---

## 5. End-to-End Pipeline Flow

```
 you                GitHub Actions                                    AWS
  │
  │ git push main
  ├────────────────▶ ① checks
  │                    bun install
  │                    turbo check-types build --filter='!mobile'   ◄── mobile skipped
  │                       │ pass
  │                       ▼
  │                  ② terraform
  │                    OIDC assume AWS_ROLE_ARN ──────────────────▶ STS (15-min creds)
  │                    init  (state from S3)                        S3 tf-state
  │                    plan → apply ─────────────────────────────▶ creates/updates:
  │                       │                                          ECR, VPC, EC2, EIP,
  │                       │ outputs: urls, registry,                 SSM params, S3 artifacts,
  │                       │          instance_id, bucket             compose file rendered→S3
  │                       ▼
  │                  ③ build-push  (6 parallel jobs)
  │                    docker build -f apps/docker/<X>.Dockerfile
  │                    web: --build-arg NEXT_PUBLIC_*=<EIP urls>
  │                    push :<git-sha> + :latest ────────────────▶ ECR
  │                       │
  │                       ▼
  │                  ④ deploy
  │                    wait until instance Online in SSM
  │                    ssm send-command ──────────────────────────▶ EC2 runs deploy.sh:
  │                       │                                          1. s3 cp compose+script
  │                       │                                          2. ssm get secrets → .env
  │                       │                                          3. ecr login
  │                       │                                          4. compose pull <sha>
  │                       │                                          5. compose up -d
  │                       │                                             (db-migrate runs
  │                       │                                              Prisma migrations
  │                       │                                              before backend starts)
  │                       │ poll status ≤20 min
  │                       ▼
  │                  ⑤ summary: service URL table
  │◀─────────────── Actions run Summary page
  │
  │   Pull requests: only ① + terraform plan. Nothing applied, nothing deployed.
  │   Changes under apps/mobile/** or *.md: workflow doesn't even start.
```

Container boot order on the instance (Compose `depends_on`):

```
postgres ──healthy──┐
redis    ──healthy──┼─▶ db-migrate (Prisma migrate, exits 0) ─▶ backend ─▶ web
mongodb  ──healthy──┘                                        └▶ engine ─▶ snap-shotting
                                                             └▶ dbstorage
docs (independent)
```

---

## 6. Who Manages What

| Concern | Managed by | Where |
| --- | --- | --- |
| State bucket, OIDC role | you, once | `infra/bootstrap` (local apply) |
| ECR, VPC, EC2, EIP, IAM, SSM params, artifacts | Terraform via CI | `infra/aws` |
| Prod compose topology | Terraform template → S3 | `infra/aws/templates/docker-compose.yml.tpl` |
| Deploy procedure | shell script → S3, run via SSM | `infra/aws/templates/deploy.sh.tpl` |
| Instance provisioning (docker install) | cloud-init, first boot only | `infra/aws/templates/user_data.sh` |
| Build/test/deploy orchestration | GitHub Actions | `.github/workflows/deploy.yml` |
| App secrets | GitHub Secrets → SSM SecureString | never in git, never in outputs |
| DB passwords | Terraform `random_password` → SSM | you never see or type them |
| Mobile app | **nothing here** — EAS | excluded everywhere |

---

## 7. Day-2 Cheat Sheet

```sh
# Shell on the instance (no SSH key needed)
aws ssm start-session --target $(cd infra/aws && terraform output -raw instance_id)

# On the instance: status / logs
docker compose -f /opt/exness/docker-compose.yml ps
docker logs -f exness-backend

# Read a secret (your IAM user, locally)
aws ssm get-parameter --name /exness/prod/POSTGRES_PASSWORD --with-decryption --query Parameter.Value --output text

# Roll back to an older build (on the instance)
/opt/exness/deploy.sh <old-git-sha>

# Tear everything down (keeps bootstrap: state bucket + OIDC role)
cd infra/aws && terraform destroy
```

---

## 8. Known Gaps / Next Steps

1. **HTTPS**: currently plain HTTP on the EIP. Point a domain at the EIP and
   add Caddy (auto-TLS) in front, or put CloudFront before the ports.
   Required before Google OAuth works on a public origin.
2. **Backups**: schedule EBS snapshots (AWS Backup or DLM) — DB data lives on
   the instance volume.
3. **docs image** runs `next dev`; change CMD to `next build` + `next start`.
4. **Bootstrap role** uses `AdministratorAccess`; scope down once resources stabilize.
