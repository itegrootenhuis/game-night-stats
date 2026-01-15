import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getAuthenticatedUser() {
  try {
    console.log('[Auth] Getting authenticated user...')
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[Auth] Supabase auth error:', authError.message)
      return null
    }
    
    if (!user) {
      console.log('[Auth] No user in session')
      return null
    }
    
    console.log('[Auth] Supabase user found:', user.id)

    // Ensure user exists in our database
    console.log('[Auth] Checking database for user...')
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })
    console.log('[Auth] Database user found:', !!dbUser)

    if (!dbUser) {
      console.log('[Auth] Creating new database user...')
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.user_metadata?.full_name || null,
        }
      })
      console.log('[Auth] Database user created:', dbUser.id)
    }

    return dbUser
  } catch (error) {
    console.error('[Auth] Error in getAuthenticatedUser:', error)
    console.error('[Auth] Error message:', error instanceof Error ? error.message : String(error))
    throw error
  }
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

