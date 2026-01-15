import Link from 'next/link'
import { Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-sm mt-auto">
      <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500 text-center sm:text-left">
            © {new Date().getFullYear()} Game Night Stats
          </p>
          <Link
            href="/donate"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
          >
            <Heart className="w-4 h-4" />
            Support the site
          </Link>
        </div>
      </div>
    </footer>
  )
}



