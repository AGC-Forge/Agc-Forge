#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  deploy.sh — AI Chat Platform Deploy Script                              ║
# ║  Target: Ubuntu 22.04 LTS + Nginx + PM2                                  ║
# ║                                                                          ║
# ║  Usage:                                                                  ║
# ║    chmod +x deploy.sh                                                    ║
# ║    ./deploy.sh          # deployment update (rolling)                    ║
# ║    ./deploy.sh --first  # first-time full setup                          ║
# ╚══════════════════════════════════════════════════════════════════════════╝

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

APP_NAME="aichat"
APP_DIR="/var/www/aichat"
REPO_URL="https://github.com/yourusername/agc-site-02.git"
BRANCH="main"
NODE_VERSION="20"
PM2_CONFIG="ecosystem.config.cjs"
LOG_DIR="/var/log/pm2"

# ── Colors ────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }
step() { echo -e "\n${BLUE}══ $* ══${NC}"; }

# ── Preflight check ───────────────────────────────────────────────────────────

check_root() {
    if [ "$EUID" -ne 0 ]; then
        err "Script ini harus dijalankan sebagai root atau dengan sudo."
        exit 1
    fi
}

check_env() {
    if [ ! -f "$APP_DIR/.env" ]; then
        err ".env tidak ditemukan di $APP_DIR"
        err "Copy .env.example ke .env dan isi semua nilai terlebih dahulu."
        exit 1
    fi
}

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  FIRST TIME SETUP                                                        ║
# ╚══════════════════════════════════════════════════════════════════════════╝

setup_first_time() {
    step "FIRST TIME SETUP"
    log "Memulai setup awal server..."

    # ── Update system ──────────────────────────────────────────────────────
    step "System Update"
    apt-get update -qq
    apt-get upgrade -y -qq

    # ── Install dependencies ───────────────────────────────────────────────
    step "Install Dependencies"
    apt-get install -y -qq \
        curl wget git \
        nginx \
        certbot python3-certbot-nginx \
        build-essential \
        postgresql postgresql-contrib \
        redis-server \
        ufw \
        logrotate \
        htop \
        unzip

    # ── Install Node.js via NVM ────────────────────────────────────────────
    step "Install Node.js $NODE_VERSION"
    if ! command -v node &>/dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt-get install -y nodejs
        log "Node.js $(node -v) terinstall"
    else
        log "Node.js $(node -v) sudah ada"
    fi

    # ── Install pnpm ───────────────────────────────────────────────────────
    step "Install pnpm"
    if ! command -v pnpm &>/dev/null; then
        npm install -g pnpm@latest
        log "pnpm $(pnpm -v) terinstall"
    else
        log "pnpm $(pnpm -v) sudah ada"
    fi

    # ── Install PM2 ────────────────────────────────────────────────────────
    step "Install PM2"
    if ! command -v pm2 &>/dev/null; then
        npm install -g pm2@latest
        pm2 install pm2-logrotate
        pm2 set pm2-logrotate:max_size 50M
        pm2 set pm2-logrotate:retain 30
        log "PM2 $(pm2 -v) terinstall"
    else
        log "PM2 $(pm2 -v) sudah ada"
    fi

    # ── Setup PostgreSQL ───────────────────────────────────────────────────
    step "Setup PostgreSQL"
    systemctl enable --now postgresql

    # Buat database dan user (baca dari .env jika tersedia)
    if [ -f "$APP_DIR/.env" ]; then
        DB_URL=$(grep DATABASE_URL "$APP_DIR/.env" | cut -d= -f2- | tr -d '"')
        log "Database URL ditemukan di .env"
    else
        warn "Buat database manual setelah setup .env"
    fi

    # ── Setup Redis ────────────────────────────────────────────────────────
    step "Setup Redis"
    # Konfigurasi Redis untuk production
    cat > /etc/redis/redis.conf.d/aichat.conf << 'EOF'
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
requirepass ""
bind 127.0.0.1 ::1
EOF
    systemctl enable --now redis-server
    log "Redis berjalan"

    # ── Setup direktori app ────────────────────────────────────────────────
    step "Setup App Directory"
    mkdir -p "$APP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p /var/www/certbot

    # Clone repo jika belum ada
    if [ ! -d "$APP_DIR/.git" ]; then
        log "Cloning repository..."
        git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    fi

    # ── Setup Nginx ────────────────────────────────────────────────────────
    setup_nginx

    # ── Setup UFW Firewall ─────────────────────────────────────────────────
    step "Setup Firewall (UFW)"
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 9001/tcp comment "MinIO Console (batasi ke IP tertentu!)"
    ufw --force enable
    log "Firewall aktif"

    # ── Setup PM2 startup ──────────────────────────────────────────────────
    step "Setup PM2 Startup"
    pm2 startup systemd -u www-data --hp /home/www-data 2>/dev/null || \
    pm2 startup systemd 2>/dev/null || true

    log "First time setup selesai!"
    log "Langkah selanjutnya:"
    log "  1. Copy .env.example ke $APP_DIR/.env dan isi semua values"
    log "  2. Jalankan: certbot --nginx -d yourdomain.com"
    log "  3. Jalankan: ./deploy.sh"
}

