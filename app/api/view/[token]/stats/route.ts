import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIP } from '@/lib/ratelimit'

// GET - Public endpoint to get stats via share token (read-only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Rate limit public endpoint
    const ip = getClientIP(request)
    const { success, response } = await checkRateLimit(ip, true)
    if (!success && response) {
      return response
    }

    const { token } = await params

    // Find the share link by token
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Invalid share link' },
        { status: 404 }
      )
    }

    // Check if the share link is active
    if (!shareLink.isActive) {
      return NextResponse.json(
        { error: 'This share link has been deactivated' },
        { status: 403 }
      )
    }

    // Check if the share link has expired
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      return NextResponse.json(
        { error: 'This share link has expired' },
        { status: 403 }
      )
    }

    const userId = shareLink.userId
    const ownerName = shareLink.user.name || shareLink.user.email.split('@')[0]

    // Get filters from query parameters (same as regular stats)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const gameId = searchParams.get('gameId')
    const playerId = searchParams.get('playerId')

    // Build date filters
    const gameNightDateFilter: any = {
      userId
    }
    
    // Filter by group tag if share link has one
    if (shareLink.groupTag) {
      gameNightDateFilter.groupTag = shareLink.groupTag
    }
    
    const dateRangeFilter: any = {}
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      dateRangeFilter.gte = start
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateRangeFilter.lte = end
    }
    
    if (Object.keys(dateRangeFilter).length > 0) {
      gameNightDateFilter.date = dateRangeFilter
    }

    // Build filter for game sessions
    const dateFilter: any = {
      gameNight: gameNightDateFilter
    }
    
    if (gameId) {
      dateFilter.gameId = gameId
    }
    
    const playerFilter = playerId ? {
      results: {
        some: {
          playerId: playerId
        }
      }
    } : null

    // Get all data for this user (read-only)
    const [
      playerCount,
      gameNightCount,
      gameSessionCount,
      players,
      games,
      gameNights,
      recentSessions,
      allFilteredSessions
    ] = await Promise.all([
      prisma.player.count({ where: { userId } }),
      prisma.gameNight.count({ where: gameNightDateFilter }),
      prisma.gameSession.count({ 
        where: {
          ...dateFilter,
          ...(playerFilter || {})
        }
      }),
      prisma.player.findMany({
        where: { 
          userId,
          ...(playerId ? { id: playerId } : {})
        },
        include: {
          gameResults: {
            where: {
              ...(startDate || endDate || gameId || playerId ? {
                gameSession: {
                  ...(startDate || endDate ? { gameNight: gameNightDateFilter } : { gameNight: { userId } }),
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
      prisma.game.findMany({
        where: { userId },
        orderBy: { name: 'asc' }
      }),
      prisma.gameNight.findMany({
        where: { userId },
        orderBy: { date: 'desc' }
      }),
      prisma.gameSession.findMany({
        where: {
          ...dateFilter,
          ...(playerFilter || {})
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          game: true,
          gameNight: true,
          results: {
            include: { player: true },
            orderBy: { position: 'asc' }
          }
        }
      }),
      prisma.gameSession.findMany({
        where: {
          ...dateFilter,
          ...(playerFilter || {})
        },
        include: { game: true }
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
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.winRate - a.winRate
      })
      .slice(0, 10)

    // Total wins
    const totalWins = players.reduce(
      (sum, player) => sum + player.gameResults.filter(r => r.isWinner).length,
      0
    )

    // Game distribution
    const gameDistribution: Record<string, number> = {}
    allFilteredSessions.forEach(session => {
      const gameName = session.game.name
      gameDistribution[gameName] = (gameDistribution[gameName] || 0) + 1
    })

    return NextResponse.json({
      ownerName,
      shareLinkName: shareLink.name,
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
      gameDistribution: Object.entries(gameDistribution).map(([name, count]) => ({
        name,
        count
      })),
      // Include filter options for the visitor
      games: games.map(g => ({ id: g.id, name: g.name })),
      players: players.map(p => ({ id: p.id, name: p.name })),
      gameNights: gameNights.map(gn => ({ id: gn.id, name: gn.name, date: gn.date }))
    })
  } catch (error) {
    console.error('Failed to fetch shared stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
