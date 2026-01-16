'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Check, XCircle } from 'lucide-react'

export function WelcomeModal() {
  const [showModal, setShowModal] = useState(false)
  const [cookieConsent, setCookieConsent] = useState<'accepted' | 'denied' | null>(null)

  useEffect(() => {
    // Check if user has seen welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    const savedCookieConsent = localStorage.getItem('cookieConsent') as 'accepted' | 'denied' | null

    if (!hasSeenWelcome) {
      setShowModal(true)
      // If they already have a cookie consent preference, use it
      if (savedCookieConsent) {
        setCookieConsent(savedCookieConsent)
      }
    }
  }, [])

  const handleAcceptCookies = () => {
    setCookieConsent('accepted')
    localStorage.setItem('cookieConsent', 'accepted')
  }

  const handleDenyCookies = () => {
    setCookieConsent('denied')
    localStorage.setItem('cookieConsent', 'denied')
  }

  const handleContinue = () => {
    if (cookieConsent === null) {
      // If no choice made, default to accepted (but don't store it)
      // User can change later if needed
      return
    }
    localStorage.setItem('hasSeenWelcome', 'true')
    setShowModal(false)
  }

  if (!showModal) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-xl relative">
          {/* Close button */}
          <button
            onClick={handleContinue}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 relative">
                <Image
                  src="/logo.png"
                  alt="Game Night Stats Logo"
                  width={64}
                  height={64}
                  className="object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>

            {/* Welcome Text */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-3">Welcome to Game Night Stats</h2>
              <p className="text-zinc-300 leading-relaxed">
                A free web app where you can track your stats for your game nights for the ultimate bragging rights amongst your friends!
              </p>
            </div>

            {/* Cookie Consent */}
            <div className="mb-6 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <h3 className="text-sm font-semibold text-white mb-2">Cookie Consent</h3>
              <p className="text-xs text-zinc-400 mb-4">
                We use cookies to provide authentication and session management. This allows you to stay logged in and access your game night statistics securely.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptCookies}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cookieConsent === 'accepted'
                      ? 'bg-teal-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={handleDenyCookies}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cookieConsent === 'denied'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Deny
                </button>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={cookieConsent === null}
              className="w-full px-4 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
