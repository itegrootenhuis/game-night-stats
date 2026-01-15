import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

// PATCH update a comment
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, commentId } = await params
    const body = await request.json()
    const { content } = body

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

    // Verify comment exists and belongs to this game night
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId, gameNightId: id }
    })

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        gameSession: {
          include: {
            game: true
          }
        }
      }
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Failed to update comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

// DELETE a comment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, commentId } = await params

    // Verify game night belongs to user
    const gameNight = await prisma.gameNight.findUnique({
      where: { id, userId: user.id }
    })

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 })
    }

    // Verify comment exists and belongs to this game night
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId, gameNightId: id }
    })

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
