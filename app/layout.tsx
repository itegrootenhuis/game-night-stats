import type { Metadata, Viewport } from 'next'
import { Header } from '@/components/Header'
import './globals.css'

export const metadata: Metadata = {
  title: 'Game Night Stats',
  description: 'Track your game night statistics and see who dominates the leaderboard',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <Header />
        {children}
      </body>
    </html>
  )
}
