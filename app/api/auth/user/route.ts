import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, email, name } = body

    if (!id || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.upsert({
      where: { id },
      update: {
        email,
        name: name || null,
      },
      create: {
        id,
        email,
        name: name || null,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Failed to create/update user:', error)
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    )
  }
}

