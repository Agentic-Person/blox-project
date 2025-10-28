import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { APP_CONFIG } from '@/lib/config/constants'
import { Providers } from '@/lib/providers/index'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}