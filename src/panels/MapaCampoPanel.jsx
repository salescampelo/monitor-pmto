import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWW, PanelSkeleton } from '../components/ui.jsx';
import HelpTooltip from '../components/HelpTooltip.jsx';

// Fix para ícones padrão do Leaflet com bundlers (Vite/Webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Constantes ── */
const CENTER_TO = [-10.25, -48.25];
const ZOOM_INITIAL = 7;

const STATUS_CONFIG = {
  visitado:      { cor: '#15803D', raio: 8,  opacidade: 0.9, label: 'Visitado' },
  agendado:      { cor: '#D4A017', raio: 8,  opacidade: 0.9, label: 'Agendado' },
  com_lideranca: { cor: '#1A3A7A', raio: 7,  opacidade: 0.8, label: 'Com liderança' },
  prioritario:   { cor: '#ef4444', raio: 6,  opacidade: 0.7, label: 'Prioritário' },
  pendente:      { cor: '#8C93A8', raio: 5,  opacidade: 0.5, label: 'Pendente' },
};

const IDEOLOGIA_CORES = {
  Conservador:  '#1A3A7A',
  Dividido:     '#D4A017',
  Progressista: '#B91C1C',
};

const PRIORIDADE_LABEL = { alta: 'ALTA', media: 'MÉDIA', baixa: 'BAIXA' };
const PRIORIDADE_COR   = { alta: '#ef4444', media: '#f59e0b', baixa: '#22c55e' };

/* ── Legenda do mapa ── */
function Legenda() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control({ position: 'bottomright' });
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
    ctrl.addTo(map);
    return () => ctrl.remove();
  }, [map]);
  return null;
}

