# Monitor Coronel Barbosa 2026

Dashboard de inteligência eleitoral para campanha a Deputado Federal pelo Tocantins.

## Funcionalidades

- **Tendência de Voto** — Análise do 2º turno 2022 por município (conservador/dividido/progressista)
- **Inteligência Competitiva** — Ranking de 17 adversários com score de ameaça dinâmico
- **Metas da Campanha** — KPIs por fase com barras de progresso
- **Dados Eleitorais** — 139 municípios com potencial e prioridade
- **Mapa de Campo** — Lideranças e visitas por região
- **Redes Sociais** — Métricas Instagram de 18 perfis monitorados
- **Monitor de Imprensa** — Menções em 32 fontes com classificação de sentimento
- **Auditoria** — Logs de acesso (admin only)

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + Vite 5 |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Auth | Supabase Auth (JWT + RLS) |
| API | Vercel Serverless Functions |
| Deploy | Vercel (auto-deploy via GitHub) |
| CI/CD | GitHub Actions |
| PWA | vite-plugin-pwa + Workbox |

## Setup Local

### Pré-requisitos

- Node.js 20+
- npm 9+
- Projeto no [Supabase](https://supabase.com) com tabela `allowed_users`

### Instalação

```bash
git clone https://github.com/salescampelo/monitor-pmto.git
cd monitor-pmto
npm install
```

### Variáveis de Ambiente

Crie `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_CANDIDATE_USERNAME=marciobarbosa_cel
```

As mesmas variáveis devem estar configuradas como **Secrets** no Vercel e no GitHub
(`Settings → Secrets → Actions`) para que o build de CI funcione.

### Comandos

```bash
npm run dev           # Servidor de desenvolvimento (http://localhost:5173)
npm run build         # Build de produção em dist/
npm run preview       # Preview local do build
npm run test          # Testes unitários (vitest)
npm run test:watch    # Testes em modo watch
npm run test:coverage # Relatório de cobertura (abre em coverage/index.html)
```

## Estrutura do Projeto

```
monitor-pmto/
├── api/
│   └── data/[file].js          # Vercel Function — serve JSON com auth JWT
├── public/
│   └── data/                   # JSONs sincronizados pelo scraper-pmto
│       ├── mention_history.json
│       ├── social_metrics.json
│       ├── social_sentiment.json
│       ├── geo_electoral.json
│       ├── campaign_kpis.json
│       ├── adversarios.json
│       ├── tendencia_voto_2022.json
│       └── liderancas.json
├── src/
│   ├── App.jsx                 # Componente raiz — auth wrapper + layout
│   ├── components/
│   │   ├── AppHeader.jsx       # Header com KPIs e navegação
│   │   ├── ErrorBoundary.jsx   # Error boundary para painéis
│   │   ├── LoginScreen.jsx     # Tela de login
│   │   ├── PwModal.jsx         # Modal de alteração de senha
│   │   └── ui.jsx              # Componentes base (Card, Met, Bt, PanelSkeleton...)
│   ├── lib/
│   │   ├── analytics.js        # Métricas, clusters, cálculos de KPI
│   │   ├── config.js           # Variáveis de ambiente (CANDIDATE_USERNAME)
│   │   ├── export.js           # Exportação CSV e PDF
│   │   ├── fetch.js            # fetchJ — fetch autenticado com retry em 401
│   │   ├── news.js             # Classificação de menções (relevance, cluster)
│   │   ├── rateLimit.js        # Rate limiting para tentativas de login
│   │   ├── supabase.js         # Cliente Supabase
│   │   ├── urlState.js         # Sincronização de estado com URL
│   │   ├── useAutoRefresh.js   # Hook de refresh automático (30min)
│   │   ├── useOffline.js       # Hook de detecção offline
│   │   └── __tests__/          # Testes unitários (vitest)
│   └── panels/
│       ├── AdversariosPanel.jsx
│       ├── AuditoriaPanel.jsx
│       ├── GeoPanel.jsx
│       ├── KpiPanel.jsx
│       ├── MapaCampoPanel.jsx
│       ├── SocialPanel.jsx
│       └── TendenciaVotoPanel.jsx
├── .github/
│   ├── dependabot.yml          # Atualizações automáticas de dependências
│   └── workflows/ci.yml        # CI: audit + test + build
├── vercel.json                 # Headers de segurança (CSP, HSTS) e redirect
└── vite.config.js              # Vite + PWA + configuração de testes
```

## Arquitetura

### Autenticação

O acesso é duplo: o usuário precisa (1) ter conta Supabase e (2) estar na tabela
`allowed_users` no banco.

```
Login → Supabase Auth (JWT) → verifica allowed_users → App
```

A Vercel Function em `api/data/[file].js` valida o JWT em cada requisição antes de
servir os dados JSON. Em caso de token expirado, o cliente faz refresh automático
e retenta a requisição uma vez (`fetchJ` em `src/lib/fetch.js`).

### Dados

Os JSONs em `public/data/` são somente-leitura neste repositório. Eles são
atualizados automaticamente pelo repositório
[salescampelo/scraper-pmto](https://github.com/salescampelo/scraper-pmto)
via `sync_github.py`.

**Nunca edite os JSONs de dados diretamente** — qualquer alteração será
sobrescrita pelo próximo sync do scraper.

### Painéis

Todos os painéis usam `React.lazy` + `Suspense` (code splitting) e estão
envoltos em `ErrorBoundary` para isolamento de erros. O painel ativo é
persistido na URL (`?panel=imprensa`) para compartilhamento.

### PWA

O app funciona offline com cache Workbox (`StaleWhileRevalidate` para dados,
`CacheFirst` para assets). O Service Worker atualiza automaticamente ao
detectar nova versão no deploy.

## CI/CD

O workflow `.github/workflows/ci.yml` executa em todo push/PR para `main`:

1. `npm audit` — bloqueia vulnerabilidades de severidade `high+`
2. `npm test` — suite de testes unitários (vitest)
3. `npm run build` — verifica que o build de produção não quebra

O deploy no Vercel é automático via integração GitHub ao fazer merge na `main`.

## Dependências Principais

```json
{
  "@supabase/supabase-js": "^2.x",   // Auth + RLS
  "react": "^18.x",                   // UI
  "recharts": "^2.x",                 // Gráficos
  "leaflet": "^1.x",                  // Mapa (GeoPanel)
  "lucide-react": "^0.x"              // Ícones
}
```

Atualizações de patch/minor são gerenciadas pelo Dependabot
(`.github/dependabot.yml`) com PRs automáticos às segundas-feiras.

## Repositórios

| Repo | Função |
|------|--------|
| [salescampelo/monitor-pmto](https://github.com/salescampelo/monitor-pmto) | Este repositório — frontend + API |
| [salescampelo/scraper-pmto](https://github.com/salescampelo/scraper-pmto) | Coleta de dados + sincronização |

O `scraper-pmto` contém os scripts de coleta (`pmto_monitor.py`,
`instagram_monitor.py`) e o `sync_github.py` que atualiza os JSONs neste repo.
