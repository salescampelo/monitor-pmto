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
| `tendencia_voto_2022.json` | 139 municípios TO, 2º turno presidencial 2022 (Bolsonaro vs Lula) |

## Painéis implementados
1. **Tendência de Voto 2022** (TendenciaVotoPanel) — dados presidenciais TSE 2022 cruzados com share Republicanos
2. **Inteligência Competitiva** (AdversariosPanel) — ranking de ameaça de 17 adversários
3. **Metas da Campanha** (KPIsPanel) — KPIs auto-atualizados via atualizar_kpis.py
4. **Inteligência Eleitoral** (GeoPanel) — 139 municípios com índice de oportunidade
5. **Redes Sociais** (SocialPanel) — ranking Instagram + série temporal
6. **Monitor de Imprensa** (NewsPanel) — menções classificadas por tipo/sentimento/relevância

## Convenções
- Componentes grandes ficam em `App.jsx` (inline); componentes reutilizáveis em `src/components/`
- Dados são buscados com cache-bust (`?t=Date.now()`) para garantir atualização
- Candidato identificado pelo username `marciobarbosa_cel`
- Cores da campanha: azul `#1a3a7a`, dourado `#d4a017`, vermelho `#b91c1c`

## Repositório scraper
O backend/scraper está em `salescampelo/scraper-pmto`. Não editar dados JSON diretamente neste repo — eles são sobrescritos pelo sync automático.

### Scripts principais (scraper-pmto)
- `atualizar_kpis.py` — auto-atualiza seguidores_ig, engajamento_ig, mencoes_imprensa em campaign_kpis.json
- `contra_narrativa.py` — gera sugestões de resposta a menções negativas via Claude API (standalone + integração leve)
- `tse_presidencial.py` — processa dados TSE presidenciais 2022 por município; gera tendencia_voto_2022.json
- `sync_github.py` — copia JSONs do scraper-pmto para public/data/ neste repo e faz push
- `pmto_monitor.py` — coleta menções na imprensa (NÃO alterar sem sessão dedicada)
- `instagram_monitor.py` — coleta métricas Instagram (NÃO alterar sem sessão dedicada)
- `briefing_diario.py` — gera briefing HTML/PDF diário (NÃO alterar sem sessão dedicada)
