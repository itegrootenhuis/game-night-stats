import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Ensure user exists in our database
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  })

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.user_metadata?.full_name || null,
      }
    })
  }

  return dbUser
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

