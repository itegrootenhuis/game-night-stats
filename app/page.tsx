'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Trophy, Target, TrendingUp, Users, Crown, Gamepad2, ChevronDown, User, Percent, Calendar, X, Loader2, ChevronUp } from 'lucide-react'
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
    color?: string | null
    avatarUrl?: string | null
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
      color?: string | null
      avatarUrl?: string | null
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
  groupTag: string | null
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
  color?: string | null
  avatarUrl?: string | null
}

const COLORS = ['#0d7377', '#38bdf8', '#14b8a6', '#06b6d4', '#22d3ee', '#0891b2', '#0e7490', '#155e75']

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [games, setGames] = useState<GameOption[]>([])
  const [players, setPlayers] = useState<PlayerOption[]>([])
  const [gameNights, setGameNights] = useState<GameNightOption[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [selectedGameNightId, setSelectedGameNightId] = useState<string>('')
  const [selectedGroupTag, setSelectedGroupTag] = useState<string>('')
  const [groupTags, setGroupTags] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [gameStats, setGameStats] = useState<GameFilterStats | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingFilter, setLoadingFilter] = useState(false)
  const [filtersCollapsed, setFiltersCollapsed] = useState(true)

  useEffect(() => {
    fetchData()
    fetchGroupTags()
  }, [])

  const fetchGroupTags = async () => {
    try {
      const res = await fetch('/api/game-nights/groups')
      if (res.ok) {
        const data = await res.json()
        setGroupTags(data)
      }
    } catch (err) {
      console.error('Failed to fetch group tags:', err)
    }
  }

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
        if (selectedGroupTag) params.append('groupTag', selectedGroupTag)
        
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
  }, [startDate, endDate, selectedGameId, selectedPlayerId, selectedGroupTag, selectedGameNightId])

  const clearAllFilters = () => {
    setSelectedGameNightId('')
    setSelectedGameId('')
    setSelectedPlayerId('')
    setSelectedGroupTag('')
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

  const handleRefresh = () => {
    fetchData()
    fetchGroupTags()
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

  // Filter game nights, players, and games by selected group tag
  const filteredGameNights = useMemo(() => {
    return selectedGroupTag
      ? gameNights.filter(gn => gn.groupTag === selectedGroupTag)
      : gameNights
  }, [selectedGroupTag, gameNights])

  // Get unique players from filtered game nights
  const filteredPlayers = useMemo(() => {
    if (!selectedGroupTag) {
      return players
    }
    
    const playerIds = new Set<string>()
    const playerMap = new Map<string, PlayerOption>()
    
    filteredGameNights.forEach(gn => {
      gn.gameSessions.forEach(session => {
        session.results.forEach(result => {
          if (!playerIds.has(result.player.id)) {
            playerIds.add(result.player.id)
            playerMap.set(result.player.id, {
              id: result.player.id,
              name: result.player.name
            })
          }
        })
      })
    })
    
    return Array.from(playerMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [selectedGroupTag, filteredGameNights, players])

  // Get unique games from filtered game nights
  const filteredGames = useMemo(() => {
    if (!selectedGroupTag) {
      return games
    }
    
    const gameIds = new Set<string>()
    const gameMap = new Map<string, GameOption>()
    
    filteredGameNights.forEach(gn => {
      gn.gameSessions.forEach(session => {
        if (!gameIds.has(session.game.id)) {
          gameIds.add(session.game.id)
          gameMap.set(session.game.id, {
            id: session.game.id,
            name: session.game.name,
            stats: { totalPlayed: 0 }
          })
        }
      })
    })
    
    return Array.from(gameMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [selectedGroupTag, filteredGameNights, games])

  // Get selected game night data
  const selectedGameNight = selectedGameNightId 
    ? filteredGameNights.find(gn => gn.id === selectedGameNightId) 
    : null

  // Clear selections if they're no longer valid after filtering
  useEffect(() => {
    if (selectedGroupTag) {
      // Clear game night if it's not in filtered list
      if (selectedGameNightId && !filteredGameNights.find(gn => gn.id === selectedGameNightId)) {
        setSelectedGameNightId('')
      }
      // Clear player if it's not in filtered list
      if (selectedPlayerId && !filteredPlayers.find(p => p.id === selectedPlayerId)) {
        setSelectedPlayerId('')
        setPlayerStats(null)
      }
      // Clear game if it's not in filtered list
      if (selectedGameId && !filteredGames.find(g => g.id === selectedGameId)) {
        setSelectedGameId('')
        setGameStats(null)
      }
    }
  }, [selectedGroupTag, filteredGameNights, filteredPlayers, filteredGames, selectedGameNightId, selectedPlayerId, selectedGameId])

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
    // If date filters or group tag are active, use stats API (which supports combined filters)
    if (startDate || endDate || selectedGroupTag) {
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

  // Create player color mapping
  const playerColorMap = useMemo(() => {
    const map = new Map<string, string>()
    players.forEach(player => {
      if (player.color) {
        map.set(player.id, player.color)
        map.set(player.name, player.color) // Also map by name for lookup
      }
    })
    // Also add colors from stats leaderboard
    stats?.leaderboard.forEach(player => {
      if (player.color && player.id) {
        map.set(player.id, player.color)
        map.set(player.name, player.color)
      }
    })
    return map
  }, [players, stats])

  // Prepare chart data
  const getWinsChartData = () => {
    if (selectedGameNightId && gameNightStats) {
      return gameNightStats.leaderboard.slice(0, 8).map(p => {
        const playerColor = playerColorMap.get(p.id) || playerColorMap.get(p.name) || COLORS[0]
        return {
          id: p.id,
          name: p.name,
          fullName: p.name,
          wins: p.wins,
          games: p.totalGames,
          winRate: p.winRate,
          color: playerColor
        }
      })
    }
    // If date filters or group tag are active, use stats API data (which includes groupTag filtering)
    if (startDate || endDate || selectedGroupTag) {
      return (stats?.leaderboard || []).slice(0, 8).map(item => {
        const playerColor = item.color || playerColorMap.get(item.id) || playerColorMap.get(item.name) || COLORS[0]
        return {
          id: item.id,
          name: item.name,
          fullName: item.name,
          wins: item.wins,
          games: item.totalGames,
          winRate: item.winRate,
          color: playerColor
        }
      })
    }
    // Otherwise, use specific game/player stats if selected
    if (selectedPlayerId && playerStats) {
      return playerStats.stats.gameStats.map(g => ({
        id: g.gameId,
        name: g.gameName,
        wins: g.wins,
        games: g.played,
        winRate: g.winRate,
        color: COLORS[0] // Games don't have colors
      }))
    }
    if (selectedGameId && gameStats) {
      return gameStats.stats.leaderboard.slice(0, 8).map(p => {
        const playerColor = p.color || playerColorMap.get(p.playerId) || playerColorMap.get(p.name) || COLORS[0]
        return {
          id: p.playerId,
          name: p.name,
          fullName: p.name,
          wins: p.wins,
          games: p.played,
          winRate: p.winRate,
          color: playerColor
        }
      })
    }
    return displayLeaderboard.slice(0, 8).map(item => {
      const playerColor = (item as any).color || playerColorMap.get(item.id) || playerColorMap.get(item.name) || COLORS[0]
      return {
        id: item.id,
        name: item.name,
        fullName: item.name,
        wins: item.wins,
        games: item.totalGames,
        winRate: item.winRate,
        color: playerColor
      }
    })
  }

  const winsChartData = getWinsChartData()

  // Win rate chart data for player view
  const winRateChartData = selectedPlayerId && playerStats && !(startDate || endDate)
    ? playerStats.stats.gameStats.map(g => ({
        name: g.gameName,
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

  // Use filtered game distribution from stats if date range or group tag is selected, otherwise use all games
  const gamesPlayedChartData = (startDate || endDate || selectedGroupTag) && stats?.gameDistribution
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

  // Custom shape function for bar chart with player colors
  const CustomBarShape = (props: any) => {
    const { x, y, width, height, payload } = props
    const color = payload?.color || COLORS[0]
    return (
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={height} 
        fill={color} 
        rx={4}
        ry={4}
      />
    )
  }

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; payload?: any }>; label?: string }) => {
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
    <main className="min-h-screen pb-20">
      <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>

        {/* Active Filters Display */}
        {(startDate || endDate || selectedGameId || selectedPlayerId || selectedGameNightId || selectedGroupTag) && (
          <div className="mb-4 p-3 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-between">
            <p className="text-sm text-blue-300">
              Active filters:{' '}
              {selectedGameNightId && (
                <span className="font-medium text-white">
                  Game Night: {filteredGameNights.find(gn => gn.id === selectedGameNightId)?.name || gameNights.find(gn => gn.id === selectedGameNightId)?.name || 'Unknown'}
                </span>
              )}
              {selectedGroupTag && (
                <span className="font-medium text-white ml-2">
                  {selectedGameNightId ? '·' : ''} Group: {selectedGroupTag}
                </span>
              )}
              {selectedGameId && (
                <span className="font-medium text-white ml-2">
                  {(selectedGameNightId || selectedGroupTag) ? '·' : ''} Game: {filteredGames.find(g => g.id === selectedGameId)?.name || games.find(g => g.id === selectedGameId)?.name || 'Unknown'}
                </span>
              )}
              {selectedPlayerId && (
                <span className="font-medium text-white ml-2">
                  {(selectedGameNightId || selectedGroupTag || selectedGameId) ? '·' : ''} Player: {filteredPlayers.find(p => p.id === selectedPlayerId)?.name || players.find(p => p.id === selectedPlayerId)?.name || 'Unknown'}
                </span>
              )}
              {(startDate || endDate) && (
                <span className="font-medium text-white ml-2">
                  {(selectedGameNightId || selectedGroupTag || selectedGameId || selectedPlayerId) ? '·' : ''} {startDate ? formatFullDate(startDate) : 'beginning'} to {endDate ? formatFullDate(endDate) : 'now'}
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
          <div className="mb-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-teal-600/20 to-sky-500/20 border border-teal-500/30">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-teal-600 to-sky-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-base sm:text-lg">
                  {playerStats.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">{playerStats.name}</h2>
                <p className="text-xs sm:text-sm text-teal-300">Player Stats</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="text-center p-2 sm:p-0 rounded-lg sm:rounded-none bg-zinc-900/30 sm:bg-transparent">
                <p className="text-xl sm:text-2xl font-bold text-white">{playerStats.stats.totalGames}</p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">Games</p>
              </div>
              <div className="text-center p-2 sm:p-0 rounded-lg sm:rounded-none bg-zinc-900/30 sm:bg-transparent">
                <p className="text-xl sm:text-2xl font-bold text-amber-400">{playerStats.stats.wins}</p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">Wins</p>
              </div>
              <div className="text-center p-2 sm:p-0 rounded-lg sm:rounded-none bg-zinc-900/30 sm:bg-transparent">
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">{playerStats.stats.winRate}%</p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">Win Rate</p>
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
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
            <div className="p-2.5 md:p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3 h-3 md:w-4 md:h-4 text-teal-400" />
                <span className="text-xs md:text-sm text-zinc-500 uppercase tracking-wider">Games</span>
              </div>
              <p className="text-lg md:text-2xl font-bold text-white">{stats?.overview.totalGamesPlayed || 0}</p>
            </div>
            
            <div className="p-2.5 md:p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
                <span className="text-xs md:text-sm text-zinc-500 uppercase tracking-wider">Nights</span>
              </div>
              <p className="text-lg md:text-2xl font-bold text-white">{stats?.overview.totalGameNights || 0}</p>
            </div>
            
            <div className="p-2.5 md:p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3 h-3 md:w-4 md:h-4 text-rose-400" />
                <span className="text-xs md:text-sm text-zinc-500 uppercase tracking-wider">Players</span>
              </div>
              <p className="text-lg md:text-2xl font-bold text-white">{stats?.overview.totalPlayers || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          {/* Collapsible Header for Mobile */}
          <button
            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
            className="md:hidden w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition mb-3"
          >
            <span className="text-sm font-medium text-white">Filters</span>
            {filtersCollapsed ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {/* Filters Content */}
          <div className={`space-y-4 ${filtersCollapsed ? 'hidden md:block' : 'block'}`}>
            {/* Other Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Group Tag Filter */}
            {groupTags.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                  <Users className="w-3 h-3 inline mr-1" />
                  Group
                </label>
                <div className="relative">
                  <select
                    value={selectedGroupTag}
                    onChange={(e) => {
                      setSelectedGroupTag(e.target.value)
                    }}
                    className="w-full pl-2 pr-8 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs appearance-none focus:outline-none focus:border-teal-500 transition cursor-pointer"
                  >
                    <option value="">All</option>
                    {groupTags.map(tag => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Game Night Filter */}
            {filteredGameNights.length > 0 && (
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
                    // Clear date filters when game night is selected (but allow group/game/player)
                    if (e.target.value) {
                      setStartDate('')
                      setEndDate('')
                    }
                  }}
                    className="w-full pl-2 pr-8 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs appearance-none focus:outline-none focus:border-teal-500 transition cursor-pointer"
                  >
                    <option value="">All</option>
                    {filteredGameNights.map(gn => (
                      <option key={gn.id} value={gn.id}>
                        {gn.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Game Filter */}
            {filteredGames.length > 0 && (
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
                    className="w-full pl-2 pr-8 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs appearance-none focus:outline-none focus:border-teal-500 transition cursor-pointer"
                  >
                    <option value="">All</option>
                    {filteredGames.map(game => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Player Filter */}
            {filteredPlayers.length > 0 && (
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
                    className="w-full pl-2 pr-8 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs appearance-none focus:outline-none focus:border-teal-500 transition cursor-pointer"
                  >
                    <option value="">All</option>
                    {filteredPlayers.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          {(gameNights.length > 0 || (stats?.overview.totalGameNights ?? 0) > 0) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full min-w-0 px-2 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs appearance-none focus:outline-none focus:border-teal-500 transition"
                    style={{ maxWidth: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    className="w-full min-w-0 px-2 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs appearance-none focus:outline-none focus:border-teal-500 transition"
                    style={{ maxWidth: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                  }}
                  className="text-xs text-teal-400 hover:text-teal-300"
                >
                  Clear date range
                </button>
              )}
            </>
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
                    fontSize={14}
                    tickLine={false} 
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(13, 115, 119, 0.1)' }} />
                  <Bar dataKey="wins" shape={CustomBarShape} />
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
              <ResponsiveContainer width="100%" height={250}>
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
                  <Bar dataKey="winRate" shape={CustomBarShape} />
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
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {(selectedGameNightId ? gameNightGamesData : gamesPlayedChartData).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend 
                    formatter={(value) => <span className="text-zinc-400 text-sm">{value}</span>}
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconSize={10}
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
                    fontSize={14}
                    tickLine={false} 
                    axisLine={false}
                    width={120}
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
                  <Bar dataKey="winRate" shape={CustomBarShape} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        </div>

        {/* Leaderboard and Recent Games */}
        {!loadingFilter && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Leaderboard / Game Stats List */}
            <div className="flex flex-col">
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
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center flex flex-col justify-center min-h-[200px]">
                <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">
                  {selectedPlayerId ? 'No games played yet' : selectedGameId ? 'No games played yet for this game' : 'No games recorded yet'}
                </p>
                <p className="text-sm text-zinc-600 mt-1">Start a game night to see stats</p>
              </div>
            )}
            </div>

            {/* Recent Games */}
            <div className="flex flex-col">
              <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
                {selectedGameNightId ? 'Games This Night' : 'Recent Games'}
              </h2>
            {filteredRecentGames.length > 0 ? (
              <div className="space-y-2 flex-1">
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
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center flex-1 flex flex-col justify-center min-h-[200px]">
                <Target className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No games played yet</p>
                <div className="mt-3 flex justify-center">
                  <Link 
                    href="/game-nights/new"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition"
                  >
                    Start Game Night
                  </Link>
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

