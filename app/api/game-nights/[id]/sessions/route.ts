import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

// Add a game session to a game night
export async function POST(
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

    const { id: gameNightId } = await params
    const body = await request.json()
    const { gameName, results } = body

    // Validate input
    if (!gameName || typeof gameName !== 'string' || gameName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Game name is required' },
        { status: 400 }
      )
    }

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'At least one player result is required' },
        { status: 400 }
      )
    }

    // Verify game night exists and belongs to this user
    const gameNight = await prisma.gameNight.findUnique({
      where: { 
        id: gameNightId,
        userId: user.id
      }
    })

    if (!gameNight) {
      return NextResponse.json(
        { error: 'Game night not found' },
        { status: 404 }
      )
    }

    // Find or create the game for this user
    let game = await prisma.game.findUnique({
      where: { 
        userId_name: {
          userId: user.id,
          name: gameName.trim()
        }
      }
    })

    if (!game) {
      game = await prisma.game.create({
        data: { 
          name: gameName.trim(),
          userId: user.id
        }
      })
    }

    // Create the game session with results
    const gameSession = await prisma.gameSession.create({
      data: {
        gameNightId,
        gameId: game.id,
        results: {
          create: results.map((result: { playerId: string; position: number; points?: number; isWinner: boolean }) => ({
            playerId: result.playerId,
            position: result.position,
            points: result.points,
            isWinner: result.isWinner
          }))
        }
      },
      include: {
        game: true,
        results: {
          include: {
            player: true
          },
          orderBy: {
            position: 'asc'
          }
        }
      }
    })

    return NextResponse.json(gameSession, { status: 201 })
  } catch (error) {
    console.error('Failed to create game session:', error)
    return NextResponse.json(
      { error: 'Failed to create game session' },
      { status: 500 }
    )
  }
}
