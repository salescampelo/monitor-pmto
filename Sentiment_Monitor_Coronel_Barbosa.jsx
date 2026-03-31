import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  TrendingDown,
  AlertTriangle,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  Newspaper,
  Target,
  Radio,
  Clock,
  Hash,
  ArrowUpRight,
  BrainCircuit,
  Layers,
  Upload,
  RefreshCw,
  Database,
  User,
  Building
} from 'lucide-react';

/* ─────────────────────────────────────────────
   CLASSIFICAÇÃO AUTOMÁTICA
   Transforma os dados brutos do scraper
   (mention_history.json) em dados enriquecidos
   para o dashboard.
   ───────────────────────────────────────────── */

const CLUSTER_RULES = [
  { id: 'Comando', keywords: ['comandante', 'comando', 'barbosa', 'márcio', 'marcio', 'cel.', 'coronel', 'pré-candidat', 'deputado', 'eleição', 'eleitoral'] },
  { id: 'Letalidade', keywords: ['letalidade', 'intervenção', 'morte', 'morto', 'óbito', 'confronto', 'tiroteio', 'baleado', 'homicídio'] },
  { id: 'Operações', keywords: ['operação', 'apreensão', 'prisão', 'preso', 'mandado', 'flagrante', 'tráfico', 'droga', 'arma', 'fuzil'] },
  { id: 'Gestão', keywords: ['promoção', 'formação', 'curso', 'concurso', 'efetivo', 'déficit', 'irregularidade', 'denúncia', 'mpe', 'tce'] },
  { id: 'Imprensa', keywords: ['imprensa', 'blog', 'jornalista', 'gabinete do ódio', 'censura', 'nota', 'comunicação'] },
];

const classifyArticle = (article) => {
  const text = (article.title + ' ' + (article.snippet || '')).toLowerCase();

  let cluster = 'Geral';
  for (const rule of CLUSTER_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      cluster = rule.id;
      break;
    }
  }

  const negativeWords = ['morte', 'morto', 'denúncia', 'irregularidade', 'ilegal', 'ódio', 'censura', 'destruí', 'ferido', 'violência', 'abuso', 'crise'];
  const positiveWords = ['homenage', 'conquista', 'reconhec', 'entrega', 'inaugur', 'capacita', 'formatur', 'solidariedade', 'integração', 'mediação'];
  
  let negCount = negativeWords.filter(w => text.includes(w)).length;
  let posCount = positiveWords.filter(w => text.includes(w)).length;
  let score = 0.5 + (posCount * 0.15) - (negCount * 0.15);
  score = Math.max(0.05, Math.min(0.95, score));

  let sentiment = 'Neutro';
  if (score <= 0.2) sentiment = 'Muito Negativo';
  else if (score <= 0.4) sentiment = 'Negativo';
  else if (score >= 0.7) sentiment = 'Positivo';

  let impact = 'Médio';
  if (article.mention_type === 'direta') impact = 'Alto';
  else if (article.priority === 'alta' && negCount > 0) impact = 'Alto';
  else if (article.priority === 'complementar') impact = 'Baixo';

  return {
    id: article.hash_id || Math.random().toString(36).substr(2, 9),
    date: article.detected_at ? article.detected_at.split(' ')[0] : new Date().toISOString().split('T')[0],
    source: article.source_name || 'Desconhecido',
    sourceType: article.source_type || 'Portal',
    title: article.title,
    sentiment,
    score: Math.round(score * 100) / 100,
    cluster,
    impact,
    keywords: article.matched_terms || [],
    url: article.url,
    mentionType: article.mention_type || 'institucional',
    analysisNote: `Menção ${article.mention_type || 'institucional'} detectada via ${article.source_name}. Termos: ${(article.matched_terms || []).join(', ')}.`,
  };
};

/* ─────────────────────────────────────────────
   CLUSTERS
   ───────────────────────────────────────────── */

