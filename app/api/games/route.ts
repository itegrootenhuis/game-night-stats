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

    const games = await prisma.game.findMany({
      where: {
        userId: user.id
      },
      include: {
        gameSessions: {
          include: {
            results: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Calculate stats for each game
    const gamesWithStats = games.map(game => {
      const totalPlayed = game.gameSessions.length
      
      return {
        id: game.id,
        name: game.name,
        createdAt: game.createdAt,
        stats: {
          totalPlayed
        }
      }
    })

    return NextResponse.json(gamesWithStats)
  } catch (error) {
    console.error('Failed to fetch games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
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
        { error: 'Game name is required' },
        { status: 400 }
      )
    }

    const game = await prisma.game.create({
      data: {
        name: name.trim(),
        userId: user.id
      }
    })

    return NextResponse.json(game, { status: 201 })
  } catch (error: unknown) {
    console.error('Failed to create game:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A game with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}
