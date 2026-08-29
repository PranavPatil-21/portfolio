import { type NextRequest } from 'next/server'

/**
 * OAuth step two: exchange the code for a token and hand it to the CMS.
 *
 * Sveltia opens `/auth` in a popup and waits for the popup to `postMessage` a
 * specific string back. This route completes the exchange server-side — the
 * client secret never reaches the browser — and then closes the loop.
 */
export const dynamic = 'force-dynamic'

const STATE_COOKIE = 'sveltia-oauth-state'

/** The message shape Sveltia listens for. */
function reply(origin: string, payload: string) {
  return new Response(
    `<!doctype html><html><body><script>
      (function () {
        var message = ${JSON.stringify(payload)};
        function send() { window.opener && window.opener.postMessage(message, ${JSON.stringify(origin)}); }
        // Sveltia sends a handshake first; answer it, then send the result.
        window.addEventListener('message', send, { once: true });
        send();
        setTimeout(function () { window.close(); }, 1200);
      })();
    </script><p>You can close this window.</p></body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  )
}

function fail(origin: string, message: string) {
  return reply(
    origin,
    `authorization:github:error:${JSON.stringify({ provider: 'github', error: message })}`,
  )
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const origin = url.origin

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return fail(origin, 'OAuth is not configured on this deployment.')
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const expected = request.cookies.get(STATE_COOKIE)?.value

  if (!code) return fail(origin, 'GitHub did not return an authorization code.')
  // Reject a callback whose state does not match the one we issued — this is
  // the check that stops a replayed or forged callback completing a login.
  if (!state || !expected || state !== expected) {
    return fail(origin, 'Authorization state did not match. Please try signing in again.')
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${origin}/callback`,
      }),
    })

    const data = (await tokenResponse.json()) as {
      access_token?: string
      error_description?: string
      error?: string
    }

    if (!data.access_token) {
      // Report GitHub's reason, never the request that carried the secret.
      return fail(origin, data.error_description ?? data.error ?? 'GitHub declined the exchange.')
    }

    const response = reply(
      origin,
      `authorization:github:success:${JSON.stringify({
        provider: 'github',
        token: data.access_token,
      })}`,
    )
    // The state is single-use; clear it so the same callback cannot run twice.
    response.headers.append(
      'set-cookie',
      `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    )
    return response
  } catch {
    return fail(origin, 'Could not reach GitHub to complete sign-in.')
  }
}
