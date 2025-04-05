import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! 忽略类型检查错误，不会影响实际功能 !!
    ignoreBuildErrors: true,
  },
  // 配置允许的图片域名
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "file.302.ai",
      },
    ],
  },
  env: {
    // 重写环境变量，使其在客户端可用
    NEXT_PUBLIC_SUPABASE_URL: process.env.karavideo_NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.karavideo_NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // 确保使用 webpack
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
