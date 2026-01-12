'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trophy, Target, TrendingUp, Users, Crown, Gamepad2, ChevronDown, User, Percent, Calendar, X, Loader2 } from 'lucide-react'
import { Skeleton, SkeletonWidget, SkeletonChart, SkeletonLeaderboard, SkeletonRecentGames } from '@/components/Skeleton'
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
  gameDistribution?: Array<{
    name: string
    count: number
  }>
}

interface GameFilterStats {
  id: string
  name: string
  stats: {
    totalPlayed: number
    leaderboard: Array<{
      playerId: string
      name: string
      wins: number
      played: number
      winRate: number
    }>
  }
}

interface PlayerStats {
  id: string
  name: string
  gameResults: Array<{
    id: string
    isWinner: boolean
    gameSession: {
      game: { id: string; name: string }
      gameNight: { id: string; name: string }
      createdAt: string
    }
  }>
  stats: {
    totalGames: number
    wins: number
    winRate: number
    gameStats: Array<{
      gameId: string
      gameName: string
      played: number
      wins: number
      winRate: number
    }>
  }
}

interface GameNightOption {
  id: string
  name: string
  date: string
  stats: {
    totalGames: number
    playerCount: number
    players: string[]
  }
  gameSessions: Array<{
    id: string
    game: { id: string; name: string }
    results: Array<{
      id: string
      isWinner: boolean
      player: { id: string; name: string }
    }>
  }>
}

interface GameOption {
  id: string
  name: string
  stats: {
    totalPlayed: number
  }
}

interface PlayerOption {
  id: string
  name: string
}

