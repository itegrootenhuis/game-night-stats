import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limit by user ID
    const { success, response } = await checkRateLimit(user.id)
    if (!success && response) {
      return response
    }

    const gameNights = await prisma.gameNight.findMany({
      where: {
        userId: user.id
      },
      include: {
        gameSessions: {
          include: {
            game: true,
            results: {
              include: {
                player: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Calculate stats for each game night
    const gameNightsWithStats = gameNights.map(gn => {
      const totalGames = gn.gameSessions.length
      const players = new Set<string>()
      
      gn.gameSessions.forEach(session => {
        session.results.forEach(result => {
          players.add(result.player.name)
        })
      })

      return {
        id: gn.id,
        name: gn.name,
        date: gn.date,
        createdAt: gn.createdAt,
        stats: {
          totalGames,
          playerCount: players.size,
          players: Array.from(players)
        },
        gameSessions: gn.gameSessions
      }
    })

    return NextResponse.json(gameNightsWithStats)
  } catch (error) {
    console.error('Failed to fetch game nights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game nights' },
      { status: 500 }
    )
  }
}

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
    const { name, date, playerIds } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Game night name is required' },
        { status: 400 }
      )
    }

    // Create the game night
    const gameNight = await prisma.gameNight.create({
      data: {
        name: name.trim(),
        date: date ? new Date(date) : new Date(),
        userId: user.id
      }
    })

    // If playerIds provided, verify they exist (for validation)
    if (playerIds && Array.isArray(playerIds) && playerIds.length > 0) {
      const existingPlayers = await prisma.player.findMany({
        where: {
          id: { in: playerIds },
          userId: user.id // Only check players belonging to this user
        }
      })
      
      if (existingPlayers.length !== playerIds.length) {
        // Some players don't exist, but we still created the game night
        console.warn('Some player IDs were invalid')
      }
    }

    return NextResponse.json(gameNight, { status: 201 })
  } catch (error) {
    console.error('Failed to create game night:', error)
    return NextResponse.json(
      { error: 'Failed to create game night' },
      { status: 500 }
    )
  }
}
