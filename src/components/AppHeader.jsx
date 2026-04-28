import React from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, ShieldAlert, LogOut } from 'lucide-react';

const getKpiColor = (type, value) => {
  switch (type) {
    case 'dias':
      if (value > 120) return '#22c55e';
      if (value > 60)  return '#eab308';
      return '#ef4444';
    case 'seguidores':
      return '#FFFFFF';
    case 'engajamento':
      if (value >= 3)   return '#22c55e';
      if (value >= 1.5) return '#eab308';
      return '#ef4444';
    case 'mencoes':
      if (value >= 5) return '#22c55e';
      if (value >= 1) return '#eab308';
      return 'rgba(255,255,255,0.5)';
    case 'sentimento':
      if (value >= 30) return '#22c55e';
      if (value >= 15) return '#4ade80';
      if (value > 0)   return '#86efac';
      return 'rgba(255,255,255,0.5)';
    default:
      return '#FFFFFF';
  }
};

const getTrendIcon = (current, previous) => {
  if (!previous || previous === 0) return { icon: '→', color: 'rgba(255,255,255,0.35)', label: 'sem dados anteriores' };
  const pctChange = ((current - previous) / previous) * 100;
  if (Math.abs(pctChange) < 1) return { icon: '→', color: 'rgba(255,255,255,0.5)', label: 'estável' };
  if (pctChange > 0) return { icon: '↑', color: '#22c55e', label: 'subindo' };
  return { icon: '↓', color: '#ef4444', label: 'caindo' };
};

