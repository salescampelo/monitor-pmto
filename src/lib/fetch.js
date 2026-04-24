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
  collector:   `${DATA_BASE}/collector_stats.json`,
};

const FETCH_TIMEOUT = 10000;
const SESSION_EXPIRED = 'Sessão expirada. Faça login novamente.';

export const fetchJ = async (u) => {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);

  const attempt = async (isRetry = false) => {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

    // No valid session — try one silent refresh before giving up
    if (sessionErr || !session?.access_token) {
      if (!isRetry) {
        const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
        if (!refreshErr && refreshed.session) return attempt(true);
      }
      throw new Error(SESSION_EXPIRED);
    }

    const base = typeof location !== 'undefined' ? location.origin : 'http://localhost';
    const url = new URL(u, base);
    url.searchParams.set('t', Date.now());
    const r = await fetch(url.toString(), {
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    // Token expired mid-request — refresh once and retry
    if (r.status === 401 && !isRetry) {
      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
      if (!refreshErr && refreshed.session) return attempt(true);
      throw new Error(SESSION_EXPIRED);
    }

    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };

  try {
    return await attempt();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[fetchJ] Timeout (${FETCH_TIMEOUT}ms) em ${u}`);
      return null;
    }
    if (err.message === SESSION_EXPIRED) {
      throw err; // propagate so callers can trigger sign-out
    }
    console.error(`[fetchJ] Erro em ${u}:`, err.message);
    return null;
  } finally {
    clearTimeout(tid);
  }
};
