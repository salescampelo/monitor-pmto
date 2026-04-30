# Sessao 2026-04-30 — Normalizacao de Dados + Recollection Completa

## Resumo

Duas frentes executadas nesta sessao: (1) conclusao da Fase 5 do plano v5.0 (run_log.json + heartbeat) e (2) normalizacao completa de dados em ambos os repos — datas em formato brasileiro, nomes de fontes limpos, pipeline de sentimento calibrado, e reset para recoleta total desde 01/01/2026.

## O que foi feito

### Fase 5 do Plano v5.0

| Arquivo | Mudanca |
|---------|---------|
| `pmto_monitor.py` | `_append_run_log()` com `RUN_LOG_FILE` e cap de 100 entradas; versao corrigida v4.0 → v5.0 em email/banner/argparse |
| `heartbeat.py` | Check 3d: deteccao de runs consecutivos com zero mencoes via `run_log.json` |

### Normalizacao — Fase 1: Limpeza retroativa (mention_history.json)

- Script `fix_mention_history.py` criado e executado
- 17 entradas limpas: nomes de fontes normalizados, `collection_method` de `"?"` para `"BACKFILL"`, campo `cluster` preenchido
- Fontes corrigidas: `"RR10 NOTICIAS |"` → `"RR10 Noticias"`, `"Folha do Jalapao -"` → `"Folha do Jalapao"`, `"Jornal Opcao | Tocantins"` → `"Jornal Opcao Tocantins"`

### Normalizacao — Fase 2: Scraper (pmto_monitor.py)

| Item | Detalhe |
|------|---------|
| `_SOURCE_NAME_FIXES` | Tabela de lookup para correcoes conhecidas |
| `_TRAILING_SEP_RE` | Regex para remover separadores finais (`\|`, `–`, `—`, `-`) |
| `normalize_source_name()` | Funcao aplicada em `fetch_google_news()` e `process_scraped_article()` |
| `_COOCCURRENCE_OK` | Promovido de variavel local para constante de modulo; corrige bug de escopo em `process_scraped_article()` |

### Normalizacao — Fase 3: Dashboard (monitor-pmto)

| Arquivo | Mudanca |
|---------|---------|
| `src/lib/analytics.js` | `fmt()`: `month:'short'` → `month:'2-digit'` para formato `dd/mm/yyyy` |
| `src/lib/news.js` | `_SRC_FIX` lookup + `normSrc()` aplicado em `classify()` |
| `src/panels/ExecutivePanel.jsx` | Datas via `fmt()` em vez de split manual |
| `src/panels/QualidadePanel.jsx` | `fmtUpdated()` helper para `updated_at` em dd/mm/yyyy |
| `src/panels/SocialPanel.jsx` | `data_coleta` formatado com `brDate()` existente |

### Normalizacao — Fase 4: Pipeline de sync

| Arquivo | Mudanca |
|---------|---------|
| `sync_github.py` | `social_sentiment_calibrado.json` adicionado a `FILES` |
| `src/lib/fetch.js` | URL sentiment alterada para `social_sentiment_calibrado.json` |
| `api/data/[file].js` | Arquivo adicionado ao `ALLOWED_FILES` Set |
| `.github/workflows/monitor.yml` | Adicionado em todos os 5 for-loops de sync |

### Normalizacao — Fase 5: Recoleta completa

- `seen_hashes.json` e `mention_history.json` limpos (reset para `[]`)
- Backups salvos como `*_backup_20260430.json`
- Dashboard build verificado (sem erros)
- Commits: `fe850d1` (scraper-pmto), `017c0ab` (monitor-pmto)
- Push em ambos os repos
- GitHub Actions workflow disparado: run `25178176533`

## Bugs corrigidos

| Bug | Impacto | Fix |
|-----|---------|-----|
| `_COOCCURRENCE_OK` escopo local | `process_scraped_article()` descartava artigos com co-ocorrencia candidato+governador | Promovido a constante de modulo |
| `fmt()` com `month:'short'` | Datas mostravam "30 de jan. de 2026" em vez de dd/mm/yyyy | Alterado para `month:'2-digit'` |
| ExecutivePanel datas brutas | Mostrava YYYY-MM-DD do JSON cru | Usa `fmt()` importado de analytics.js |
| `social_sentiment_calibrado.json` fora do pipeline | Arquivo existia mas nao era sincronizado, servido ou consumido | Adicionado em 4 pontos do pipeline |
| Linha 186 do monitor.yml incompleta | Sync de inteligencia competitiva nao incluia sentimento calibrado | Corrigido na Fase 4 |

## Proximos passos sugeridos

### Prioridade alta

1. **Backfill Jan-Abr 2026** — Google News RSS so cobre ~2-3 semanas. Para cobertura completa desde 01/01/2026, implementar busca historica via site-specific queries ou Wayback Machine API.

2. **Deduplicacao cross-layer** — Mesmo artigo pode ser encontrado pela Layer 1 (scraping direto) e Layer 2 (Google News RSS). Implementar dedup por URL canonica ou similaridade de titulo.

3. **Modelo de sentimento** — Scoring atual por keywords (NW/PW lists) e coarse. Migrar para classificador treinado (e.g., BERTimbau fine-tuned em noticias politicas brasileiras) ou usar API LLM para classificacao.

### Prioridade media

4. **Sistema de alertas** — Notificacao via Telegram/email para mencoes de alto impacto negativo (letalidade, denuncia, escandalo). Threshold configuravel no heartbeat.

5. **Painel de tendencias temporais** — Grafico de linha mostrando volume de mencoes/sentimento ao longo do tempo, permitindo visualizar picos e correlacionar com eventos.

6. **Cache inteligente no dashboard** — Implementar SWR/React Query com stale-while-revalidate para reduzir fetches redundantes e melhorar UX offline (PWA).

7. **Metricas de engajamento social** — Alem de contagem de seguidores, rastrear taxa de engajamento (likes+comments/followers), crescimento relativo, e comparativo com adversarios.

### Prioridade baixa

8. **Painel de adversarios expandido** — Adicionar timeline comparativa de mencoes, radar de temas, e share-of-voice relativo entre candidatos.

9. **Export PDF do Painel Executivo** — Gerar relatorio em PDF com branding para distribuicao interna (coordenadores de campanha).

10. **Rate limiting no scraper** — Implementar circuit breaker por dominio para evitar bloqueios em sites que detectam scraping agressivo.

11. **Testes automatizados** — Adicionar testes unitarios para `normalize_source_name()`, `classify()`, `fmt()`, e integracao para o pipeline de sync.

12. **Monitoramento de uptime** — Adicionar check no heartbeat que verifica se o dashboard Vercel esta respondendo (health endpoint).
