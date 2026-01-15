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
    console.log('[API /api/games POST] Starting request')
    
    const user = await getAuthenticatedUser()
    console.log('[API /api/games POST] Auth result:', user ? `User ${user.id}` : 'No user')
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name } = body
    console.log('[API /api/games POST] Request body:', { name })

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Game name is required' },
        { status: 400 }
      )
    }

    console.log('[API /api/games POST] Creating game in database...')
    const game = await prisma.game.create({
      data: {
        name: name.trim(),
        userId: user.id
      }
    })
    console.log('[API /api/games POST] Game created:', game.id)

    return NextResponse.json(game, { status: 201 })
  } catch (error: unknown) {
    console.error('[API /api/games POST] Error:', error)
    console.error('[API /api/games POST] Error type:', typeof error)
    console.error('[API /api/games POST] Error name:', error instanceof Error ? error.name : 'unknown')
    console.error('[API /api/games POST] Error message:', error instanceof Error ? error.message : String(error))
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A game with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create game', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
