import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Er staat een los package-lock.json in de home-map; zonder expliciete root
  // kiest Turbopack die map als projectroot.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
