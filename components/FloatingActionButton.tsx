'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, X, Users, Gamepad2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface FloatingActionButtonProps {
  onPlayerAdded?: () => void
  onGameAdded?: () => void
}

export function FloatingActionButton({ onPlayerAdded, onGameAdded }: FloatingActionButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showAddGame, setShowAddGame] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [gameName, setGameName] = useState('')
  const [submittingPlayer, setSubmittingPlayer] = useState(false)
  const [submittingGame, setSubmittingGame] = useState(false)

  const handleNewGameNight = () => {
    setIsOpen(false)
    router.push('/game-nights/new')
  }

  const handleAddPlayer = () => {
    setIsOpen(false)
    setShowAddPlayer(true)
  }

  const handleAddGame = () => {
    setIsOpen(false)
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
        onPlayerAdded?.()
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
        onGameAdded?.()
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

  return (
    <>
      {/* Backdrop */}
      {(isOpen || showAddPlayer || showAddGame) && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => {
            setIsOpen(false)
            setShowAddPlayer(false)
            setShowAddGame(false)
            setPlayerName('')
            setGameName('')
          }}
        />
      )}

      {/* FAB Button - positioned above footer (footer is ~5.5rem tall) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-teal-600 to-sky-500 hover:from-teal-500 hover:to-sky-400 text-white shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'rotate-45 scale-110' : 'hover:scale-110'
        }`}
        style={{ bottom: 'calc(5.5rem + 1.5rem)' }}
        aria-label="Quick Actions"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>

      {/* Menu */}
      {isOpen && (
        <div className="fixed right-6 z-50 flex flex-col gap-2" style={{ bottom: 'calc(5.5rem + 1.5rem + 4rem)' }}>
          <button
            onClick={handleAddGame}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-all shadow-lg min-w-[180px]"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium">Add Game</p>
              <p className="text-xs text-zinc-400">Add a new game</p>
            </div>
          </button>
          <button
            onClick={handleAddPlayer}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-all shadow-lg min-w-[180px]"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium">Add Player</p>
              <p className="text-xs text-zinc-400">Add a new player</p>
            </div>
          </button>
          <button
            onClick={handleNewGameNight}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-all shadow-lg min-w-[180px]"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-teal-600 to-sky-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium">New Game Night</p>
              <p className="text-xs text-zinc-400">Start tracking games</p>
            </div>
          </button>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
      )}

      {/* Add Game Modal */}
      {showAddGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
      )}
    </>
  )
}
