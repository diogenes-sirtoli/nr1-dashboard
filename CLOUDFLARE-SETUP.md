# Dashboard NR1 — acesso seguro (Cloudflare Pages + Basic Auth)

As páginas com dados pessoais (index, detalhes, falhas, custo) buscam os dados em
`/api/dashboard-data` (uma **Pages Function** que injeta o token do n8n do lado
servidor). O acesso ao site inteiro é gateado por **HTTP Basic Auth** feito no
`functions/_middleware.js` — **não** usa Cloudflare Access / Zero Trust (evita o
plano que pede cadastro de cobrança). Passo a passo (uma vez):

## 1. Criar o projeto no Cloudflare Pages
- Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
- Selecionar o repositório **`diogenes-sirtoli/nr1-dashboard`**, branch **`main`**.
- Build settings: **Framework preset = None**, **Build command = (vazio)**,
  **Build output directory = `/`** (o site é HTML estático na raiz).
- Deploy. O Cloudflare publica em `https://nr1-dashboard.pages.dev`.

## 2. Configurar as variáveis (secrets) da Function
No projeto Pages → **Settings** → **Environment variables** → **Production**, adicionar
as DUAS como **Secret** e depois **re-deploy** para valerem:

- **`DASHBOARD_API_TOKEN`** — token do webhook n8n (header `X-Dashboard-Token` do
  `nr1-dashboard-data`). Valor está no repo `gobeejobs-campanha_nr1`, arquivo `.env`,
  linha `DASHBOARD_API_TOKEN=...`.
- **`DASHBOARD_BASIC_AUTH`** — credencial de login do time no formato `usuario:senha`
  (ex.: `equipe:umaSenhaForteAqui`). Escolher uma senha forte; é a que o middleware
  exige no prompt do navegador.

## 3. Domínio próprio
- No projeto Pages → **Custom domains** → **Set up a domain** → `nr1.gobeesiness.com`.
- Como o `gobeesiness.com` já está na Cloudflare, o registro DNS é criado sozinho.

## 4. Como o login funciona (Basic Auth — já no código)
- O `functions/_middleware.js` roda **antes** de toda rota do projeto (páginas + `/api`),
  nos **dois** hostnames (`nr1.gobeesiness.com` e `nr1-dashboard.pages.dev`).
- Sem/errada a credencial → **401** com `WWW-Authenticate` → o navegador abre o prompt
  nativo de usuário/senha. Certa → segue para a página/Function.
- A comparação é em tempo constante. A senha só existe no env `DASHBOARD_BASIC_AUTH`
  (Segredo no Pages); nunca vai para o repositório nem para o navegador.
- Não há tela de logout; para "sair", fechar o navegador (ele cacheia a credencial
  Basic durante a sessão). Aceitável para ferramenta interna.

## Como fica o fluxo
```
Equipe → nr1.gobeesiness.com  →  _middleware.js (Basic Auth, prompt de login)
   páginas estáticas + /api/dashboard-data (Pages Function)
   a Function injeta X-Dashboard-Token → webhook n8n → dados (com PII)
```
O token nunca chega ao navegador; sem login, nada carrega. LGPD ok.

## Observações
- **Página de qualidade** (`qualidade.html`): usa o endpoint público `nr1-quality-data`
  (só agregados, sem PII), mas como está dentro do projeto Pages, também fica atrás do
  Basic Auth (decisão: tudo time-only). Sem problema — não tem PII de qualquer forma.
- Se rotacionar o token do webhook no n8n, atualizar também `DASHBOARD_API_TOKEN` no Pages.
  Para trocar a senha do time, editar `DASHBOARD_BASIC_AUTH` e re-deploy.
- O `.pages.dev` também fica protegido pelo mesmo middleware — não há hostname exposto
  servindo PII sem login.
- O GitHub Pages antigo (`diogenes-sirtoli.github.io/nr1-dashboard`) continua público,
  mas as páginas com PII lá **não carregam dados** (o `/api` não existe no GitHub Pages).
  O acesso oficial passa a ser `nr1.gobeesiness.com`.
