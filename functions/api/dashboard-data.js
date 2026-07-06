// Cloudflare Pages Function — proxy autenticado para o webhook de dados do dashboard.
//
// Fica em nr1.gobeesiness.com/api/dashboard-data. Toda a zona nr1.gobeesiness.com
// deve estar protegida por Cloudflare Access, então esta função só executa para
// usuários já autenticados pelo time. Ela injeta o token do n8n (guardado como
// secret/variável de ambiente DASHBOARD_API_TOKEN), que NUNCA aparece no navegador.
//
// Defesa extra: se o cabeçalho do Access não estiver presente, recusa (evita que
// alguém chame a rota fora do fluxo do Access).

const UPSTREAM =
  'https://testes-api-n8n-dev.nicehill-2119d736.brazilsouth.azurecontainerapps.io/webhook/nr1-dashboard-data';

export async function onRequestGet(context) {
  const { env, request } = context;

  // Só permite se veio pelo Cloudflare Access (cabeçalho injetado pelo Access).
  const accessJwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!accessJwt) {
    return json({ error: 'unauthorized' }, 401);
  }

  const token = env.DASHBOARD_API_TOKEN;
  if (!token) {
    return json({ error: 'server misconfigured: DASHBOARD_API_TOKEN ausente' }, 500);
  }

  let upstream;
  try {
    upstream = await fetch(UPSTREAM, { headers: { 'X-Dashboard-Token': token } });
  } catch (e) {
    return json({ error: 'upstream indisponível', detail: String(e) }, 502);
  }

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
