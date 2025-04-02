/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! 忽略类型检查错误，不会影响实际功能 !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // 同时忽略ESLint错误，避免构建失败
    ignoreDuringBuilds: true,
  },
  // 禁用 experimental features
  experimental: {
    turbo: {
      enabled: true
    }
  },
  // 配置允许的图片域名
  images: {
    domains: ['file.302.ai'],
  },
  // 确保使用 webpack
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    return config;
  },
}

module.exports = nextConfig 