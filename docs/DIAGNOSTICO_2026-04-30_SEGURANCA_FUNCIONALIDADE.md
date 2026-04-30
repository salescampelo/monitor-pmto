# Diagnostico 2026-04-30 — Seguranca, Implementacao e Funcionalidade

## 1. SEGURANCA (OWASP Top 10)

| # | Sev. | Categoria OWASP | Arquivo | Linha | Achado | Correcao |
|---|------|-----------------|---------|-------|--------|----------|
| 1 | CRITICO | A07:Misconfiguration | `.env` | 25,30,33 | Secrets em texto plano (Gmail app password, Apify token, Anthropic key). Qualquer vazamento expoe todas as credenciais. | Rotacionar as 3 chaves. Usar secrets manager. |
| 2 | CRITICO | A01:Broken Access | `.env` / `monitor.yml` | 38 | `BRIEFING_TO` email hardcoded — atacante que modifica .env redireciona toda inteligencia de campanha. | Mover para GitHub Secrets. |
| 3 | ALTO | A07:Misconfiguration | `monitor.yml` | 51 | `GH_PAT` com permissoes amplas. Se vazar via logs, acesso a todos os repos do usuario. | Usar fine-grained PAT com escopo minimo (2 repos). |
| 4 | ALTO | A03:Injection | `heartbeat.yml` | 53-56 | `${{ steps.hb.outputs.problems }}` injetado diretamente no corpo do email. Conteudo controlado por atacante pode injetar headers. | Usar indirection via `env:` variable. |
| 5 | ALTO | A05:Misconfiguration | `sync_github.py` | 26 | `git add .` expoe qualquer arquivo acidental no repo monitor. | Substituir por lista explicita de arquivos. |
| 6 | MEDIO | A08:Integrity | `pmto_monitor.py` | 908 | `hashlib.md5` para dedup — nao e contexto de seguranca, mas gera flags em auditorias. | Migrar para `sha256`. |
| 7 | MEDIO | A01:Broken Access | `api/data/[file].js` | 30-35 | Auth valida apenas que usuario existe no Supabase, sem checar role. Qualquer usuario autenticado acessa todos os dados. | Adicionar query de role no handler. |
| 8 | BAIXO | A09:Logging | `pmto_monitor.py` | 889 | Bare `except:` suprime todos os erros silenciosamente. | Usar `except Exception as e: logger.warning(...)`. |
| 9 | BAIXO | A05:Misconfiguration | `vercel.json` | 12 | `img-src https:` permite qualquer origem HTTPS. | Restringir a dominios conhecidos se possivel. |
| 10 | BAIXO | A04:Insecure Design | `App.jsx` | 203-225 | Drag-and-drop JSON parser sem validacao de schema. JSON malicioso pode congelar a UI. | Adicionar validacao com zod antes de `setState`. |

**Pontos positivos**: Path traversal mitigado via `ALLOWED_FILES`. CSP forte (sem `unsafe-eval`). React escapa XSS por padrao. Workflow nao usa `pull_request_target`. Supabase anon key exposto apenas via `VITE_` (client-side by design).

---

## 2. FUNCIONALIDADE DOS PAINEIS

