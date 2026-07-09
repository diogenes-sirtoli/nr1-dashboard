// Cloudflare Pages Function — middleware de autenticação (HTTP Basic Auth).
//
// Roda ANTES de qualquer rota do projeto Pages (páginas estáticas + /api/*),
// nos DOIS hostnames (nr1.gobeesiness.com e nr1-dashboard.pages.dev). É o portão
// único que protege o PII servido pelo dashboard — substitui o Cloudflare Access.
//
// Credencial compartilhada do time, guardada como Segredo no Pages:
//   DASHBOARD_BASIC_AUTH = "usuario:senha"
// Sem/errada => 401 com WWW-Authenticate (browser abre prompt nativo).
//
// Comparação em tempo constante para não vazar a credencial por timing.

export async function onRequest(context) {
  const { env, request, next } = context;

  const expected = env.DASHBOARD_BASIC_AUTH;
  if (!expected) {
    return new Response(
      JSON.stringify({ error: 'server misconfigured: DASHBOARD_BASIC_AUTH ausente' }),
      { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } }
    );
  }

  const header = request.headers.get('Authorization') || '';
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    let provided = '';
    try {
      provided = atob(encoded);
    } catch {
      provided = '';
    }
    if (provided && timingSafeEqual(provided, expected)) {
      return next();
    }
  }

  return new Response('Autenticação necessária.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="NR1 Dashboard", charset="UTF-8"',
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

// Compara duas strings em tempo constante (não sai cedo em divergência).
function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}
