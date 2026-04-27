import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  images: {
    remotePatterns: [
      // MinIO lokal
      // MinIO lokal / staging
      { protocol: "http", hostname: "localhost", port: "9000", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "9000", pathname: "/**" },
      // MinIO production (sesuaikan dengan domain kamu)
      { protocol: "https", hostname: process.env.MINIO_ENDPOINT ?? "localhost", pathname: "/**" },
      // Puter CDN (hasil generate)
      { protocol: "https", hostname: "*.puter.site", pathname: "/**" },
      { protocol: "https", hostname: "api.puter.com", pathname: "/**" },
      // OAuth avatars
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Picsum (test mode placeholder)
      { protocol: "https", hostname: "picsum.photos" },
    ],
    // Format output image
    formats: ["image/avif", "image/webp"],
    // Disable image optimization jika pakai CDN eksternal
    // unoptimized: true,
  },
  // ── Server external packages ──────────────────────────────────────────────
  serverExternalPackages: [
    "@heyputer/puter.js",
    "minio",
    "ioredis",
    "nodemailer",
  ],
  // ── Experimental ─────────────────────────────────────────────────────────
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    // Optimasi untuk production
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
    ],
  },
  // ── Headers keamanan ──────────────────────────────────────────────────────
  // (Nginx sudah handle, tapi ini sebagai fallback)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      // Cache static assets
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // www ke non-www (atau sebaliknya) — biasanya handle di Nginx
      // { source: "/(.*)", has: [{ type: "host", value: "www.yourdomain.com" }], destination: "https://yourdomain.com/$1", permanent: true },
    ];
  },
  // ── Logging di production ─────────────────────────────────────────────────
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
  // ── Webpack customization ─────────────────────────────────────────────────
  webpack: (config, { isServer }) => {
    // Ignore server-only modules di client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
