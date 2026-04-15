const BASE = '/data';
export const URLS = {
  mentions:   `${BASE}/mention_history.json`,
  social:     `${BASE}/social_metrics.json`,
  sentiment:  `${BASE}/social_sentiment.json`,
  geo:        `${BASE}/geo_electoral.json`,
  kpis:       `${BASE}/campaign_kpis.json`,
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
    clearTimeout(tid);
    return r.ok ? r.json() : null;
  } catch { clearTimeout(tid); return null; }
};
