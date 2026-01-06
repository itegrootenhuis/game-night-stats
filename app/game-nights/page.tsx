'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Plus, Loader2, Trash2, Gamepad2 } from 'lucide-react'

interface GameNight {
  id: string
  name: string
  date: string
  stats: {
    totalGames: number
    playerCount: number
    players: string[]
  }
}

export default function GameNightsPage() {
  const [gameNights, setGameNights] = useState<GameNight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGameNights()
  }, [])

  const fetchGameNights = async () => {
    try {
      const res = await fetch('/api/game-nights')
      if (res.ok) {
        const data = await res.json()
        setGameNights(data)
      }
    } catch (err) {
      console.error('Failed to fetch game nights:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this game night?')) return

    try {
      const res = await fetch(`/api/game-nights/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setGameNights(gameNights.filter(gn => gn.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete game night:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
            <h1 className="text-2xl font-bold text-white">Game Nights</h1>
          </div>
          <Link
            href="/game-nights/new"
            className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 transition"
          >
            <Plus className="w-5 h-5 text-white" />
          </Link>
        </div>

        {/* Game Nights List */}
        {gameNights.length > 0 ? (
          <div className="space-y-3">
            {gameNights.map((gameNight) => (
              <div
                key={gameNight.id}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Link
                      href={`/game-nights/${gameNight.id}`}
                      className="text-lg font-semibold text-white hover:text-teal-400 transition"
                    >
                      {gameNight.name}
                    </Link>
                    <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(gameNight.date)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(gameNight.id)}
                    className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-zinc-400 mt-3 pt-3 border-t border-zinc-800">
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="w-4 h-4" />
                    {gameNight.stats.totalGames} games
                  </span>
                  <span>
                    {gameNight.stats.playerCount} players
                  </span>
                </div>
                
                {gameNight.stats.players.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {gameNight.stats.players.map(player => (
                      <span
                        key={player}
                        className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-400"
                      >
                        {player}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 text-center">
            <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">No game nights yet</p>
            <p className="text-sm text-zinc-600 mt-1 mb-4">
              Create your first game night to start tracking
            </p>
            <Link 
              href="/game-nights/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              New Game Night
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
