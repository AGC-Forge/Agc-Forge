import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      // MinIO lokal
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      // MinIO production (sesuaikan dengan domain kamu)
      {
        protocol: "https",
        hostname: process.env.MINIO_ENDPOINT ?? "localhost",
        pathname: "/**",
      },
      // Puter CDN (hasil generate)
      {
        protocol: "https",
        hostname: "*.puter.site",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.puter.com",
        pathname: "/**",
      },
      // GitHub avatars (OAuth)
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      // Google avatars (OAuth)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  serverExternalPackages: ["@heyputer/puter.js"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
