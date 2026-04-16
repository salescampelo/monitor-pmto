import { supabase } from './supabase.js';

const DATA_BASE = '/api/data';

export const URLS = {
  mentions:    `${DATA_BASE}/mention_history.json`,
  social:      `${DATA_BASE}/social_metrics.json`,
  sentiment:   `${DATA_BASE}/social_sentiment.json`,
  geo:         `${DATA_BASE}/geo_electoral.json`,
  kpis:        `${DATA_BASE}/campaign_kpis.json`,
  adversarios: `${DATA_BASE}/adversarios.json`,
  tendencia:   `${DATA_BASE}/tendencia_voto_2022.json`,
  liderancas:  `${DATA_BASE}/liderancas.json`,
};

const FETCH_TIMEOUT = 10000;

export const fetchJ = async u => {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
    const r = await fetch(u + '?t=' + Date.now(), { signal: ctrl.signal, headers });
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
