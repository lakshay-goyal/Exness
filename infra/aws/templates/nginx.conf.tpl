# Rendered by Terraform, stored in S3, mounted into the nginx container by
# docker-compose. Routes the public domain to the web app container; acting
# as default_server also catches direct hits on the raw IP. TLS terminates
# here with a Let's Encrypt certificate issued/renewed by certbot (see
# deploy.sh for first issuance, the certbot compose service for renewals).

server {
    listen 80 default_server;
    server_name ${server_name} _;

    # ACME HTTP-01 challenges (certbot webroot renewals)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://${server_name}$request_uri;
    }
}

server {
    listen 443 ssl default_server;
    http2 on;
    server_name ${server_name} _;

    ssl_certificate     /etc/letsencrypt/live/${server_name}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${server_name}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://web:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
