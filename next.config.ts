import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
