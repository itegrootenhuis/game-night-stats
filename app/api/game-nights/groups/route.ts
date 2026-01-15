import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

// GET - Get all unique group tags for the current user
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all game nights with group tags
    const gameNights = await prisma.gameNight.findMany({
      where: {
        userId: user.id,
        groupTag: { not: null }
      },
      select: {
        groupTag: true
      },
      distinct: ['groupTag']
    })

    // Extract unique group tags (filter out nulls)
    const groupTags = gameNights
      .map(gn => gn.groupTag)
      .filter((tag): tag is string => tag !== null)
      .sort()

    return NextResponse.json(groupTags)
  } catch (error) {
    console.error('Failed to fetch group tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group tags' },
      { status: 500 }
    )
  }
}
