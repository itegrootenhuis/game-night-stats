import type { Metadata, Viewport } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Toaster } from 'sonner'
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
      <body className="min-h-screen bg-background antialiased flex flex-col">
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <Toaster 
          theme="dark" 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#fafafa',
            },
          }}
        />
      </body>
    </html>
  )
}
