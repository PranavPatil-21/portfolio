import { NextResponse, type NextRequest } from 'next/server'

/**
 * OAuth step one: send the editor to GitHub.
 *
 * This is the broker Sveltia CMS expects at `backend.base_url`. Hosting it here
 * rather than on a separate Cloudflare Worker means one deployment, one set of
 * secrets and one thing to keep alive — the CMS is already served from this
 * origin, so there is nothing to gain from a second service.
 *
 * Implements the same contract as the reference worker: `/auth` starts the
 * flow, `/callback` finishes it by posting the token back to the opener.
 */
export const dynamic = 'force-dynamic'

const STATE_COOKIE = 'sveltia-oauth-state'

export function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json(
      { error: 'GITHUB_CLIENT_ID is not configured on this deployment.' },
      { status: 500 },
    )
  }

  const url = new URL(request.url)
  const provider = url.searchParams.get('provider') ?? 'github'
  if (provider !== 'github') {
    return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 })
  }

  /*
   * CSRF protection. The state is generated here, held in an httpOnly cookie
   * the browser cannot read, and compared on the way back. Without it, an
   * attacker can complete someone else's login by replaying a callback URL.
   */
  const state = crypto.randomUUID()

  const authorize = new URL('https://github.com/login/oauth/authorize')
  authorize.searchParams.set('client_id', clientId)
  // `repo` is the narrowest scope that still allows committing content.
  authorize.searchParams.set('scope', url.searchParams.get('scope') ?? 'repo,user')
  authorize.searchParams.set('state', state)
  authorize.searchParams.set('redirect_uri', `${url.origin}/callback`)

  const response = NextResponse.redirect(authorize.toString())
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return response
}
