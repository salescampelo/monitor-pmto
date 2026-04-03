# Monitor Coronel Barbosa 2026

## O que é
Dashboard de inteligência eleitoral com 3 módulos:
- M3: Inteligência Eleitoral (139 municípios TO, TSE 2022 + IBGE)
- M2: Monitor de Redes Sociais (22 perfis Instagram)
- M1: Monitor de Imprensa (32 fontes, 882 menções)

## Stack
- React + Vite (src/App.jsx é o componente único, 619 linhas)
- Recharts (PieChart, BarChart, LineChart)
- Lucide React (ícones)
- DM Sans (Google Fonts via index.html)
- Deploy: GitHub → Vercel (auto)
- Dados: 4 JSONs fetchados do GitHub raw (mention_history, social_metrics, social_sentiment, geo_electoral)

## Paleta PMTO (obrigatória)
- Azul institucional: #1A3A7A (primário)
- Dourado: #D4A017 (destaque)
- Fundo: #F3F5F9
- Cards: #FFFFFF com borda #DFE3ED
- Texto primário: #1A1D2E
- Texto secundário: #5A6178
- Texto muted: #8C93A8
- Verde sucesso: #15803D
- Vermelho alerta: #B91C1C

## Problemas a corrigir (prioridade)

### 1. Responsividade (crítico)
- Grids com colunas fixas quebram em mobile (<768px)
- Padding lateral 32px inadequado para mobile
- Metric cards (Met) extravasam sem flexWrap
- YAxis width=150 no BarChart consome muito espaço em mobile
- Tabelas do GeoPanel e SocialPanel precisam de scroll horizontal ou layout alternativo em mobile

### 2. Cores residuais do tema dark
- Linha 74: DCOL usa #22c55e/#ef4444/#64748b (dark) → usar #15803D/#B91C1C/#8C93A8
- Linha 109: borderLeft #8b5cf6 (roxo) → #1A3A7A (azul PMTO)
- Linha 173: background rgba(139,92,246,0.08) (roxo) → rgba(26,58,122,0.06)
- Linha 175: username colors #a78bfa/#cbd5e1 (dark) → #1A3A7A/#2D3142
- Linha 288: nuvem de palavras cor neutra #e2e8f0 (invisível em fundo claro) → #8C93A8
- Linha 589: filtro cor #8b5cf6 (roxo) → #1A3A7A

### 3. Tipografia inconsistente
- GeoPanel ranking header (linha 394): fontSize:10 → 12
- Geo ranking colunas (399-404): fontSize:10 → 12
- Loading screen (533): font-family usar DM Sans
- Categoria label geo (416): fontSize:8 → 10

## Ordem dos painéis na página
Header → M1 header (Monitor de imprensa) → Metrics → M3 (Inteligência eleitoral) → M2 (Redes sociais) → Filtros → Feed notícias

## Convenções
- Não usar CSS externo — tudo inline (manter padrão existente)
- Manter componente único em App.jsx
- Manter fetch automático dos 4 JSONs do GitHub
- Não alterar lógica de classificação de notícias (CL_RULES)