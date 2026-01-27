'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

export default function ContactPage() {
  const supabase = createClient()
  const [subjectType, setSubjectType] = useState<string>('')
  const [otherSubject, setOtherSubject] = useState<string>('')
  const [body, setBody] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false)

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  useEffect(() => {
    // Load reCAPTCHA v3 script
    if (recaptchaSiteKey && typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            setRecaptchaLoaded(true)
          })
        }
      }
      document.head.appendChild(script)

      return () => {
        // Cleanup: remove script on unmount
        const existingScript = document.querySelector(`script[src*="recaptcha"]`)
        if (existingScript) {
          document.head.removeChild(existingScript)
        }
      }
    } else {
      // If no site key, allow form to work without reCAPTCHA (for development)
      setRecaptchaLoaded(true)
    }
  }, [recaptchaSiteKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!subjectType) {
      toast.error('Please select a subject type')
      return
    }

    if (subjectType === 'other' && !otherSubject.trim()) {
      toast.error('Please enter a subject')
      return
    }

    if (!body.trim()) {
      toast.error('Please enter a message')
      return
    }

    if (body.trim().length > 2000) {
      toast.error('Message must be 2000 characters or less')
      return
    }

    setSubmitting(true)

    try {
      // Generate reCAPTCHA token if available
      let recaptchaToken = null
      if (recaptchaSiteKey && window.grecaptcha && recaptchaLoaded) {
        try {
          recaptchaToken = await window.grecaptcha.execute(recaptchaSiteKey, {
            action: 'submit_contact_form'
          })
        } catch (error) {
          console.error('Failed to generate reCAPTCHA token:', error)
          // Continue without token - server will handle this
        }
      }

      // Get user email if authenticated
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email || 'Anonymous'

      // Determine final subject
      const finalSubject = subjectType === 'other' 
        ? otherSubject.trim() 
        : subjectType === 'existing'
          ? 'Feedback (existing features)'
          : 'Feedback (feature request)'

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: finalSubject,
          body: body.trim(),
          userEmail,
          recaptchaToken
        })
      })

      if (res.ok) {
        toast.success('Message sent successfully!')
        // Reset form
        setSubjectType('')
        setOtherSubject('')
        setBody('')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      toast.error('Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen pb-20">
      <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Contact Us</h1>
            <p className="text-sm text-zinc-500 mt-1">
              We'd love to hear from you! Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Subject <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={subjectType}
                  onChange={(e) => {
                    setSubjectType(e.target.value)
                    if (e.target.value !== 'other') {
                      setOtherSubject('')
                    }
                  }}
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white appearance-none focus:outline-none focus:border-teal-500 transition disabled:opacity-50 cursor-pointer"
                  required
                >
                  <option value="">Select a subject...</option>
                  <option value="existing">Feedback (existing features)</option>
                  <option value="feature">Feedback (feature request)</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Other Subject Input (conditional) */}
            {subjectType === 'other' && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Custom Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={otherSubject}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 100) {
                      setOtherSubject(value)
                    }
                  }}
                  disabled={submitting}
                  placeholder="Enter your subject..."
                  maxLength={100}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition disabled:opacity-50"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {otherSubject.length}/100 characters
                </p>
              </div>
            )}

            {/* Body Textarea */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 2000) {
                    setBody(value)
                  }
                }}
                disabled={submitting}
                placeholder="Tell us what's on your mind..."
                rows={8}
                maxLength={2000}
                required
                className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition disabled:opacity-50 resize-none"
              />
              <p className="text-xs text-zinc-500 mt-1">
                {body.length}/2000 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Link
                href="/"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !subjectType || !body.trim() || (subjectType === 'other' && !otherSubject.trim())}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
