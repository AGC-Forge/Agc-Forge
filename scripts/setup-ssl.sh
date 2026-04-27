#!/usr/bin/env bash
# setup-ssl.sh — Setup SSL Certificate dengan Let's Encrypt
# Usage: sudo bash setup-ssl.sh yourdomain.com [www.yourdomain.com]

set -euo pipefail

DOMAIN="${1:-}"
WWW_DOMAIN="${2:-}"
EMAIL="${3:-admin@${DOMAIN}}"

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 yourdomain.com [www.yourdomain.com] [email@domain.com]"
    exit 1
fi

echo "🔐 Setup SSL untuk: $DOMAIN"

# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Stop Nginx sementara untuk webroot challenge
systemctl stop nginx 2>/dev/null || true

# Request certificate
if [ -n "$WWW_DOMAIN" ]; then
    certbot certonly \
        --standalone \
        --agree-tos \
        --non-interactive \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        -d "$WWW_DOMAIN"
    echo "Certificate untuk $DOMAIN dan $WWW_DOMAIN"
else
    certbot certonly \
        --standalone \
        --agree-tos \
        --non-interactive \
        --email "$EMAIL" \
        -d "$DOMAIN"
    echo "Certificate untuk $DOMAIN"
fi

# Update Nginx config dengan domain yang benar
sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/aichat

# Start Nginx kembali
systemctl start nginx
nginx -t && systemctl reload nginx

# Setup auto-renewal cron
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo "✅ SSL berhasil dikonfigurasi!"
echo "   Certificate: /etc/letsencrypt/live/$DOMAIN/"
echo "   Auto-renewal: cron jam 3 pagi setiap hari"
echo ""
echo "Test SSL: curl -I https://$DOMAIN"
