import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAuthenticatedUser } from '@/lib/auth'

async function verifyRecaptcha(token: string | null): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY
  
  // If no secret key is configured, skip verification (for development)
  if (!secretKey) {
    console.warn('[Contact API] RECAPTCHA_SECRET_KEY not set, skipping verification')
    return true
  }

  // If no token provided but secret key exists, require verification
  if (!token) {
    console.warn('[Contact API] reCAPTCHA token not provided')
    return false
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data = await response.json()
    
    // Check if verification was successful and score is acceptable (v3 returns score 0.0-1.0)
    // Typically, scores above 0.5 are considered legitimate
    const isValid = data.success === true && (data.score ?? 0) >= 0.5
    
    if (!isValid) {
      console.warn('[Contact API] reCAPTCHA verification failed:', {
        success: data.success,
        score: data.score,
        errors: data['error-codes']
      })
    }
    
    return isValid
  } catch (error) {
    console.error('[Contact API] reCAPTCHA verification error:', error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { subject, body: messageBody, userEmail, recaptchaToken } = body

    // Validation
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      )
    }

    if (subject.length > 100) {
      return NextResponse.json(
        { error: 'Subject must be 100 characters or less' },
        { status: 400 }
      )
    }

    if (!messageBody || typeof messageBody !== 'string' || messageBody.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message body is required' },
        { status: 400 }
      )
    }

    if (messageBody.length > 2000) {
      return NextResponse.json(
        { error: 'Message body must be 2000 characters or less' },
        { status: 400 }
      )
    }

    // Verify reCAPTCHA token if secret key is configured
    const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY
    if (recaptchaSecretKey) {
      const isValidRecaptcha = await verifyRecaptcha(recaptchaToken)
      if (!isValidRecaptcha) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed. Please try again.' },
          { status: 400 }
        )
      }
    }

    // Get recipient email from environment variable
    const recipientEmail = process.env.CONTACT_US_EMAIL || 'itegrootenhuis@gmail.com'

    // Get authenticated user if available
    let authenticatedUser = null
    try {
      authenticatedUser = await getAuthenticatedUser()
    } catch (error) {
      // User is not authenticated, that's okay - use provided userEmail or "Anonymous"
    }

    const senderEmail = authenticatedUser?.email || userEmail || 'Anonymous'
    const senderName = authenticatedUser?.name || (userEmail !== 'Anonymous' ? userEmail : 'Anonymous User')

    // Send email using Resend
    const resendApiKey = process.env.RESEND_API_KEY
    console.log('[Contact API] RESEND_API_KEY check:', {
      exists: !!resendApiKey,
      length: resendApiKey?.length || 0,
      startsWith: resendApiKey?.substring(0, 7) || 'N/A'
    })
    
    if (!resendApiKey || resendApiKey.trim().length === 0) {
      console.error('[Contact API] RESEND_API_KEY is not set or is empty')
      return NextResponse.json(
        { error: 'Email service is not configured. Please ensure RESEND_API_KEY is set in your .env file and restart the dev server.' },
        { status: 500 }
      )
    }

    // Initialize Resend client
    let resend
    try {
      resend = new Resend(resendApiKey)
    } catch (error) {
      console.error('[Contact API] Failed to initialize Resend:', error)
      return NextResponse.json(
        { error: 'Email service initialization failed' },
        { status: 500 }
      )
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'Game Night Stats <onboarding@resend.dev>', // This will need to be updated with a verified domain
        to: recipientEmail,
        subject: `Contact Form: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #18181b; color: #fafafa;">
            <h2 style="color: #14b8a6; margin-bottom: 20px;">New Contact Form Submission</h2>
            
            <div style="background-color: #27272a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong style="color: #a1a1aa;">From:</strong> <span style="color: #fafafa;">${senderName} (${senderEmail})</span></p>
              <p style="margin: 5px 0;"><strong style="color: #a1a1aa;">Subject:</strong> <span style="color: #fafafa;">${subject}</span></p>
            </div>
            
            <div style="background-color: #27272a; padding: 15px; border-radius: 8px;">
              <h3 style="color: #a1a1aa; margin-top: 0; margin-bottom: 10px;">Message:</h3>
              <p style="color: #fafafa; white-space: pre-wrap; line-height: 1.6;">${messageBody.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        `,
        text: `
New Contact Form Submission

From: ${senderName} (${senderEmail})
Subject: ${subject}

Message:
${messageBody}
        `.trim()
      })

      if (error) {
        console.error('[Contact API] Resend error:', error)
        return NextResponse.json(
          { error: 'Failed to send email', details: error.message || 'Unknown error' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, messageId: data?.id })
    } catch (resendError) {
      console.error('[Contact API] Resend send error:', resendError)
      return NextResponse.json(
        { error: 'Failed to send email', details: resendError instanceof Error ? resendError.message : 'Unknown error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Contact API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    )
  }
}
