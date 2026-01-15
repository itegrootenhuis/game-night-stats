import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

// DELETE - Delete/revoke a share link
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

    // Verify the share link belongs to the user
    const shareLink = await prisma.shareLink.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      )
    }

    await prisma.shareLink.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete share link:', error)
    return NextResponse.json(
      { error: 'Failed to delete share link' },
      { status: 500 }
    )
  }
}

// PATCH - Update a share link (toggle active status)
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
    const { isActive, name, expiresAt } = body

    // Verify the share link belongs to the user
    const existingLink = await prisma.shareLink.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      )
    }

    const shareLink = await prisma.shareLink.update({
      where: { id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {})
      }
    })

    return NextResponse.json(shareLink)
  } catch (error) {
    console.error('Failed to update share link:', error)
    return NextResponse.json(
      { error: 'Failed to update share link' },
      { status: 500 }
    )
  }
}