const KpiChip = ({ value, label, color, trend, compact }) => (
  <div style={{
    background: 'rgba(255,255,255,0.08)', borderRadius: 10,
    padding: compact ? '8px 12px' : '14px 18px',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.1)',
    ...(compact ? { minWidth: 100, flexShrink: 0 } : { minWidth: 80, flex: '1 1 80px', maxWidth: 130 }),
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <span style={{
        fontSize: compact ? 18 : 28, fontWeight: 700, color,
        lineHeight: 1.1, fontVariantNumeric: 'tabular-nums',
        fontFamily: "'DM Sans',monospace",
      }}>
        {value}
      </span>
      {trend && (
        <span style={{ fontSize: 14, fontWeight: 700, color: trend.color, lineHeight: 1 }}
          title={`Tendência: ${trend.label}`} aria-label={`Tendência ${trend.label}`}>
          {trend.icon}
        </span>
      )}
    </div>
    <div style={{
      fontSize: compact ? 8 : 10, fontWeight: 600,
      color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase',
      letterSpacing: '0.5px', marginTop: 3, lineHeight: 1.2,
    }}>
      {label}
    </div>
  </div>
);

export default function AppHeader({
  isMobile, isExecutiveView = false, refreshing = false, handleRefresh, nav, setNav, userEmail = null, onLogout = null, setPw, lastUpdate = null,
  daysToElection = null, followers = '—', followersRaw = 0, followersPrevWeek = null,
  engagementRate = 0, engagementPrevWeek = null,
  mentions48h = 0, positiveCommentsPct = 0,
  autoRefreshEnabled = false, setAutoRefresh = () => {},
}) {
  const kpis = [
    { value: daysToElection ?? '—', label: 'DIAS P/ ELEIÇÃO', color: getKpiColor('dias', daysToElection ?? 0), trend: null },
    { value: followers ?? '—', label: 'SEGUIDORES IG', color: '#FFFFFF', trend: getTrendIcon(followersRaw, followersPrevWeek) },
    { value: `${(engagementRate ?? 0).toFixed(1)}%`, label: 'ENGAJAMENTO IG', color: getKpiColor('engajamento', engagementRate ?? 0), trend: getTrendIcon(engagementRate, engagementPrevWeek) },
    { value: mentions48h ?? 0, label: 'IMPRENSA 48H', color: getKpiColor('mencoes', mentions48h ?? 0), trend: null },
    { value: `${positiveCommentsPct ?? 0}%`, label: 'POSITIVO IG', color: getKpiColor('sentimento', positiveCommentsPct ?? 0), trend: null },
  ];

  if (isMobile) {
    return (
      <>
        {/* Compact top bar */}
        <header style={{
          background: 'linear-gradient(135deg, #1A3A7A 0%, #0D1F42 100%)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 200,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={20} style={{ color: '#D4A017' }} aria-hidden="true" />
            <span style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}>
              Monitor CB
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              aria-label={refreshing ? 'Atualizando dados…' : 'Atualizar dados'}
              onClick={handleRefresh} disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', padding: 8, borderRadius: 8,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)', cursor: refreshing ? 'wait' : 'pointer',
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            {onLogout && (
              <div style={{ position: 'relative' }}>
                <button
                  aria-label="Menu do usuário" aria-haspopup="menu" aria-expanded={nav.avatarOpen}
                  onClick={() => setNav(n => ({ ...n, avatarOpen: !n.avatarOpen }))}
                  title={userEmail}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#D4A017', fontSize: 11, fontWeight: 800, outline: 'none',
                  }}
                >
                  CB
                </button>
                {nav.avatarOpen && <>
                  <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 299 }}
                    onClick={() => setNav(n => ({ ...n, avatarOpen: false }))} />
                  <div role="menu" aria-label="Opções do usuário" style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 300,
                    background: '#FFFFFF', border: '1px solid rgba(26,39,68,0.08)',
                    borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: 160, overflow: 'hidden',
                  }}>
                    <button role="menuitem"
                      onClick={() => { setNav(n => ({ ...n, avatarOpen: false })); setPw(p => ({ ...p, show: true })); }}
                      style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: 13, color: '#1A2744', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                      Alterar senha
                    </button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', fontSize: 13, color: '#1A2744', cursor: 'pointer', boxSizing: 'border-box' }}>
                      <input type="checkbox" checked={!!autoRefreshEnabled} onChange={e => setAutoRefresh(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#1A3A7A' }} />
                      Auto-refresh (30min)
                    </label>
                    <button role="menuitem"
                      onClick={() => { setNav(n => ({ ...n, avatarOpen: false })); onLogout(); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', fontSize: 13, color: '#B91C1C', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                      <LogOut size={13} /> Sair
                    </button>
                  </div>
                </>}
              </div>
            )}
          </div>
        </header>

        {/* KPI strip — horizontal scroll */}
        {!isExecutiveView && <div style={{
          background: 'linear-gradient(135deg, #0D1F42 0%, #0A1832 100%)',
          padding: '10px 16px',
          overflowX: 'auto', overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          display: 'flex', gap: 8,
          scrollbarWidth: 'none',
        }}>
          <style>{`.kpi-strip::-webkit-scrollbar{display:none}`}</style>
          {kpis.map((kpi, i) => <KpiChip key={i} {...kpi} compact />)}
        </div>}
      </>
    );
  }

  // Desktop/tablet header (unchanged)
  return (
    <header style={{ background: 'linear-gradient(135deg, #1A3A7A 0%, #0D1F42 100%)', padding: '32px 40px 28px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          aria-label={refreshing ? 'Atualizando dados…' : 'Atualizar dados'}
          title="Atualizar dados"
          onClick={handleRefresh} disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.6 : 1, transition: 'all 0.18s', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          <RefreshCw size={11} aria-hidden="true" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? '...' : 'Atualizar'}
        </button>
        {onLogout && <div style={{ position: 'relative' }}>
          <button
            aria-label="Menu do usuário" aria-haspopup="menu" aria-expanded={nav.avatarOpen}
            onClick={() => setNav(n => ({ ...n, avatarOpen: !n.avatarOpen }))}
            title={userEmail}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#D4A017', fontSize: 11, fontWeight: 800, outline: 'none' }}>
            CB
          </button>
          {nav.avatarOpen && <>
            <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setNav(n => ({ ...n, avatarOpen: false }))} />
            <div role="menu" aria-label="Opções do usuário" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 300, background: '#FFFFFF', border: '1px solid rgba(26,39,68,0.08)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 160, overflow: 'hidden' }}>
              <button role="menuitem" onClick={() => { setNav(n => ({ ...n, avatarOpen: false })); setPw(p => ({ ...p, show: true })); }}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3EE'} onMouseLeave={e => e.currentTarget.style.background = 'none'}
                style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: 13, color: '#1A2744', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                Alterar senha
              </button>
              <label
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3EE'} onMouseLeave={e => e.currentTarget.style.background = 'none'}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', fontSize: 13, color: '#1A2744', cursor: 'pointer', boxSizing: 'border-box' }}>
                <input type="checkbox" checked={!!autoRefreshEnabled} onChange={e => setAutoRefresh(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#1A3A7A' }} />
                Auto-refresh (30min)
              </label>
              <button role="menuitem" onClick={() => { setNav(n => ({ ...n, avatarOpen: false })); onLogout(); }}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3EE'} onMouseLeave={e => e.currentTarget.style.background = 'none'}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', fontSize: 13, color: '#B91C1C', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <LogOut size={13} aria-hidden="true" /> Sair
              </button>
            </div>
          </>}
        </div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            CENTRAL DE INTELIGÊNCIA · CAMPANHA 2026
          </p>
          <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, lineHeight: 1.05, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
            <span style={{ color: '#FFFFFF', display: 'block' }}>INTELIGÊNCIA</span>
            <span style={{ color: '#FFFFFF', display: 'block' }}>ELEITORAL</span>
            <span style={{ color: '#D4A017', display: 'block' }}>TOCANTINS.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 400, margin: '14px 0 0' }}>
            32 fontes monitoradas · TO + Brasil · {lastUpdate || new Date().toLocaleDateString('pt-BR') + ' (auto)'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end', flex: '1 1 500px', maxWidth: 700 }}>
          {kpis.map((kpi, i) => <KpiChip key={i} {...kpi} />)}
        </div>
      </div>
    </header>
  );
}

AppHeader.propTypes = {
  isMobile:            PropTypes.bool.isRequired,
  isExecutiveView:     PropTypes.bool,
  refreshing:          PropTypes.bool,
  handleRefresh:       PropTypes.func.isRequired,
  nav:                 PropTypes.shape({
    sidebarOpen: PropTypes.bool,
    avatarOpen:  PropTypes.bool,
  }).isRequired,
  setNav:              PropTypes.func.isRequired,
  userEmail:           PropTypes.string,
  onLogout:            PropTypes.func,
  setPw:               PropTypes.func.isRequired,
  lastUpdate:          PropTypes.string,
  daysToElection:      PropTypes.number,
  followers:           PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  followersRaw:        PropTypes.number,
  followersPrevWeek:   PropTypes.number,
  engagementRate:      PropTypes.number,
  engagementPrevWeek:  PropTypes.number,
  mentions48h:         PropTypes.number,
  positiveCommentsPct: PropTypes.number,
  autoRefreshEnabled:  PropTypes.bool,
  setAutoRefresh:      PropTypes.func,
};
