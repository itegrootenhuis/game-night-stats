import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limit by user ID
    const { success, response } = await checkRateLimit(user.id)
    if (!success && response) {
      return response
    }

    const players = await prisma.player.findMany({
      where: {
        userId: user.id
      },
      include: {
        gameResults: {
          include: {
            gameSession: {
              include: {
                game: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Calculate stats for each player
    const playersWithStats = players.map(player => {
      const totalGames = player.gameResults.length
      const wins = player.gameResults.filter(r => r.isWinner).length
      const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

      return {
        id: player.id,
        name: player.name,
        createdAt: player.createdAt,
        stats: {
          totalGames,
          wins,
          winRate
        }
      }
    })

    return NextResponse.json(playersWithStats)
  } catch (error) {
    console.error('Failed to fetch players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      )
    }

    const player = await prisma.player.create({
      data: {
        name: name.trim(),
        userId: user.id
      }
    })

    return NextResponse.json(player, { status: 201 })
  } catch (error: unknown) {
    console.error('Failed to create player:', error)
    
    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A player with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    )
  }
}
