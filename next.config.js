/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
  },
}

module.exports = nextConfig