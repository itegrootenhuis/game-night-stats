import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET game night details for visitors
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; gameNightId: string }> }
) {
  try {
    const { token, gameNightId } = await params

    // Verify the share link is valid
    const shareLink = await prisma.shareLink.findUnique({
      where: { token, isActive: true },
      include: { user: true }
    })

    if (!shareLink) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
    }

    // Check expiration
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }

    // Fetch the game night with sessions and comments
    const gameNight = await prisma.gameNight.findUnique({
      where: { id: gameNightId, userId: shareLink.userId },
      include: {
        gameSessions: {
          include: {
            game: true,
            results: {
              include: {
                player: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 })
    }

    // Check if share link is filtered by group tag and game night matches
    if (shareLink.groupTag && gameNight.groupTag !== shareLink.groupTag) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 })
    }

    // Fetch comments separately
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

    return NextResponse.json({
      ...gameNight,
      comments,
      ownerName: shareLink.user.name || shareLink.user.email
    })
  } catch (error) {
    console.error('Failed to fetch game night for visitor:', error)
    return NextResponse.json({ error: 'Failed to fetch game night' }, { status: 500 })
  }
}
