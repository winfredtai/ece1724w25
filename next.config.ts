import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "file.302.ai",
      },
      {
        protocol: "https",
        hostname: "cdn.klingai.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-7d734936d4b14f42b4d57763fc2b3d12.r2.dev",
        pathname: "/**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.karavideo_NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.karavideo_NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  webpack: (config) => {
    return config;
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
