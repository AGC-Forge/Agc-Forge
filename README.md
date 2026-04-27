# 🚀 Deploy Guide — AI Chat Platform

## Stack

- **OS**: Ubuntu 22.04 LTS
- **Runtime**: Node.js 20 LTS
- **Package manager**: pnpm
- **Process manager**: PM2 (cluster mode)
- **Web server**: Nginx
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Storage**: MinIO (Docker)
- **SSL**: Let's Encrypt (Certbot)

---

## 📋 Prerequisite

- VPS/server with minimum requirements:
  - **2 vCPU**, **2GB RAM**, **20GB SSD**
  - Ubuntu 22.04 LTS fresh install
  - Domain already pointing to IP server (A record)
- Root or sudo access
- GitHub repository already exists

---

## 📁 Deploy File Structure

```
/var/www/aichat/            ← App directory
/etc/nginx/sites-available/ ← Nginx config
/etc/letsencrypt/           ← SSL certs
/var/log/pm2/               ← PM2 logs
/opt/minio/data/            ← MinIO data
```

---

## 🔧 Step-by-Step Deploy

### Step 1 — Prepare Server

```bash
# Login as root or user with sudo
ssh root@your-server-ip

# Clone this repository (or upload deploy files)
git clone https://github.com/AGC-Forge/Agc-Forge.git /tmp/deploy-files
cd /tmp/deploy-files
```

### Step 2 — Setup Services (Database, Redis, MinIO)

```bash
# Run setup script (create DB, Redis, MinIO)
sudo bash scripts/setup-server.sh

# ⚠️ SAVE the displayed output credentials!
# DB password, MinIO credentials will be displayed once
```

### Step 3 — Clone Application

```bash
# Clone repo application
git clone -b main https://github.com/AGC-Forge/Agc-Forge.git /var/www/aichat
cd /var/www/aichat
```

### Step 4 — Setup Environment Variables

```bash
# Copy template file
cp /var/www/aichat/.env.generated /var/www/aichat/.env

# Edit .env — required fields:
nano /var/www/aichat/.env
```

**Required fields:**

```env
# Replace your domain with your domain name
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# OAuth (minimum one)
GITHUB_CLIENT_ID="xxx"
GITHUB_CLIENT_SECRET="xxx"

# Puter.js (choose one mode)
PUTER_AUTH_TOKEN="xxx"               # mode static
# ATAU
PUTER_GET_AUTO_TOKEN_FROM_LOGGED_USER="true"
NEXT_PUBLIC_PUTER_AUTO_TOKEN="true"

# Email (minimum one)
RESEND_API_KEY="re_xxx"   # easiest: resend.com
```

### Step 5 — First Time Setup (install Node, PM2, Nginx)

```bash
sudo bash scripts/deploy.sh --first
```

### Step 6 — Setup SSL

```bash
# Replace yourdomain.com with your domain name
sudo bash scripts/setup-ssl.sh yourdomain.com www.yourdomain.com admin@yourdomain.com
```

### Step 7 — Deploy Application

```bash
# Deploy (build + migrate + start PM2)
sudo bash scripts/deploy.sh
```

### Step 8 — Seed Database

```bash
cd /var/www/aichat
pnpm prisma db seed
```

### Step 9 — Verification

```bash
# Check all service
bash scripts/health-check.sh

# Cek PM2
pm2 list
pm2 logs aichat --lines 50

# Test di browser: https://yourdomain.com
```

---

## 🔄 Update / Deploy Again

```bash
cd /var/www/aichat
sudo bash scripts/deploy.sh
```

Script will automatically do:

1. `git pull` from branch main
2. `pnpm install`
3. `prisma generate`
4. `prisma migrate deploy`
5. `next build`
6. `pm2 reload` (zero-downtime)
7. Health check

---

## 📊 PM2 Commands Important

