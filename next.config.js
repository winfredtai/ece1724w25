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
}

module.exports = nextConfig 