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
  RefreshCw,
  User,
  Building,
  Loader2
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
   CLUSTERS & HELPERS (CORES ATUALIZADAS PARA MODO CLARO)
   ───────────────────────────────────────────── */

const CLUSTERS = [
  { id: 'all', label: 'Todas', icon: Layers, color: '#475569', bg: '#f1f5f9' },
  { id: 'Comando', label: 'Comando', icon: User, color: '#4f46e5', bg: '#e0e7ff' },
  { id: 'Letalidade', label: 'Letalidade', icon: AlertTriangle, color: '#dc2626', bg: '#fee2e2' },
  { id: 'Operações', label: 'Operações', icon: Target, color: '#2563eb', bg: '#dbeafe' },
  { id: 'Gestão', label: 'Gestão', icon: Building, color: '#d97706', bg: '#fef3c7' },
  { id: 'Imprensa', label: 'Imprensa', icon: Radio, color: '#db2777', bg: '#fce7f3' },
  { id: 'Geral', label: 'Geral', icon: Newspaper, color: '#64748b', bg: '#f1f5f9' },
];

const getSentimentColor = (score) => {
  if (score <= 0.2) return { text: '#dc2626', bg: '#fee2e2', border: '#fca5a5' };
  if (score <= 0.4) return { text: '#d97706', bg: '#fef3c7', border: '#fcd34d' };
  if (score <= 0.6) return { text: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };
  return { text: '#16a34a', bg: '#dcfce3', border: '#86efac' };
};

