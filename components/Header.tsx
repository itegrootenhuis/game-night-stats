'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, ChevronDown } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 relative flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Game Night Stats Logo"
                className="w-8 h-8 object-contain rounded-lg"
                onError={(e) => {
                  // Hide broken image
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <span className="font-semibold text-white">Game Night Stats</span>
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 relative flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Game Night Stats Logo"
              className="w-8 h-8 object-contain rounded-lg"
              onError={(e) => {
                // Hide broken image
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <span className="font-semibold text-white">Game Night Stats</span>
        </Link>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
              <span className="text-sm text-zinc-300 hidden sm:block max-w-[120px] truncate">
                {user.user_metadata?.name || user.email?.split('@')[0]}
              </span>
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-zinc-800 shadow-lg z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-sm text-white truncate">
                      {user.user_metadata?.name || 'User'}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  )
}

