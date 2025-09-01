/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
  },
  
  // Explicitly configure static file serving
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Ensure static files are served from public directory
  experimental: {
    outputFileTracingRoot: process.cwd(),
    outputFileTracingIgnores: ['**/*client-reference-manifest.js']
  }
}

module.exports = nextConfig