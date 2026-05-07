# SESSAO 2026-05-07 — Apify Quota Fix + Badge Reposicionamento

**Data:** 7 de maio de 2026
**Repos tocados:** `scraper-pmto`, `monitor-pmto`
**Commits:** `fd3d5f0` (scraper-pmto), `773d5d3` + `995c3e1` (monitor-pmto)

---

## 1. Problemas reportados pelo usuário

1. Diversos emails de "comportamento anômalo dos scrapers" desde 01/05
2. Painel Inteligência Competitiva mostrando o nível de ameaça duas vezes (uma ao lado do nome, outra no fim da barra)

## 2. Diagnóstico — causa raiz

### 2.1 Silêncio de 6 dias do scraper (01–07/maio)

- O `instagram_monitor.py` crashou com `apify_client.errors.ApifyApiError: Monthly usage hard limit exceeded`
- O step `Executar instagram_monitor.py` no `monitor.yml` **não tinha** `continue-on-error: true`
- Como Instagram crashou, o run inteiro foi marcado como `failure`
- Os steps `Commit dados atualizados` e `Sync para monitor-pmto` que vinham DEPOIS **nunca foram executados**
- Resultado: notícias eram coletadas em memória mas nunca chegavam ao painel
- O heartbeat (workflow criado em sessão anterior) detectou corretamente a anomalia e disparou os emails

Os 2 runs analisados (`25493123439` e `25483828987`) confirmaram o stack trace idêntico em ambos.

### 2.2 Badge duplicado no AdversariosPanel

- O componente renderizava `nivelDin` (alta/interno/média/candidato) em DOIS lugares:
  - **Linha 1** — ao lado do nome do candidato (linhas 122–125 do JSX)
  - **Linha 2 desktop** — dentro da coluna do score (linhas 141–144)
- No mobile só aparecia 1× (Linha 1); no desktop apareciam ambos

## 3. Implementações entregues

### 3.1 scraper-pmto · commit `fd3d5f0`

| Arquivo | Mudança | Por quê |
|---|---|---|
| `.github/workflows/monitor.yml` | `continue-on-error: true` em 4 steps Apify (3× instagram_monitor, 1× gerar_adversarios) | Falha Apify nunca mais derruba o run inteiro nem trava o sync |
| `pmto_monitor.py` | Nova função `_log_failure()` + refator `__main__` → `_main()` + try/except top-level | Heartbeat passa a alertar com a CAUSA do problema (`last_error` em `collector_stats.json`), não só com silêncio |
| `captura_manual.py` (novo, 288 linhas) | Captura manual de URLs hostis (Cloudflare) com retry + UA rotation | Sites como `luizarmandocosta.com.br` que não indexam no Google News RSS |
| `.gitignore` | Ignora arquivos auxiliares de debug local | Limpeza |

### 3.2 monitor-pmto · commit `773d5d3` (primeira tentativa)

- Removido o badge duplicado da coluna do score (Linha 2 desktop)
- Mantido apenas o da Linha 1 (perto do nome)
- 1 file changed, 2 insertions(+), 6 deletions(-)

### 3.3 monitor-pmto · commit `995c3e1` (reposicionamento final)

Pedido do usuário: mover badges para perto dos números à direita (final das barras).

- **Desktop**: badge agora aparece à direita junto com score e trend (em linha, `gap:6`) na mesma coluna
- **Mobile**: badge mantido na Linha 1 ao lado do nome (mobile não tem coluna direita)
- Coluna direita expandida 76px → 90px para acomodar `[badge][trend][score]`
- Score com `minWidth:24` para alinhamento consistente entre rows

## 4. Validação em produção

| Verificação | Resultado |
|---|---|
| Run 25517850936 (scraper) | 5 jobs ✓ success: Notícias manhã/meio-dia/noite, Inteligência Competitiva, Instagram Mid-week (que era o que crashava antes) |
| Job opcional Instagram Full | Travado por > 45min, cancelado manualmente. Não bloqueia nada — re-tenta no próximo cron de domingo |
| Sync para monitor-pmto | Auto-commit recebido em `public/data/`, painel mostra timestamp `07/05/2026 19:46` no header |
| Build Vercel | CI ✓ em 28s, Vercel auto-deployou commit `995c3e1` |
| Inspeção visual do painel | Badges à direita, sem duplicação, alinhamento consistente |

## 5. Ações pendentes (próximas sessões — não urgentes)

| # | Ação | Prazo | Esforço |
|---|---|---|---|
| 16 | Migrar `actions/checkout` v4 → v5 e `setup-python` v5 → v6 | Soft: 02/jun/2026 (forçado Node 24) | 15 min |
| 17 | Implementar fail-soft em `instagram_monitor.py` (try/except em torno de `client.actor().call()` para retornar métricas vazias com `quota_exceeded=true` em vez de propagar) | Próxima sessão tranquila | 10 min |
| 18 | Avaliar migração Apify → Bright Data (plugin já instalado) | Sessão dedicada | 1–2 h |
| 19 | (este documento) | ✅ Feito | — |
| Extra | Diagnosticar travamento do Instagram Full | Quando voltar a acontecer | TBD |
| Extra | Configurar Vercel para servir `/data/*.json` direto (atualmente 307 redirect; painel acessa via `/api/data/` com auth) | Opcional | 5 min |

## 6. Lições estruturais

### 6.1 Pattern de falha silenciosa identificado

A combinação **(step sem `continue-on-error`)** + **(steps de sync DEPOIS do step que pode falhar)** = **silêncio total quando qualquer dependência externa cai**. Esse mesmo pattern apareceu em:
- monitor-pmto: cascade vite-plugin-pwa em 24-25/abr
- scraper-pmto: Apify quota em 01-07/maio

Heurística defensiva: **steps de sync/commit/notificação sempre devem ter `continue-on-error: true` em tudo que depende de API externa, OU vir antes desses steps**.

### 6.2 Observabilidade > Resiliência

A verdadeira fix da sessão anterior (heartbeat + alertas) foi o que tornou ESTE diagnóstico possível em minutos. O `_log_failure()` adicionado hoje extende a mesma filosofia: o heartbeat agora detecta a CAUSA, não só o sintoma.

### 6.3 Apify quota

Limite mensal aumentado para $50. Uso atual ($29.07) foi pesquisa massiva já concluída — projeção orgânica deve manter o teto. Mas plano:
- Manter monitoramento mensal de uso
- Migrar para Bright Data se uso crescer organicamente acima de $35/mês
- `--mode full --max-posts 100` é o job mais caro; reduzir para 30 posts se necessário

---

**Co-autoria:** Marcel Sales Campelo + Claude Opus 4.7
