# Monitor Coronel Barbosa 2026

[![CI](https://github.com/salescampelo/monitor-pmto/actions/workflows/ci.yml/badge.svg)](https://github.com/salescampelo/monitor-pmto/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/deploy-vercel-black)](https://monitor-coronel-barbosa.vercel.app)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-43853d)](https://nodejs.org)
[![Vite](https://img.shields.io/badge/vite-5-646cff)](https://vite.dev)
[![React](https://img.shields.io/badge/react-18-61dafb)](https://react.dev)
[![Tests](https://img.shields.io/badge/tests-71_passing-22c55e)]()

Central de inteligência eleitoral para a campanha do **Cel. Márcio Barbosa (Republicanos/TO)** a Deputado Federal em 2026. Dashboard estático em Vite/React com autenticação Supabase, painéis interativos e sincronização automática com scrapers Python.

**🌐 Produção:** https://monitor-coronel-barbosa.vercel.app

---

## 📑 Sumário

- [Funcionalidades](#-funcionalidades)
- [Stack](#-stack)
- [Arquitetura](#-arquitetura)
- [Setup local](#-setup-local)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Scripts](#-scripts)
- [Estrutura de diretórios](#-estrutura-de-diretórios)
- [Fonte de dados](#-fonte-de-dados)
- [Testes](#-testes)
- [Segurança](#-segurança)
- [Acessibilidade](#-acessibilidade)
- [PWA](#-pwa)
- [Deploy](#-deploy)
- [Convenções](#-convenções)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Métricas do projeto](#-métricas-do-projeto)

---

## 🎯 Funcionalidades

| # | Módulo | Descrição |
|---|--------|-----------|
| 1 | **Tendência de Voto** | Análise do 2º turno presidencial 2022 por município (conservador / dividido / progressista) |
| 2 | **Inteligência Competitiva** | Ranking de 17 adversários com score de ameaça dinâmico |
| 3 | **Metas da Campanha** | KPIs por fase com barras de progresso e countdown |
| 4 | **Dados Eleitorais** | 139 municípios com potencial e prioridade calculados |
| 5 | **Mapa de Capilaridade** | Lideranças e visitas por região (Leaflet) |
| 6 | **Redes Sociais** | Métricas Instagram de 18 perfis monitorados (candidato + adversários) |
| 7 | **Monitor de Imprensa** | Menções em 32 fontes com classificação de sentimento |
| 8 | **Auditoria** | Logs de acesso (admin only) |

### Header — KPIs de topo

- **Dias p/ eleição** — countdown até 04/10/2026
- **Seguidores IG** + seta de tendência semanal
- **Engajamento IG** (%) + seta de tendência
- **Imprensa 48h** — menções nas últimas 48 horas
- **Positivo IG** (%) — sentimento positivo dos comentários

Cores dinâmicas (verde / amarelo / vermelho) por threshold.

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Bundler | Vite 5 |
| UI | React 18 + JSX |
| Gráficos | Recharts 2 |
| Mapas | Leaflet + react-leaflet |
| Ícones | Lucide React |
| Datas | date-fns 4 |
| Auth | Supabase Auth (JWT) |
| API | Vercel Serverless Functions |
| Deploy | Vercel (auto-deploy) |
| CI | GitHub Actions |
| PWA | vite-plugin-pwa + Workbox |
| Testes | Vitest + jsdom + @vitest/coverage-v8 |
| Type-check runtime | PropTypes |

## 🏗️ Arquitetura

```
┌─────────────────┐   sync_github.py   ┌──────────────────┐   Vercel   ┌────────────┐
│  scraper-pmto   │ ─────────────────▶ │ monitor-pmto/    │ ─────────▶ │  Browser   │
│  (Python + CI)  │  commits JSON      │ public/data/     │   static   │  + Auth    │
└─────────────────┘                     └──────────────────┘            └────────────┘
        ↑                                       ↓
        │                              ┌──────────────────┐
        │                              │ api/data/[file]  │
        │                              │ (Vercel Function)│
        │                              │ JWT validation   │
        │                              └──────────────────┘
        │
        └─── GitHub Actions (cron: 07h BRT diário + 09h BRT domingos)
```

Os dados são JSONs gerados pelo scraper e sincronizados para `public/data/`. A rota `/api/data/[file]` valida o JWT Supabase antes de servir cada arquivo, impedindo acesso anônimo.

## 🚀 Setup local

### Pré-requisitos

- **Node.js 20+** (recomendado LTS)
- **npm 9+**
- Projeto Supabase configurado com tabela `allowed_users`
- E-mail cadastrado em `allowed_users` para acessar

### Instalação

```bash
git clone https://github.com/salescampelo/monitor-pmto.git
cd monitor-pmto
npm install
```

### Primeiro run

```bash
cp .env.example .env.local
# edite .env.local com suas credenciais
npm run dev
# abre em http://localhost:5173
```

## 🔑 Variáveis de ambiente

Listadas em `.env.example` (nenhuma credencial sensível é committada):

| Variável | Obrigatória | Descrição | Exemplo |
|---|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | URL do projeto Supabase | `https://aatuwpfcjhhmvtbwxzjy.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Chave pública (anon) | `eyJhbGciOi...` |
| `VITE_CANDIDATE_USERNAME` | ✅ | Username IG do candidato | `marciobarbosa_cel` |

> As mesmas variáveis devem estar em:
> - **Vercel**: Settings → Environment Variables (Production + Preview)
> - **GitHub**: Settings → Secrets and variables → Actions (para o CI)

## 📜 Scripts

```bash
npm run dev            # servidor de desenvolvimento com HMR
npm run build          # build de produção → dist/
npm run preview        # inspecionar o build localmente
npm run test           # vitest em modo run (CI)
npm run test:watch     # vitest em modo watch
npm run test:coverage  # cobertura via v8 → coverage/index.html
```

## 📁 Estrutura de diretórios

```
monitor-pmto/
├── .github/
│   ├── workflows/ci.yml          # Build + test + audit em cada push
│   └── dependabot.yml            # Auto-update npm + GitHub Actions
├── api/
│   └── data/[file].js            # Vercel Function: valida JWT e serve JSON
├── public/
│   ├── data/                     # JSONs do scraper (auto-sincronizados)
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── App.jsx                   # shell + auth wrapper + painel Imprensa inline
│   ├── main.jsx
│   ├── components/
│   │   ├── AppHeader.jsx         # header com KPIs e tendências
│   │   ├── LoginScreen.jsx       # login com rate limiting
│   │   ├── ErrorBoundary.jsx     # wrapper de erros globais
│   │   ├── HelpTooltip.jsx       # tooltips contextuais por painel
│   │   ├── PwModal.jsx           # modal de troca de senha
│   │   └── ui.jsx                # CSS + componentes base (Card, Met, Bt, NC, PanelSkeleton…)
│   ├── panels/
│   │   ├── TendenciaVotoPanel.jsx
│   │   ├── AdversariosPanel.jsx
│   │   ├── KpiPanel.jsx
│   │   ├── GeoPanel.jsx
│   │   ├── MapaCampoPanel.jsx
│   │   ├── SocialPanel.jsx
│   │   └── AuditoriaPanel.jsx
│   └── lib/
│       ├── config.js             # CONFIG.* externalizado (candidate username etc.)
│       ├── supabase.js           # client Supabase + autoRefreshToken
│       ├── fetch.js              # fetchJ autenticado + retry em 401 + timeout
│       ├── analytics.js          # cálculo de métricas do header
│       ├── news.js               # classificador de menções (tipo, scope, relevância)
│       ├── urlState.js           # persistência de filtros na URL
│       ├── useAutoRefresh.js     # hook background 30min + toggle
│       ├── useOffline.js         # detecção de offline (banner fixo)
│       ├── export.js             # exportação CSV (BOM UTF-8) + PDF (print)
│       ├── rateLimit.js          # 5 tentativas de login / 15min
│       ├── accessLog.js          # audit log (tabela Supabase)
│       └── __tests__/            # testes Vitest
├── .env.example                  # template de variáveis
├── vercel.json                   # redirects + CSP hardening
├── vite.config.js                # PWA plugin + build config
├── package.json
└── README.md
```

## 📊 Fonte de dados

Todos os JSONs ficam em `public/data/` e são **sobrescritos pelo sync automático**. Não edite diretamente.

| Arquivo | Fonte | Frequência |
|---------|-------|------------|
| `mention_history.json` | Google News RSS (pmto_monitor.py) | 2×/dia |
| `social_metrics.json` | Apify (instagram_monitor.py) | Diário |
| `social_sentiment.json` | Agregado Claude API | Diário |
| `adversarios.json` | Cálculo dinâmico | Diário |
| `geo_electoral.json` | TSE + IBGE | Estático |
| `tendencia_voto_2022.json` | TSE presidencial 2022 | Estático |
| `campaign_kpis.json` | atualizar_kpis.py | Diário |
| `liderancas.json` | Manual + georef | Semanal |

Carregamento lazy no cliente: apenas `social_metrics`, `social_sentiment`, `campaign_kpis` e `adversarios` no boot (~40 KB). Os demais são carregados sob demanda quando o painel correspondente é aberto.

## 🧪 Testes

- **Framework:** Vitest + jsdom
- **Cobertura atual:** ~85% em libs (`fetch`, `urlState`, `analytics`, `apiData`)
- **Total:** 71 testes passando
- **Escopo:** foco em lógica pura (libs); componentes são testados manualmente

```bash
npm run test            # rodar todos
npm run test:watch      # watch mode durante desenvolvimento
npm run test:coverage   # gera coverage/index.html
```

> **Filosofia:** testamos o que pode quebrar silenciosamente (parsing, classificação, URL state, autenticação). Interações visuais ficam para QA manual.

## 🔐 Segurança

| Camada | Mecanismo |
|---|---|
| Autenticação | Supabase JWT com `autoRefreshToken` |
| Autorização | Tabela `allowed_users` com RLS (`email = auth.jwt()->>'email'`) |
| Dados | Vercel Function valida JWT antes de servir JSONs |
| CSP | `script-src 'self'` sem `unsafe-inline` em scripts |
| Rate limit | 5 tentativas de login / 15min (client-side, UX) |
| Retry em 401 | `fetch.js` tenta `refreshSession()` antes de desistir |
| Auditoria | Logins e ações registrados em `access_log` |
| XSS | DOM API em vez de `innerHTML` em painéis dinâmicos |

> ⚠️ **Nunca** committar `.env.local`, chaves, tokens ou PATs. Suspeitas de exposição → revogue imediatamente no Supabase / GitHub.

## ♿ Acessibilidade

- Skip link para conteúdo principal (`#main-content`)
- Focus visible com outline dourado (`#D4A017`)
- `aria-label` em todos os controles interativos
- `role="alert"` em mensagens de erro de login
- Navegação completa por teclado na sidebar
- Contraste mínimo WCAG AA nos KPIs e botões
- Setas de tendência com `aria-label` descritivo

## 📱 PWA

Funciona offline via Service Worker (Workbox através de vite-plugin-pwa):

- **Assets estáticos:** `CacheFirst` (30 dias)
- **JSONs de dados:** `StaleWhileRevalidate` (24h)
- **Instalável:** manifest + ícones 192/512
- **Banner offline:** barra vermelha fixa quando o navegador detecta ausência de conexão

## 🚢 Deploy

- **Auto-deploy:** cada push para `main` dispara build + deploy na Vercel
- **Preview URLs:** PRs geram URLs de preview automaticamente
- **Rollback:** Vercel Dashboard → Deployments → Promote Previous
- **CI gate:** `.github/workflows/ci.yml` roda `build` + `test` + `npm audit` em cada push

### Checklist antes de mergear

- [ ] `npm run build` sem erros
- [ ] `npm run test` todos passando
- [ ] Variáveis novas adicionadas ao `.env.example`
- [ ] Variáveis novas configuradas no Vercel e no GitHub Secrets
- [ ] Testado em dispositivo móvel (ou DevTools responsivo)

## 📐 Convenções

- **Componentes grandes** ficam inline em `App.jsx`; reutilizáveis vão para `src/components/`
- **Painéis** vivem em `src/panels/` e são importados via `React.lazy` + `Suspense` (`SafePanel`)
- **Bibliotecas puras** (lógica, sem React) em `src/lib/` com testes colocados em `src/lib/__tests__/`
- **Configuração externalizada** em `src/lib/config.js` — nunca hardcoded em componentes
- **PropTypes** em todos os componentes públicos
- **Cores da campanha:** azul `#1A3A7A` · dourado `#D4A017` · vermelho `#B91C1C` · cinza `#8C93A8` · fundo `#F8F7F4`
- **Tipografia:** `'DM Sans', -apple-system, sans-serif`
- **Mensagens de commit:** `tipo(escopo): descrição`
  - Tipos: `feat` · `fix` · `chore` · `test` · `docs` · `refactor` · `style` · `perf`

## 🐛 Troubleshooting

### "Sessão expirada" no console
O refresh token expirou. Faça logout + login novamente. O `fetch.js` tenta `refreshSession()` uma vez antes de desistir.

### KPI "Engajamento IG" mostrando 0%
O campo `taxa_engajamento_pct` pode estar ausente no `social_metrics.json` mais recente. Rode `atualizar_kpis.py` no scraper ou aguarde o próximo cron.

### Setas de tendência não aparecem
Requerem pelo menos 2 snapshots do candidato no `social_metrics.json` (para calcular delta semanal). Se só há 1, a seta fica cinza com label "sem dados anteriores".

### Build falha com erro de Rollup
Apague `node_modules` e `package-lock.json`, reinstale:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Tooltip de ajuda ficando atrás do mapa
Z-index do mapa Leaflet é alto. O `HelpTooltip` usa `z-index: 9999` para ficar acima. Se ainda ocorrer, verifique estilos de containers pai.

## 🗺️ Roadmap

### Próximas sessões

- [ ] PropTypes em todos os componentes restantes
- [ ] `React.memo` nos painéis pesados (SocialPanel, MapaCampoPanel)
- [ ] Framework de Insights automatizados (13h estimadas, atravessa 2 repos)
  - Snapshots diários no scraper
  - Motor de análise (deltas + thresholds)
  - Painel de insights priorizados no dashboard
- [ ] Integração de briefing diário automatizado (Gmail)
- [ ] Testes de componentes (React Testing Library)

### Concluído recentemente

- [x] Proteção de JSONs via Vercel Function
- [x] RLS Supabase corrigido
- [x] Rate limiting no login
- [x] CSP hardening
- [x] CI pipeline + Dependabot
- [x] Lazy loading + Error Boundary
- [x] PWA + offline banner
- [x] Exportação CSV/PDF
- [x] URL state (filtros persistidos)
- [x] Header KPIs com tendência
- [x] Tooltips de ajuda por painel
- [x] Padronização "Mapa de Capilaridade"

## 📈 Métricas do projeto

| Métrica | Valor |
|---------|-------|
| Testes | 71 passando |
| Cobertura (libs) | ~85% |
| Bundle (gzip) | ~140 KB |
| Lighthouse Perf | ~85 |
| Score segurança | 8/10 |
| Score A11Y | 6/10 |
| Vulnerabilidades npm | 0 |
| P0 críticos abertos | 0 |

## 🔗 Repositório scraper

O backend/scraper vive em **[`salescampelo/scraper-pmto`](https://github.com/salescampelo/scraper-pmto)** (privado).

### Scripts principais

| Script | Função |
|---|---|
| `pmto_monitor.py` | Coleta menções na imprensa |
| `instagram_monitor.py` | Coleta métricas Instagram via Apify |
| `atualizar_kpis.py` | Auto-atualiza KPIs agregados |
| `contra_narrativa.py` | Sugestões de resposta a menções negativas (Claude API) |
| `tse_presidencial.py` | Processa dados TSE 2022 por município |
| `sync_github.py` | Copia JSONs para `public/data/` deste repo e faz push |
| `briefing_diario.py` | Gera briefing HTML/PDF diário |

---

**Autor:** Marcel Sales Campelo
**Licença:** Software proprietário — uso restrito à campanha Cel. Márcio Barbosa 2026. Não redistribuir.
**Última atualização:** 17/04/2026