| # | Painel | Problema | Sev. | Arquivo:Linha | Correcao |
|---|--------|----------|------|---------------|----------|
| 1 | TendenciaVotoPanel | Acessa `agregado.municipios_conservadores` sem null-guard. Se `agregado` for undefined, crash. | QUEBRADO | TendenciaVotoPanel.jsx:62 | Adicionar `if(!agregado) return <PanelSkeleton/>;` |
| 2 | GeoPanel | Campo `m.categoria` no JSX mas JSON usa `categoria_geo`. Crash em `.split(' ')`. | QUEBRADO | GeoPanel.jsx:27-30,107 | Alinhar nome do campo (usar `categoria_geo`). |
| 3 | ExecutivePanel | KPI id `'sentimento_positivo'` nao existe no JSON. Mostra 2-3 cards em vez de 4. | DEGRADADO | ExecutivePanel.jsx:42 | Adicionar KPI ao JSON ou atualizar lista de ids. |
| 4 | AdversariosPanel | Fallbacks hardcoded (linhas 24-58) mascaram falhas de dados. Usuario ve dados estaticos sem saber. | DEGRADADO | AdversariosPanel.jsx:24-58 | Retornar `<PanelSkeleton/>` se `!d?.ranking`. |
| 5 | MapaCampoPanel | `data_visita` exibido em formato bruto ISO em vez de dd/mm/yyyy. | COSMETICO | MapaCampoPanel.jsx:134 | Aplicar `fmt()` ou `brDate()`. |
| 6 | KpiPanel | PropTypes desatualizados (nao refletem schema real). | COSMETICO | KpiPanel.jsx:88-101 | Atualizar PropTypes. |

**Paineis OK**: SocialPanel, QualidadePanel, Imprensa (newest-first correto), analytics.js `fmt()`, news.js `classify()`+`normSrc()`.

---

## 3. BACKEND / PIPELINE

| # | Componente | Problema | Sev. | Local | Correcao |
|---|-----------|----------|------|-------|----------|
| 1 | instagram_monitor.py | Escrita JSON nao-atomica. Crash no meio = arquivo corrompido. | CRITICO | :171-173 | Usar padrao tmp+`os.replace()` (como pmto_monitor.py ja faz). |
| 2 | Sync pipeline | Lista de arquivos diverge entre `sync_github.py` (10 files), workflow noticias (8 files), workflow inteligencia (4 files). Faltam `tendencia_voto_2022.json` e `liderancas.json` em varios pontos. | ALTO | sync_github.py:14, monitor.yml:107,186 | Unificar para lista unica em todas as locations. |
| 3 | config.py / workflow | Duas fontes de verdade para lista de sync: `sync_github.py` (local) e loops no workflow (CI). | MEDIO | config.py:15, monitor.yml | Extrair lista canonica para arquivo compartilhado. |
| 4 | pmto_monitor.py | Artigos sem data recebem `datetime.now()` como fallback, burlando `DATE_CUTOFF`. | MEDIO | :1128-1132 | Exigir ao menos data extraida do corpo. Logar warning. |
| 5 | monitor.yml | `git rebase -X theirs` pode descartar dados se runs sobrepoem (concurrency group mitiga mas nao elimina). | MEDIO | :94-98 | Considerar `-X ours` ou merge em vez de rebase. |
| 6 | API [file].js | `social_sentiment.json` (bruto) ainda no allowlist mas nunca consumido pelo client. | BAIXO | :11 | Remover da ALLOWED_FILES. |
| 7 | API [file].js | `readFileSync` bloqueia event loop. OK na escala atual mas nao escala. | BAIXO | :50 | Migrar para `fs/promises.readFile`. |
| 8 | pmto_monitor.py | `seen_hashes.json` cap de 10k. Hashes antigos sao evicted e artigos podem reaparecer. | BAIXO | :896 | Aumentar para 20k. Documentar o limite. |

---

## 4. ACOES PRIORITARIAS

### Imediatas (antes do proximo deploy)
1. Rotacionar secrets expostos no `.env` (Gmail, Apify, Anthropic)
2. Corrigir GeoPanel campo `categoria` → `categoria_geo`
3. Adicionar null-guard em TendenciaVotoPanel para `agregado`
4. Tornar escrita atomica em `instagram_monitor.py`

### Curto prazo (esta semana)
5. Unificar listas de sync em fonte unica
6. Escopar GH_PAT para permissoes minimas
7. Adicionar check de role no `api/data/[file].js`
8. Corrigir ExecutivePanel KPI ids

### Medio prazo
9. Substituir `git add .` por lista explicita em `sync_github.py`
10. Migrar md5 → sha256 no scraper
11. Adicionar validacao de schema no drag-and-drop
12. Resolver fallbacks hardcoded no AdversariosPanel