const CLUSTERS = [
  { id: 'all', label: 'Todas', icon: Layers, color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  { id: 'Comando', label: 'Comando', icon: User, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  { id: 'Letalidade', label: 'Letalidade', icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  { id: 'Operações', label: 'Operações', icon: Target, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { id: 'Gestão', label: 'Gestão', icon: Building, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { id: 'Imprensa', label: 'Imprensa', icon: Radio, color: '#ec4899', bg: 'rgba(236,72,153,0.08)' },
  { id: 'Geral', label: 'Geral', icon: Newspaper, color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
];

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

const getSentimentColor = (score) => {
  if (score <= 0.2) return { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' };
  if (score <= 0.4) return { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' };
  if (score <= 0.6) return { text: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)' };
  return { text: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' };
};

const getImpactBadge = (impact) => {
  const map = {
    'Alto': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    'Médio': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    'Baixo': { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }
  };
  return map[impact] || map['Médio'];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const computeMetrics = (data) => {
  if (!data.length) return { toxicity: '0.0', highImpact: 0, sources: 0, total: 0, diretas: 0, institucionais: 0 };
  const avgScore = data.reduce((s, n) => s + n.score, 0) / data.length;
  const toxicity = ((1 - avgScore) * 100).toFixed(1);
  const highImpact = data.filter(n => n.impact === 'Alto').length;
  const sources = [...new Set(data.map(n => n.source))].length;
  const diretas = data.filter(n => n.mentionType === 'direta').length;
  const institucionais = data.filter(n => n.mentionType === 'institucional').length;
  return { toxicity, highImpact, sources, total: data.length, diretas, institucionais };
};

/* ─────────────────────────────────────────────
   COMPONENTES
   ───────────────────────────────────────────── */

const MetricCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div style={{
    background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)',
    borderRadius: 16, padding: '16px 20px', flex: 1, minWidth: 130
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <Icon size={13} style={{ color: accent || '#64748b' }} />
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>{label}</span>
    </div>
    <p style={{ fontSize: 26, fontWeight: 800, color: accent || '#e2e8f0', margin: 0, lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: 11, color: '#475569', marginTop: 5 }}>{sub}</p>}
  </div>
);

const NewsCard = ({ item, expanded, onToggle }) => {
  const sentColor = getSentimentColor(item.score);
  const impactStyle = getImpactBadge(item.impact);
  const cluster = CLUSTERS.find(c => c.id === item.cluster);

  return (
    <div style={{
      background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.4)',
      borderRadius: 16, overflow: 'hidden', borderLeft: `3px solid ${cluster?.color || '#64748b'}`
    }}>
      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: item.mentionType === 'direta' ? 'rgba(239,68,68,0.15)' : 'rgba(30,41,59,0.8)',
              color: item.mentionType === 'direta' ? '#ef4444' : '#94a3b8', textTransform: 'uppercase'
            }}>
              {item.mentionType === 'direta' ? '● Direta' : '○ Institucional'}
            </span>
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>{item.source}</span>
            <span style={{ fontSize: 11, color: '#334155' }}>•</span>
            <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {formatDate(item.date)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: sentColor.bg, color: sentColor.text, border: `1px solid ${sentColor.border}`
            }}>{item.sentiment}</span>
            <span style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: impactStyle.bg, color: impactStyle.color
            }}>{item.impact}</span>
          </div>
        </div>

        <h4 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px 0', lineHeight: 1.4 }}>{item.title}</h4>

        {item.keywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
            {item.keywords.map(kw => (
              <span key={kw} style={{ fontSize: 10, fontFamily: 'monospace', color: '#475569', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Hash size={9} />{kw}
              </span>
            ))}
          </div>
        )}

        <div style={{ borderTop: '1px solid rgba(51,65,85,0.3)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#8b5cf6', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
            <BrainCircuit size={13} />
            {expanded ? 'Ocultar' : 'Análise'}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: 11, textDecoration: 'none', fontWeight: 600 }}>
            Abrir fonte <ArrowUpRight size={12} />
          </a>
        </div>

        {expanded && (
          <div style={{ marginTop: 12, padding: 14, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10 }}>
            <p style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Nota de inteligência</p>
            <p style={{ fontSize: 12, color: '#c4b5fd', lineHeight: 1.6, margin: 0 }}>{item.analysisNote}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const UploadScreen = ({ onLoad, isDragging }) => (
  <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <div style={{
      textAlign: 'center', maxWidth: 480, padding: 48,
      background: isDragging ? 'rgba(139,92,246,0.08)' : 'rgba(15,23,42,0.5)',
      border: isDragging ? '2px dashed #8b5cf6' : '2px dashed rgba(51,65,85,0.4)',
      borderRadius: 24, transition: 'all 0.3s ease'
    }}>
      <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 16, padding: 16, display: 'inline-flex', marginBottom: 24 }}>
        <Upload size={32} style={{ color: '#8b5cf6' }} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: '0 0 12px 0' }}>Carregar dados do monitor</h2>
      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: '0 0 28px 0' }}>
        Arraste o arquivo <strong style={{ color: '#a78bfa' }}>mention_history.json</strong> da pasta <strong style={{ color: '#94a3b8' }}>data/</strong> para cá, ou clique abaixo.
      </p>
      <label style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '12px 28px', background: '#8b5cf6', color: '#fff',
        borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none'
      }}>
        <Database size={16} /> Selecionar arquivo
        <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => { try { onLoad(JSON.parse(ev.target.result)); } catch { alert('JSON inválido.'); } };
          reader.readAsText(file);
        }} />
      </label>
      <p style={{ fontSize: 11, color: '#334155', marginTop: 20 }}>monitor_pmto / data / mention_history.json</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   APP PRINCIPAL
   ───────────────────────────────────────────── */

