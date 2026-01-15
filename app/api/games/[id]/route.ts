import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    const game = await prisma.game.findUnique({
      where: { 
        id,
        userId: user.id // Ensure game belongs to this user
      },
      include: {
        gameSessions: {
          include: {
            gameNight: true,
            results: {
              include: {
                player: true
              },
              orderBy: {
                position: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Calculate player stats for this game
    const playerStats: Record<string, { name: string; color: string | null; avatarUrl: string | null; wins: number; played: number }> = {}
    
    game.gameSessions.forEach(session => {
      session.results.forEach(result => {
        if (!playerStats[result.playerId]) {
          playerStats[result.playerId] = {
            name: result.player.name,
            color: result.player.color,
            avatarUrl: result.player.avatarUrl,
            wins: 0,
            played: 0
          }
        }
        playerStats[result.playerId].played++
        if (result.isWinner) {
          playerStats[result.playerId].wins++
        }
      })
    })

    // Sort by wins
    const leaderboard = Object.entries(playerStats)
      .map(([playerId, stats]) => ({
        playerId,
        name: stats.name,
        color: stats.color,
        avatarUrl: stats.avatarUrl,
        wins: stats.wins,
        played: stats.played,
        winRate: stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.winRate - a.winRate
      })

    return NextResponse.json({
      ...game,
      stats: {
        totalPlayed: game.gameSessions.length,
        leaderboard
      }
    })
  } catch (error) {
    console.error('Failed to fetch game:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Game name is required' },
        { status: 400 }
      )
    }

    // Verify the game belongs to this user
    const existingGame = await prisma.game.findUnique({
      where: { id, userId: user.id }
    })

    if (!existingGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const game = await prisma.game.update({
      where: { id },
      data: { name: name.trim() }
    })

    return NextResponse.json(game)
  } catch (error: unknown) {
    console.error('Failed to update game:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A game with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    // Verify the game belongs to this user before deleting
    const game = await prisma.game.findUnique({
      where: { id, userId: user.id }
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    await prisma.game.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Failed to delete game:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    )
  }
}
