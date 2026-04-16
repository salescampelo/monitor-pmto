# Monitor Coronel Barbosa 2026

[![CI](https://github.com/salescampelo/monitor-pmto/actions/workflows/ci.yml/badge.svg)](https://github.com/salescampelo/monitor-pmto/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/deploy-vercel-black)](https://monitor-coronel-barbosa.vercel.app)

Dashboard de inteligência eleitoral para campanha a Deputado Federal pelo Tocantins.

## 🎯 Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Tendência de Voto** | Análise do 2º turno 2022 por município (conservador/dividido/progressista) |
| **Inteligência Competitiva** | Ranking de 17 adversários com score de ameaça dinâmico |
| **Metas da Campanha** | KPIs por fase com barras de progresso e countdown |
| **Dados Eleitorais** | 139 municípios com potencial e prioridade calculados |
| **Mapa de Campo** | Lideranças e visitas por região |
| **Redes Sociais** | Métricas Instagram de 18 perfis monitorados |
| **Monitor de Imprensa** | Menções em 32 fontes com classificação de sentimento |
| **Auditoria** | Logs de acesso (admin only) |

## 🛠️ Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + Vite 5 |
| UI | Lucide Icons + Recharts |
| Auth | Supabase Auth (JWT) |
| API | Vercel Serverless Functions |
| Deploy | Vercel (auto-deploy on push) |
| CI | GitHub Actions |
| PWA | vite-plugin-pwa + Workbox |

## 🚀 Setup Local

### Pré-requisitos

- Node.js 18+
- npm 9+
- Projeto Supabase configurado

### Instalação

```bash
git clone https://github.com/salescampelo/monitor-pmto.git
cd monitor-pmto
npm install
```

### Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha os valores:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_CANDIDATE_USERNAME=marciobarbosa_cel
```

As mesmas variáveis devem estar configuradas no Vercel (Settings → Environment Variables) e no GitHub (Settings → Secrets → Actions) para o CI funcionar.

### Comandos

```bash
npm run dev           # Servidor de desenvolvimento (http://localhost:5173)
npm run build         # Build de produção em dist/
npm run preview       # Preview local do build
npm run test          # Testes unitários (vitest)
npm run test:watch    # Testes em modo watch
npm run test:coverage # Relatório de cobertura (abre em coverage/index.html)
```

## 🧪 Testes

```bash
npm run test            # Rodar todos (71 testes)
npm run test:watch      # Watch mode
npm run test:coverage   # Cobertura (~85% libs)
```

## 🔐 Segurança

- **Auth**: Supabase JWT com refresh automático
- **Dados**: Vercel Function valida token antes de servir JSONs
- **CSP**: `script-src 'self'` (sem unsafe-inline)
- **RLS**: Tabela `allowed_users` no Supabase
- **Rate limit**: 5 tentativas de login / 15min

## ♿ Acessibilidade

- Skip link para navegação por teclado
- `aria-labels` em todos os controles
- Focus visible (outline dourado)
- Contraste WCAG AA
- Screen reader friendly

## 📱 PWA

Funciona offline com Service Worker:
- Assets: CacheFirst (30 dias)
- Dados: StaleWhileRevalidate (24h)
- Instalável no mobile

## 📊 Dados

Coletados pelo repositório [scraper-pmto](https://github.com/salescampelo/scraper-pmto):

| Arquivo | Fonte | Frequência |
|---------|-------|------------|
| `mention_history.json` | Google News RSS | 2x/dia |
| `social_metrics.json` | Apify (Instagram) | Diário |
| `adversarios.json` | Cálculo dinâmico | Diário |
| `geo_electoral.json` | TSE + IBGE | Estático |
| `campaign_kpis.json` | Manual | Semanal |

## 🚢 Deploy

Push para `main` → deploy automático no Vercel.

### Variáveis no Vercel

Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CANDIDATE_USERNAME`

## 📈 Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| Testes | 71 passando |
| Cobertura (libs) | ~85% |
| Bundle (gzip) | ~140KB |
| Lighthouse Perf | ~85 |
| Vulnerabilidades | 0 |

---

**Autor**: Marcel Sales Campelo  
**Licença**: Projeto privado — uso restrito à campanha
