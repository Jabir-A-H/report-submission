import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Fetch session to check if this was a password recovery (reset) flow.
      // If GoTrue or the email template stripped the query parameters (e.g. next=/update-password),
      // we can detect recovery flow from the session JWT's AMR claim and override next to /update-password.
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (token) {
        try {
          const payloadBase64 = token.split('.')[1]
          let payloadJson = ''
          if (typeof atob === 'function') {
            payloadJson = atob(payloadBase64)
          } else {
            payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8')
          }
          const payload = JSON.parse(payloadJson)
          const isRecovery = payload?.amr?.some((method: any) => 
            typeof method === 'string' 
              ? method === 'recovery' 
              : method?.method === 'recovery'
          )
          
          if (isRecovery) {
            next = '/update-password'
          }
        } catch (e) {
          console.error('Failed to parse JWT payload for AMR check:', e)
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalhost = process.env.NODE_ENV === 'development'
      if (isLocalhost) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?message=লিঙ্কটি মেয়াদোত্তীর্ণ বা অবৈধ। আবার চেষ্টা করুন।`)
}
