# Sessao 2026-04-30 — Backfill v3 + Google News URL Decoder

## Contexto

O backfill Jan-Abr 2026 estava retornando apenas 6 menções (as mesmas do run normal).
A investigação revelou que `fetch_article_body()` recebia URLs do Google News RSS
(`https://news.google.com/rss/articles/CBMi...`) que são codificadas em protobuf proprietário.
O body-fetch baixava a página do Google News (580KB HTML) em vez do artigo real.

## Problema Raiz

Google News RSS não usa redirecionamentos HTTP padrão nem base64 simples.
As URLs são codificadas via protobuf proprietário. Tentativas falhadas:
- `requests.get` com follow_redirects → retorna página Google News
- Base64 decode (vários paddings) → bytes sem URL legível
- Double base64 → estrutura protobuf, sem URL
- Biblioteca `gnews` → API incompatível
- Path `/articles/` em vez de `/rss/articles/` → 302 para outra URL Google

## Solução

Instalação da biblioteca `googlenewsdecoder` (v0.1.7) que implementa o decode
do protobuf do Google News via scraping do HTML intermediário.

### Alterações em `pmto_monitor.py`

```python
from googlenewsdecoder import new_decoderv1

def resolve_google_news_url(url):
    """Decode a Google News RSS URL to the real article URL."""
    if "news.google.com" not in url:
        return url
    try:
        result = new_decoderv1(url)
        if result.get("status") and result.get("decoded_url"):
            return result["decoded_url"]
    except Exception:
        pass
    return url
```

Integrado em dois pontos:
1. `fetch_article_body()` — resolve URL antes de buscar o corpo
2. Construção do `base` dict da menção — armazena URL real no `mention_history.json`

### Outras correções
- `requirements.txt` — adicionado `googlenewsdecoder>=0.1.7`
- `config.py` — corrigido `BASE_DIR` de OneDrive para `C:\dev` (sync estava falhando)
- 6 menções legadas com URLs Google News foram retroativamente resolvidas

## Resultados do Backfill v3

| Janela | Período | Novas Menções |
|--------|---------|---------------|
| 1 | 01/01–14/01 | 0 (dupl.) |
| 2 | 15/01–28/01 | 0 (dupl.) |
| 3 | 29/01–11/02 | 0 (dupl.) |
| 4 | 12/02–25/02 | 9 |
| 5 | 26/02–11/03 | 5 |
| 6 | 12/03–25/03 | 4 |
| 7 | 26/03–08/04 | 8 |
| 8 | 09/04–22/04 | 0 (UFC homônimo) |
| 9 | 23/04–30/04 | 1 |
| **Total** | | **27 novas** |

**Antes:** 6 menções | **Depois:** 46 menções
**Body-fetch rescues:** 27 artigos resgatados via leitura do corpo
**Fontes:** 20 veículos distintos

### Distribuição Mensal
- Janeiro: 6
- Fevereiro: 19
- Março: 12
- Abril: 9

### Top Fontes
| Qt | Fonte |
|----|-------|
| 7 | Gazeta do Cerrado |
| 5 | Cleber Toledo |
| 5 | G1 |
| 4 | Jornal Opção Tocantins |
| 4 | Agência Tocantins |
| 4 | Jornal Folha Capital |
| 2 | RR10 Notícias |
| 2 | Portal LJ |
| 2 | Luiz Armando Costa |

## Filtros que Funcionaram

- Exclusão de UFC (Márcio "Ticoto" Barbosa, lutador homônimo): 12 artigos corretamente bloqueados
- Exclusão de "Wanderlei Barbosa" (governador): ~15 artigos corretamente filtrados
- Exclusão de PMGO (coronel Barbosa de Goiás): 3 artigos filtrados

## Commits

| Repo | Hash | Descrição |
|------|------|-----------|
| scraper-pmto | `4610763` | feat(backfill): add Google News URL decoder + backfill Jan-Apr 2026 |
| scraper-pmto | `0cc929c` | fix(config): correct BASE_DIR path for monitor-pmto sync |
| monitor-pmto | `d68c71f` | data: backfill Jan-Apr 2026 mentions (6 → 46) |

## Próximos Passos

1. Janelas 1-3 retornaram 0 porque `seen_hashes` ainda tinha entradas desses períodos da coleta normal. Uma segunda passagem com hashes limpos poderia recuperar mais.
2. Considerar scraping direto (CAMADA 1) com `--backfill` para sites que não indexam bem no Google News (ex: Conexão TO, Atitude TO).
3. Monitorar se `googlenewsdecoder` continua funcionando — Google pode mudar o formato.
4. A janela 8 (09-22/04) não retornou nada legítimo porque foi dominada por resultados do UFC (lutador homônimo). Queries mais específicas poderiam ajudar.