```bash
pm2 list                          # list all app
pm2 logs aichat                   # tail logs
pm2 logs aichat --lines 200       # 200 last lines of logs
pm2 monit                         # real-time monitoring
pm2 reload aichat                 # reload without downtime
pm2 restart aichat                # restart (with downtime)
pm2 stop aichat                   # stop
pm2 delete aichat                 # delete from PM2
pm2 save                          # save process list
pm2 startup                       # create auto-start on boot
```

---

## 🗄️ Database Commands

```bash
# Connect ke PostgreSQL
sudo -u postgres psql aichat_db

# Run migration
cd /var/www/aichat && pnpm prisma migrate deploy

# Reset database (BERBAHAYA — delete all data!)
pnpm prisma migrate reset

# Open Prisma Studio (GUI)
pnpm prisma studio
```

---

## 🪣 MinIO Commands

```bash
# Cek status
docker ps | grep minio
docker logs minio

# Restart
docker restart minio

# Console UI: https://yourdomain.com:9001

# mc (MinIO Client) commands
mc ls local/aichat-media          # list files
mc du local/aichat-media          # disk usage
mc rm --recursive local/aichat-media/generated/  # delete generated files
```

---

## 🔒 Security Checklist

- [ ] Firewall UFW active (SSH, 80, 443 saja)
- [ ] MinIO Console (9001) limited to IP tertentu
- [ ] PostgreSQL not expose to public (bind 127.0.0.1)
- [ ] Redis not expose to public (bind 127.0.0.1)
- [ ] `.env` permissions: `chmod 600 /var/www/aichat/.env`
- [ ] SSL certificate installed and auto-renewal active
- [ ] PM2 log rotation active
- [ ] NEXTAUTH_SECRET set (minimum 32 char)
- [ ] ENCRYPTION_KEY set (64 hex char)

---

## 🐛 Troubleshooting

### App cannot start

```bash
pm2 logs aichat --err --lines 100
# Cek juga:
cd /var/www/aichat && node_modules/.bin/next start
```

### Database connection error

```bash
# Test connection
psql "postgresql://aichat_user:PASSWORD@localhost:5432/aichat_db" -c "SELECT 1"
# Cek pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

### MinIO upload failed

```bash
# Cek container
docker logs minio --tail 50
# Test connection
curl http://localhost:9000/minio/health/live
```

### Nginx 502 Bad Gateway

```bash
# Check Next.js running
pm2 list
curl http://localhost:3000
# Check Nginx error log
tail -50 /var/log/nginx/error.log
```

### SSE / Streaming not working properly

```bash
# Check proxy_buffering off di Nginx
grep -n "proxy_buffering" /etc/nginx/sites-available/aichat
# Should be proxy_buffering off; di location /api/ai/
```

### SSL expired

```bash
certbot renew --force-renewal
systemctl reload nginx
```

---

## 📈 Monitoring (Opsional)

### Setup Uptime Kuma (free, self-hosted)

```bash
docker run -d \
  --name uptime-kuma \
  --restart unless-stopped \
  -p 3001:3001 \
  -v uptime-kuma:/app/data \
  louislam/uptime-kuma:1
```

Access: `http://your-ip:3001`

Monitor endpoints:

- `https://yourdomain.com` → HTTP 200
- `https://yourdomain.com/api/auth/session` → HTTP 200

---

## 💰 Estimated VPS Cost

| Provider             | Spec            | Cost/month |
| -------------------- | --------------- | ---------- |
| DigitalOcean Droplet | 2 vCPU, 4GB RAM | ~$24       |
| Vultr                | 2 vCPU, 4GB RAM | ~$20       |
| Hetzner CX21         | 3 vCPU, 4GB RAM | ~€5.80     |
| Contabo VPS S        | 4 vCPU, 8GB RAM | ~€5        |
| IDCloudHost          | 2 vCPU, 4GB RAM | ~Rp85k     |

Recommend: **Hetzner** (terbaik price/performance) atau **IDCloudHost** (lokal, latency rendah).
