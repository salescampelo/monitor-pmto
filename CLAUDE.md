# Monitor Coronel Barbosa — Dashboard (monitor-pmto)

## Visão geral
Dashboard de inteligência eleitoral para a campanha do Cel. Márcio Barbosa (Republicanos/TO) ao cargo de Deputado Federal em 2026. Frontend estático em Vite/React, deployado no Vercel.

## Stack
- **Framework**: Vite + React (JSX)
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Auth**: Supabase
- **Deploy**: Vercel (auto-deploy via GitHub `salescampelo/monitor-pmto`)
- **URL produção**: https://monitor-coronel-barbosa.vercel.app

## Fonte de dados
Todos os dados são lidos de arquivos JSON em `/public/data/`, que são sincronizados a partir do repositório `salescampelo/scraper-pmto` via `sync_github.py`.

| Arquivo | Conteúdo |
|---|---|
| `mention_history.json` | Menções do candidato na imprensa |
| `social_metrics.json` | Métricas Instagram dos perfis monitorados |
| `social_sentiment.json` | Sentimento agregado das redes sociais |
| `geo_electoral.json` | Mapeamento dos 139 municípios do TO |
| `campaign_kpis.json` | KPIs por fase eleitoral |
| `adversarios.json` | Ranking de adversários com score de ameaça |

## Painéis implementados
1. **Monitor de Imprensa** — menções classificadas por tipo, sentimento e impacto
2. **Radar de Redes Sociais** (SocialPanel) — ranking de seguidores e engajamento
3. **Inteligência Competitiva** (AdversariosPanel) — ranking de ameaça dos adversários
4. **Mapa Eleitoral** — municípios TO por prioridade e oportunidade
5. **KPIs da Campanha** — progresso por fase (Fase 1: Jan–Jun 2026)

## Convenções
- Componentes grandes ficam em `App.jsx` (inline); componentes reutilizáveis em `src/components/`
- Dados são buscados com cache-bust (`?t=Date.now()`) para garantir atualização
- Candidato identificado pelo username `marciobarbosa_cel`
- Cores da campanha: azul `#1a3a7a`, dourado `#d4a017`, vermelho `#b91c1c`

## Repositório scraper
O backend/scraper está em `salescampelo/scraper-pmto`. Não editar dados JSON diretamente neste repo — eles são sobrescritos pelo sync automático.
