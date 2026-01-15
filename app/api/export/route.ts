import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all user data
    const [players, games, gameNights] = await Promise.all([
      prisma.player.findMany({
        where: { userId: user.id },
        include: {
          gameResults: {
            include: {
              gameSession: {
                include: {
                  game: true,
                  gameNight: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.game.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.gameNight.findMany({
        where: { userId: user.id },
        include: {
          gameSessions: {
            include: {
              game: true,
              results: {
                include: {
                  player: true
                },
                orderBy: { position: 'asc' }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { date: 'desc' }
      })
    ])

    // Format the export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        email: user.email,
        name: user.name
      },
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
        stats: {
          totalGames: p.gameResults.length,
          wins: p.gameResults.filter(r => r.isWinner).length
        }
      })),
      games: games.map(g => ({
        id: g.id,
        name: g.name,
        createdAt: g.createdAt
      })),
      gameNights: gameNights.map(gn => ({
        id: gn.id,
        name: gn.name,
        date: gn.date,
        createdAt: gn.createdAt,
        sessions: gn.gameSessions.map(s => ({
          id: s.id,
          game: s.game.name,
          date: s.date,
          results: s.results.map(r => ({
            player: r.player.name,
            position: r.position,
            points: r.points,
            isWinner: r.isWinner
          }))
        }))
      })),
      summary: {
        totalPlayers: players.length,
        totalGames: games.length,
        totalGameNights: gameNights.length,
        totalSessions: gameNights.reduce((sum, gn) => sum + gn.gameSessions.length, 0)
      }
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Failed to export data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