const getImpactBadge = (impact) => {
  const map = {
    'Alto': { color: '#dc2626', bg: '#fee2e2' },
    'Médio': { color: '#d97706', bg: '#fef3c7' },
    'Baixo': { color: '#16a34a', bg: '#dcfce3' }
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
   COMPONENTES VISUAIS
   ───────────────────────────────────────────── */

const MetricCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div style={{
    background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    borderRadius: 16, padding: '16px 20px', flex: 1, minWidth: 130
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <Icon size={14} style={{ color: accent || '#64748b' }} />
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>{label}</span>
    </div>
    <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>{sub}</p>}
  </div>
);

const NewsCard = ({ item, expanded, onToggle }) => {
  const sentColor = getSentimentColor(item.score);
  const impactStyle = getImpactBadge(item.impact);
  const cluster = CLUSTERS.find(c => c.id === item.cluster);

  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      borderRadius: 16, overflow: 'hidden', borderLeft: `4px solid ${cluster?.color || '#cbd5e1'}`
    }}>
      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: item.mentionType === 'direta' ? '#fee2e2' : '#f1f5f9',
              color: item.mentionType === 'direta' ? '#dc2626' : '#64748b', textTransform: 'uppercase'
            }}>
              {item.mentionType === 'direta' ? '● Direta' : '○ Institucional'}
            </span>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>{item.source}</span>
            <span style={{ fontSize: 11, color: '#cbd5e1' }}>•</span>
            <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {formatDate(item.date)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: sentColor.bg, color: sentColor.text, border: `1px solid ${sentColor.border}`
            }}>{item.sentiment}</span>
            <span style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: impactStyle.bg, color: impactStyle.color
            }}>{item.impact}</span>
          </div>
        </div>

        <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 10px 0', lineHeight: 1.4 }}>{item.title}</h4>

        {item.keywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
            {item.keywords.map(kw => (
              <span key={kw} style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', display: 'flex', alignItems: 'center', gap: 2, background: '#f8fafc', padding: '2px 6px', borderRadius: 4, border: '1px solid #f1f5f9' }}>
                <Hash size={10} />{kw}
              </span>
            ))}
          </div>
        )}

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#1e3a8a', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
            <BrainCircuit size={14} />
            {expanded ? 'Ocultar Análise' : 'Ver Análise IA'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
            Abrir na fonte original <ArrowUpRight size={14} />
          </a>
        </div>

        {expanded && (
          <div style={{ marginTop: 14, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            <p style={{ fontSize: 11, color: '#1e3a8a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Nota de Inteligência</p>
            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, margin: 0 }}>{item.analysisNote}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   APP PRINCIPAL
   ───────────────────────────────────────────── */

const App = () => {
  const [rawData, setRawData] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState('all');
  const [expandedCards, setExpandedCards] = useState({});
  const [sortOrder, setSortOrder] = useState('date');
  const [filterType, setFilterType] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const GITHUB_JSON_URL = 'https://raw.githubusercontent.com/salescampelo/monitor-pmto/refs/heads/main/mention_history.json';

  const fetchAutonomously = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(GITHUB_JSON_URL + '?t=' + new Date().getTime());
      if (!response.ok) throw new Error('Falha ao buscar os dados do repositório.');
      const data = await response.json();
      setRawData(data);
      setLastUpdate(new Date().toLocaleString('pt-BR'));
    } catch (err) {
      console.error("Erro ao carregar os dados:", err);
      setError("Não foi possível carregar as informações mais recentes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutonomously();
  }, [fetchAutonomously]);

  const articles = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return [];
    return rawData.map(classifyArticle);
  }, [rawData]);

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

  if (isLoading || error || !articles.length) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7f9', color: '#334155', fontFamily: "'SF Pro Display', 'Segoe UI', -apple-system, sans-serif" }}>
        <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {isLoading ? (
            <>
              <Loader2 size={40} style={{ color: '#1e3a8a', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Sincronizando banco de dados...</h2>
              <p style={{ color: '#64748b', fontSize: 14, marginTop: 10 }}>Buscando as menções mais recentes no servidor.</p>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </>
          ) : (
            <>
               <AlertTriangle size={40} style={{ color: '#ef4444', margin: '0 auto 20px' }} />
               <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{error || "Nenhum dado encontrado."}</h2>
               <p style={{ color: '#64748b', fontSize: 14, marginTop: 10, marginBottom: 20 }}>Verifique se o GitHub Actions rodou corretamente.</p>
               <button onClick={fetchAutonomously} style={{ padding: '10px 20px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
                 Tentar Novamente
               </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f9', color: '#334155', fontFamily: "'SF Pro Display', 'Segoe UI', -apple-system, sans-serif", padding: '24px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* CABEÇALHO AZUL MARINHO */}
        <header style={{
          background: '#1e3a8a', // Azul Marinho
          borderRadius: 20, padding: '24px 28px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
          boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#ffffff', borderRadius: 14, padding: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <ShieldAlert size={26} style={{ color: '#1e3a8a' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', margin: 0 }}>Monitor de Menções — Cel. Márcio Barbosa</h1>
              <p style={{ fontSize: 11, color: '#bfdbfe', margin: '4px 0 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                PMTO • {lastUpdate ? `Última Sincronização: ${lastUpdate}` : 'Dados do servidor'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: '#bfdbfe', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px 0' }}>Toxicidade</p>
              <p style={{ fontSize: 26, fontWeight: 900, color: '#fca5a5', margin: 0 }}>{metrics.toxicity}%</p>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: '#bfdbfe', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px 0' }}>Menções</p>
              <p style={{ fontSize: 26, fontWeight: 900, color: '#fde047', margin: 0 }}>{metrics.total}</p>
            </div>
            <button onClick={fetchAutonomously} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <MetricCard icon={User} label="Diretas" value={metrics.diretas} sub="Cel. Barbosa" accent="#dc2626" />
          <MetricCard icon={Building} label="Institucionais" value={metrics.institucionais} sub="PMTO" accent="#d97706" />
          <MetricCard icon={AlertTriangle} label="Impacto alto" value={metrics.highImpact} accent="#dc2626" />
          <MetricCard icon={Newspaper} label="Fontes" value={metrics.sources} accent="#2563eb" />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ id: 'all', label: 'Todas as Menções' }, { id: 'direta', label: '● Diretas' }, { id: 'institucional', label: '○ Institucionais' }].map(t => (
            <button key={t.id} onClick={() => setFilterType(t.id)} style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: filterType === t.id ? '1px solid #1e3a8a' : '1px solid #cbd5e1',
              background: filterType === t.id ? '#eff6ff' : '#ffffff',
              color: filterType === t.id ? '#1e3a8a' : '#475569', cursor: 'pointer',
              boxShadow: filterType === t.id ? '0 2px 4px rgba(30,58,138,0.05)' : 'none'
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CLUSTERS.map(c => {
              const Icon = c.icon;
              const active = selectedCluster === c.id;
              const count = c.id === 'all' ? null : clusterCounts[c.id] || 0;
              if (c.id !== 'all' && !count) return null;
              return (
                <button key={c.id} onClick={() => setSelectedCluster(c.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: active ? `1px solid ${c.color}` : '1px solid #e2e8f0',
                  background: active ? c.bg : '#ffffff',
                  color: active ? c.color : '#64748b', cursor: 'pointer'
                }}>
                  <Icon size={14} /> {c.label} {count !== null && <span style={{ opacity: 0.6 }}>({count})</span>}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSortOrder('date')} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: sortOrder === 'date' ? '1px solid #2563eb' : '1px solid #cbd5e1',
              background: sortOrder === 'date' ? '#eff6ff' : '#ffffff',
              color: sortOrder === 'date' ? '#2563eb' : '#475569', cursor: 'pointer'
            }}><Calendar size={12} style={{ marginRight: 4, verticalAlign: -2 }} /> Ordernar por Data</button>
            <button onClick={() => setSortOrder('score')} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: sortOrder === 'score' ? '1px solid #dc2626' : '1px solid #cbd5e1',
              background: sortOrder === 'score' ? '#fef2f2' : '#ffffff',
              color: sortOrder === 'score' ? '#dc2626' : '#475569', cursor: 'pointer'
            }}><TrendingDown size={12} style={{ marginRight: 4, verticalAlign: -2 }} /> Mais Tóxicos</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
          {filteredNews.map(item => (
            <NewsCard key={item.id} item={item} expanded={!!expandedCards[item.id]} onToggle={() => setExpandedCards(prev => ({ ...prev, [item.id]: !prev[item.id] }))} />
          ))}
          {filteredNews.length === 0 && (
            <div style={{ padding: 60, textAlign: 'center', background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0' }}>
              <Eye size={32} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b', fontSize: 15, fontWeight: 500 }}>Nenhuma menção encontrada para este filtro.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
