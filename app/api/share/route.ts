import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

// GET - List all share links for the current user
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const shareLinks = await prisma.shareLink.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(shareLinks)
  } catch (error) {
    console.error('Failed to fetch share links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch share links' },
      { status: 500 }
    )
  }
}

// POST - Create a new share link
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
    const { name, expiresAt, groupTag } = body

    const shareLink = await prisma.shareLink.create({
      data: {
        userId: user.id,
        name: name || null,
        groupTag: groupTag || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    })

    return NextResponse.json(shareLink, { status: 201 })
  } catch (error) {
    console.error('Failed to create share link:', error)
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    )
  }
}
