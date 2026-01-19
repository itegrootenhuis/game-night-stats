'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Calendar, 
  Trophy, 
  Dice5,
  Eye,
  AlertCircle,
  ChevronDown
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface Stats {
  ownerName: string
  shareLinkName: string | null
  overview: {
    totalPlayers: number
    totalGameNights: number
    totalGamesPlayed: number
    totalWins: number
  }
  leaderboard: Array<{
    id: string
    name: string
    totalGames: number
    wins: number
    winRate: number
  }>
  recentGames: Array<{
    id: string
    gameName: string
    gameNightName: string
    date: string
    winners: string[]
    playerCount: number
  }>
  gameDistribution: Array<{
    name: string
    count: number
  }>
  games: Array<{ id: string; name: string }>
  players: Array<{ id: string; name: string }>
  gameNights: Array<{ id: string; name: string; date: string }>
}

const CHART_COLORS = ['#14b8a6', '#38bdf8', '#a78bfa', '#f472b6', '#fb923c', '#facc15', '#4ade80', '#f87171']

export default function ViewPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    fetchStats()
  }, [resolvedParams.token, selectedGameId, selectedPlayerId, startDate, endDate])

  async function fetchStats() {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (selectedGameId) queryParams.set('gameId', selectedGameId)
      if (selectedPlayerId) queryParams.set('playerId', selectedPlayerId)
      if (startDate) queryParams.set('startDate', startDate)
      if (endDate) queryParams.set('endDate', endDate)

      const url = `/api/view/${resolvedParams.token}/stats${queryParams.toString() ? `?${queryParams}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to load stats')
        return
      }

      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  function clearFilters() {
    setSelectedGameId('')
    setSelectedPlayerId('')
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = selectedGameId || selectedPlayerId || startDate || endDate

  if (loading && !stats) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading stats...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Unable to View Stats</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-500 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </main>
    )
  }

  if (!stats) return null

  // Prepare chart data
  const winPercentageData = stats.leaderboard.map(player => ({
    name: player.name,
    winRate: player.winRate,
    games: player.totalGames
  }))

  return (
    <main className="min-h-screen p-4 pb-20">
      <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600/20 text-teal-400 text-sm mb-4">
            <Eye className="w-4 h-4" />
            Visitor View (Read-only)
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {stats.ownerName}'s Game Night Stats
          </h1>
          {stats.shareLinkName && (
            <p className="text-zinc-400">{stats.shareLinkName}</p>
          )}
        </div>

        {/* Filters */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Game</label>
              <div className="relative">
                <select
                  value={selectedGameId}
                  onChange={(e) => {
                    setSelectedGameId(e.target.value)
                    if (e.target.value) setSelectedPlayerId('')
                  }}
                  className="w-full pl-3 pr-8 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                >
                  <option value="">All Games</option>
                  {stats.games.map(game => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none stroke-[3]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Player</label>
              <div className="relative">
                <select
                  value={selectedPlayerId}
                  onChange={(e) => {
                    setSelectedPlayerId(e.target.value)
                    if (e.target.value) setSelectedGameId('')
                  }}
                  className="w-full pl-3 pr-8 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                >
                  <option value="">All Players</option>
                  {stats.players.map(player => (
                    <option key={player.id} value={player.id}>{player.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none stroke-[3]" />
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-medium text-zinc-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-w-0 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                style={{ maxWidth: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-medium text-zinc-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-w-0 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                style={{ maxWidth: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <p className="text-sm text-teal-400">Filters active</p>
              <button
                onClick={clearFilters}
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-600/20">
                <Users className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.overview.totalPlayers}</p>
                <p className="text-sm text-zinc-400">Players</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600/20">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.overview.totalGameNights}</p>
                <p className="text-sm text-zinc-400">Game Nights</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-600/20">
                <Dice5 className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.overview.totalGamesPlayed}</p>
                <p className="text-sm text-zinc-400">Games Played</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Leaderboard */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Leaderboard
            </h3>
            {stats.leaderboard.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-2">
                {stats.leaderboard.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-amber-500 text-black' :
                        index === 1 ? 'bg-zinc-400 text-black' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-zinc-700 text-zinc-300'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-white">{player.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{player.wins} wins</p>
                      <p className="text-xs text-zinc-400">{player.winRate}% · {player.totalGames} games</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Win Percentage Chart */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Player Win Percentage</h3>
            {winPercentageData.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No data yet</p>
            ) : (
              <>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={winPercentageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="winRate"
                        nameKey="name"
                      >
                        {winPercentageData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [`${value}%`, 'Win Rate']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {winPercentageData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm text-zinc-400">
                        {item.name}: <span className="text-white font-medium">{item.winRate}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Games Distribution */}
        {stats.gameDistribution.length > 0 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Games Distribution</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.gameDistribution} layout="vertical">
                  <XAxis type="number" stroke="#71717a" />
                  <YAxis dataKey="name" type="category" stroke="#71717a" width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Game Nights List */}
        {stats.gameNights.length > 0 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Game Nights
            </h3>
            <div className="space-y-2">
              {stats.gameNights.map(gameNight => (
                <Link
                  key={gameNight.id}
                  href={`/view/${resolvedParams.token}/game-nights/${gameNight.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition group"
                >
                  <div>
                    <p className="font-medium text-white group-hover:text-teal-400 transition">{gameNight.name}</p>
                    <p className="text-sm text-zinc-400">{formatDate(gameNight.date)}</p>
                  </div>
                  <span className="text-zinc-500 group-hover:text-teal-400 transition">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Games */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Games</h3>
          {stats.recentGames.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No games recorded yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentGames.map(game => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                >
                  <div>
                    <p className="font-medium text-white">{game.gameName}</p>
                    <p className="text-sm text-zinc-400">
                      {game.gameNightName} · {formatDate(game.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-teal-400">
                      {game.winners.length > 0 ? game.winners.join(', ') : 'No winner'}
                    </p>
                    <p className="text-xs text-zinc-500">{game.playerCount} players</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-500 mb-4">
            Want to track your own game nights?
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-500 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </main>
  )
}