/* ── Popup de município ── */
function PopupConteudo({ m }) {
  const cfg = STATUS_CONFIG[m.status_visita] || STATUS_CONFIG.pendente;
  const lids = (m.liderancas || []).filter(l => l.nome);
  return (
    <div style={{ maxWidth: 300, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#1A2744', lineHeight: 1.5 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 15, fontWeight: 800 }}>{m.nome}</strong>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${cfg.cor}18`, color: cfg.cor, border: `1px solid ${cfg.cor}40` }}>
          {cfg.label.toUpperCase()}
        </span>
      </div>
      {m.classificacao_ideologica && (
        <div style={{ marginBottom: 6, fontSize: 11, color: IDEOLOGIA_CORES[m.classificacao_ideologica] || '#8C93A8', fontWeight: 700 }}>
          {m.classificacao_ideologica} · Eleitorado: {(m.eleitorado || 0).toLocaleString('pt-BR')}
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(26,39,68,0.08)', paddingTop: 8, marginBottom: 8 }}>
        {m.pct_bolsonaro_2022 > 0 && (
          <div style={{ fontSize: 12, color: '#5A6478', marginBottom: 3 }}>
            Bolsonaro {m.pct_bolsonaro_2022}% × Lula {m.pct_lula_2022}%
          </div>
        )}
        {m.share_republicanos > 0 && (
          <div style={{ fontSize: 12, color: '#1A3A7A', fontWeight: 600, marginBottom: 3 }}>
            Share Republicanos: {m.share_republicanos}%
          </div>
        )}
        {m.gap_conversao && (
          <div style={{ fontSize: 11, color: '#15803D', fontWeight: 700 }}>⚠ GAP de conversão identificado</div>
        )}
      </div>

      {m.deputados_mais_votados_2022?.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(26,39,68,0.08)', paddingTop: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8C93A8', marginBottom: 4 }}>Dep. Federal mais votados 2022</div>
          {m.deputados_mais_votados_2022.slice(0, 3).map((d, i) => (
            <div key={i} style={{ fontSize: 11, color: '#5A6478', marginBottom: 2 }}>
              {i + 1}. {d.nome} ({d.partido}) — {(d.votos || 0).toLocaleString('pt-BR')}
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(26,39,68,0.08)', paddingTop: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8C93A8', marginBottom: 4 }}>Lideranças</div>
        {lids.length > 0 ? lids.map((l, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <strong style={{ fontSize: 12 }}>{l.nome}</strong>
            {l.telefone && <span style={{ fontSize: 11, color: '#8C93A8' }}> · {l.telefone}</span>}
            {l.cargo_local && <div style={{ fontSize: 11, color: '#5A6478' }}>{l.cargo_local}</div>}
            {l.observacao && <div style={{ fontSize: 11, color: '#8C93A8', fontStyle: 'italic' }}>{l.observacao}</div>}
          </div>
        )) : (
          <div style={{ fontSize: 12, color: '#8C93A8', fontStyle: 'italic' }}>Nenhuma liderança cadastrada</div>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(26,39,68,0.08)', paddingTop: 8 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div>
            <span style={{ fontSize: 10, color: '#8C93A8' }}>Prioridade</span>
            <div style={{ fontSize: 12, fontWeight: 700, color: PRIORIDADE_COR[m.prioridade] }}>{PRIORIDADE_LABEL[m.prioridade] || m.prioridade}</div>
          </div>
          <div>
            <span style={{ fontSize: 10, color: '#8C93A8' }}>Última visita</span>
            <div style={{ fontSize: 12, color: '#1A2744' }}>{m.data_visita || 'Não visitado'}</div>
          </div>
        </div>
        {m.notas_coordenacao && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#5A6478', borderLeft: '2px solid #D4A017', paddingLeft: 8 }}>{m.notas_coordenacao}</div>
        )}
      </div>
    </div>
  );
}

/* ── Sidebar de filtros ── */
function FiltrosSidebar({ busca, setBusca, statusFiltro, setStatusFiltro, ideologiaFiltro, setIdeologiaFiltro, filtrados, municipios, contadores, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: isMobile ? '12px 0' : '0 16px 0 0' }}>
      {/* Busca */}
      <div>
        <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8C93A8', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Buscar município</label>
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Nome do município..."
          style={{ width: '100%', border: '1px solid rgba(26,39,68,0.12)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#1A2744', boxSizing: 'border-box' }}
        />
      </div>

      {/* Status */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8C93A8', letterSpacing: '0.08em', marginBottom: 8 }}>Status</div>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={statusFiltro[key]} onChange={e => setStatusFiltro(p => ({ ...p, [key]: e.target.checked }))}
              style={{ accentColor: cfg.cor, width: 14, height: 14 }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.cor, display: 'inline-block', opacity: cfg.opacidade }} />
              <span style={{ fontSize: 13, color: '#1A2744' }}>{cfg.label}</span>
              <span style={{ fontSize: 11, color: '#8C93A8' }}>({contadores[key] || 0})</span>
            </span>
          </label>
        ))}
      </div>

      {/* Ideologia */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8C93A8', letterSpacing: '0.08em', marginBottom: 8 }}>Tendência 2022</div>
        {['Conservador', 'Dividido', 'Progressista'].map(id => (
          <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={ideologiaFiltro[id] !== false} onChange={e => setIdeologiaFiltro(p => ({ ...p, [id]: e.target.checked }))}
              style={{ accentColor: IDEOLOGIA_CORES[id], width: 14, height: 14 }} />
            <span style={{ width: 10, height: 10, borderRadius: 2, background: IDEOLOGIA_CORES[id], display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: '#1A2744' }}>{id}</span>
          </label>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#8C93A8', borderTop: '1px solid rgba(26,39,68,0.08)', paddingTop: 10 }}>
        Mostrando <strong style={{ color: '#1A2744' }}>{filtrados.length}</strong> de {municipios.filter(m => !m.coordenadas_pendentes).length} municípios
      </div>
    </div>
  );
}

/* ── Painel principal ── */
function MapaCampoPanel({ liderancasData }) {
  const isMobile = useWW() < 768;
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState({
    visitado: true, agendado: true, com_lideranca: true, prioritario: true, pendente: true,
  });
  const [ideologiaFiltro, setIdeologiaFiltro] = useState({
    Conservador: true, Dividido: true, Progressista: true, '': true,
  });

  const municipios = liderancasData?.municipios || [];

  const filtrados = useMemo(() => {
    return municipios.filter(m => {
      if (m.coordenadas_pendentes || (m.latitude === 0 && m.longitude === 0)) return false;
      if (!statusFiltro[m.status_visita]) return false;
      const idKey = m.classificacao_ideologica || '';
      if (!ideologiaFiltro[idKey] && idKey !== '') return false;
      if (busca && !m.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [municipios, statusFiltro, ideologiaFiltro, busca]);

  const contadores = useMemo(() => {
    const c = { visitado: 0, agendado: 0, com_lideranca: 0, prioritario: 0, pendente: 0 };
    municipios.forEach(m => { if (c[m.status_visita] !== undefined) c[m.status_visita]++; });
    return c;
  }, [municipios]);

  const meta = liderancasData?.meta || {};

  if (!liderancasData) return <PanelSkeleton/>;

  const alturaMapaDesktop = '600px';
  const alturaMapaMobile  = '420px';

  const filtroProps = { busca, setBusca, statusFiltro, setStatusFiltro, ideologiaFiltro, setIdeologiaFiltro, filtrados, municipios, contadores, isMobile };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(26,39,68,0.08)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(26,39,68,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.15)', borderRadius: 12, padding: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
          </div>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A2744', margin: 0 }}>Mapa de Campo — Lideranças e Visitas</h2>
              <HelpTooltip panelId="campo"/>
            </div>
            <p style={{ fontSize: 12, color: '#8c93a8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '2px 0 0' }}>
              Tocantins · {meta.total_municipios_com_lideranca || 0} lideranças cadastradas · {contadores.visitado} municípios visitados
            </p>
          </div>
        </div>
        {isMobile && (
          <button onClick={() => setFiltrosOpen(o => !o)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(26,39,68,0.12)', background: '#F5F3EE', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#1A2744', fontFamily: 'inherit' }}>
            {filtrosOpen ? 'Ocultar filtros' : 'Filtros'}
          </button>
        )}
      </div>

      {/* Filtros mobile accordion */}
      {isMobile && filtrosOpen && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(26,39,68,0.08)', background: '#FAFAF8' }}>
          <FiltrosSidebar {...filtroProps} />
        </div>
      )}

      {/* Corpo: filtros + mapa */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Sidebar de filtros (desktop) */}
        {!isMobile && (
          <div style={{ width: 200, flexShrink: 0, padding: '20px 0 20px 20px', borderRight: '1px solid rgba(26,39,68,0.08)', overflowY: 'auto' }}>
            <FiltrosSidebar {...filtroProps} />
          </div>
        )}

        {/* Mapa */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer
            center={CENTER_TO}
            zoom={ZOOM_INITIAL}
            style={{ height: isMobile ? alturaMapaMobile : alturaMapaDesktop, width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={19}
            />
            {!isMobile && <Legenda />}
            {filtrados.map(m => {
              const cfg = STATUS_CONFIG[m.status_visita] || STATUS_CONFIG.pendente;
              return (
                <CircleMarker
                  key={m.nome}
                  center={[m.latitude, m.longitude]}
                  radius={cfg.raio}
                  pathOptions={{
                    color: cfg.cor,
                    fillColor: cfg.cor,
                    fillOpacity: cfg.opacidade,
                    weight: 1.5,
                    opacity: 0.9,
                  }}
                >
                  <Popup maxWidth={320} minWidth={260}>
                    <PopupConteudo m={m} />
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
          {/* Legenda inline abaixo do mapa em mobile */}
          {isMobile && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', padding: '10px 12px', borderTop: '1px solid rgba(26,39,68,0.08)', justifyContent: 'center' }}>
              {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
                <span key={cfg.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#5A6478' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.cor, display: 'inline-block', opacity: cfg.opacidade, flexShrink: 0 }} />
                  {cfg.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barra de resumo */}
      <div style={{ background: '#F5F3EE', borderTop: '1px solid rgba(26,39,68,0.08)', padding: '10px 20px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <span key={key} style={{ fontSize: 12, color: '#5A6478', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.cor, display: 'inline-block' }} />
            <strong style={{ color: '#1A2744' }}>{contadores[key] || 0}</strong> {cfg.label.toLowerCase()}
          </span>
        ))}
        {meta.municipios_sem_coordenadas > 0 && (
          <span style={{ fontSize: 11, color: '#8C93A8', marginLeft: 'auto' }}>
            {meta.municipios_sem_coordenadas} sem coordenadas
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(MapaCampoPanel);

MapaCampoPanel.propTypes = {
  liderancasData: PropTypes.shape({
    municipios: PropTypes.arrayOf(PropTypes.shape({
      nome:       PropTypes.string.isRequired,
      lat:        PropTypes.number,
      lng:        PropTypes.number,
      liderancas: PropTypes.number,
      visitas:    PropTypes.number,
      prioridade: PropTypes.string,
    })),
    meta: PropTypes.shape({
      municipios_cobertos:       PropTypes.number,
      total_liderancas:          PropTypes.number,
      municipios_sem_coordenadas: PropTypes.number,
    }),
  }),
};
