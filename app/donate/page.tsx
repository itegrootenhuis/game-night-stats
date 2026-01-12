import Link from 'next/link'
import { ArrowLeft, Heart, Server, Globe, Code } from 'lucide-react'

export default function DonatePage() {
  return (
    <main className="min-h-screen p-4 pb-20">
      <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Support the Site</h1>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-600 to-sky-500 mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Thank You for Your Support!</h2>
            <p className="text-lg text-zinc-400">
              Your donations help keep Game Night Stats running and improving
            </p>
          </div>

          {/* What donations support */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">What Your Donations Support</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-teal-600/20 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Domain Name Costs</h4>
                  <p className="text-sm text-zinc-400">
                    Keeping the site accessible with a custom domain name
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-teal-600/20 flex items-center justify-center">
                  <Server className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Database Costs</h4>
                  <p className="text-sm text-zinc-400">
                    Hosting and maintaining the database that stores all your game night statistics
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-teal-600/20 flex items-center justify-center">
                  <Code className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Future Updates</h4>
                  <p className="text-sm text-zinc-400">
                    Development of new features, improvements, and bug fixes to enhance your experience
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Donation Options */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Donate Now</h3>
            <p className="text-zinc-400 mb-6">
              Your support means the world to us and helps ensure Game Night Stats continues to be a free and useful tool for tracking your game night statistics.
            </p>
            <a
              href="https://buy.stripe.com/test_3cIbJ14HUajJ6O9anTcfK00"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full p-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-center transition-colors"
            >
              Donate via Stripe
            </a>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

