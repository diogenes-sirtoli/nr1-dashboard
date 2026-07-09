// Cloudflare Pages Function — proxy autenticado para o webhook de dados do dashboard.
//
// Fica em nr1.gobeesiness.com/api/dashboard-data. O acesso é gateado pelo
// functions/_middleware.js (HTTP Basic Auth), que roda ANTES desta função em toda
// rota do projeto. Portanto, se chegou aqui, o usuário já passou pela autenticação.
// Esta função injeta o token do n8n (guardado como secret/variável de ambiente
// DASHBOARD_API_TOKEN), que NUNCA aparece no navegador.

const UPSTREAM =
  'https://testes-api-n8n-dev.nicehill-2119d736.brazilsouth.azurecontainerapps.io/webhook/nr1-dashboard-data';

export async function onRequestGet(context) {
  const { env } = context;

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
