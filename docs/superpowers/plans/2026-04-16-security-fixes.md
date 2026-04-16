# Security & Quality Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar os fixes de segurança e qualidade identificados na auditoria, do mais crítico ao mais simples, sem quebrar funcionalidades existentes.

**Architecture:** Cada task é independente e auto-contida. Não há dependências entre tasks exceto onde explicitamente indicado. Todos os fixes são no frontend (Vite/React) + config Vercel — sem backend novo.

**Tech Stack:** Vite 5, React 18 JSX, Supabase JS v2, Leaflet/react-leaflet, Vercel (static deploy via GitHub)

---

## File Map

| Arquivo | Tasks que o modificam |
|---|---|
| `vercel.json` | T1, T7 |
| `src/lib/fetch.js` | T4 |
| `src/App.jsx` | T3, T6 |
| `src/components/LoginScreen.jsx` | T5 |
| `src/panels/MapaCampoPanel.jsx` | T2 |
| `src/lib/analytics.js` | T6 |
| `.env.local` | T6 (leitura apenas) |

---

## Task 1 — CSP + Security Headers no vercel.json

**Prioridade:** P0 — CSP ausente permite script injection e clickjacking  
**Files:**
- Modify: `vercel.json`

**Estado atual do arquivo** (para referência):
```json
{
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=()" }
    ]},
    { "source": "/assets/(.*)", "headers": [
      { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
    ]},
    { "source": "/data/(.*)", "headers": [
      { "key": "Cache-Control", "value": "public, max-age=300, stale-while-revalidate=60" }
    ]}
  ]
}
```

Fontes externas que o app usa (para o CSP):
- `fonts.googleapis.com` e `fonts.gstatic.com` — Google Fonts (carregados no `index.html`)
- `unpkg.com` — Leaflet icons (hardcoded em `MapaCampoPanel.jsx` linha 10-12)
- `*.supabase.co` — Supabase auth + DB (URL lida de `VITE_SUPABASE_URL` em `.env.local`)
- `*.basemaps.cartocdn.com` — tiles do mapa Leaflet (TileLayer em `MapaCampoPanel.jsx`)
- `tile.openstreetmap.org` — fallback tiles (verificar se usado)

