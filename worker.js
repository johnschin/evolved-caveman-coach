// ============================================================
// Evolved Caveman AI Coach — Cloudflare Worker Proxy
// ============================================================

const ALLOWED_ORIGIN = '*';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // ── CORS preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── Route: POST /consent ── (write consent_events + users via service role)
    if (pathname === '/consent' && request.method === 'POST') {
      return handleConsent(request, env);
    }

    // ── Route: GET /check-consent ── (read consent_events via service role)
    if (pathname === '/check-consent' && request.method === 'GET') {
      return handleCheckConsent(request, env);
    }

    // ── Route: POST /session ── (write session_logs via service role)
    if (pathname === '/session' && request.method === 'POST') {
      return handleSession(request, env);
    }

    // ── Route: PATCH /session ── (update session_logs via service role)
    if (pathname === '/session' && request.method === 'PATCH') {
      return handleSessionUpdate(request, env);
    }

    // ── Route: POST /crisis ── (write crisis_events via service role)
    if (pathname === '/crisis' && request.method === 'POST') {
      return handleCrisis(request, env);
    }

    // ── Route: POST / (default) ── (proxy to Anthropic Claude API)
    if (request.method === 'POST') {
      return handleChat(request, env);
    }

    return new Response('Not found', { status: 404 });
  }
};

// ── HELPER: Supabase fetch using service role key ──────────────────────────
async function supabaseFetch(env, path, method, body) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

// ── HANDLER: Save consent + upsert user ───────────────────────────────────
async function handleConsent(request, env) {
  try {
    const { email, agreedToTerms, consentTimestamp, userAgent, consentVersion } = await request.json();

    if (!email || !agreedToTerms) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    // 1. Insert consent_event
    const consentRes = await supabaseFetch(env, '/consent_events', 'POST', {
      user_id: email,
      event_type: 'initial_consent',
      timestamp: consentTimestamp || new Date().toISOString(),
      ip_address: 'worker-proxied',
      user_agent: userAgent || '',
      consent_text_shown: consentVersion || 'Version 1.0 - 2026-03-07',
      acknowledged: true,
    });

    if (!consentRes.ok) {
      const err = await consentRes.text();
      console.error('consent_events insert failed:', err);
      return jsonResponse({ error: 'Failed to save consent' }, 500);
    }

    // 2. Upsert user record
    const userRes = await fetch(`${env.SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        email,
        consent_version: consentVersion || '1.0',
        consent_timestamp: consentTimestamp || new Date().toISOString(),
        disclaimer_accepted: true,
        disclaimer_accepted_at: consentTimestamp || new Date().toISOString(),
        is_minor_confirmed: true,
      }),
    });

    if (!userRes.ok) {
      const err = await userRes.text();
      console.error('users upsert failed:', err);
      // Don't fail the whole request — consent was saved
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('handleConsent error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

// ── HANDLER: Check consent (replaces anon key read) ───────────────────────
async function handleCheckConsent(request, env) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return jsonResponse({ error: 'Missing email parameter' }, 400);
    }

    const res = await supabaseFetch(
      env,
      `/consent_events?user_id=eq.${encodeURIComponent(email)}&acknowledged=eq.true&order=timestamp.desc&limit=1`,
      'GET',
      null
    );

    if (!res.ok) {
      return jsonResponse({ error: 'Database error' }, 500);
    }

    const data = await res.json();
    return jsonResponse({ found: data && data.length > 0, record: data[0] || null });
  } catch (err) {
    console.error('handleCheckConsent error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

// ── HANDLER: Create session log ───────────────────────────────────────────
async function handleSession(request, env) {
  try {
    const body = await request.json();
    const res = await supabaseFetch(env, '/session_logs', 'POST', body);
    if (!res.ok) {
      const err = await res.text();
      console.error('session_logs insert failed:', err);
      return jsonResponse({ error: 'Failed to create session' }, 500);
    }
    const data = await res.json();
    return jsonResponse({ success: true, id: data[0]?.id || null });
  } catch (err) {
    console.error('handleSession error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

// ── HANDLER: Update session log ───────────────────────────────────────────
async function handleSessionUpdate(request, env) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return jsonResponse({ error: 'Missing id' }, 400);

    const body = await request.json();
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/session_logs?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(body),
    });

    return jsonResponse({ success: res.ok });
  } catch (err) {
    console.error('handleSessionUpdate error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

// ── HANDLER: Log crisis event ─────────────────────────────────────────────
async function handleCrisis(request, env) {
  try {
    const body = await request.json();
    const res = await supabaseFetch(env, '/crisis_events', 'POST', body);
    return jsonResponse({ success: res.ok });
  } catch (err) {
    console.error('handleCrisis error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

// ── HANDLER: Claude API proxy ─────────────────────────────────────────────
async function handleChat(request, env) {
  try {
    const body = await request.json();

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-5',
        max_tokens: body.max_tokens || 1024,
        system: body.system,
        messages: body.messages,
      }),
    });

    const data = await anthropicRes.json();
    return jsonResponse(data, anthropicRes.status);
  } catch (err) {
    console.error('handleChat error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

// ── UTIL ──────────────────────────────────────────────────────────────────
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
