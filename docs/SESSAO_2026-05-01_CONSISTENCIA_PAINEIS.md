# Sessao 2026-05-01 — Consistencia Cross-Panel + Fix API

## Contexto

Dashboard apresentava "Erro ao carregar dados" apos push do backfill.
Alem do fix critico da API, foi feita auditoria completa de consistencia
entre paineis e correcao de todas as discrepancias encontradas.

---

## 1. Fix Critico: API Bloqueando Acesso

**Problema:** O server-side check `allowed_users` adicionado na sessao anterior
usava a anon key do Supabase, que nao tem permissao SELECT na tabela.
Resultado: 403 em toda requisicao de dados → `fetchJ` retornava null →
`bootError = true` → mensagem "Erro ao carregar dados".

**Solucao:** Removido o bloco `allowed_users` de `api/data/[file].js`.
A autenticacao via Supabase JWT (`getUser(token)`) ja valida a identidade.

**Commit:** `0ff3661` — fix(api): remove allowed_users check blocking data access

---

## 2. Auditoria de Consistencia Cross-Panel

Agente especializado auditou todos os 10 paineis. Encontrou 14 inconsistencias reais.

### Correcoes Aplicadas (High + Medium Priority)

| # | Problema | Paineis | Correcao |
|---|----------|---------|----------|
| 1 | `mentions48h` sem filtro de relevancia | AppHeader | Adicionado `relevance >= 0.5` |
| 2 | `latestMentions` sem filtro de relevancia | ExecutivePanel | Adicionado `relevance >= 0.5` |
| 3 | Sentimento: 3 categorias vs 4 | ExecutivePanel vs SocialPanel | Executive agora mostra Positivo/Engajado/Neutro/Negativo |
| 4 | Cor "positivo" diferente | Executive `#15803d` vs Social `#22c55e` | Unificado: `#22c55e` |
| 5 | Cor "medio engajamento" inconsistente | Header `#eab308`, Legend `#d4a017`, Chart `#f59e0b` | Unificado: `#f59e0b` |
| 6 | Precisao engajamento diferente | Social sem `.toFixed(1)` | Adicionado `.toFixed(1)` em todos |
| 7 | Data da eleicao hardcoded | AppHeader `'2026-10-04'` vs kpiData | Agora usa `kpiData.election_date` |
| 8 | Source names nao normalizados | QualidadePanel | Importa e aplica `normSrc()` |
| 9 | Datas raw (ISO) exibidas | Sidebar, MapaCampoPanel | Formatadas via `fmtDt()`/`fmt()` |

### Commits

- `6301012` — fix(panels): unify metrics, sentiment, and colors across all panels
- `fc806ba` — fix(panels): normalize source names, format raw dates

---

## 3. Backfill Jan 1-Feb 11 (Recovery Pass)

As janelas 1-3 do backfill anterior retornaram 0 porque `seen_hashes.json`
ja continha entradas daquele periodo. Limpeza e re-execucao recuperou 3 mencoes adicionais.

**Resultado:** 46 → 49 mencoes totais

| Mes | Antes | Depois |
|-----|-------|--------|
| Janeiro | 6 | 8 |
| Fevereiro | 19 | 20 |
| Marco | 12 | 12 |
| Abril | 9 | 9 |
| **Total** | **46** | **49** |

Mencoes recuperadas:
- "Passagem de comando no 13 BPM em Sao Felix..."
- "Operacao Cangucu pode virar filme nacional..."
- "Quem e Amanda Vasconcelos, mulher do cantor Henrique..."

---

## 4. Fix config.py BASE_DIR (sessao anterior, finalizado hoje)

`sync_github.py` nao conseguia copiar dados porque `config.py` apontava para
um path OneDrive inexistente. Corrigido para `C:\dev` onde `monitor-pmto` esta.

**Commit (scraper-pmto):** `0cc929c` — fix(config): correct BASE_DIR path

---

## Estado Final do Sistema

| Componente | Status |
|------------|--------|
| Vercel deploy | OK (13:23 UTC) |
| Scraper workflow | OK (ultimas 2 runs: success) |
| API data access | OK (auth via JWT apenas) |
| mention_history.json | 49 mencoes, 20 fontes, URLs reais |
| Paineis cross-panel | Metricas consistentes |
| Cores sentimento | Unificadas (positivo/engajado/neutro/negativo) |
| Formato datas | dd/mm/yyyy em todos os paineis |
| Source names | Normalizados via normSrc() |
| Engagement precision | .toFixed(1) em todos os paineis |
| Election countdown | Dinamico via kpiData.election_date |

---

## Pendencias Residuais (Baixa Prioridade)

1. **Rotacao de secrets** (.env) — acao manual do usuario
2. **KpiPanel PropTypes** — desatualizados mas sem impacto funcional
3. **AdversariosPanel** usa adversarios.json para seguidores enquanto SocialPanel usa social_metrics.json — diferenca temporal possivel mas nao critica
