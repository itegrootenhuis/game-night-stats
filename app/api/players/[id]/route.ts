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
    
    const player = await prisma.player.findUnique({
      where: { 
        id,
        userId: user.id // Ensure player belongs to this user
      },
      include: {
        gameResults: {
          include: {
            gameSession: {
              include: {
                game: true,
                gameNight: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Calculate detailed stats
    const totalGames = player.gameResults.length
    const wins = player.gameResults.filter(r => r.isWinner).length
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

    // Wins per game
    const gameStats: Record<string, { played: number; wins: number; gameName: string }> = {}
    player.gameResults.forEach(result => {
      const gameId = result.gameSession.gameId
      const gameName = result.gameSession.game.name
      if (!gameStats[gameId]) {
        gameStats[gameId] = { played: 0, wins: 0, gameName }
      }
      gameStats[gameId].played++
      if (result.isWinner) {
        gameStats[gameId].wins++
      }
    })

    return NextResponse.json({
      ...player,
      stats: {
        totalGames,
        wins,
        winRate,
        gameStats: Object.entries(gameStats).map(([gameId, stats]) => ({
          gameId,
          ...stats,
          winRate: stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0
        }))
      }
    })
  } catch (error) {
    console.error('Failed to fetch player:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player' },
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
    const { name, color, avatarUrl } = body

    // Verify the player belongs to this user
    const existingPlayer = await prisma.player.findUnique({
      where: { id, userId: user.id }
    })

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    const updateData: { name?: string; color?: string | null; avatarUrl?: string | null } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Player name is required' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (color !== undefined) {
      updateData.color = color && typeof color === 'string' && color.trim().length > 0 ? color.trim() : null
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim().length > 0 ? avatarUrl.trim() : null
    }

    const player = await prisma.player.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(player)
  } catch (error: unknown) {
    console.error('Failed to update player:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A player with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update player' },
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
    
    // Verify the player belongs to this user before deleting
    const player = await prisma.player.findUnique({
      where: { id, userId: user.id }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    await prisma.player.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Failed to delete player:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    )
  }
}
