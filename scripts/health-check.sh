#!/usr/bin/env bash
# health-check.sh — Cek status semua service AI Chat
# Usage: bash health-check.sh

set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
fail() { echo -e "  ${RED}✗${NC} $*"; FAILED=1; }
warn() { echo -e "  ${YELLOW}⚠${NC} $*"; }

FAILED=0

echo ""
echo "═══ AI Chat Health Check — $(date) ═══"
echo ""

# ── Next.js / PM2 ────────────────────────────────────────────────────────────

echo "▶ Next.js (PM2)"
if pm2 list | grep -q "aichat.*online"; then
    INSTANCES=$(pm2 list | grep "aichat.*online" | wc -l)
    ok "Running — $INSTANCES instance(s) online"
else
    fail "PM2 'aichat' tidak running"
    warn "Jalankan: pm2 start ecosystem.config.cjs"
fi

# HTTP health
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP" = "200" ] || [ "$HTTP" = "307" ] || [ "$HTTP" = "302" ]; then
    ok "HTTP response: $HTTP"
else
    fail "HTTP response: $HTTP (expected 200/302/307)"
fi

echo ""
echo "▶ Nginx"
if systemctl is-active --quiet nginx; then
    ok "Running"
    nginx -t 2>/dev/null && ok "Config valid" || fail "Config error"
else
    fail "Nginx tidak running"
fi

echo ""
echo "▶ PostgreSQL"
if systemctl is-active --quiet postgresql; then
    ok "Running"
    if sudo -u postgres psql -c "SELECT 1" &>/dev/null 2>&1; then
        ok "Connection OK"
        # Cek database aichat_db
        DB_COUNT=$(sudo -u postgres psql -tAc "SELECT count(*) FROM pg_database WHERE datname='aichat_db'")
        if [ "$DB_COUNT" = "1" ]; then
            ok "Database 'aichat_db' ada"
        else
            warn "Database 'aichat_db' tidak ditemukan"
        fi
    else
        fail "PostgreSQL connection gagal"
    fi
else
    fail "PostgreSQL tidak running"
fi

echo ""
echo "▶ Redis"
if systemctl is-active --quiet redis-server; then
    ok "Running"
    REDIS_PING=$(redis-cli ping 2>/dev/null || echo "FAILED")
    if [ "$REDIS_PING" = "PONG" ]; then
        ok "PING → PONG"
    else
        fail "Redis PING gagal: $REDIS_PING"
    fi

    # Cek memory usage
    REDIS_MEM=$(redis-cli info memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
    ok "Memory used: $REDIS_MEM"
else
    fail "Redis tidak running"
fi

echo ""
echo "▶ MinIO"
if docker ps | grep -q minio; then
    ok "Container running"
    MINIO_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/minio/health/live 2>/dev/null || echo "000")
    if [ "$MINIO_HEALTH" = "200" ]; then
        ok "MinIO API healthy (HTTP $MINIO_HEALTH)"
    else
        warn "MinIO health check: HTTP $MINIO_HEALTH"
    fi
else
    fail "MinIO Docker container tidak running"
    warn "Jalankan: docker start minio"
fi

echo ""
echo "▶ SSL Certificate"
DOMAIN=$(grep "server_name" /etc/nginx/sites-available/aichat 2>/dev/null | head -1 | awk '{print $2}' | tr -d ';' || echo "")
if [ -n "$DOMAIN" ] && [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY" +%s 2>/dev/null)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

    if [ "$DAYS_LEFT" -gt 30 ]; then
        ok "Valid — expires in $DAYS_LEFT days ($EXPIRY)"
    elif [ "$DAYS_LEFT" -gt 7 ]; then
        warn "Expires in $DAYS_LEFT days — renew soon!"
    else
        fail "CRITICAL: expires in $DAYS_LEFT days!"
    fi
else
    warn "SSL certificate tidak ditemukan atau domain tidak dikonfigurasi"
fi

echo ""
echo "▶ Disk Space"
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 80 ]; then
    ok "$(df -h / | awk 'NR==2{print "Used: "$3"/"$2" ("$5")"}')"
elif [ "$DISK_USAGE" -lt 90 ]; then
    warn "Disk usage: ${DISK_USAGE}% — mulai bersihkan!"
else
    fail "CRITICAL: Disk usage: ${DISK_USAGE}%"
fi

echo ""
echo "▶ Memory"
FREE_MEM=$(free -h | awk '/^Mem:/{print "Total: "$2" | Used: "$3" | Free: "$4}')
ok "$FREE_MEM"

echo ""
echo "═══════════════════════════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ Semua service berjalan normal${NC}"
else
    echo -e "${RED}❌ Ada masalah yang perlu diperbaiki${NC}"
    exit 1
fi
echo ""
