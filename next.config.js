/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
  },
  
  // Configure headers including CSP
  async headers() {
    const headers = [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      }
    ]
    
    // Only add CSP in production
    if (process.env.NODE_ENV !== 'development') {
      headers.push({
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none';"
          },
        ],
      })
    }
    
    return headers
  },
  
  // Ensure static files are served from public directory
  experimental: {
    outputFileTracingRoot: process.cwd()
  }
}

module.exports = nextConfig