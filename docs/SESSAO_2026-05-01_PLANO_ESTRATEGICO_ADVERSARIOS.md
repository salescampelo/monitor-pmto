# Sessao 2026-05-01 — Plano Estrategico + Monitoramento de Adversarios

## Contexto

Continuacao da sessao de consistencia de paineis. Foco em planejamento
estrategico ate a eleicao (04/Out/2026) e primeiras implementacoes de
inteligencia competitiva.

---

## 1. Plano Estrategico Salvo

Criado documento `PLANO_ESTRATEGICO_2026_ELEICAO.md` com roadmap em 3 fases:

- **Fase 1 (Mai-Jun):** Fundacao — liderancas, agenda, TikTok, cron meio-dia
- **Fase 2 (Jul-Ago):** Inteligencia — adversarios, TSE, pesquisas, Meta Ads
- **Fase 3 (Set-Out):** War Room — 4x/dia, crise, HGPE, D-Day

**Commit (monitor-pmto):** `93d7c6b` — docs: add strategic plan for election monitoring

---

## 2. Cron Meio-Dia (P0 Implementado)

**Antes:** 2 execucoes diarias (03h e 19h BRT) — gap de 16h durante o dia.

**Depois:** 3 execucoes diarias (07h, 12h, 19h BRT = 10:00, 15:00, 22:00 UTC).

Reducao da latencia de deteccao de 16h para ~7h no pior caso.

**Commits (scraper-pmto):**
- `6f75b8b` — feat: add midday cron + adversary news monitoring
- `ba96d97` — fix(workflow): adjust morning cron to 07h BRT (10:00 UTC)

---

## 3. Analise de Ameacas

Avaliacao completa dos 17 adversarios do painel. Conclusoes:

### Tier 1 — Ameacas Existenciais

| Candidato | Score | Overlap | Razao |
|-----------|-------|---------|-------|
| Ricardo Ayres (Republicanos) | 71.4 | 90% | Interno, deputado em exercicio, 42K votos 2022 |
| Tiago Dimas (Podemos) | 75.2 | 40% | Mesma base Araguaina, 30% engajamento, viral |

### Tier 2 — Ameacas Serias

| Candidato | Score | Overlap | Razao |
|-----------|-------|---------|-------|
| Janad Valcari (PP) | 58.3 | 60% | 89K seguidores, voto feminino conservador Palmas |
| Filipe Martins (PL) | 55.9 | 55% | Deputado, PL $$, base Palmas |
| Lucas Campelo (Republicanos) | 30.5 | 75% | Interno, Araguaina, canibaliza ~20K votos |

### Insight Principal

Squeeze duplo: internamente (Ricardo Ayres + Lucas Campelo) e externamente
em Araguaina (Tiago Dimas). Janad e Filipe sao perigosos mas operam mais
em Palmas.

---

## 4. Monitoramento de Adversarios (P1 Implementado)

### Script: `monitor_adversarios.py`

Novo scraper dedicado que consulta Google News RSS para:
- **Tiago Dimas** (4 queries)
- **Ricardo Ayres** (3 queries)
- **Janad Valcari** (3 queries)

Primeiro resultado (7 dias):
- Tiago Dimas: 13 mencoes
- Ricardo Ayres: 10 mencoes
- Janad Valcari: 60 mencoes (!!!  — maior visibilidade mediatica)

Output: `data/adversarios_mentions.json`

### Integracao no Dashboard

- `src/lib/fetch.js` — adicionada URL `adversariosMentions`
- `src/App.jsx` — state + lazy load quando painel ativo
- `src/panels/AdversariosPanel.jsx` — secao "Imprensa dos adversarios"
  com 3 colunas, top 5 headlines por adversario, clicaveis

**Commit (monitor-pmto):** `623577c` — feat(panel): add adversary news section

---

## 5. Ajuste de Horarios

Horarios finais de coleta (BRT):
- 07:00 — noticias-manha (principal, com briefing + adversarios)
- 12:00 — noticias-meiodia (noticias + adversarios)
- 19:00 — noticias-noite
- A cada 3 dias: inteligencia competitiva Instagram
- Domingo/Quarta: coleta Instagram full/midweek

---

## Estado Final

| Componente | Status |
|------------|--------|
| Coleta 3x/dia | Configurado (07h, 12h, 19h BRT) |
| monitor_adversarios.py | Funcional, 83 mencoes capturadas |
| Painel adversarios + news | Deployado via Vercel |
| adversarios_mentions.json | Synced via workflow |
| Plano estrategico | Salvo no vault |

---

## Pendencias

1. **TikTok** — adiado (anti-bot agressivo, requer pesquisa de viabilidade)
2. **Liderancas** — aguardando dados do usuario
3. **Integracao painel news no refresh** — funciona no lazy load, refresh manual nao inclui advMentions (baixa prioridade)
4. **Secrets rotation** — pendente (acao manual)
