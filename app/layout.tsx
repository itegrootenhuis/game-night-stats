import type { Metadata, Viewport } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { WelcomeModal } from '@/components/WelcomeModal'
import { Toaster } from 'sonner'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamenightstats.com'

export const metadata: Metadata = {
  title: 'Game Night Stats - Track Board Game Statistics & Leaderboards',
  description: 'Free web app to track your board game night statistics. See who wins the most, track wins, losses, and create leaderboards for ultimate bragging rights with friends.',
  keywords: ['board game stats', 'game night tracking', 'board game leaderboard', 'track game wins', 'board game statistics', 'game night stats', 'board game tracker', 'game statistics'],
  authors: [{ name: 'Game Night Stats' }],
  creator: 'Game Night Stats',
  publisher: 'Game Night Stats',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Game Night Stats',
    title: 'Game Night Stats - Track Board Game Statistics & Leaderboards',
    description: 'Free web app to track your board game night statistics. See who wins the most, track wins, losses, and create leaderboards for ultimate bragging rights with friends.',
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
        alt: 'Game Night Stats Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Game Night Stats - Track Board Game Statistics & Leaderboards',
    description: 'Free web app to track your board game night statistics. See who wins the most, track wins, losses, and create leaderboards for ultimate bragging rights with friends.',
    images: [`${siteUrl}/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification if needed
    // google: 'verification-code-here',
  },
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
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Game Night Stats',
    description: 'Free web app to track your board game night statistics. See who wins the most, track wins, losses, and create leaderboards for ultimate bragging rights with friends.',
    url: siteUrl,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Track game night statistics',
      'Create leaderboards',
      'Track wins and losses',
      'View player statistics',
      'Filter by game, player, or date',
      'Share stats with friends',
    ],
    keywords: 'board game stats, game night tracking, board game leaderboard, track game wins, board game statistics',
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-background antialiased flex flex-col">
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <WelcomeModal />
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