const COLORS = ['#0d7377', '#38bdf8', '#14b8a6', '#06b6d4', '#22d3ee', '#0891b2', '#0e7490', '#155e75']

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [games, setGames] = useState<GameOption[]>([])
  const [players, setPlayers] = useState<PlayerOption[]>([])
  const [gameNights, setGameNights] = useState<GameNightOption[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [selectedGameNightId, setSelectedGameNightId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [gameStats, setGameStats] = useState<GameFilterStats | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingFilter, setLoadingFilter] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // If game is selected (without game night), fetch game stats
    // Game and Player are mutually exclusive (unless game night is selected)
    if (selectedGameId && !selectedGameNightId) {
      fetchGameStats(selectedGameId)
      setSelectedPlayerId('') // Player and Game are mutually exclusive when no game night
      setPlayerStats(null)
    } else if (!selectedGameId) {
      setGameStats(null)
    }
  }, [selectedGameId, selectedGameNightId])

  useEffect(() => {
    // If player is selected (without game night), fetch player stats
    // Game and Player are mutually exclusive (unless game night is selected)
    if (selectedPlayerId && !selectedGameNightId) {
      fetchPlayerStats(selectedPlayerId)
      setSelectedGameId('') // Player and Game are mutually exclusive when no game night
      setGameStats(null)
    } else if (!selectedPlayerId) {
      setPlayerStats(null)
    }
  }, [selectedPlayerId, selectedGameNightId])

  // Fetch stats when date range or game/player filters change (but not game night)
  useEffect(() => {
    // Don't fetch if game night is selected (it has its own logic)
    if (selectedGameNightId) {
      return
    }
    
    // Fetch updated stats with all active filters
    const fetchFilteredData = async () => {
      setLoadingFilter(true)
      try {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        if (selectedGameId) params.append('gameId', selectedGameId)
        if (selectedPlayerId) params.append('playerId', selectedPlayerId)
        
        const queryString = params.toString()
        const statsUrl = queryString ? `/api/stats?${queryString}` : '/api/stats'
        
        const statsRes = await fetch(statsUrl)
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Failed to fetch filtered stats:', err)
      } finally {
        setLoadingFilter(false)
      }
    }
    
    fetchFilteredData()
  }, [startDate, endDate, selectedGameId, selectedPlayerId, selectedGameNightId])

  const clearAllFilters = () => {
    setSelectedGameNightId('')
    setSelectedGameId('')
    setSelectedPlayerId('')
    setStartDate('')
    setEndDate('')
    setGameStats(null)
    setPlayerStats(null)
  }

  const fetchData = async () => {
    try {
      // Build query string with all active filters
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedGameId) params.append('gameId', selectedGameId)
      if (selectedPlayerId) params.append('playerId', selectedPlayerId)
      const queryString = params.toString()
      const statsUrl = queryString ? `/api/stats?${queryString}` : '/api/stats'

      const [statsRes, gamesRes, playersRes, gameNightsRes] = await Promise.all([
        fetch(statsUrl),
        fetch('/api/games'),
        fetch('/api/players'),
        fetch('/api/game-nights')
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      if (gamesRes.ok) {
        const data = await gamesRes.json()
        setGames(data)
      }

      if (playersRes.ok) {
        const data = await playersRes.json()
        setPlayers(data)
      }

      if (gameNightsRes.ok) {
        const data = await gameNightsRes.json()
        setGameNights(data)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchGameStats = async (gameId: string) => {
    setLoadingFilter(true)
    try {
      const res = await fetch(`/api/games/${gameId}`)
      if (res.ok) {
        const data = await res.json()
        setGameStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch game stats:', err)
    } finally {
      setLoadingFilter(false)
    }
  }

  const fetchPlayerStats = async (playerId: string) => {
    setLoadingFilter(true)
    try {
      const res = await fetch(`/api/players/${playerId}`)
      if (res.ok) {
        const data = await res.json()
        setPlayerStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch player stats:', err)
    } finally {
      setLoadingFilter(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get selected game night data
  const selectedGameNight = selectedGameNightId 
    ? gameNights.find(gn => gn.id === selectedGameNightId) 
    : null

  // Calculate game night specific stats (with optional game/player filters)
  const getGameNightStats = () => {
    if (!selectedGameNight) return null

    const playerWins: Record<string, { name: string; wins: number; played: number }> = {}
    const gameCount: Record<string, { name: string; count: number }> = {}

    selectedGameNight.gameSessions.forEach(session => {
      // Filter by game if selected
      if (selectedGameId && session.game.id !== selectedGameId) {
        return
      }

      // Count games
      if (!gameCount[session.game.id]) {
        gameCount[session.game.id] = { name: session.game.name, count: 0 }
      }
      gameCount[session.game.id].count++

      // Count player stats
      session.results.forEach(result => {
        // Filter by player if selected
        if (selectedPlayerId && result.player.id !== selectedPlayerId) {
          return
        }

        if (!playerWins[result.player.id]) {
          playerWins[result.player.id] = { name: result.player.name, wins: 0, played: 0 }
        }
        playerWins[result.player.id].played++
        if (result.isWinner) {
          playerWins[result.player.id].wins++
        }
      })
    })

    const leaderboard = Object.entries(playerWins)
      .map(([id, data]) => ({
        id,
        name: data.name,
        wins: data.wins,
        totalGames: data.played,
        winRate: data.played > 0 ? Math.round((data.wins / data.played) * 100) : 0
      }))
      .sort((a, b) => b.wins - a.wins)

    const gamesPlayed = Object.entries(gameCount)
      .map(([id, data]) => ({
        id,
        name: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)

    return { leaderboard, gamesPlayed }
  }

  const gameNightStats = getGameNightStats()

  // Determine what leaderboard to show
  const getDisplayLeaderboard = () => {
    // Game night stats (with optional game/player filters)
    if (selectedGameNightId && gameNightStats) {
      return gameNightStats.leaderboard
    }
    // If date filters are active, use stats API (which supports combined filters)
    if (startDate || endDate) {
      return stats?.leaderboard || []
    }
    // Otherwise, use specific game/player stats if selected
    if (selectedPlayerId && playerStats && !selectedGameNightId) {
      return playerStats.stats.gameStats.map(g => ({
        id: g.gameId,
        name: g.gameName,
        totalGames: g.played,
        wins: g.wins,
        winRate: g.winRate
      }))
    }
    if (selectedGameId && gameStats && !selectedGameNightId) {
      return gameStats.stats.leaderboard.map(p => ({
        id: p.playerId,
        name: p.name,
        totalGames: p.played,
        wins: p.wins,
        winRate: p.winRate
      }))
    }
    return stats?.leaderboard || []
  }

  const displayLeaderboard = getDisplayLeaderboard()

  // Prepare chart data
  const getWinsChartData = () => {
    if (selectedGameNightId && gameNightStats) {
      return gameNightStats.leaderboard.slice(0, 8).map(p => ({
        name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
        wins: p.wins,
        games: p.totalGames,
        winRate: p.winRate
      }))
    }
    // If date filters are active, use stats API data
    if (startDate || endDate) {
      return (stats?.leaderboard || []).slice(0, 8).map(item => ({
        name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
        wins: item.wins,
        games: item.totalGames,
        winRate: item.winRate
      }))
    }
    // Otherwise, use specific game/player stats if selected
    if (selectedPlayerId && playerStats) {
      return playerStats.stats.gameStats.map(g => ({
        name: g.gameName.length > 12 ? g.gameName.substring(0, 12) + '...' : g.gameName,
        wins: g.wins,
        games: g.played,
        winRate: g.winRate
      }))
    }
    return displayLeaderboard.slice(0, 8).map(item => ({
      name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
      wins: item.wins,
      games: item.totalGames,
      winRate: item.winRate
    }))
  }

  const winsChartData = getWinsChartData()

  // Win rate chart data for player view
  const winRateChartData = selectedPlayerId && playerStats && !(startDate || endDate)
    ? playerStats.stats.gameStats.map(g => ({
        name: g.gameName.length > 10 ? g.gameName.substring(0, 10) + '...' : g.gameName,
        winRate: g.winRate,
        fullName: g.gameName
      }))
    : []

  // Games distribution for game night
  const gameNightGamesData = selectedGameNightId && gameNightStats
    ? gameNightStats.gamesPlayed.map(g => ({
        name: g.name,
        value: g.count
      }))
    : []

  // Use filtered game distribution from stats if date range is selected, otherwise use all games
  const gamesPlayedChartData = (startDate || endDate) && stats?.gameDistribution
    ? stats.gameDistribution.map(g => ({
        name: g.name,
        value: g.count
      }))
    : games
        .filter(g => g.stats.totalPlayed > 0)
        .map(game => ({
          name: game.name,
          value: game.stats.totalPlayed
        }))

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-zinc-400">
              {entry.dataKey === 'wins' ? 'Wins' : entry.dataKey === 'winRate' ? 'Win Rate' : 'Games'}: 
              <span className="text-white ml-1">
                {entry.value}{entry.dataKey === 'winRate' ? '%' : ''}
              </span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-white font-medium">{payload[0].name}</p>
          <p className="text-sm text-zinc-400">
            Played: <span className="text-white">{payload[0].value} times</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Get recent games filtered appropriately
  const getFilteredRecentGames = () => {
    if (!stats?.recentGames) return []
    
    if (selectedGameNightId && selectedGameNight) {
      // Show games from this game night (with optional game/player filters)
      let sessions = selectedGameNight.gameSessions
      
      // Filter by game if selected
      if (selectedGameId) {
        sessions = sessions.filter(s => s.game.id === selectedGameId)
      }
      
      return sessions.map(session => {
        let results = session.results
        // Filter by player if selected
        if (selectedPlayerId) {
          results = results.filter(r => r.player.id === selectedPlayerId)
        }
        
        return {
          id: session.id,
          gameName: session.game.name,
          winners: results.filter(r => r.isWinner).map(r => r.player.name),
          playerCount: results.length
        }
      })
    }

    if (selectedPlayerId && playerStats && !selectedGameNightId) {
      return playerStats.gameResults.slice(0, 5).map(result => ({
        id: result.id,
        gameName: result.gameSession.game.name,
        gameNightName: result.gameSession.gameNight.name,
        date: result.gameSession.createdAt,
        isWinner: result.isWinner
      }))
    }
    
    if (selectedGameId && gameStats && !selectedGameNightId) {
      return stats.recentGames.filter(game => game.gameName === gameStats.name).slice(0, 5)
    }
    
    return stats.recentGames.slice(0, 5)
  }

  const filteredRecentGames = getFilteredRecentGames()

  if (loading) {
    return (
      <main className="min-h-screen p-4 pb-20">
        <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="h-7 w-32" />
          </div>

          {/* Filters Skeleton */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Stats Widgets Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <SkeletonWidget />
            <SkeletonWidget />
            <SkeletonWidget className="col-span-2 lg:col-span-1" />
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SkeletonLeaderboard />
            <SkeletonChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SkeletonChart />
            <SkeletonRecentGames />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 pb-20">
      <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>

        {/* Active Filters Display */}
        {(startDate || endDate || selectedGameId || selectedPlayerId || selectedGameNightId) && (
          <div className="mb-4 p-3 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-between">
            <p className="text-sm text-blue-300">
              Active filters:{' '}
              {selectedGameNightId && (
                <span className="font-medium text-white">
                  Game Night: {gameNights.find(gn => gn.id === selectedGameNightId)?.name || 'Unknown'}
                </span>
              )}
              {selectedGameId && (
                <span className="font-medium text-white ml-2">
                  {selectedGameNightId ? '·' : ''} Game: {games.find(g => g.id === selectedGameId)?.name || 'Unknown'}
                </span>
              )}
              {selectedPlayerId && (
                <span className="font-medium text-white ml-2">
                  {selectedGameNightId || selectedGameId ? '·' : ''} Player: {players.find(p => p.id === selectedPlayerId)?.name || 'Unknown'}
                </span>
              )}
              {(startDate || endDate) && (
                <span className="font-medium text-white ml-2">
                  {(selectedGameNightId || selectedGameId || selectedPlayerId) ? '·' : ''} {startDate ? formatFullDate(startDate) : 'beginning'} to {endDate ? formatFullDate(endDate) : 'now'}
                </span>
              )}
            </p>
            <button
              onClick={clearAllFilters}
              className="ml-4 p-1 rounded hover:bg-blue-500/20 transition-colors"
              aria-label="Clear all filters"
            >
              <X className="w-4 h-4 text-blue-300" />
            </button>
          </div>
        )}

        {/* Stats Overview */}
        {selectedPlayerId && playerStats ? (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-teal-600/20 to-sky-500/20 border border-teal-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-sky-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {playerStats.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{playerStats.name}</h2>
                <p className="text-sm text-teal-300">Player Stats</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{playerStats.stats.totalGames}</p>
                <p className="text-xs text-zinc-400">Games</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{playerStats.stats.wins}</p>
                <p className="text-xs text-zinc-400">Wins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{playerStats.stats.winRate}%</p>
                <p className="text-xs text-zinc-400">Win Rate</p>
              </div>
            </div>
          </div>
        ) : selectedGameNightId && selectedGameNight ? (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedGameNight.name}</h2>
                <p className="text-sm text-emerald-300">{formatFullDate(selectedGameNight.date)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{selectedGameNight.stats.totalGames}</p>
                <p className="text-xs text-zinc-400">Games</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{selectedGameNight.stats.playerCount}</p>
                <p className="text-xs text-zinc-400">Players</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {gameNightStats?.leaderboard[0]?.wins || 0}
                </p>
                <p className="text-xs text-zinc-400">Most Wins</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-teal-400" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Games Played</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.overview.totalGamesPlayed || 0}</p>
            </div>
            
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Game Nights</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.overview.totalGameNights || 0}</p>
            </div>
            
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-rose-400" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Players</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.overview.totalPlayers || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs appearance-none focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                  className="w-full px-2 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs appearance-none focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
                // Date range can be cleared independently
              }}
                  className="text-xs text-teal-400 hover:text-teal-300"
            >
              Clear date range
            </button>
          )}

          {/* Other Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Game Night Filter */}
            {gameNights.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Game Night
                </label>
                <div className="relative">
                  <select
                    value={selectedGameNightId}
                  onChange={(e) => {
                    setSelectedGameNightId(e.target.value)
                    // Clear date filters when game night is selected (but allow game/player)
                    if (e.target.value) {
                      setStartDate('')
                      setEndDate('')
                    }
                  }}
                    className="w-full px-2 py-2 pr-6 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs appearance-none focus:outline-none focus:border-teal-500 transition cursor-pointer"
                  >
                    <option value="">All</option>
                    {gameNights.map(gn => (
                      <option key={gn.id} value={gn.id}>
                        {gn.name.length > 12 ? gn.name.substring(0, 12) + '...' : gn.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Game Filter */}
            {games.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                  <Gamepad2 className="w-3 h-3 inline mr-1" />
                  Game
                </label>
                <div className="relative">
                  <select
                    value={selectedGameId}
                    onChange={(e) => {
                      setSelectedGameId(e.target.value)
                      // Game filter can work with game night or date range, but clears player if no game night
                      if (e.target.value && !selectedGameNightId) {
                        setSelectedPlayerId('')
                      }
                    }}
                    className="w-full px-2 py-2 pr-6 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs appearance-none focus:outline-none focus:border-teal-500 transition cursor-pointer"
                  >
                    <option value="">All</option>
                    {games.map(game => (
                      <option key={game.id} value={game.id}>
                        {game.name.length > 12 ? game.name.substring(0, 12) + '...' : game.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Player Filter */}
            {players.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                  <User className="w-3 h-3 inline mr-1" />
                  Player
                </label>
                <div className="relative">
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => {
                      setSelectedPlayerId(e.target.value)
                      // Player filter can work with game night or date range, but clears game if no game night
                      if (e.target.value && !selectedGameNightId) {
                        setSelectedGameId('')
                      }
                    }}
                    className="w-full px-2 py-2 pr-6 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs appearance-none focus:outline-none focus:border-teal-500 transition cursor-pointer"
                  >
                    <option value="">All</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name.length > 12 ? player.name.substring(0, 12) + '...' : player.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {loadingFilter && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Wins Bar Chart */}
        {!loadingFilter && winsChartData.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
              <Trophy className="w-4 h-4 inline mr-1" />
              {selectedGameNightId && selectedGameNight
                ? `${selectedGameNight.name}${selectedGameId ? ` - ${games.find(g => g.id === selectedGameId)?.name || 'Game'}` : ''}${selectedPlayerId ? ` - ${players.find(p => p.id === selectedPlayerId)?.name || 'Player'}` : ''} Winners`
                : selectedPlayerId && playerStats 
                  ? `${playerStats.name}'s Wins by Game`
                  : selectedGameId && gameStats 
                    ? `${gameStats.name} Wins` 
                    : 'Wins by Player'}
            </h2>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={winsChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(13, 115, 119, 0.1)' }} />
                  <Bar dataKey="wins" fill="#0d7377" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Win Rate by Game Chart (Player View Only) */}
        {!loadingFilter && selectedPlayerId && winRateChartData.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
              <Percent className="w-4 h-4 inline mr-1" />
              Win Rate by Game
            </h2>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={winRateChartData} margin={{ left: 0, right: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                  <Bar dataKey="winRate" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Games Distribution Pie Chart */}
        {!loadingFilter && (
          (selectedGameNightId && gameNightGamesData.length > 0) || 
          (!selectedGameId && !selectedPlayerId && !selectedGameNightId && gamesPlayedChartData.length > 0)
        ) && (
          <div>
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
              <Gamepad2 className="w-4 h-4 inline mr-1" />
              {selectedGameNightId ? 'Games Played This Night' : 'Games Distribution'}
            </h2>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={selectedGameNightId ? gameNightGamesData : gamesPlayedChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(selectedGameNightId ? gameNightGamesData : gamesPlayedChartData).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend 
                    formatter={(value) => <span className="text-zinc-400 text-sm">{value}</span>}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Player Win Percentage (Only when no player/game night filter) */}
        {!loadingFilter && !selectedPlayerId && !selectedGameNightId && winsChartData.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
              <Percent className="w-4 h-4 inline mr-1" />
              Player Win Percentage
            </h2>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={winsChartData} layout="vertical" margin={{ left: 60, right: 20, top: 10, bottom: 10 }}>
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    width={55}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg">
                            <p className="text-white font-medium">{label}</p>
                            <p className="text-sm text-zinc-400">
                              Win Rate: <span className="text-white">{data.winRate}%</span>
                            </p>
                            <p className="text-sm text-zinc-400">
                              Wins: <span className="text-white">{data.wins}</span> / <span className="text-white">{data.games}</span> games
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                    cursor={{ fill: 'rgba(13, 115, 119, 0.1)' }} 
                  />
                  <Bar dataKey="winRate" fill="#0d7377" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        </div>

        {/* Leaderboard / Game Stats List */}
        {!loadingFilter && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
              {selectedGameNightId && selectedGameNight
                ? `${selectedGameNight.name}${selectedGameId ? ` - ${games.find(g => g.id === selectedGameId)?.name || 'Game'}` : ''}${selectedPlayerId ? ` - ${players.find(p => p.id === selectedPlayerId)?.name || 'Player'}` : ''} Leaderboard`
                : selectedPlayerId && playerStats 
                  ? `${playerStats.name}'s Game Stats`
                  : selectedGameId && gameStats 
                    ? `${gameStats.name} Leaderboard` 
                    : 'Overall Leaderboard'}
            </h2>
            {displayLeaderboard.length > 0 ? (
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                {displayLeaderboard.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 ${
                      index !== displayLeaderboard.length - 1 ? 'border-b border-zinc-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {selectedPlayerId ? (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <Gamepad2 className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-amber-500 text-black' :
                          index === 1 ? 'bg-zinc-400 text-black' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {index + 1}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white flex items-center gap-1.5">
                          {item.name}
                          {!selectedPlayerId && index === 0 && <Crown className="w-4 h-4 text-amber-400" />}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {item.totalGames} games · {item.winRate}% win rate
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{item.wins}</p>
                      <p className="text-xs text-zinc-500">wins</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center">
                <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">
                  {selectedPlayerId ? 'No games played yet' : selectedGameId ? 'No games played yet for this game' : 'No games recorded yet'}
                </p>
                <p className="text-sm text-zinc-600 mt-1">Start a game night to see stats</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Games */}
        {!loadingFilter && (
          <div>
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
              {selectedGameNightId ? 'Games This Night' : 'Recent Games'}
            </h2>
            {filteredRecentGames.length > 0 ? (
              <div className="space-y-2">
                {selectedGameNightId ? (
                  // Game night specific games
                  (filteredRecentGames as Array<{ id: string; gameName: string; winners: string[]; playerCount: number }>).map((game) => (
                    <div
                      key={game.id}
                      className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-white">{game.gameName}</p>
                        <span className="text-xs text-zinc-500">{game.playerCount} players</span>
                      </div>
                      {game.winners.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-sm text-amber-400">
                            {game.winners.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : selectedPlayerId && playerStats ? (
                  // Player-specific recent games
                  (filteredRecentGames as Array<{ id: string; gameName: string; gameNightName: string; date: string; isWinner: boolean }>).map((game) => (
                    <div
                      key={game.id}
                      className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">{game.gameName}</p>
                          <p className="text-sm text-zinc-500 mt-0.5">
                            {game.gameNightName} · {formatDate(game.date)}
                          </p>
                        </div>
                        {game.isWinner ? (
                          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                            <Trophy className="w-3 h-3" />
                            Won
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
                            Played
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  // Normal recent games
                  (filteredRecentGames as Stats['recentGames']).map((game) => (
                    <div
                      key={game.id}
                      className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">{game.gameName}</p>
                          <p className="text-sm text-zinc-500 mt-0.5">
                            {game.gameNightName} · {formatDate(game.date)}
                          </p>
                        </div>
                        <span className="text-xs text-zinc-500">{game.playerCount} players</span>
                      </div>
                      {game.winners.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-sm text-amber-400">
                            {game.winners.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center">
                <Target className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No games played yet</p>
                <Link 
                  href="/game-nights/new"
                  className="inline-block mt-3 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition"
                >
                  Start Game Night
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
