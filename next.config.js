/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: 'www.youtube.com',
      }
    ],
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

    // Only add CSP in production - relaxed for external services
    if (process.env.NODE_ENV !== 'development') {
      headers.push({
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://www.youtube.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com https://i.ytimg.com https://www.youtube.com",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.clerk.accounts.dev",
              "connect-src 'self' https://*.supabase.co https://clerk.com https://*.clerk.accounts.dev https://api.openai.com wss://*.supabase.co",
              "media-src 'self' https://www.youtube.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
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