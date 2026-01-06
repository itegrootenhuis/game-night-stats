'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Users, X, Trophy, Target, Loader2 } from 'lucide-react'

interface Player {
  id: string
  name: string
  stats: {
    totalGames: number
    wins: number
    winRate: number
  }
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/players')
      if (res.ok) {
        const data = await res.json()
        setPlayers(data)
      }
    } catch (err) {
      console.error('Failed to fetch players:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName.trim() })
      })

      if (res.ok) {
        setNewPlayerName('')
        setShowAddPlayer(false)
        fetchPlayers()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add player')
      }
    } catch (err) {
      console.error('Failed to add player:', err)
      setError('Failed to add player')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemovePlayer = async (playerId: string) => {
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setPlayers(players.filter(p => p.id !== playerId))
      }
    } catch (err) {
      console.error('Failed to remove player:', err)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Players</h1>
          </div>
          <button
            onClick={() => setShowAddPlayer(true)}
            className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 transition"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Add Player Form */}
        {showAddPlayer && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                placeholder="Enter player name"
                autoFocus
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition disabled:opacity-50"
              />
              <button
                onClick={handleAddPlayer}
                disabled={submitting || !newPlayerName.trim()}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
              <button
                onClick={() => { setShowAddPlayer(false); setNewPlayerName(''); setError('') }}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>
        )}

        {/* Players List */}
        {players.length > 0 ? (
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-sky-500 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{player.name}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> {player.stats.wins} wins
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" /> {player.stats.totalGames} games
                      </span>
                      {player.stats.totalGames > 0 && (
                        <span className="text-teal-400">
                          {player.stats.winRate}% win rate
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 text-center">
            <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">No players yet</p>
            <p className="text-sm text-zinc-600 mt-1 mb-4">
              Add players to track their stats
            </p>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
