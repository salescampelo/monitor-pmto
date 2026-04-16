const DEFAULTS = {
  panel:     'tendencia',
  cluster:   'all',
  type:      'all',
  scope:     'all',
  relevance: 'relevant',
  sortOrder: 'date',
};

const VALID = {
  relevance: new Set(['relevant', 'direct', 'all']),
  sortOrder: new Set(['date', 'score']),
};

export function getStateFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const relevance = p.get('relevance');
  const sortOrder = p.get('sort');
  return {
    panel:     p.get('panel')   || DEFAULTS.panel,
    cluster:   p.get('cluster') || DEFAULTS.cluster,
    type:      p.get('type')    || DEFAULTS.type,
    scope:     p.get('scope')   || DEFAULTS.scope,
    relevance: VALID.relevance.has(relevance) ? relevance : DEFAULTS.relevance,
    sortOrder: VALID.sortOrder.has(sortOrder) ? sortOrder : DEFAULTS.sortOrder,
  };
}

export function setStateToUrl(state) {
  const p = new URLSearchParams();
  if (state.panel     !== DEFAULTS.panel)     p.set('panel',     state.panel);
  if (state.cluster   !== DEFAULTS.cluster)   p.set('cluster',   state.cluster);
  if (state.type      !== DEFAULTS.type)      p.set('type',      state.type);
  if (state.scope     !== DEFAULTS.scope)     p.set('scope',     state.scope);
  if (state.relevance !== DEFAULTS.relevance) p.set('relevance', state.relevance);
  if (state.sortOrder !== DEFAULTS.sortOrder) p.set('sort',      state.sortOrder);

  const newUrl = p.toString()
    ? `${window.location.pathname}?${p.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, '', newUrl);
}
