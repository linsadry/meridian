# Meridian

> Rastreador inteligente de sustentabilidade da rotina médica.

Stack: **React + Vite · Supabase · Cloudflare Pages**

---

## Pré-requisitos

- Node.js >= 18
- Conta Supabase (supabase.com) — gratuita
- Conta Cloudflare (dash.cloudflare.com) — gratuita
- Conta GitHub

---

## 1 — Supabase

### 1.1 Criar projeto

1. app.supabase.com → New project
2. Nome: `meridian`, escolha região (sa-east-1 = São Paulo)
3. Aguarde inicializar (~2 min)

### 1.2 Rodar a migration

1. SQL Editor → New query
2. Cole o conteúdo de `supabase/migration.sql`
3. Clique Run

Cria: tabela `turnos` com RLS, view `turnos_metrics`, políticas por usuário.

### 1.3 Pegar as chaves

Project Settings → API:
- VITE_SUPABASE_URL     = Project URL
- VITE_SUPABASE_ANON_KEY = anon public key

---

## 2 — Variáveis de ambiente

```bash
cp .env.example .env.local
# edite com suas chaves Supabase
```

Nunca commite .env.local (já está no .gitignore).

---

## 3 — Rodar local

```bash
npm install
npm run dev
# http://localhost:5173
```

Modo offline: sem env vars, o app usa localStorage automaticamente.

---

## 4 — GitHub

```bash
git init
git add .
git commit -m "feat: initial Meridian release"
# crie repo em github.com/new
git remote add origin https://github.com/SEU_USUARIO/meridian.git
git branch -M main
git push -u origin main
```

---

## 5 — Cloudflare Pages

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Selecione o repositório meridian

Configurações de build:
- Framework preset: Vite
- Build command: npm run build
- Build output directory: dist
- Node.js version: 18

Variáveis de ambiente (Settings → Environment variables → Production):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Clique Save and Deploy.
URL gerada: https://meridian.pages.dev

### CI/CD automático

Cada push na main dispara deploy automaticamente.

---

## Estrutura

```
meridian/
├── public/
│   ├── _redirects        # SPA routing Cloudflare
│   ├── _headers          # Security + cache headers
│   └── favicon.svg
├── src/
│   ├── lib/
│   │   ├── supabase.js   # Cliente singleton
│   │   └── db.js         # Data layer com fallback localStorage
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   └── migration.sql     # DDL completo
├── .env.example
├── .gitignore
└── vite.config.js
```

---

## Segurança

- RLS ativo: usuário acessa só seus dados
- Anon key segura para frontend (JWT via Supabase)
- Headers: X-Frame-Options, nosniff via Cloudflare
- HTTPS automático

---

## Build local

```bash
npm run build    # gera /dist
npm run preview  # serve em :4173
```
