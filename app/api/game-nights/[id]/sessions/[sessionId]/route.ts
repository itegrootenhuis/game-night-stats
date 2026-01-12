import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

// PATCH - Update game session results (change winner)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: gameNightId, sessionId } = await params
    const body = await request.json()
    const { winnerIds } = body // Array of player IDs who won

    if (!winnerIds || !Array.isArray(winnerIds)) {
      return NextResponse.json(
        { error: 'winnerIds array is required' },
        { status: 400 }
      )
    }

    // Verify the game night belongs to this user
    const gameNight = await prisma.gameNight.findFirst({
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

    // Verify the session belongs to this game night
    const session = await prisma.gameSession.findFirst({
      where: {
        id: sessionId,
        gameNightId: gameNightId
      },
      include: {
        results: true
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      )
    }

    // Update all results - set isWinner based on winnerIds
    const updatePromises = session.results.map((result, index) => {
      const isWinner = winnerIds.includes(result.playerId)
      return prisma.gameResult.update({
        where: { id: result.id },
        data: {
          isWinner,
          position: isWinner ? 1 : index + 2
        }
      })
    })

    await Promise.all(updatePromises)

    // Fetch and return updated session
    const updatedSession = await prisma.gameSession.findUnique({
      where: { id: sessionId },
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

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Failed to update game session:', error)
    return NextResponse.json(
      { error: 'Failed to update game session' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a game session
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: gameNightId, sessionId } = await params

    // Verify the game night belongs to this user
    const gameNight = await prisma.gameNight.findFirst({
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

    // Delete the session (cascades to results)
    await prisma.gameSession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete game session:', error)
    return NextResponse.json(
      { error: 'Failed to delete game session' },
      { status: 500 }
    )
  }
}
