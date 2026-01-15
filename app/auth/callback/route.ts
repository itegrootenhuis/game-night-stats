import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/'

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/acc9b804-01c2-45a6-8223-42a227cc8625',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:5',message:'Callback route hit',data:{hasCode:!!code,code:code?.substring(0,10)+'...',redirect,origin,fullUrl:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/acc9b804-01c2-45a6-8223-42a227cc8625',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:15',message:'Code exchange result',data:{hasError:!!error,errorMessage:error?.message,hasUser:!!data?.user,userId:data?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (!error && data.user) {
      // Ensure user exists in our database
      try {
        await prisma.user.upsert({
          where: { id: data.user.id },
          update: {
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || null,
          },
          create: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || null,
          },
        })
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/acc9b804-01c2-45a6-8223-42a227cc8625',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:30',message:'User upserted successfully',data:{userId:data.user.id,email:data.user.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } catch (err) {
        console.error('Failed to upsert user:', err)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/acc9b804-01c2-45a6-8223-42a227cc8625',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:33',message:'User upsert failed',data:{errorMessage:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      }

      const finalRedirect = `${origin}${redirect}`
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/acc9b804-01c2-45a6-8223-42a227cc8625',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:38',message:'Redirecting after success',data:{finalRedirect},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return NextResponse.redirect(finalRedirect)
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/acc9b804-01c2-45a6-8223-42a227cc8625',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:42',message:'Code exchange failed or no user',data:{hasError:!!error,errorMessage:error?.message,hasUser:!!data?.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    }
  } else {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/acc9b804-01c2-45a6-8223-42a227cc8625',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:47',message:'No code parameter',data:{searchParams:Object.fromEntries(searchParams.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}

