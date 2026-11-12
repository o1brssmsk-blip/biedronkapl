import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// site_enabled ayari icin kisa sureli cache (her istekte DB'yi yormamak icin)
let siteEnabledCache: { value: boolean; at: number } | null = null

async function isSiteEnabled(supabase: ReturnType<typeof createServerClient>): Promise<boolean> {
  if (siteEnabledCache && Date.now() - siteEnabledCache.at < 10_000) {
    return siteEnabledCache.value
  }
  try {
    const { data } = await supabase
      .from('global_settings')
      .select('site_enabled')
      .limit(1)
      .maybeSingle()
    const enabled = data?.site_enabled !== false
    siteEnabledCache = { value: enabled, at: Date.now() }
    return enabled
  } catch {
    return true
  }
}

const SITE_OFFLINE_HTML = `<!DOCTYPE html><html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>503 - Service Unavailable</title></head><body style="background-color:#0a0a0a;color:#e5e5e5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><div style="text-align:center;padding:2rem;"><h1 style="font-size:3rem;margin:0 0 1rem;">503</h1><p style="font-size:1.1rem;opacity:.7;">Service Unavailable</p></div></body></html>`

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAdminArea = pathname.startsWith('/admin')
  const isLogin = pathname.startsWith('/admin/login')

  // Force HTTPS in production when the incoming protocol is forwarded as HTTP.
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  if (process.env.NODE_ENV === 'production' && forwardedProto === 'http') {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 308)
  }

  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabase =
    url && anonKey
      ? createServerClient(url, anonKey, {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              response = NextResponse.next({ request })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options),
              )
            },
          },
        })
      : null

  if (isAdminArea) {
    if (supabase && !isLogin) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        const login = new URL('/admin/login', request.url)
        login.searchParams.set('next', pathname)
        return NextResponse.redirect(login)
      }
    }

    return response
  }

  // Site kapaliysa admin disinda tum sayfalar + api 503 (statik dosyalar haric)
  if (supabase && !pathname.startsWith('/_next') && !pathname.includes('.')) {
    const enabled = await isSiteEnabled(supabase)
    if (!enabled) {
      return new NextResponse(SITE_OFFLINE_HTML, {
        status: 503,
        headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': '60' },
      })
    }
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return response
  }

  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim()
  }

  if (ip && supabase) {
    const { data: bannedIp } = await supabase
      .from('banned_ips')
      .select('ip_address')
      .eq('ip_address', ip)
      .maybeSingle()

    if (bannedIp) {
      return new NextResponse(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Access Denied</title></head><body style="background-color:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div><h1>403 - Access Denied</h1><p>Your IP address (${ip}) has been blocked by the administrator.</p></div></body></html>`,
        { status: 403, headers: { 'content-type': 'text/html' } },
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
