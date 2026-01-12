import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(
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
    
    const gameNight = await prisma.gameNight.findUnique({
      where: { 
        id,
        userId: user.id // Ensure game night belongs to this user
      },
      include: {
        gameSessions: {
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
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!gameNight) {
      return NextResponse.json(
        { error: 'Game night not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(gameNight)
  } catch (error) {
    console.error('Failed to fetch game night:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game night' },
      { status: 500 }
    )
  }
}

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
    const { name, date } = body

    // Verify the game night belongs to this user
    const existingGameNight = await prisma.gameNight.findUnique({
      where: { id, userId: user.id }
    })

    if (!existingGameNight) {
      return NextResponse.json(
        { error: 'Game night not found' },
        { status: 404 }
      )
    }

    const updateData: { name?: string; date?: Date } = {}
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Game night name is required' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (date !== undefined) {
      updateData.date = new Date(date)
    }

    const gameNight = await prisma.gameNight.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(gameNight)
  } catch (error) {
    console.error('Failed to update game night:', error)
    return NextResponse.json(
      { error: 'Failed to update game night' },
      { status: 500 }
    )
  }
}

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
    
    // Verify the game night belongs to this user before deleting
    const gameNight = await prisma.gameNight.findUnique({
      where: { id, userId: user.id }
    })

    if (!gameNight) {
      return NextResponse.json(
        { error: 'Game night not found' },
        { status: 404 }
      )
    }

    await prisma.gameNight.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Failed to delete game night:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Game night not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete game night' },
      { status: 500 }
    )
  }
}
