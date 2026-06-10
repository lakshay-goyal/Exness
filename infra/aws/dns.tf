# Terraform-managed DNS via Cloudflare. Inert until the Cloudflare secrets
# are configured in GitHub (CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID) — the
# manually created Hostinger A record keeps the domain working in the
# meantime. Once the zone for the domain is moved to Cloudflare (nameserver
# change at the Hostinger registrar panel), this record takes over and tracks
# the EIP automatically.

locals {
  # nonsensitive: only the presence of the token feeds this flag, and the flag
  # decides the web_url scheme — without it the sensitivity taint would spread
  # to the web_url output.
  manage_dns = nonsensitive(var.cloudflare_api_token != "") && var.cloudflare_zone_id != ""
}

provider "cloudflare" {
  # The provider rejects a missing/empty token at configure time even when no
  # resources use it, so a well-formed placeholder stands in until the real
  # secret exists. No API call is made while cloudflare_record.web has count 0.
  api_token = local.manage_dns ? var.cloudflare_api_token : "0000000000000000000000000000000000000000"
}

resource "cloudflare_record" "web" {
  count = local.manage_dns ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = var.web_domain
  type    = "A"
  content = aws_eip.app.public_ip
  proxied = true # origin has its own Let's Encrypt cert — set the zone SSL mode to "Full (strict)"
  ttl     = 1    # 1 = auto, required when proxied
}
