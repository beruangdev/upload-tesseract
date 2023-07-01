/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "localhost:3000"],
  },
  experimental: {
    serverActions: true,
  },
  reactStrictMode: true,
}

module.exports = nextConfig
