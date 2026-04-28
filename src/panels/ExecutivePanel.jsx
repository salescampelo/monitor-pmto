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
