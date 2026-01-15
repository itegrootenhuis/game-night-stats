import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET comments for a game night (visitor)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; gameNightId: string }> }
) {
  try {
    const { token, gameNightId } = await params

    // Verify the share link is valid
    const shareLink = await prisma.shareLink.findUnique({
      where: { token, isActive: true }
    })

    if (!shareLink) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
    }

    // Check expiration
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }

    // Verify game night belongs to the share link owner
    const gameNight = await prisma.gameNight.findUnique({
      where: { id: gameNightId, userId: shareLink.userId }
    })

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 })
    }

    // Check if share link is filtered by group tag and game night matches
    if (shareLink.groupTag && gameNight.groupTag !== shareLink.groupTag) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 })
    }

    const comments = await prisma.comment.findMany({
      where: { gameNightId },
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
    console.error('Failed to fetch comments for visitor:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST create a comment (visitor)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string; gameNightId: string }> }
) {
  try {
    const { token, gameNightId } = await params
    const body = await request.json()
    const { content, gameSessionId, authorName } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // Verify the share link is valid
    const shareLink = await prisma.shareLink.findUnique({
      where: { token, isActive: true }
    })

    if (!shareLink) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
    }

    // Check expiration
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }

    // Verify game night belongs to the share link owner
    const gameNight = await prisma.gameNight.findUnique({
      where: { id: gameNightId, userId: shareLink.userId }
    })

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 })
    }

    // Check if share link is filtered by group tag and game night matches
    if (shareLink.groupTag && gameNight.groupTag !== shareLink.groupTag) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 })
    }

    // If gameSessionId provided, verify it belongs to this game night
    if (gameSessionId) {
      const session = await prisma.gameSession.findUnique({
        where: { id: gameSessionId, gameNightId }
      })
      if (!session) {
        return NextResponse.json({ error: 'Game session not found' }, { status: 404 })
      }
    }

    // Format content with author name if provided
    const formattedContent = authorName 
      ? `[${authorName}]: ${content.trim()}`
      : content.trim()

    const comment = await prisma.comment.create({
      data: {
        content: formattedContent,
        gameNightId,
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
    console.error('Failed to create comment for visitor:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
