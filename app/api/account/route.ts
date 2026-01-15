import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function DELETE() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete all user data from Prisma database
    // Due to cascading deletes set up in the schema, deleting the user
    // will also delete all related data (game nights, players, games, etc.)
    await prisma.user.delete({
      where: { id: user.id }
    })

    // Note: The Supabase auth user deletion should be handled client-side
    // using supabase.auth.admin.deleteUser() or the user can sign out
    // and their auth session will be invalidated

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