# ── Setup Nginx ───────────────────────────────────────────────────────────────

setup_nginx() {
    step "Setup Nginx"

    # Buat direktori snippet
    mkdir -p /etc/nginx/snippets

    # Copy config
    if [ -f "$(dirname "$0")/nginx/aichat" ]; then
        cp "$(dirname "$0")/nginx/aichat" /etc/nginx/sites-available/aichat
        cp "$(dirname "$0")/nginx/snippets/nextjs-proxy.conf" /etc/nginx/snippets/
    else
        warn "File nginx config tidak ditemukan. Buat manual di /etc/nginx/sites-available/aichat"
    fi

    # Enable site
    ln -sf /etc/nginx/sites-available/aichat /etc/nginx/sites-enabled/aichat

    # Hapus default
    rm -f /etc/nginx/sites-enabled/default

    # Test config
    nginx -t
    systemctl enable --now nginx
    systemctl reload nginx
    log "Nginx dikonfigurasi"
}

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  ROLLING DEPLOYMENT (tanpa downtime)                                     ║
# ╚══════════════════════════════════════════════════════════════════════════╝

deploy() {
    step "DEPLOYMENT - $(date '+%Y-%m-%d %H:%M:%S')"

    check_env
    cd "$APP_DIR"

    # ── 1. Git pull ────────────────────────────────────────────────────────
    step "Git Pull"
    git fetch origin
    git reset --hard "origin/$BRANCH"
    COMMIT=$(git log --oneline -1)
    log "Deploy commit: $COMMIT"

    # ── 2. Install dependencies ────────────────────────────────────────────
    step "Install Dependencies"
    pnpm install --frozen-lockfile --prod=false

    # ── 3. Generate Prisma client ──────────────────────────────────────────
    step "Generate Prisma Client"
    pnpm prisma generate

    # ── 4. Run database migrations ─────────────────────────────────────────
    step "Database Migration"
    pnpm prisma migrate deploy
    log "Migrations berhasil"

    # ── 5. Build Next.js ───────────────────────────────────────────────────
    step "Build Next.js"
    pnpm build
    log "Build berhasil"

    # ── 6. PM2 reload (zero-downtime) ──────────────────────────────────────
    step "PM2 Reload (zero-downtime)"
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 reload "$PM2_CONFIG" --update-env
        log "PM2 reload selesai"
    else
        pm2 start "$PM2_CONFIG"
        log "PM2 app dimulai"
    fi

    # Simpan PM2 process list
    pm2 save

    # ── 7. Health check ────────────────────────────────────────────────────
    step "Health Check"
    sleep 5

    MAX_RETRIES=12
    RETRY=0
    while [ $RETRY -lt $MAX_RETRIES ]; do
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
        if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "307" ] || [ "$HTTP_STATUS" = "302" ]; then
            log "✅ Health check OK (HTTP $HTTP_STATUS)"
            break
        fi
        RETRY=$((RETRY + 1))
        warn "Health check $RETRY/$MAX_RETRIES... (HTTP $HTTP_STATUS) tunggu 5s"
        sleep 5
    done

    if [ $RETRY -eq $MAX_RETRIES ]; then
        err "❌ Health check gagal setelah $((MAX_RETRIES * 5)) detik!"
        err "Cek logs: pm2 logs $APP_NAME"
        exit 1
    fi

    # ── 8. Reload Nginx ────────────────────────────────────────────────────
    nginx -t && systemctl reload nginx
    log "Nginx di-reload"

    step "DEPLOYMENT SELESAI ✅"
    log "Commit: $COMMIT"
    log "PM2 Status:"
    pm2 list
}

# ── Main ──────────────────────────────────────────────────────────────────────

case "${1:-}" in
    --first)
        check_root
        setup_first_time
        ;;
    --nginx)
        check_root
        setup_nginx
        ;;
    --migrate)
        check_env
        cd "$APP_DIR"
        pnpm prisma migrate deploy
        log "Migration selesai"
        ;;
    --seed)
        check_env
        cd "$APP_DIR"
        pnpm prisma db seed
        log "Seed selesai"
        ;;
    --logs)
        pm2 logs "$APP_NAME" --lines 100
        ;;
    --status)
        pm2 list
        systemctl status nginx --no-pager
        systemctl status redis-server --no-pager
        systemctl status postgresql --no-pager
        ;;
    --rollback)
        step "ROLLBACK"
        cd "$APP_DIR"
        git log --oneline -5
        read -p "Masukkan commit hash untuk rollback: " HASH
        git checkout "$HASH"
        pnpm build
        pm2 reload "$PM2_CONFIG" --update-env
        log "Rollback ke $HASH selesai"
        ;;
    *)
        deploy
        ;;
esac