- [ ] **Step 1: Substituir vercel.json pelo conteúdo final com CSP + proteção de /data/**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com fonts.gstatic.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; worker-src blob:; frame-ancestors 'none';"
        },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/data/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=300, stale-while-revalidate=60" },
        { "key": "X-Robots-Tag", "value": "noindex, nofollow" },
        { "key": "Content-Type", "value": "application/json; charset=utf-8" }
      ]
    }
  ]
}
```

**Notas sobre o CSP:**
- `unsafe-inline` em `script-src` é necessário porque Vite injeta inline scripts no HTML de produção. Remover quebraria o app.
- `img-src https:` é necessário para as tile images do Leaflet (cartocdn, openstreetmap, unpkg)
- `connect-src wss://*.supabase.co` necessário para Supabase Realtime
- Leaflet (unpkg) é carregado via import no bundle, não via CDN — por isso não precisa de `script-src unpkg.com`

- [ ] **Step 2: Verificar que o JSON é válido**

```bash
cd "C:\Users\marce\OneDrive\Área de Trabalho\Monitor_Coronel_Barbosa\monitor-pmto"
node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('JSON válido')"
```
Expected: `JSON válido`

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "security: CSP header + HSTS + noindex em /data/"
```

---

## Task 2 — Corrigir innerHTML em MapaCampoPanel (XSS)

**Prioridade:** P0 — `innerHTML` com dados variáveis abre vetor XSS  
**Files:**
- Modify: `src/panels/MapaCampoPanel.jsx` linhas 42-49

**Estado atual (linhas 37-55):**
```jsx
function Legenda() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control({ position: 'bottomright' });
    ctrl.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.style.cssText = 'background:rgba(255,255,255,0.95);padding:10px 12px;...';
      div.innerHTML = Object.entries(STATUS_CONFIG).map(([, cfg]) =>
        `<div style="display:flex;align-items:center;gap:6px">
          <span style="width:10px;height:10px;border-radius:50%;background:${cfg.cor};display:inline-block;opacity:${cfg.opacidade}"></span>
          <span style="color:#1A2744;font-weight:600">${cfg.label}</span>
        </div>`
      ).join('');
      return div;
    };
    ctrl.addTo(map);
    return () => ctrl.remove();
  }, [map]);
  return null;
}
```

- [ ] **Step 1: Substituir innerHTML por criação segura de DOM**

Substituir o bloco `ctrl.onAdd = () => { ... }` por:

```jsx
    ctrl.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.style.cssText = 'background:rgba(255,255,255,0.95);padding:10px 12px;border-radius:8px;border:1px solid rgba(26,39,68,0.12);font-size:11px;line-height:1.8;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-family:DM Sans,sans-serif';
      Object.entries(STATUS_CONFIG).forEach(([, cfg]) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px';
        const dot = document.createElement('span');
        dot.style.cssText = `width:10px;height:10px;border-radius:50%;background:${cfg.cor};display:inline-block;opacity:${cfg.opacidade}`;
        const label = document.createElement('span');
        label.style.cssText = 'color:#1A2744;font-weight:600';
        label.textContent = cfg.label;
        row.appendChild(dot);
        row.appendChild(label);
        div.appendChild(row);
      });
      return div;
    };
```

- [ ] **Step 2: Verificar que o build não tem erros**

```bash
cd "C:\Users\marce\OneDrive\Área de Trabalho\Monitor_Coronel_Barbosa\monitor-pmto"
npm run build 2>&1 | tail -20
```
Expected: `✓ built in` sem erros

- [ ] **Step 3: Commit**

```bash
git add src/panels/MapaCampoPanel.jsx
git commit -m "security: substituir innerHTML por DOM seguro na legenda do mapa"
```

---

## Task 3 — handlePwChange com finally (infinite loading fix)

**Prioridade:** P1 — usuário pode ficar preso em estado "carregando" para sempre  
**Files:**
- Modify: `src/App.jsx` linhas 93-99

**Estado atual:**
```js
const handlePwChange=useCallback(async()=>{
  if(pwNew.length<6||pwNew!==pwConfirm)return;
  setPwLoading(true);setPwError('');
  const{error}=await supabase.auth.updateUser({password:pwNew});
  if(error){setPwError(error.message);setPwLoading(false);}
  else{setPwSuccess(true);setPwLoading(false);setTimeout(()=>{setShowPwModal(false);setPwNew('');setPwConfirm('');setPwSuccess(false);},2000);}
},[pwNew,pwConfirm]);
```

Problema: se `supabase.auth.updateUser` lançar exceção (timeout, rede), o bloco `if(error)` nunca executa e `setPwLoading(false)` nunca é chamado.

- [ ] **Step 1: Refatorar handlePwChange com try/catch/finally e mensagem sanitizada**

```js
  const handlePwChange=useCallback(async()=>{
    if(pwNew.length<6||pwNew!==pwConfirm)return;
    setPwLoading(true);setPwError('');
    try{
      const{error}=await supabase.auth.updateUser({password:pwNew});
      if(error){
        setPwError(error.status===422?'Senha não atende aos requisitos mínimos.':'Erro ao atualizar senha. Tente novamente.');
      }else{
        setPwSuccess(true);
        setTimeout(()=>{setShowPwModal(false);setPwNew('');setPwConfirm('');setPwSuccess(false);},2000);
      }
    }catch{
      setPwError('Erro de conexão. Verifique sua internet e tente novamente.');
    }finally{
      setPwLoading(false);
    }
  },[pwNew,pwConfirm]);
```

- [ ] **Step 2: Build**

```bash
npm run build 2>&1 | tail -10
```
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "fix: handlePwChange com try/finally — impede loading infinito"
```

---

## Task 4 — fetchJ com error logging + finally

**Prioridade:** P1 — falhas silenciosas tornam debugging impossível  
**Files:**
- Modify: `src/lib/fetch.js`

**Estado atual:**
```js
const FETCH_TIMEOUT = 10000;
export const fetchJ = async u => {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const r = await fetch(u + '?t=' + Date.now(), { signal: ctrl.signal });
    clearTimeout(tid);
    return r.ok ? r.json() : null;
  } catch { clearTimeout(tid); return null; }
};
```

Problema: `catch` vazio engole qualquer erro sem registro. Em produção, impossível saber se foi timeout, 404, JSON inválido, etc.

- [ ] **Step 1: Adicionar logging e finally para garantir clearTimeout**

```js
const BASE = '/data';
export const URLS = {
  mentions:    `${BASE}/mention_history.json`,
  social:      `${BASE}/social_metrics.json`,
  sentiment:   `${BASE}/social_sentiment.json`,
  geo:         `${BASE}/geo_electoral.json`,
  kpis:        `${BASE}/campaign_kpis.json`,
  adversarios: `${BASE}/adversarios.json`,
  tendencia:   `${BASE}/tendencia_voto_2022.json`,
  liderancas:  `${BASE}/liderancas.json`,
};

const FETCH_TIMEOUT = 10000;

export const fetchJ = async u => {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const r = await fetch(u + '?t=' + Date.now(), { signal: ctrl.signal });
    if (!r.ok) {
      console.warn(`[fetchJ] HTTP ${r.status} em ${u}`);
      return null;
    }
    return await r.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[fetchJ] Timeout (${FETCH_TIMEOUT}ms) em ${u}`);
    } else {
      console.error(`[fetchJ] Erro em ${u}:`, err.message);
    }
    return null;
  } finally {
    clearTimeout(tid);
  }
};
```

- [ ] **Step 2: Build**

```bash
npm run build 2>&1 | tail -10
```
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add src/lib/fetch.js
git commit -m "fix: fetchJ com error logging e finally para clearTimeout garantido"
```

---

## Task 5 — Rate limiting de login no cliente

**Prioridade:** P1 — sem limite, tentativas erradas repetidas bloqueiam IP no Supabase silenciosamente  
**Files:**
- Create: `src/lib/rateLimit.js`
- Modify: `src/components/LoginScreen.jsx` linhas 53-61

- [ ] **Step 1: Criar src/lib/rateLimit.js**

```js
// Armazena tentativas por email em memória (reseta ao recarregar a página)
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5;

export const checkRateLimit = email => {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const history = (attempts.get(key) || []).filter(t => now - t < WINDOW_MS);
  if (history.length >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((history[0] + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSec };
  }
  return { allowed: true };
};

export const recordAttempt = email => {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const history = (attempts.get(key) || []).filter(t => now - t < WINDOW_MS);
  history.push(now);
  attempts.set(key, history);
};

export const clearAttempts = email => {
  attempts.delete(email.toLowerCase().trim());
};
```

- [ ] **Step 2: Integrar no LoginScreen.jsx**

Adicionar import no topo do arquivo (após os imports existentes):
```js
import { checkRateLimit, recordAttempt, clearAttempts } from '../lib/rateLimit.js';
```

Substituir o `handleLogin` atual (linhas 53-62):
```js
  const handleLogin = async e => {
    e.preventDefault();
    setError('');

    const { allowed, retryAfterSec } = checkRateLimit(email);
    if (!allowed) {
      const min = Math.ceil(retryAfterSec / 60);
      setError(`Muitas tentativas incorretas. Aguarde ${min} min antes de tentar novamente.`);
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      recordAttempt(email);
      setError(err.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : 'Erro ao entrar. Tente novamente.');
    } else {
      clearAttempts(email);
    }
    setLoading(false);
  };
```

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -10
```
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
git add src/lib/rateLimit.js src/components/LoginScreen.jsx
git commit -m "feat: rate limiting de login — bloqueia após 5 tentativas em 15min"
```

---

## Task 6 — Candidato hardcoded → variável de config

**Prioridade:** P2 — `'marciobarbosa_cel'` hardcoded dificulta reutilização e gera confusão  
**Files:**
- Create: `src/lib/config.js`
- Modify: `src/lib/analytics.js` linha 55

**Nota:** A variável `VITE_CANDIDATE_USERNAME` deve ser adicionada ao `.env.local` **e** nas env vars do Vercel. O `.env.local` já existe no projeto com outras vars Supabase — apenas acrescentar a linha.

- [ ] **Step 1: Criar src/lib/config.js**

```js
export const CONFIG = {
  CANDIDATE_USERNAME: import.meta.env.VITE_CANDIDATE_USERNAME || 'marciobarbosa_cel',
};
```

- [ ] **Step 2: Adicionar VITE_CANDIDATE_USERNAME no .env.local**

Adicionar ao final do arquivo `.env.local` existente:
```
VITE_CANDIDATE_USERNAME=marciobarbosa_cel
```

- [ ] **Step 3: Substituir hardcode em analytics.js linha 55**

Adicionar import no topo de `src/lib/analytics.js`:
```js
import { CONFIG } from './config.js';
```

Substituir linha 55:
```js
// ANTES:
const CANDIDATO = 'marciobarbosa_cel';

// DEPOIS:
const CANDIDATO = CONFIG.CANDIDATE_USERNAME;
```

- [ ] **Step 4: Build**

```bash
npm run build 2>&1 | tail -10
```
Expected: sem erros

- [ ] **Step 5: Commit**

```bash
git add src/lib/config.js src/lib/analytics.js .env.local
git commit -m "refactor: candidato hardcoded → CONFIG.CANDIDATE_USERNAME em env var"
```

---

## Task 7 — Push final e verificação de deploy

**Prioridade:** Finalização — garantir que tudo foi para o remote e o deploy Vercel passou  
**Files:** Nenhum arquivo modificado nesta task

- [ ] **Step 1: Push de todos os commits**

```bash
cd "C:\Users\marce\OneDrive\Área de Trabalho\Monitor_Coronel_Barbosa\monitor-pmto"
git push
```
Expected: `main -> main` sem erros

- [ ] **Step 2: Verificar log dos commits**

```bash
git log --oneline -8
```
Expected: ver os 6 commits das tasks anteriores

- [ ] **Step 3: Verificar deploy no Vercel (aguardar ~60s)**

```bash
# Verificar status do último deploy via Vercel CLI (se instalado)
# ou navegar em: https://vercel.com/salescampelo/monitor-pmto
```

Confirmar:
- Build passou sem erros
- App carrega em https://monitor-coronel-barbosa.vercel.app
- Login funciona
- Mapa carrega com legenda visível
- Console do browser não mostra erros de CSP

---

## Sumário de tasks

| Task | Arquivo(s) | Prioridade | Estimativa |
|------|-----------|-----------|-----------|
| T1 — CSP + HSTS + /data/ noindex | `vercel.json` | P0 | 10min |
| T2 — innerHTML → DOM seguro (XSS) | `MapaCampoPanel.jsx` | P0 | 15min |
| T3 — handlePwChange finally | `App.jsx` | P1 | 5min |
| T4 — fetchJ logging + finally | `fetch.js` | P1 | 10min |
| T5 — Rate limiting login | `LoginScreen.jsx` + novo `rateLimit.js` | P1 | 15min |
| T6 — Candidato → env var | `analytics.js` + novo `config.js` | P2 | 10min |
| T7 — Push + verificação deploy | — | Final | 5min |
