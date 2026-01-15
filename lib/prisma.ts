import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Log DATABASE_URL format (without exposing the actual password)
const dbUrl = process.env.DATABASE_URL
if (dbUrl) {
  try {
    const url = new URL(dbUrl)
    const hasPassword = url.password && url.password.length > 0
    const maskedUrl = `${url.protocol}//${url.username}${hasPassword ? ':****' : ''}@${url.hostname}:${url.port}${url.pathname}${url.search}`
    console.log('[Prisma] DATABASE_URL format:', maskedUrl)
    console.log('[Prisma] Has pgbouncer param:', url.searchParams.has('pgbouncer'))
    console.log('[Prisma] Hostname:', url.hostname)
    console.log('[Prisma] Port:', url.port)
    
    // Warn if using direct connection (port 5432) instead of pooler (port 6543)
    if (url.port === '5432' || (!url.port && url.hostname.includes('supabase.co'))) {
      console.error('[Prisma] ⚠️ WARNING: Using direct database connection (port 5432). For Vercel/serverless, use connection pooler on port 6543!')
      console.error('[Prisma] ⚠️ Get the pooler URL from Supabase Dashboard → Settings → Database → Connection string → Transaction mode')
    }
    
    if (!url.hostname.includes('pooler') && url.hostname.includes('supabase.co')) {
      console.error('[Prisma] ⚠️ WARNING: Hostname does not contain "pooler". This may be a direct connection which won\'t work on Vercel.')
    }
  } catch (e) {
    console.error('[Prisma] Failed to parse DATABASE_URL:', e)
  }
} else {
  console.error('[Prisma] DATABASE_URL is not set!')
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

