# Plano Estrategico — Monitor Coronel Barbosa ate a Eleicao 2026

**Criado em:** 2026-05-01
**Eleicao:** 2026-10-04 (1o turno)
**Horizonte:** ~5 meses

---

## Diagnostico Atual

| Dimensao | Status | Gap |
|----------|--------|-----|
| Cobertura de imprensa | 49 mencoes (Jan-Abr) | Baixo volume — normal para pre-campanha |
| Fontes monitoradas | Google News RSS (20 fontes) | Falta TikTok, Instagram, rádio local |
| Frequencia de coleta | 1x/dia (cron noturno) | Insuficiente para crise/viralização |
| Inteligencia competitiva | Inexistente | Não monitora adversários na mídia |
| Dados eleitorais | Inexistente | Sem integração TSE/pesquisas |
| Rede de liderancas | Panel existe, dados manuais | Sem automação de atualização |

---

## Fase 1 — Fundacao (Mai-Jun 2026)

Objetivo: ampliar cobertura e frequencia antes do periodo eleitoral oficial.

### 1.1 Ativacao de Liderancas

- Importar planilha de liderancas com campos: nome, municipio, telefone, ultima_visita, status
- Criar endpoint de upload CSV para atualização em lote
- Adicionar campo `prioridade` (alta/media/baixa) baseado em influencia eleitoral
- Gerar alerta semanal de liderancas sem contato há >14 dias

### 1.2 Agenda de Campo

- Criar `agenda.json` com eventos futuros (visitas, reunioes, atos publicos)
- Painel de calendario no dashboard com contagem regressiva
- Integrar com Google Calendar via API (opcional, depende de adoção pelo usuario)

### 1.3 Monitoramento TikTok/Instagram

- Adicionar scraper de mencoes em TikTok (via biblioteca `TikTokApi` ou Apify)
- Monitorar hashtags relevantes: #CoronelBarbosa, #PMTO, #TocantinsEleicoes
- Capturar metricas de engajamento (views, likes, shares)
- Alimentar o SocialPanel com dados reais (hoje usa mock/manual)

### 1.4 Cron Meio-Dia

- Adicionar segunda execucao diaria do scraper (12h UTC-3)
- Reduz janela de deteccao de crise de 24h para 12h
- Custo: zero (GitHub Actions free tier suporta)

---

## Fase 2 — Inteligencia (Jul-Ago 2026)

Objetivo: transformar o monitor de "clipping" em ferramenta de inteligencia eleitoral.

### 2.1 Monitoramento de Adversarios

- Criar queries RSS para principais adversarios (nomes a definir com usuario)
- Painel comparativo: volume de mencoes, sentimento, fontes
- Alerta quando adversario tem pico de cobertura (>3x media)

### 2.2 Integracao TSE — DivulgaCand

- Apos 15/Ago (prazo de registro): consultar API DivulgaCand
- Exibir painel com todos os candidatos registrados no municipio/estado
- Dados: nome, partido, coligacao, bens declarados, certidoes

### 2.3 Pesquisas Eleitorais

- Monitorar publicacao de pesquisas registradas no TSE
- Capturar: instituto, data, amostra, numeros por candidato
- Exibir evolucao temporal no dashboard
- Fonte: API do TSE (PesqEle) + scraping de portais locais

### 2.4 Meta Ads Library

- Consultar Meta Ad Library para gastos com anuncios politicos
- Comparar investimento proprio vs adversarios
- Alerta semanal de novos anuncios detectados

---

## Fase 3 — War Room (Set-Out 2026)

Objetivo: operacao em tempo quase-real para o periodo critico.

### 3.1 Coleta 4x/Dia

- Cron a cada 6h (00h, 06h, 12h, 18h UTC-3)
- Janela de deteccao reduzida para 6h
- Considerar 8x/dia na ultima semana (a cada 3h)

### 3.2 Deteccao de Crise

- Regra: se mencoes negativas > 3 em janela de 6h → alerta SMS/WhatsApp
- Regra: se adversario tem mencao positiva viral (engajamento >10x media) → alerta
- Integracao com Twilio ou Evolution API (WhatsApp) para notificacoes instantaneas

### 3.3 HGPE (Horario Gratuito)

- Monitorar exibicoes do HGPE (radio/TV)
- Registrar data, horario, duracao, tema abordado
- Permitir input manual rapido via formulario no dashboard

### 3.4 Modo D-Day (dia da eleicao)

- Coleta a cada 30min nas ultimas 48h
- Painel de "boca de urna digital" — mencoes em tempo real
- Após apuração: integrar resultados do TSE (Divulga) automaticamente

---

## Priorizacao e Esforco Estimado

| Item | Impacto | Esforco | Prioridade |
|------|---------|---------|------------|
| Cron meio-dia | Alto | Baixo (1h) | P0 |
| Monitoramento adversarios | Alto | Medio (4-6h) | P1 |
| TikTok/Instagram | Alto | Alto (8-12h) | P1 |
| Liderancas ativacao | Medio | Medio (4h) | P1 |
| Pesquisas eleitorais | Alto | Medio (6h) | P2 |
| TSE DivulgaCand | Medio | Baixo (3h) | P2 |
| Meta Ads | Medio | Medio (4h) | P2 |
| Deteccao de crise | Alto | Medio (6h) | P2 |
| Agenda de campo | Baixo | Baixo (2h) | P3 |
| HGPE tracking | Medio | Medio (4h) | P3 |
| Modo D-Day | Alto | Alto (8h) | P3 (implementar em Set) |

---

## Metricas de Sucesso

- **Cobertura:** >100 mencoes/mes ate Agosto
- **Latencia:** deteccao de noticia em <6h (hoje: <24h)
- **Adversarios:** monitorando pelo menos 3 competidores
- **Liderancas:** 100% dos contatos com visita registrada <30 dias
- **Alertas:** zero falso-negativo em crises reais

---

## Dependencias do Usuario

1. Definir lista de adversarios (nomes completos para queries RSS)
2. Fornecer planilha de liderancas atualizada
3. Decidir canal de alerta preferido (email, WhatsApp, SMS)
4. Rotacionar secrets do .env (pendente desde sessao anterior)
5. Validar hashtags TikTok/Instagram relevantes para o contexto local

---

## Proximos Passos Imediatos

1. [x] Cron meio-dia — adicionar segundo schedule no workflow
2. [ ] Criar queries RSS para 2-3 adversarios principais
3. [ ] Pesquisar viabilidade tecnica do scraper TikTok (rate limits, anti-bot)
4. [ ] Importar dados de liderancas no formato JSON