const STORAGE_KEY = 'pmto-monitor-data';

const App = () => {
  const [rawData, setRawData] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState('all');
  const [expandedCards, setExpandedCards] = useState({});
  const [sortOrder, setSortOrder] = useState('date');
  const [filterType, setFilterType] = useState('all');
  const [isDragging, setIsDragging] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result && result.value) {
          const p = JSON.parse(result.value);
          setRawData(p.data);
          setLastUpdate(p.updatedAt);
        }
      } catch {}
    };
    load();
  }, []);

  const articles = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return [];
    return rawData.map(classifyArticle);
  }, [rawData]);

  const handleLoad = useCallback(async (data) => {
    setRawData(data);
    const now = new Date().toLocaleString('pt-BR');
    setLastUpdate(now);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify({ data, updatedAt: now })); } catch {}
  }, []);

  useEffect(() => {
    const over = (e) => { e.preventDefault(); setIsDragging(true); };
    const leave = () => setIsDragging(false);
    const drop = (e) => {
      e.preventDefault(); setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file || !file.name.endsWith('.json')) return;
      const reader = new FileReader();
      reader.onload = (ev) => { try { handleLoad(JSON.parse(ev.target.result)); } catch { alert('JSON inválido.'); } };
      reader.readAsText(file);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => { window.removeEventListener('dragover', over); window.removeEventListener('dragleave', leave); window.removeEventListener('drop', drop); };
  }, [handleLoad]);

  const filteredNews = useMemo(() => {
    let f = articles;
    if (filterType !== 'all') f = f.filter(n => n.mentionType === filterType);
    if (selectedCluster !== 'all') f = f.filter(n => n.cluster === selectedCluster);
    if (sortOrder === 'score') f = [...f].sort((a, b) => a.score - b.score);
    else f = [...f].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return f;
  }, [articles, selectedCluster, sortOrder, filterType]);

  const metrics = useMemo(() => computeMetrics(articles), [articles]);
  const clusterCounts = useMemo(() => {
    const c = {};
    articles.forEach(n => { c[n.cluster] = (c[n.cluster] || 0) + 1; });
    return c;
  }, [articles]);

  if (!articles.length) {
    return (
      <div style={{ minHeight: '100vh', background: '#060810', color: '#cbd5e1', fontFamily: "'SF Pro Display', 'Segoe UI', -apple-system, sans-serif" }}>
        <UploadScreen onLoad={handleLoad} isDragging={isDragging} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060810', color: '#cbd5e1', fontFamily: "'SF Pro Display', 'Segoe UI', -apple-system, sans-serif", padding: '24px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <header style={{
          background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.4)',
          borderRadius: 20, padding: '24px 28px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: 12 }}>
              <ShieldAlert size={26} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Monitor de Menções — Cel. Márcio Barbosa</h1>
              <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                PMTO • {lastUpdate ? `Atualizado: ${lastUpdate}` : 'Dados do scraper'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px 0' }}>Toxicidade</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#ef4444', margin: 0 }}>{metrics.toxicity}%</p>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(51,65,85,0.4)' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px 0' }}>Menções</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', margin: 0 }}>{metrics.total}</p>
            </div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
              color: '#a78bfa', fontSize: 11, fontWeight: 700, cursor: 'pointer'
            }}>
              <RefreshCw size={13} /> Atualizar
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => { try { handleLoad(JSON.parse(ev.target.result)); } catch { alert('JSON inválido.'); } };
                reader.readAsText(file);
              }} />
            </label>
          </div>
        </header>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <MetricCard icon={User} label="Diretas" value={metrics.diretas} sub="Cel. Barbosa" accent="#ef4444" />
          <MetricCard icon={Building} label="Institucionais" value={metrics.institucionais} sub="PMTO" accent="#f59e0b" />
          <MetricCard icon={AlertTriangle} label="Impacto alto" value={metrics.highImpact} accent="#ef4444" />
          <MetricCard icon={Newspaper} label="Fontes" value={metrics.sources} accent="#3b82f6" />
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[{ id: 'all', label: 'Todas' }, { id: 'direta', label: '● Diretas' }, { id: 'institucional', label: '○ Institucionais' }].map(t => (
            <button key={t.id} onClick={() => setFilterType(t.id)} style={{
              padding: '7px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700,
              border: filterType === t.id ? '1px solid #8b5cf6' : '1px solid rgba(51,65,85,0.4)',
              background: filterType === t.id ? 'rgba(139,92,246,0.1)' : 'rgba(15,23,42,0.4)',
              color: filterType === t.id ? '#8b5cf6' : '#64748b', cursor: 'pointer'
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CLUSTERS.map(c => {
              const Icon = c.icon;
              const active = selectedCluster === c.id;
              const count = c.id === 'all' ? null : clusterCounts[c.id] || 0;
              if (c.id !== 'all' && !count) return null;
              return (
                <button key={c.id} onClick={() => setSelectedCluster(c.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  border: active ? `1px solid ${c.color}` : '1px solid rgba(51,65,85,0.4)',
                  background: active ? c.bg : 'rgba(15,23,42,0.4)',
                  color: active ? c.color : '#64748b', cursor: 'pointer'
                }}>
                  <Icon size={12} /> {c.label} {count !== null && <span style={{ opacity: 0.6 }}>({count})</span>}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setSortOrder('date')} style={{
              padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700,
              border: sortOrder === 'date' ? '1px solid #3b82f6' : '1px solid rgba(51,65,85,0.4)',
              background: sortOrder === 'date' ? 'rgba(59,130,246,0.1)' : 'rgba(15,23,42,0.4)',
              color: sortOrder === 'date' ? '#3b82f6' : '#64748b', cursor: 'pointer'
            }}><Calendar size={11} style={{ marginRight: 3, verticalAlign: -1 }} /> Data</button>
            <button onClick={() => setSortOrder('score')} style={{
              padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700,
              border: sortOrder === 'score' ? '1px solid #ef4444' : '1px solid rgba(51,65,85,0.4)',
              background: sortOrder === 'score' ? 'rgba(239,68,68,0.1)' : 'rgba(15,23,42,0.4)',
              color: sortOrder === 'score' ? '#ef4444' : '#64748b', cursor: 'pointer'
            }}><TrendingDown size={11} style={{ marginRight: 3, verticalAlign: -1 }} /> Toxicidade</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {filteredNews.map(item => (
            <NewsCard key={item.id} item={item} expanded={!!expandedCards[item.id]} onToggle={() => setExpandedCards(prev => ({ ...prev, [item.id]: !prev[item.id] }))} />
          ))}
          {filteredNews.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: 16, border: '1px solid rgba(51,65,85,0.3)' }}>
              <Eye size={24} style={{ color: '#334155', marginBottom: 8 }} />
              <p style={{ color: '#475569', fontSize: 13 }}>Nenhuma menção para este filtro.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
