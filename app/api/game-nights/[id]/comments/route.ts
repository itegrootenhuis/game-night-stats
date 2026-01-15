import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

// GET all comments for a game night
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify game night belongs to user
    const gameNight = await prisma.gameNight.findUnique({
      where: { id, userId: user.id }
    })

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 })
    }

    const comments = await prisma.comment.findMany({
      where: { gameNightId: id },
      include: {
        gameSession: {
          include: {
            game: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST create a new comment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { content, gameSessionId } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // Verify game night belongs to user
    const gameNight = await prisma.gameNight.findUnique({
      where: { id, userId: user.id }
    })

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 })
    }

    // If gameSessionId provided, verify it belongs to this game night
    if (gameSessionId) {
      const session = await prisma.gameSession.findUnique({
        where: { id: gameSessionId, gameNightId: id }
      })
      if (!session) {
        return NextResponse.json({ error: 'Game session not found' }, { status: 404 })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        gameNightId: id,
        gameSessionId: gameSessionId || null
      },
      include: {
        gameSession: {
          include: {
            game: true
          }
        }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
