import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get filters from query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const gameId = searchParams.get('gameId')
    const playerId = searchParams.get('playerId')

    // Build date filters
    const gameNightDateFilter: any = {
      userId: user.id
    }
    
    const dateRangeFilter: any = {}
    if (startDate) {
      // Parse start date and set to beginning of day in local timezone
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      dateRangeFilter.gte = start
    }
    if (endDate) {
      // Parse end date and set to end of day in local timezone
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateRangeFilter.lte = end
    }
    
    if (Object.keys(dateRangeFilter).length > 0) {
      gameNightDateFilter.date = dateRangeFilter
    }

    // Build filter for game sessions (filter by game night date, and optionally by game/player)
    const dateFilter: any = {
      gameNight: gameNightDateFilter
    }
    
    // Add game filter if specified
    if (gameId) {
      dateFilter.gameId = gameId
    }
    
    // Add player filter if specified (filter by results)
    const playerFilter = playerId ? {
      results: {
        some: {
          playerId: playerId
        }
      }
    } : null

    // Get all counts for this user
    const [
      playerCount,
      gameNightCount,
      gameSessionCount,
      players,
      recentSessions,
      allFilteredSessions
    ] = await Promise.all([
      prisma.player.count({ where: { userId: user.id } }),
      prisma.gameNight.count({ 
        where: gameNightDateFilter
      }),
      prisma.gameSession.count({ 
        where: {
          ...dateFilter,
          ...(playerFilter || {})
        }
      }),
      prisma.player.findMany({
        where: { 
          userId: user.id,
          ...(playerId ? { id: playerId } : {})
        },
        include: {
          gameResults: {
            where: {
              ...(startDate || endDate || gameId || playerId ? {
                gameSession: {
                  ...(startDate || endDate ? { gameNight: gameNightDateFilter } : { gameNight: { userId: user.id } }),
                  ...(gameId ? { gameId } : {})
                }
              } : {}),
              ...(playerId ? { playerId } : {})
            },
            include: {
              gameSession: {
                include: {
                  gameNight: true,
                  game: true
                }
              }
            }
          }
        }
      }),
      prisma.gameSession.findMany({
        where: {
          ...dateFilter,
          ...(playerFilter || {})
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          game: true,
          gameNight: true,
          results: {
            include: {
              player: true
            },
            orderBy: {
              position: 'asc'
            }
          }
        }
      }),
      // Get all sessions for game distribution (not just recent 10)
      prisma.gameSession.findMany({
        where: {
          ...dateFilter,
          ...(playerFilter || {})
        },
        include: {
          game: true
        }
      })
    ])

    // Calculate leaderboard
    const leaderboard = players
      .map(player => {
        const totalGames = player.gameResults.length
        const wins = player.gameResults.filter(r => r.isWinner).length
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

        return {
          id: player.id,
          name: player.name,
          totalGames,
          wins,
          winRate
        }
      })
      .filter(p => p.totalGames > 0)
      .sort((a, b) => {
        // Sort by wins first, then by win rate
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.winRate - a.winRate
      })
      .slice(0, 10)

    // Total wins across all players
    const totalWins = players.reduce(
      (sum, player) => sum + player.gameResults.filter(r => r.isWinner).length,
      0
    )

    // Calculate games distribution from all filtered sessions (not just recent 10)
    // Always include gameDistribution, even if empty
    const gameDistribution: Record<string, number> = {}
    allFilteredSessions.forEach(session => {
      const gameName = session.game.name
      gameDistribution[gameName] = (gameDistribution[gameName] || 0) + 1
    })

    return NextResponse.json({
      overview: {
        totalPlayers: playerCount,
        totalGameNights: gameNightCount,
        totalGamesPlayed: gameSessionCount,
        totalWins
      },
      leaderboard,
      recentGames: recentSessions.map(session => ({
        id: session.id,
        gameName: session.game.name,
        gameNightName: session.gameNight.name,
        date: session.createdAt,
        winners: session.results
          .filter(r => r.isWinner)
          .map(r => r.player.name),
        playerCount: session.results.length
      })),
      // Always include gameDistribution in response
      gameDistribution: Object.entries(gameDistribution).map(([name, count]) => ({
        name,
        count
      }))
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
