'use client'

import { useState } from 'react'
import { Users, Gamepad2, Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface QuickActionsBarProps {
  onPlayerAdded?: () => void
  onGameAdded?: () => void
}

export function QuickActionsBar({ onPlayerAdded, onGameAdded }: QuickActionsBarProps) {
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showAddGame, setShowAddGame] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [gameName, setGameName] = useState('')
  const [submittingPlayer, setSubmittingPlayer] = useState(false)
  const [submittingGame, setSubmittingGame] = useState(false)

  const handleAddPlayer = async () => {
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

  const handleAddGame = async () => {
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
      {/* Quick Actions Bar */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => {
            setShowAddPlayer(true)
            setShowAddGame(false)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white transition text-sm"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Add Player</span>
        </button>
        <button
          onClick={() => {
            setShowAddGame(true)
            setShowAddPlayer(false)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white transition text-sm"
        >
          <Gamepad2 className="w-4 h-4" />
          <span className="hidden sm:inline">Add Game</span>
        </button>
      </div>

      {/* Add Player Modal */}
      {showAddPlayer && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setShowAddPlayer(false)
              setPlayerName('')
            }}
          />
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
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    placeholder="Enter player name"
                    autoFocus
                    disabled={submittingPlayer}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddPlayer}
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
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setShowAddGame(false)
              setGameName('')
            }}
          />
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
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGame()}
                    placeholder="e.g., Catan, Ticket to Ride"
                    autoFocus
                    disabled={submittingGame}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddGame}
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
