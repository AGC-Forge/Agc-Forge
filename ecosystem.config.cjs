/**
 * PM2 Ecosystem Config
 * Project: agc-site-02 (AI Chat Platform)
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs          # start
 *   pm2 reload ecosystem.config.cjs         # zero-downtime reload
 *   pm2 stop ecosystem.config.cjs           # stop
 *   pm2 delete ecosystem.config.cjs         # remove dari PM2
 *   pm2 logs aichat                         # lihat logs
 *   pm2 monit                               # monitoring realtime
 */

module.exports = {
  apps: [
    {
      // ── App utama: Next.js ──────────────────────────────────────────────
      name: "aichat",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/aichat",

      // ── Environment ────────────────────────────────────────────────────
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // ── Cluster mode untuk multi-core ──────────────────────────────────
      instances: "max",          // gunakan semua CPU core
      exec_mode: "cluster",

      // ── Memory management ──────────────────────────────────────────────
      max_memory_restart: "1G",  // restart instance jika > 1GB RAM
      node_args: "--max-old-space-size=1024",

      // ── Restart policy ─────────────────────────────────────────────────
      restart_delay: 5000,       // tunggu 5 detik sebelum restart
      max_restarts: 10,          // max 10 restart dalam 1 menit
      min_uptime: "10s",         // harus up minimal 10 detik untuk dianggap sukses

      // ── Logs ───────────────────────────────────────────────────────────
      output: "/var/log/pm2/aichat-out.log",
      error: "/var/log/pm2/aichat-err.log",
      merge_logs: true,          // merge logs dari semua instances
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      log_type: "json",

      // ── Watch (matikan di production) ──────────────────────────────────
      watch: false,
      ignore_watch: ["node_modules", ".next", "uploads", "logs"],

      // ── Health & monitoring ────────────────────────────────────────────
      kill_timeout: 5000,        // timeout sebelum force kill saat restart
      wait_ready: true,          // tunggu signal 'ready' dari app
      listen_timeout: 10000,     // timeout untuk listen signal
    },

    // ── Job Worker: Gen Job Poller (opsional jika pakai background jobs) ─
    // Uncomment jika butuh background job processor terpisah
    // {
    //   name: "aichat-worker",
    //   script: "scripts/job-worker.mjs",
    //   cwd: "/var/www/aichat",
    //   env: { NODE_ENV: "production" },
    //   instances: 1,
    //   exec_mode: "fork",
    //   max_memory_restart: "512M",
    //   output: "/var/log/pm2/aichat-worker-out.log",
    //   error: "/var/log/pm2/aichat-worker-err.log",
    // },
  ],
};
