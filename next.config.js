/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: {
    resolve: {
      fallback: {
        fs: false,
        path: false,
        crypto: false,
      },
    },
  },
}

module.exports = nextConfig
