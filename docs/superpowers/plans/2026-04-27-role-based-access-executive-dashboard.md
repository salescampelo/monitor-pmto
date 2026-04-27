# Role-Based Access & Executive Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add role-based access to Monitor Coronel Barbosa so the candidate sees a simplified executive dashboard by default, while campaign staff and admin keep the full multi-panel view.

**Architecture:** Roles stored as a `role` column on the existing `allowed_users` Supabase table (3 values: admin/coordenacao/candidato). The auth check query already runs on every login — we add `role` to the select. A new `ExecutivePanel.jsx` composes from existing boot-fetched data. Routing logic in `App.jsx` directs `candidato` to the executive view by default with a toggle to the full dashboard.

**Tech Stack:** React 18, Supabase (auth + DB), Vite, Lucide icons, inline styles (existing pattern)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/App.jsx` | Modify | Auth query, role prop passing, isAdmin/isCandidato derivation, default panel, mentions fetch trigger, executive panel rendering, sidebar entry, header conditional |
| `src/panels/ExecutivePanel.jsx` | Create | Single-screen executive dashboard for the candidate |
| `src/components/BottomNav.jsx` | Modify | Add "Resumo" to drawer, accept isCandidato prop, hide in executive mode |
| `src/components/AppHeader.jsx` | Modify | Accept isExecutiveView prop, render simplified header when true |
| `src/lib/urlState.js` | Modify | Update default panel to support role-based defaults |
| `.env.local` | Modify | Remove VITE_ADMIN_EMAIL |

---

### Task 1: Add role to auth query and pass to App

**Files:**
- Modify: `src/App.jsx:501-596`

- [ ] **Step 1: Add role state to Root component**

In `src/App.jsx`, inside the `Root()` function (line 503), add a `role` state variable after `authError`:

```jsx
const[userRole, setUserRole] = useState(null);
```

- [ ] **Step 2: Update the auth query to select role**

In `src/App.jsx`, change line 522 from:

```js
supabase.from(ALLOWED_CHECK_TABLE).select('email').eq('email',session.user.email)
```

to:

```js
supabase.from(ALLOWED_CHECK_TABLE).select('email, role').eq('email',session.user.email)
```

- [ ] **Step 3: Extract role from query result**

In `src/App.jsx`, after line 537 (`const ok=Array.isArray(data)&&data.length===1;`), add:

```js
if(ok)setUserRole(data[0].role||'coordenacao');
```

- [ ] **Step 4: Update the duplicate auth query in the retry button**

In `src/App.jsx`, line 577, the retry button has a duplicate inline query. Update it identically:
- Change `.select('email')` to `.select('email, role')`
- After the `const ok=` line inside that handler, add `if(ok)setUserRole(data[0].role||'coordenacao');`

- [ ] **Step 5: Pass role to App component**

In `src/App.jsx`, change line 596 from:

```jsx
return<App onLogout={handleLogout} userEmail={session.user.email}/>;
```

to:

```jsx
return<App onLogout={handleLogout} userEmail={session.user.email} role={userRole}/>;
```

- [ ] **Step 6: Update App component signature and derive isAdmin/isCandidato**

In `src/App.jsx`, change line 45 from:

```js
const App = ({onLogout, userEmail}) => {
```

to:

```js
const App = ({onLogout, userEmail, role = 'coordenacao'}) => {
```

Then replace line 297:

```js
const isAdmin=userEmail===import.meta.env.VITE_ADMIN_EMAIL;
```

with:

```js
const isAdmin = role === 'admin';
const isCandidato = role === 'candidato';
```

- [ ] **Step 7: Verify build passes**

Run: `cd /c/dev/monitor-pmto && npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

- [ ] **Step 8: Commit**

```bash
cd /c/dev/monitor-pmto && git add src/App.jsx && git commit -m "feat: fetch role from allowed_users, replace VITE_ADMIN_EMAIL"
```

---

### Task 2: Update default panel logic and URL state

**Files:**
- Modify: `src/App.jsx:46-71`
- Modify: `src/lib/urlState.js`

- [ ] **Step 1: Make default panel role-aware**

In `src/App.jsx`, change line 71 from:

```js
const[activePanel,setActivePanel]=useState(urlState.panel);
```

to:

```js
const defaultPanel = isCandidato ? 'executive' : (urlState.panel || 'kpis');
const[activePanel,setActivePanel]=useState(urlState.panel === 'tendencia' && isCandidato ? 'executive' : urlState.panel || defaultPanel);
```

Wait — this needs to be simpler. The URL state already has a default of `'tendencia'` in `urlState.js`. We need to:
1. Check if there's an explicit `?panel=` in the URL
2. If not, use role-based default

In `src/lib/urlState.js`, change `getStateFromUrl` to return `null` for panel when no explicit `?panel=` param exists:

```js
export function getStateFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const relevance = p.get('relevance');
  const sortOrder = p.get('sort');
  return {
    panel:     p.get('panel') || null,
    cluster:   p.get('cluster') || DEFAULTS.cluster,
    type:      p.get('type')    || DEFAULTS.type,
    scope:     p.get('scope')   || DEFAULTS.scope,
    relevance: VALID.relevance.has(relevance) ? relevance : DEFAULTS.relevance,
    sortOrder: VALID.sortOrder.has(sortOrder) ? sortOrder : DEFAULTS.sortOrder,
  };
}
```

Then in `src/App.jsx`, change the activePanel initialization (line 71) to:

```js
const[activePanel,setActivePanel]=useState(urlState.panel || (isCandidato ? 'executive' : 'kpis'));
```

- [ ] **Step 2: Add 'executive' to document title map**

In `src/App.jsx` line 81, add `executive` to the titles object:

```js
const titles={executive:'Resumo Executivo',tendencia:'Tendência de Voto',adversarios:'Inteligência Competitiva',kpis:'Metas e KPIs',geo:'Dados Eleitorais',campo:'Mapa de Capilaridade',social:'Redes Sociais',imprensa:'Monitor de Imprensa',qualidade:'Qualidade do Coletor',auditoria:'Auditoria'};
```

- [ ] **Step 3: Add mentions fetch for executive panel**

In `src/App.jsx` line 115, change:

```js
if(activePanel==='imprensa'&&!newsRaw)fetchJ(URLS.mentions).then(d=>{if(d)setNewsRaw(d);}).catch(onExpiry);
```

to:

```js
if((activePanel==='imprensa'||activePanel==='executive')&&!newsRaw)fetchJ(URLS.mentions).then(d=>{if(d)setNewsRaw(d);}).catch(onExpiry);
```

- [ ] **Step 4: Add executive panel to refresh functions**

In `src/App.jsx` line 126 (inside `handleRefresh`), update the `panelFetches` ternary chain to include executive:

```js
const panelFetches=activePanel==='imprensa'||activePanel==='executive'?[fetchJ(URLS.mentions)]:
```

And in `refreshSilent` (line 151), make the same change:

```js
const panelFetches=activePanel==='imprensa'||activePanel==='executive'?[fetchJ(URLS.mentions)]:
```

Also add the setter for both functions — after the existing `if(activePanel==='imprensa'&&panelResults[0])setNewsRaw(panelResults[0]);` line, add:

```js
if(activePanel==='executive'&&panelResults[0])setNewsRaw(panelResults[0]);
```

(Do this in both `handleRefresh` and `refreshSilent`.)

- [ ] **Step 5: Verify build passes**

Run: `cd /c/dev/monitor-pmto && npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

- [ ] **Step 6: Commit**

```bash
cd /c/dev/monitor-pmto && git add src/App.jsx src/lib/urlState.js && git commit -m "feat: role-aware default panel and executive data fetching"
```

---

### Task 3: Create ExecutivePanel component

**Files:**
- Create: `src/panels/ExecutivePanel.jsx`

- [ ] **Step 1: Create the ExecutivePanel file**

Create `src/panels/ExecutivePanel.jsx` with the full component:

```jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Calendar, TrendingUp, TrendingDown, Minus, Users,
  Newspaper, ArrowUpRight, BarChart3,
} from 'lucide-react';
import { Card, useWW } from '../components/ui.jsx';

const SENTIMENT_COLORS = { positivo: '#15803d', neutro: '#8C93A8', negativo: '#b91c1c' };

function ExecutivePanel({ kpiData, socialData, sentimentData, articles, candidateUsername, onFullView }) {
  const isMobile = useWW() < 768;

  const electionDate = kpiData?.election_date ? new Date(kpiData.election_date + 'T00:00:00') : null;
  const daysLeft = electionDate ? Math.max(0, Math.ceil((electionDate - new Date()) / (1000 * 60 * 60 * 24))) : null;
  const phase = kpiData?.current_phase || 1;
  const phaseInfo = kpiData?.phases?.[String(phase)] || {};

  const candidateSnapshots = useMemo(() => {
    if (!Array.isArray(socialData)) return [];
    const un = candidateUsername?.toLowerCase();
    return socialData
      .filter(p => p.username?.toLowerCase() === un)
      .sort((a, b) => (b.data_coleta || '').localeCompare(a.data_coleta || ''));
  }, [socialData, candidateUsername]);

  const profile = candidateSnapshots[0] || null;
  const prevWeek = useMemo(() => {
    if (candidateSnapshots.length < 2) return null;
    const latestDate = new Date(candidateSnapshots[0]?.data_coleta || Date.now());
    const target = new Date(latestDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    return candidateSnapshots.slice(1).reduce((best, s) => {
      const diff = Math.abs(new Date(s.data_coleta) - target);
      const bestDiff = best ? Math.abs(new Date(best.data_coleta) - target) : Infinity;
      return diff < bestDiff ? s : best;
    }, null);
  }, [candidateSnapshots]);

  const highlightKpis = useMemo(() => {
    if (!kpiData?.kpis) return [];
    const ids = ['seguidores_ig', 'engajamento_ig', 'mencoes_imprensa', 'sentimento_positivo'];
    return ids.map(id => kpiData.kpis.find(k => k.id === id)).filter(Boolean);
  }, [kpiData]);

  const latestMentions = useMemo(() => {
    if (!Array.isArray(articles)) return [];
    return [...articles]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 5);
  }, [articles]);

  const sentiment = sentimentData?.sentiment || {};
  const sentParts = useMemo(() => {
    const pos = sentiment.pct_positivo || 0;
    const neg = sentiment.pct_negativo || 0;
    const neu = Math.max(0, 100 - pos - neg);
    return { pos, neg, neu };
  }, [sentiment]);

  const getDelta = (current, previous) => {
    if (!previous || previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    if (Math.abs(pct) < 1) return { icon: Minus, color: '#8C93A8', label: 'estável', value: '0%' };
    if (pct > 0) return { icon: TrendingUp, color: '#15803d', label: 'subindo', value: `+${pct.toFixed(1)}%` };
    return { icon: TrendingDown, color: '#b91c1c', label: 'caindo', value: `${pct.toFixed(1)}%` };
  };

  const cardStyle = {
    background: '#fff',
    borderRadius: 16,
    padding: isMobile ? 16 : 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid rgba(26,39,68,0.06)',
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Countdown */}
      <div style={{
        ...cardStyle,
        background: 'linear-gradient(135deg, #1A3A7A 0%, #0D1F42 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: isMobile ? 20 : 28,
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', margin: '0 0 8px' }}>
          <Calendar size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
          Eleição 2026
        </p>
        <p style={{ fontSize: isMobile ? 48 : 56, fontWeight: 800, color: '#D4A017', margin: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {daysLeft ?? '—'}
        </p>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>
          dias restantes
        </p>
        <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', display: 'inline-block' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#D4A017' }}>
            Fase {phase}: {phaseInfo.name || ''}
          </span>
        </div>
      </div>

      {/* KPI Progress Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {highlightKpis.map(kpi => {
          const target = kpi.targets?.[String(phase)] || 0;
          const current = kpi.current || 0;
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          const isOnTrack = pct >= 50;
          const barColor = pct >= 100 ? '#15803d' : (isOnTrack ? '#1A3A7A' : '#b91c1c');
          const displayCurrent = kpi.format === 'percent' ? `${current}%` : current.toLocaleString('pt-BR');
          const displayTarget = kpi.format === 'percent' ? `${target}%` : target.toLocaleString('pt-BR');
          return (
            <div key={kpi.id} style={cardStyle}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8C93A8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                {kpi.label}
              </p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#1A2744', margin: '0 0 4px', fontVariantNumeric: 'tabular-nums' }}>
                {displayCurrent}
              </p>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(26,39,68,0.08)', overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.6s ease-out' }} />
              </div>
              <p style={{ fontSize: 10, color: '#8C93A8', margin: 0 }}>
                Meta: {displayTarget} ({pct}%)
              </p>
            </div>
          );
        })}
      </div>

      {/* Social Pulse */}
      {profile && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Users size={16} style={{ color: '#1A3A7A' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2744' }}>Redes Sociais</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#8C93A8', textTransform: 'uppercase', margin: '0 0 4px' }}>Seguidores</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#1A2744', fontVariantNumeric: 'tabular-nums' }}>
                  {(profile.seguidores || 0).toLocaleString('pt-BR')}
                </span>
                {(() => {
                  const d = getDelta(profile.seguidores, prevWeek?.seguidores);
                  if (!d) return null;
                  const Icon = d.icon;
                  return <span style={{ fontSize: 12, fontWeight: 700, color: d.color }} title={d.label}><Icon size={14} style={{ verticalAlign: -2 }} /> {d.value}</span>;
                })()}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#8C93A8', textTransform: 'uppercase', margin: '0 0 4px' }}>Engajamento</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#1A2744' }}>
                  {(profile.taxa_engajamento_pct || 0).toFixed(1)}%
                </span>
                {(() => {
                  const d = getDelta(profile.taxa_engajamento_pct, prevWeek?.taxa_engajamento_pct);
                  if (!d) return null;
                  const Icon = d.icon;
                  return <span style={{ fontSize: 12, fontWeight: 700, color: d.color }} title={d.label}><Icon size={14} style={{ verticalAlign: -2 }} /> {d.value}</span>;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment Bar */}
      <div style={cardStyle}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8C93A8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
          Sentimento Instagram
        </p>
        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: '#f1f5f9' }}>
          {sentParts.pos > 0 && <div style={{ width: `${sentParts.pos}%`, background: SENTIMENT_COLORS.positivo, transition: 'width 0.6s ease-out' }} />}
          {sentParts.neu > 0 && <div style={{ width: `${sentParts.neu}%`, background: SENTIMENT_COLORS.neutro, transition: 'width 0.6s ease-out' }} />}
          {sentParts.neg > 0 && <div style={{ width: `${sentParts.neg}%`, background: SENTIMENT_COLORS.negativo, transition: 'width 0.6s ease-out' }} />}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {[
            { label: 'Positivo', value: sentParts.pos, color: SENTIMENT_COLORS.positivo },
            { label: 'Neutro', value: sentParts.neu, color: SENTIMENT_COLORS.neutro },
            { label: 'Negativo', value: sentParts.neg, color: SENTIMENT_COLORS.negativo },
          ].map(s => (
            <span key={s.label} style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>
              {s.label} {Math.round(s.value)}%
            </span>
          ))}
        </div>
      </div>

      {/* Latest Mentions */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Newspaper size={16} style={{ color: '#b91c1c' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2744' }}>Últimas Menções</span>
        </div>
        {latestMentions.length === 0 && (
          <p style={{ fontSize: 13, color: '#8C93A8', textAlign: 'center', margin: '16px 0' }}>Carregando menções...</p>
        )}
        {latestMentions.map((item, i) => {
          const sentColor = item.sentiment === 'positivo' ? '#15803d' : item.sentiment === 'negativo' ? '#b91c1c' : '#8C93A8';
          return (
            <a
              key={item.id || i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                padding: '10px 0',
                borderTop: i > 0 ? '1px solid rgba(26,39,68,0.06)' : 'none',
                textDecoration: 'none', color: 'inherit',
                minHeight: 44,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A2744', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {item.title}
                </p>
                <p style={{ fontSize: 11, color: '#8C93A8', margin: '4px 0 0' }}>
                  {item.source} · {item.date?.split(' ')[0] || ''}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: sentColor, textTransform: 'uppercase', background: `${sentColor}10`, padding: '2px 6px', borderRadius: 4 }}>
                  {item.sentiment || 'neutro'}
                </span>
                <ArrowUpRight size={14} style={{ color: '#8C93A8' }} />
              </div>
            </a>
          );
        })}
      </div>

      {/* Toggle to full view */}
      {onFullView && (
        <button
          onClick={onFullView}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: 14, borderRadius: 12,
            background: 'rgba(26,55,122,0.06)', border: '1px solid rgba(26,55,122,0.12)',
            color: '#1A3A7A', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            minHeight: 44,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,55,122,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,55,122,0.06)'}
        >
          <BarChart3 size={16} />
          Ver painel completo
        </button>
      )}
    </div>
  );
}

ExecutivePanel.propTypes = {
  kpiData: PropTypes.object,
  socialData: PropTypes.array,
  sentimentData: PropTypes.object,
  articles: PropTypes.array,
  candidateUsername: PropTypes.string,
  onFullView: PropTypes.func,
};

export default ExecutivePanel;
```

- [ ] **Step 2: Verify build passes**

Run: `cd /c/dev/monitor-pmto && npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

- [ ] **Step 3: Commit**

```bash
cd /c/dev/monitor-pmto && git add src/panels/ExecutivePanel.jsx && git commit -m "feat: add ExecutivePanel — single-screen candidate dashboard"
```

---

### Task 4: Wire ExecutivePanel into App.jsx

**Files:**
- Modify: `src/App.jsx:1-34` (imports)
- Modify: `src/App.jsx:391-399` (panel rendering)
- Modify: `src/App.jsx:318-321` (header and BottomNav props)
- Modify: `src/App.jsx:328-369` (sidebar)

- [ ] **Step 1: Add lazy import for ExecutivePanel**

In `src/App.jsx`, after line 27 (`const QualidadePanel`), add:

```js
const ExecutivePanel  = lazy(() => import('./panels/ExecutivePanel.jsx'));
```

Also add `LayoutDashboard` to the lucide-react import (line 8):

```js
  BarChart3, TrendingUp, Heart, MessageCircle, Users, LogOut, Menu, Map, Shield,
  Download, FileText, LayoutDashboard,
```

- [ ] **Step 2: Add executive panel rendering**

In `src/App.jsx`, before line 392 (`{activePanel==='tendencia'`), add:

```jsx
{activePanel==='executive'&&<SafePanel><ExecutivePanel kpiData={kpiData} socialData={socialData} sentimentData={sentimentData} articles={articles} candidateUsername={CONFIG.CANDIDATE_USERNAME} onFullView={()=>setActivePanel('kpis')}/></SafePanel>}
```

- [ ] **Step 3: Add "Resumo Executivo" to sidebar**

In `src/App.jsx`, change the sidebar panels array (starting at line 330) to include executive at position 0:

```js
{[
  {id:'executive', label:'Resumo Executivo', icon:LayoutDashboard, sub:'Visão do candidato'},
  {id:'tendencia', label:'Tendência 2022', icon:TrendingUp,  sub:'Bolsonaro × Lula'},
```

(Insert the executive entry as the first element of the array.)

- [ ] **Step 4: Derive isExecutiveView and conditionally hide sidebar/BottomNav for candidato**

In `src/App.jsx`, after the `isCandidato` line (which we added in Task 1), add:

```js
const isExecutiveView = isCandidato && activePanel === 'executive';
```

Then update the sidebar `display` (line 328) to also hide for candidato in executive view:

Change:
```js
display:isMobile?'none':'flex'
```
to:
```js
display:(isMobile||isExecutiveView)?'none':'flex'
```

And update the BottomNav rendering (line 321) from:

```jsx
{isMobile&&<BottomNav activePanel={activePanel} setActivePanel={setActivePanel} isAdmin={isAdmin}/>}
```

to:

```jsx
{isMobile&&!isExecutiveView&&<BottomNav activePanel={activePanel} setActivePanel={setActivePanel} isAdmin={isAdmin}/>}
```

- [ ] **Step 5: Pass isExecutiveView to AppHeader**

In `src/App.jsx` line 318, add the `isExecutiveView` prop to the `<AppHeader>` call:

```jsx
<AppHeader isMobile={isMobile} isExecutiveView={isExecutiveView} refreshing={refreshing} ...
```

(Add `isExecutiveView={isExecutiveView}` right after `isMobile={isMobile}`.)

- [ ] **Step 6: Verify build passes**

Run: `cd /c/dev/monitor-pmto && npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

- [ ] **Step 7: Commit**

```bash
cd /c/dev/monitor-pmto && git add src/App.jsx && git commit -m "feat: wire ExecutivePanel into routing, sidebar, and navigation"
```

---

### Task 5: Simplify AppHeader for executive view

**Files:**
- Modify: `src/components/AppHeader.jsx`

- [ ] **Step 1: Add isExecutiveView prop**

In `src/components/AppHeader.jsx`, update the function signature (line 72) to include `isExecutiveView`:

```js
export default function AppHeader({
  isMobile, isExecutiveView = false, refreshing = false, handleRefresh, nav, setNav, userEmail = null, onLogout = null, setPw, lastUpdate = null,
```

- [ ] **Step 2: Skip KPI strip in mobile executive view**

In `src/components/AppHeader.jsx`, the mobile branch (lines 87-175) renders a KPI strip after the header bar. Wrap the KPI strip `<div>` (lines 162-173) in a conditional:

Change:
```jsx
      {/* KPI strip — horizontal scroll */}
      <div style={{
```

to:

```jsx
      {/* KPI strip — horizontal scroll */}
      {!isExecutiveView && <div style={{
```

And close it at line 173 — change:
```jsx
        </div>
      </>
```

to:
```jsx
        </div>}
      </>
```

- [ ] **Step 3: Add isExecutiveView to PropTypes**

In `src/components/AppHeader.jsx`, add to the propTypes (after line 246 `isMobile`):

```js
isExecutiveView:     PropTypes.bool,
```

- [ ] **Step 4: Verify build passes**

Run: `cd /c/dev/monitor-pmto && npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

- [ ] **Step 5: Commit**

```bash
cd /c/dev/monitor-pmto && git add src/components/AppHeader.jsx && git commit -m "feat: simplified mobile header for executive view (no KPI strip)"
```

---

### Task 6: Update BottomNav with "Resumo" entry

**Files:**
- Modify: `src/components/BottomNav.jsx`

- [ ] **Step 1: Add LayoutDashboard import and Resumo tab**

In `src/components/BottomNav.jsx`, update the import (line 3) to add `LayoutDashboard`:

```js
import {
  BarChart3, Target, Users, Newspaper, MoreHorizontal,
  TrendingUp, MapPin, Map, Database, Shield, X, LayoutDashboard,
} from 'lucide-react';
```

Then add the executive entry to `MORE_TABS` (line 15), as the first element:

```js
const MORE_TABS = [
  { id: 'executive', label: 'Resumo Executivo', icon: LayoutDashboard },
  { id: 'tendencia', label: 'Tendência 2022', icon: TrendingUp },
  { id: 'geo',       label: 'Eleitoral',      icon: MapPin },
  { id: 'campo',     label: 'Mapa de Campo',  icon: Map },
];
```

- [ ] **Step 2: Verify build passes**

Run: `cd /c/dev/monitor-pmto && npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

- [ ] **Step 3: Commit**

```bash
cd /c/dev/monitor-pmto && git add src/components/BottomNav.jsx && git commit -m "feat: add Resumo Executivo to BottomNav drawer"
```

---

### Task 7: Remove VITE_ADMIN_EMAIL and clean up

**Files:**
- Modify: `.env.local`
- Modify: `.env.example`

- [ ] **Step 1: Remove VITE_ADMIN_EMAIL from .env.local**

Remove the line `VITE_ADMIN_EMAIL=marcelsalescampelo@gmail.com` from `.env.local`.

The file should become:

```
VITE_SUPABASE_URL=https://aatuwpfcjhhmvtbwxzjy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdHV3cGZjamhobXZ0Ynd4emp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1ODYyNDgsImV4cCI6MjA5MTE2MjI0OH0.lc48EJBCTsZyOrJk1pYhfKcY1HruXuFZUTz5HD_rlL4
VITE_CANDIDATE_USERNAME=marciobarbosa_cel
```

- [ ] **Step 2: Update .env.example**

Check if `.env.example` has `VITE_ADMIN_EMAIL`. If so, remove it. If not, no action needed.

- [ ] **Step 3: Verify build passes**

Run: `cd /c/dev/monitor-pmto && npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

- [ ] **Step 4: Commit**

```bash
cd /c/dev/monitor-pmto && git add .env.example && git commit -m "chore: remove VITE_ADMIN_EMAIL, role comes from Supabase"
```

(Don't commit `.env.local` — it should be in `.gitignore`.)

---

### Task 8: Supabase schema change (manual)

**Files:**
- Supabase dashboard (manual step)

- [ ] **Step 1: Add role column**

Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor):

```sql
ALTER TABLE allowed_users
  ADD COLUMN role text NOT NULL DEFAULT 'coordenacao';
```

- [ ] **Step 2: Set roles for existing users**

```sql
UPDATE allowed_users SET role = 'admin' WHERE email = 'marcelsalescampelo@gmail.com';
```

For the candidate's email (replace `<barbosa-email>` with actual email):

```sql
UPDATE allowed_users SET role = 'candidato' WHERE email = '<barbosa-email>';
```

- [ ] **Step 3: Verify the data**

```sql
SELECT email, role FROM allowed_users;
```

Expected: each row shows the correct role assignment.

---

### Task 9: End-to-end verification

- [ ] **Step 1: Run full build**

Run: `cd /c/dev/monitor-pmto && npx vite build 2>&1 | tail -10`
Expected: `✓ built in` + `PWA v1.2.0` + `precache` entries

- [ ] **Step 2: Run tests**

Run: `cd /c/dev/monitor-pmto && npx vitest run 2>&1 | tail -10`
Expected: All tests pass

- [ ] **Step 3: Start dev server and test in browser**

Run: `cd /c/dev/monitor-pmto && npx vite --host 2>&1 &`

Test manually:
1. Login as admin (Marcel) — should land on `kpis`, see all 9 panels + Resumo Executivo in sidebar
2. Navigate to Resumo Executivo — should show countdown, KPI cards, social pulse, mentions, sentiment
3. Click "Ver painel completo" — should switch to kpis panel with full sidebar
4. Test on mobile viewport (375px) — BottomNav visible, "Mais" drawer includes Resumo
5. Verify desktop header unchanged, mobile header hides KPI strip on executive view

- [ ] **Step 4: Test candidato role (after Supabase update)**

Login as the candidate's email — should land directly on executive view with no sidebar/BottomNav. "Ver painel completo" should reveal the full dashboard.

- [ ] **Step 5: Commit any fixes if needed and push**

```bash
cd /c/dev/monitor-pmto && git push origin main
```
