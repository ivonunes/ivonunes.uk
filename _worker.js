const supportedProvider = 'github';

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function outputHTML({ provider = supportedProvider, token, error, errorCode }) {
  const state = error ? 'error' : 'success';
  const content = error ? { provider, error, errorCode } : { provider, token };

  return new Response(
    `<!doctype html><html><body><script>
      (() => {
        window.addEventListener('message', ({ data, origin }) => {
          if (data === 'authorizing:${provider}') {
            window.opener?.postMessage(
              'authorization:${provider}:${state}:${JSON.stringify(content)}',
              origin
            );
          }
        });
        window.opener?.postMessage('authorizing:${provider}', '*');
      })();
    </script></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Set-Cookie': 'cms-auth-state=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure'
      }
    }
  );
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp(`(?:^|; )${escapeRegExp(name)}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function isAllowedDomain(domain, allowedDomains) {
  if (!allowedDomains) {
    return true;
  }

  return allowedDomains.split(',').some((entry) => {
    const pattern = entry.trim();
    if (!pattern) return false;
    return new RegExp(`^${escapeRegExp(pattern).replace('\\*', '.+')}$`).test(domain || '');
  });
}

async function handleCmsAuth(request, env) {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || supportedProvider;
  const domain = url.searchParams.get('site_id') || '';

  if (provider !== supportedProvider) {
    return outputHTML({
      error: 'Your Git backend is not supported by the authenticator.',
      errorCode: 'UNSUPPORTED_BACKEND'
    });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return outputHTML({
      provider,
      error: 'OAuth app client ID or secret is not configured.',
      errorCode: 'MISCONFIGURED_CLIENT'
    });
  }

  if (!isAllowedDomain(domain, env.ALLOWED_DOMAINS)) {
    return outputHTML({
      provider,
      error: 'Your domain is not allowed to use the authenticator.',
      errorCode: 'UNSUPPORTED_DOMAIN'
    });
  }

  const state = crypto.randomUUID().replaceAll('-', '');
  const githubHostname = env.GITHUB_HOSTNAME || 'github.com';
  const callbackUrl = `${url.origin}/admin/oauth/callback`;
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: callbackUrl,
    scope: 'repo,user',
    state
  });

  return new Response('', {
    status: 302,
    headers: {
      Location: `https://${githubHostname}/login/oauth/authorize?${params.toString()}`,
      'Set-Cookie': `cms-auth-state=${encodeURIComponent(state)}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`
    }
  });
}

async function handleCmsCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = getCookie(request, 'cms-auth-state');

  if (!code || !state) {
    return outputHTML({
      error: 'Failed to receive an authorization code. Please try again later.',
      errorCode: 'AUTH_CODE_REQUEST_FAILED'
    });
  }

  if (!cookieState || cookieState !== state) {
    return outputHTML({
      error: 'Potential CSRF attack detected. Authentication flow aborted.',
      errorCode: 'CSRF_DETECTED'
    });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return outputHTML({
      error: 'OAuth app client ID or secret is not configured.',
      errorCode: 'MISCONFIGURED_CLIENT'
    });
  }

  const githubHostname = env.GITHUB_HOSTNAME || 'github.com';
  const callbackUrl = `${url.origin}/admin/oauth/callback`;

  let response;
  try {
    response = await fetch(`https://${githubHostname}/login/oauth/access_token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        redirect_uri: callbackUrl
      })
    });
  } catch {
    return outputHTML({
      error: 'Failed to request an access token. Please try again later.',
      errorCode: 'TOKEN_REQUEST_FAILED'
    });
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return outputHTML({
      error: 'Server responded with malformed data. Please try again later.',
      errorCode: 'MALFORMED_RESPONSE'
    });
  }

  if (!payload.access_token) {
    return outputHTML({
      error: payload.error_description || payload.error || 'Authentication failed.',
      errorCode: 'TOKEN_REQUEST_FAILED'
    });
  }

  return outputHTML({ token: payload.access_token });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/admin/oauth/auth') {
      return handleCmsAuth(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/admin/oauth/callback') {
      return handleCmsCallback(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
