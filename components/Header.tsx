'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, ChevronDown, Share2, Settings, Users, Plus, Calendar, X, Dice6, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showAddGame, setShowAddGame] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [gameName, setGameName] = useState('')
  const [submittingPlayer, setSubmittingPlayer] = useState(false)
  const [submittingGame, setSubmittingGame] = useState(false)
  
  // Check if we're in visitor view
  const isVisitorView = pathname?.startsWith('/view/') ?? false

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

  const handleAddPlayer = () => {
    setShowQuickActions(false)
    setShowAddPlayer(true)
  }

  const handleAddGame = () => {
    setShowQuickActions(false)
    setShowAddGame(true)
  }

  const submitAddPlayer = async () => {
    if (!playerName.trim()) return

    setSubmittingPlayer(true)
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName.trim() })
      })

      if (res.ok) {
        toast.success(`${playerName.trim()} added successfully!`)
        setPlayerName('')
        setShowAddPlayer(false)
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to add player')
      }
    } catch (err) {
      console.error('Failed to add player:', err)
      toast.error('Failed to add player')
    } finally {
      setSubmittingPlayer(false)
    }
  }

  const submitAddGame = async () => {
    if (!gameName.trim()) return

    setSubmittingGame(true)
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: gameName.trim() })
      })

      if (res.ok) {
        toast.success(`${gameName.trim()} added successfully!`)
        setGameName('')
        setShowAddGame(false)
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to add game')
      }
    } catch (err) {
      console.error('Failed to add game:', err)
      toast.error('Failed to add game')
    } finally {
      setSubmittingGame(false)
    }
  }

  if (loading) {
    return (
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
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
    <>
    <header className="sticky top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 h-14 flex items-center justify-between relative">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
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

        {/* Desktop: Centered navigation links */}
        {!isVisitorView && (
          <div className="hidden md:flex items-center gap-4 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
            <Link
              href="/game-nights/new"
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
              aria-label="Start New Game Night"
            >
              <Calendar className="w-4 h-4" />
              <span>Start New Game Night</span>
            </Link>
            <Link
              href="/game-nights"
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
              aria-label="Game Nights"
            >
              <Calendar className="w-4 h-4" />
              <span>Game Nights</span>
            </Link>
            <Link
              href="/games"
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
              aria-label="Games"
            >
              <Dice6 className="w-4 h-4" />
              <span>Games</span>
            </Link>
            <Link
              href="/players"
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
              aria-label="Players"
            >
              <Users className="w-4 h-4" />
              <span>Players</span>
            </Link>
          </div>
        )}

        {user ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile: Quick Actions Dropdown */}
            {!isVisitorView && (
            <div className="relative md:hidden">
              <button
                onClick={() => {
                  setShowQuickActions(!showQuickActions)
                  setShowDropdown(false)
                }}
                className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                aria-label="Quick Actions"
              >
                <Plus className="w-5 h-5" />
              </button>

              {showQuickActions && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowQuickActions(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-lg z-20 overflow-hidden">
                    <Link
                      href="/game-nights/new"
                      onClick={() => setShowQuickActions(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-teal-600 to-sky-500 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">New Game Night</p>
                        <p className="text-xs text-zinc-400">Start tracking games</p>
                      </div>
                    </Link>
                    <Link
                      href="/game-nights"
                      onClick={() => setShowQuickActions(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-zinc-600 to-zinc-500 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">Game Nights</p>
                        <p className="text-xs text-zinc-400">View past game nights</p>
                      </div>
                    </Link>
                    <button
                      onClick={handleAddGame}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Dice6 className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">Add Game</p>
                        <p className="text-xs text-zinc-400">Add a new game</p>
                      </div>
                    </button>
                    <button
                      onClick={handleAddPlayer}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">Add Player</p>
                        <p className="text-xs text-zinc-400">Add a new player</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
              </div>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowDropdown(!showDropdown)
                  setShowQuickActions(false)
                }}
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
                  <Link
                    href="/share"
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Stats
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Us
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors border-t border-zinc-800"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
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

      {/* Modals - rendered outside header for proper centering */}
      {/* Add Player Modal */}
      {showAddPlayer && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => {
              setShowAddPlayer(false)
              setPlayerName('')
            }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Add Player</h2>
                <button
                  onClick={() => {
                    setShowAddPlayer(false)
                    setPlayerName('')
                  }}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitAddPlayer()}
                    placeholder="Enter player name"
                    autoFocus
                    disabled={submittingPlayer}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={submitAddPlayer}
                    disabled={submittingPlayer || !playerName.trim()}
                    className="flex-1 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingPlayer ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Add Player'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPlayer(false)
                      setPlayerName('')
                    }}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Game Modal */}
      {showAddGame && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => {
              setShowAddGame(false)
              setGameName('')
            }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Add Game</h2>
                <button
                  onClick={() => {
                    setShowAddGame(false)
                    setGameName('')
                  }}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Game Name
                  </label>
                  <input
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitAddGame()}
                    placeholder="e.g., Catan, Ticket to Ride"
                    autoFocus
                    disabled={submittingGame}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={submitAddGame}
                    disabled={submittingGame || !gameName.trim()}
                    className="flex-1 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingGame ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Add Game'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddGame(false)
                      setGameName('')
                    }}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

