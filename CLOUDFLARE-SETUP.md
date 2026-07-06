# Dashboard NR1 — acesso seguro (Cloudflare Pages + Access)

As páginas com dados pessoais (index, detalhes, falhas, custo) passaram a buscar os
dados em `/api/dashboard-data` (uma **Pages Function** que injeta o token do n8n do
lado servidor). Para funcionar, o site precisa rodar no **Cloudflare Pages** e ficar
atrás do **Cloudflare Access**. Passo a passo (uma vez):

## 1. Criar o projeto no Cloudflare Pages
- Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
- Selecionar o repositório **`diogenes-sirtoli/nr1-dashboard`**, branch **`main`**.
- Build settings: **Framework preset = None**, **Build command = (vazio)**,
  **Build output directory = `/`** (o site é HTML estático na raiz).
- Deploy. O Cloudflare publica em `https://nr1-dashboard.pages.dev`.

## 2. Configurar o token (secret) da Function
- No projeto Pages → **Settings** → **Environment variables** → **Production**.
- Adicionar **`DASHBOARD_API_TOKEN`** com o valor do token do webhook n8n.
  - Esse valor está no repositório `gobeejobs-campanha_nr1`, arquivo `.env`, linha
    `DASHBOARD_API_TOKEN=...` (é o mesmo token exigido pelo header `X-Dashboard-Token`
    do webhook `nr1-dashboard-data`).
- **Re-deploy** o projeto para a variável valer.

## 3. Domínio próprio
- No projeto Pages → **Custom domains** → **Set up a domain** → `nr1.gobeesiness.com`.
- Como o `gobeesiness.com` já está na Cloudflare, o registro DNS é criado sozinho.

## 4. Proteger com Cloudflare Access (o login do time)
- Cloudflare **Zero Trust** → **Access** → **Applications** → **Add an application**
  → **Self-hosted**.
- **Application domain**: `nr1.gobeesiness.com` (cobre o site inteiro, inclusive `/api`).
- **Policy**: *Allow* → por e-mails do time (ou pelo domínio `@gobeesiness.com`,
  ou Google/one-time PIN).
- Salvar. A partir daí, abrir `nr1.gobeesiness.com` exige login; só quem está na
  policy entra, e o `/api/dashboard-data` também fica protegido.

## Como fica o fluxo
```
Equipe → nr1.gobeesiness.com  →  Cloudflare Access (login)
   páginas estáticas + /api/dashboard-data (Pages Function)
   a Function injeta X-Dashboard-Token → webhook n8n → dados (com PII)
```
O token nunca chega ao navegador; sem login, nada carrega. LGPD ok.

## Observações
- **Página de qualidade** (`qualidade.html`): usa o endpoint público `nr1-quality-data`
  (só agregados, sem PII). Funciona com ou sem login — mas dentro do `nr1.gobeesiness.com`
  ela também fica atrás do Access, o que é fine.
- Se algum dia rotacionar o token do webhook no n8n, atualizar também a variável
  `DASHBOARD_API_TOKEN` no Pages.
- O GitHub Pages antigo (`diogenes-sirtoli.github.io/nr1-dashboard`) continua público,
  mas as páginas com PII lá **não carregam dados** (o `/api` não existe no GitHub Pages).
  O acesso oficial passa a ser `nr1.gobeesiness.com`.
