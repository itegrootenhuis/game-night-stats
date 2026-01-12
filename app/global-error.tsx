'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Critical Error
          </h1>
          <p className="text-zinc-400 mb-8">
            A critical error occurred. Please refresh the page or try again later.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </button>
          {error.digest && (
            <p className="mt-6 text-xs text-zinc-600">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
