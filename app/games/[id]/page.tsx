'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Gamepad2, Trophy, Target, Loader2, Crown, Calendar } from 'lucide-react'

interface PlayerStat {
  playerId: string
  name: string
  wins: number
  played: number
  winRate: number
}

interface GameSession {
  id: string
  createdAt: string
  gameNight: {
    id: string
    name: string
  }
  results: Array<{
    id: string
    isWinner: boolean
    player: {
      id: string
      name: string
    }
  }>
}

interface Game {
  id: string
  name: string
  gameSessions: GameSession[]
  stats: {
    totalPlayed: number
    leaderboard: PlayerStat[]
  }
}

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGame()
  }, [id])

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/games/${id}`)
      if (res.ok) {
        const data = await res.json()
        setGame(data)
      }
    } catch (err) {
      console.error('Failed to fetch game:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  if (!game) {
    return (
      <main className="min-h-screen p-4">
        <div className="max-w-lg mx-auto text-center py-12">
          <p className="text-zinc-500">Game not found</p>
          <Link href="/games" className="text-teal-400 hover:text-teal-300 mt-2 inline-block">
            Back to Games
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/games"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{game.name}</h1>
              <p className="text-sm text-zinc-500">Played {game.stats.totalPlayed} times</p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
            <Trophy className="w-4 h-4 inline mr-1" />
            Leaderboard
          </h2>
          {game.stats.leaderboard.length > 0 ? (
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
              {game.stats.leaderboard.map((player, index) => (
                <div
                  key={player.playerId}
                  className={`flex items-center justify-between p-4 ${
                    index !== game.stats.leaderboard.length - 1 ? 'border-b border-zinc-800' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-amber-500 text-black' :
                      index === 1 ? 'bg-zinc-400 text-black' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white flex items-center gap-1.5">
                        {player.name}
                        {index === 0 && <Crown className="w-4 h-4 text-amber-400" />}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {player.played} games · {player.winRate}% win rate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{player.wins}</p>
                    <p className="text-xs text-zinc-500">wins</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center">
              <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No games played yet</p>
            </div>
          )}
        </div>

        {/* Game History */}
        <div>
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
            <Target className="w-4 h-4 inline mr-1" />
            Game History
          </h2>
          {game.gameSessions.length > 0 ? (
            <div className="space-y-2">
              {game.gameSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Link 
                      href={`/game-nights/${session.gameNight.id}`}
                      className="text-sm text-zinc-400 hover:text-teal-400 transition"
                    >
                      {session.gameNight.name}
                    </Link>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(session.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {session.results.map((result) => (
                      <span
                        key={result.id}
                        className={`px-2 py-1 text-xs rounded-full ${
                          result.isWinner
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {result.isWinner && <Trophy className="w-3 h-3 inline mr-1" />}
                        {result.player.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center">
              <Target className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No games in history</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

