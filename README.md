# Monitor de Menções — Cel. Márcio A. Barbosa de Mendonça

Dashboard de inteligência para monitoramento de menções na imprensa brasileira.

**32 fontes** (18 Tocantins + 14 nacionais) · Agosto/2022 – presente

🔗 **Live:** [monitor-pmto.vercel.app](https://monitor-pmto.vercel.app)

## Como usar

1. Acesse o dashboard
2. Arraste o arquivo `mention_history.json` (gerado pelo scraper) para a tela
3. Os dados ficam salvos no navegador entre sessões
4. Botão "Atualizar" carrega versão mais recente do JSON

## Estrutura

```
├── index.html          # Entry point
├── package.json        # Dependências (React, Vite, lucide-react)
├── vite.config.js      # Config do Vite
├── .gitignore          # Ignora Python, logs, dados
└── src/
    ├── main.jsx        # React mount
    └── App.jsx         # Dashboard completo
```

## Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`
