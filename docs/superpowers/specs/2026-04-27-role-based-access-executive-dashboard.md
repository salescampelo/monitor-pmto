# Fase 2 — Role-Based Access & Executive Dashboard

## Overview

Add a role system to the Monitor Coronel Barbosa dashboard so the candidate (Cel. Barbosa) sees a simplified executive summary by default, while campaign staff (`coordenacao`) and the admin keep the full multi-panel dashboard. Roles are stored in the existing `allowed_users` Supabase table — no new tables or API endpoints.

## Roles

| Role | Who | Panel access | Default landing |
|------|-----|-------------|-----------------|
| `admin` | Marcel (marcelsalescampelo@gmail.com) | All 9 panels + Executive | `kpis` |
| `coordenacao` | Campaign staff (5-15 people) | 7 panels + Executive (no Qualidade/Auditoria) | `kpis` |
| `candidato` | Cel. Barbosa | Executive Dashboard (can toggle to full view) | `executive` |

## 1. Role System

### 1.1 Supabase Schema Change

Add column to `allowed_users`:

```sql
ALTER TABLE allowed_users
  ADD COLUMN role text NOT NULL DEFAULT 'coordenacao';

-- Set existing rows
UPDATE allowed_users SET role = 'admin' WHERE email = 'marcelsalescampelo@gmail.com';
-- Set candidate row (replace with actual email)
UPDATE allowed_users SET role = 'candidato' WHERE email = '<barbosa-email>';
```

Valid values: `admin`, `coordenacao`, `candidato`. No enum constraint — validated client-side with a fallback to `coordenacao` for unknown values.

### 1.2 Auth Flow Change

**Current** (Root component, `App.jsx:522`):
```js
supabase.from('allowed_users').select('email').eq('email', session.user.email)
```

**New:**
```js
supabase.from('allowed_users').select('email, role').eq('email', session.user.email)
```

- Extract `role` from `data[0].role`, fallback to `'coordenacao'` if missing
- Pass `role` as prop to `<App>` component: `<App onLogout={handleLogout} userEmail={session.user.email} role={role} />`
- Inside `App`, derive `isAdmin` as `role === 'admin'` (replaces `VITE_ADMIN_EMAIL` env var check)
- Remove `VITE_ADMIN_EMAIL` from `.env.local`

### 1.3 Access Rules

Derive panel visibility from role:

```js
const isAdmin = role === 'admin';
const isCandidato = role === 'candidato';
```

- `isAdmin` gates Qualidade and Auditoria panels (unchanged behavior, new source)
- `isCandidato` controls default landing panel and header simplification

## 2. Executive Dashboard

### 2.1 New Component: `src/panels/ExecutivePanel.jsx`

A single-screen, mobile-first summary designed for a 30-second glance. No tabs, no sub-navigation.

### 2.2 Content Blocks (top to bottom)

1. **Election Countdown**
   - Days remaining until `kpiData.election_date` (Oct 4, 2026)
   - Current phase name from `kpiData.phases[kpiData.current_phase].name`
   - Visual: large number + phase badge

2. **KPI Progress Cards**
   - 3-4 key metrics from `kpiData.kpis[]`: seguidores, engajamento, menções, sentimento positivo
   - Each card: current value, phase target, progress bar (percentage fill)
   - Color: gold fill on navy track

3. **Social Pulse**
   - Candidate's follower count and engagement rate from `socialData` (filtered by `is_candidate: true`)
   - Week-over-week delta (compare latest two snapshots)
   - Visual: metric + delta arrow (green up / red down)

4. **Latest Mentions**
   - Last 5 articles from `articles` array (sorted by date descending)
   - Each: title (truncated), source name, date, sentiment badge (positivo/neutro/negativo)
   - Tap opens source URL

5. **Quick Sentiment**
   - Simple horizontal bar showing % positive / neutral / negative from `sentimentData.sentiment`
   - Color: green / gray / red segments

### 2.3 Data Sources

| Block | Data source | Fetched at boot? |
|-------|------------|-----------------|
| Election countdown | `kpiData` | Yes |
| KPI progress | `kpiData` | Yes |
| Social pulse | `socialData` | Yes |
| Latest mentions | `articles` (mention_history.json) | No — lazy loaded |
| Quick sentiment | `sentimentData` | Yes |

`mention_history.json` must be fetched when `activePanel === 'executive'` (in addition to existing `imprensa` trigger).

### 2.4 Visual Design

- Follows existing design language: DM Sans, navy `#1A3A7A`, gold `#D4A017`, warm gray background `#F8F7F4`
- Cards: `background: #fff`, `borderRadius: 16px`, `boxShadow: '0 1px 3px rgba(0,0,0,0.06)'`
- Mobile-first single column, 16px padding
- Touch targets: 44px minimum height on interactive elements
- Stagger animation on card entry (50ms delay between cards, 300ms ease-out fade+translateY)

## 3. Routing & Navigation

### 3.1 Panel Routing

- New panel ID: `executive`
- Default panel logic:
  ```js
  const defaultPanel = isCandidato ? 'executive' : 'kpis';
  ```
- URL: `?panel=executive`

### 3.2 Candidato Toggle

- Executive view shows "Ver painel completo" link at the bottom
- Clicking it sets `activePanel = 'kpis'` and shows full dashboard with sidebar/BottomNav
- Full view shows "Voltar ao resumo" button (replaces the executive sidebar entry) to return to executive

### 3.3 Sidebar (Desktop/Tablet)

- Add "Resumo Executivo" entry at position 0 (top) for all roles, icon: `LayoutDashboard`
- For `candidato` in executive view: sidebar hidden (same as mobile pattern)
- For `candidato` in full view: sidebar visible with all allowed panels

### 3.4 BottomNav (Mobile)

- For `candidato` in executive view: BottomNav hidden (single-screen, no navigation needed)
- For `candidato` in full view: BottomNav shown as normal
- For `admin`/`coordenacao`: "Resumo" added to the "Mais" drawer

### 3.5 Header

- For `candidato` in executive view: simplified header — "Monitor CB" title + refresh button + avatar/logout. No KPI strip (KPIs are in the executive content).
- For full dashboard view (all roles): header unchanged

## 4. Files Changed

| File | Action | Changes |
|------|--------|---------|
| `src/App.jsx` | Modify | Auth query adds `role`, pass `role` prop, derive `isAdmin`/`isCandidato`, default panel logic, mentions fetch trigger, header conditional |
| `src/panels/ExecutivePanel.jsx` | Create | Executive dashboard component |
| `src/components/BottomNav.jsx` | Modify | Add "Resumo" to drawer, hide for candidato in executive view |
| `src/components/AppHeader.jsx` | Modify | Simplified mode for candidato in executive view |
| `.env.local` | Modify | Remove `VITE_ADMIN_EMAIL` |
| Supabase (manual) | Modify | Add `role` column to `allowed_users`, set values |

## 5. Out of Scope

- Row-level data filtering by role (all authenticated users see the same data)
- Fase 3 (Push Notifications) and Fase 4 (Polish & Security)
- React 19 migration
- New API endpoints or JSON files
