import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getStateFromUrl, setStateToUrl } from '../urlState';

// urlState.js usa window.location.search e window.history.replaceState.
// Mockamos window globalmente para rodar no ambiente node (sem jsdom),
// o que garante que o V8 capture a cobertura do módulo.

describe('urlState', () => {
  let mockReplaceState;

  const setSearch = (search) => {
    global.window.location.search   = search;
    global.window.location.pathname = '/';
  };

  beforeEach(() => {
    mockReplaceState = vi.fn();
    global.window = {
      location: { search: '', pathname: '/' },
      history:  { replaceState: mockReplaceState },
    };
  });

  afterEach(() => {
    delete global.window;
    vi.restoreAllMocks();
  });

  // ─── getStateFromUrl ───────────────────────────────────────────────────────

  describe('getStateFromUrl', () => {
    it('retorna todos os defaults quando URL está vazia', () => {
      const state = getStateFromUrl();
      expect(state.panel).toBeNull();
      expect(state.cluster).toBe('all');
      expect(state.type).toBe('all');
      expect(state.scope).toBe('all');
      expect(state.relevance).toBe('relevant');
      expect(state.sortOrder).toBe('date');
    });

    it('parseia panel da URL', () => {
      setSearch('?panel=imprensa');
      expect(getStateFromUrl().panel).toBe('imprensa');
    });

    it('parseia cluster da URL', () => {
      setSearch('?cluster=direct');
      expect(getStateFromUrl().cluster).toBe('direct');
    });

    it('parseia type da URL', () => {
      setSearch('?type=news');
      expect(getStateFromUrl().type).toBe('news');
    });

    it('parseia scope da URL', () => {
      setSearch('?scope=state');
      expect(getStateFromUrl().scope).toBe('state');
    });

    it('parseia múltiplos parâmetros simultaneamente', () => {
      setSearch('?panel=social&cluster=direct&relevance=all');
      const state = getStateFromUrl();
      expect(state.panel).toBe('social');
      expect(state.cluster).toBe('direct');
      expect(state.relevance).toBe('all');
    });

    it('aceita qualquer valor de panel (sem lista de válidos)', () => {
      // panel não tem Set de valores válidos — qualquer string passa
      setSearch('?panel=qualquercoisa');
      expect(getStateFromUrl().panel).toBe('qualquercoisa');
    });

    it('usa default quando relevance é inválido', () => {
      setSearch('?relevance=invalido');
      expect(getStateFromUrl().relevance).toBe('relevant');
    });

    it('aceita relevance=relevant', () => {
      setSearch('?relevance=relevant');
      expect(getStateFromUrl().relevance).toBe('relevant');
    });

    it('aceita relevance=direct', () => {
      setSearch('?relevance=direct');
      expect(getStateFromUrl().relevance).toBe('direct');
    });

    it('aceita relevance=all', () => {
      setSearch('?relevance=all');
      expect(getStateFromUrl().relevance).toBe('all');
    });

    it('lê sortOrder pelo parâmetro "sort" (não "sortOrder")', () => {
      setSearch('?sort=score');
      expect(getStateFromUrl().sortOrder).toBe('score');
    });

    it('aceita sortOrder=date', () => {
      setSearch('?sort=date');
      expect(getStateFromUrl().sortOrder).toBe('date');
    });

    it('usa default quando sort é inválido', () => {
      setSearch('?sort=invalido');
      expect(getStateFromUrl().sortOrder).toBe('date');
    });

    it('ignora parâmetro "sortOrder" (chave errada — deve usar "sort")', () => {
      setSearch('?sortOrder=score');
      expect(getStateFromUrl().sortOrder).toBe('date'); // default: chave correta é "sort"
    });
  });

  // ─── setStateToUrl ─────────────────────────────────────────────────────────

  describe('setStateToUrl', () => {
    it('chama replaceState com "/" quando todos os valores são default', () => {
      setStateToUrl({
        panel: 'tendencia', cluster: 'all', type: 'all',
        scope: 'all', relevance: 'relevant', sortOrder: 'date',
      });
      expect(mockReplaceState).toHaveBeenCalledWith({}, '', '/');
    });

    it('adiciona apenas parâmetros não-default', () => {
      setStateToUrl({
        panel: 'imprensa', cluster: 'all', type: 'all',
        scope: 'all', relevance: 'relevant', sortOrder: 'date',
      });
      const url = mockReplaceState.mock.calls[0][2];
      expect(url).toContain('panel=imprensa');
      expect(url).not.toContain('cluster=');
      expect(url).not.toContain('relevance=');
    });

    it('usa "sort" como chave para sortOrder na URL (não "sortOrder")', () => {
      setStateToUrl({
        panel: 'tendencia', cluster: 'all', type: 'all',
        scope: 'all', relevance: 'relevant', sortOrder: 'score',
      });
      const url = mockReplaceState.mock.calls[0][2];
      expect(url).toContain('sort=score');
      expect(url).not.toContain('sortOrder=');
    });

    it('codifica múltiplos parâmetros não-default corretamente', () => {
      setStateToUrl({
        panel: 'social', cluster: 'direct', type: 'all',
        scope: 'all', relevance: 'all', sortOrder: 'date',
      });
      const url = mockReplaceState.mock.calls[0][2];
      expect(url).toContain('panel=social');
      expect(url).toContain('cluster=direct');
      expect(url).toContain('relevance=all');
    });

    it('inclui pathname na URL gerada', () => {
      setStateToUrl({ panel: 'geo', cluster: 'all', type: 'all',
        scope: 'all', relevance: 'relevant', sortOrder: 'date' });
      const url = mockReplaceState.mock.calls[0][2];
      expect(url).toContain('/');
      expect(url).toContain('panel=geo');
    });

    it('não lança erro com valores undefined', () => {
      expect(() => setStateToUrl({
        panel: undefined, cluster: undefined, type: undefined,
        scope: undefined, relevance: undefined, sortOrder: undefined,
      })).not.toThrow();
    });

    it('chama replaceState exatamente uma vez', () => {
      setStateToUrl({ panel: 'kpis', cluster: 'all', type: 'all',
        scope: 'all', relevance: 'relevant', sortOrder: 'date' });
      expect(mockReplaceState).toHaveBeenCalledTimes(1);
    });
  });

  // ─── round-trip ────────────────────────────────────────────────────────────

  describe('round-trip', () => {
    const roundTrip = (state) => {
      setStateToUrl(state);
      // Extrai a URL que replaceState recebeu e simula window.location
      const url = mockReplaceState.mock.calls[0][2];
      const search = url.includes('?') ? url.slice(url.indexOf('?')) : '';
      global.window.location.search = search;
      return getStateFromUrl();
    };

    it('preserva panel não-default', () => {
      const restored = roundTrip({ panel: 'social', cluster: 'all', type: 'all',
        scope: 'all', relevance: 'relevant', sortOrder: 'date' });
      expect(restored.panel).toBe('social');
    });

    it('preserva cluster não-default', () => {
      const restored = roundTrip({ panel: 'kpis', cluster: 'direct', type: 'all',
        scope: 'all', relevance: 'relevant', sortOrder: 'date' });
      expect(restored.cluster).toBe('direct');
    });

    it('preserva relevance=direct', () => {
      const restored = roundTrip({ panel: 'kpis', cluster: 'all', type: 'all',
        scope: 'all', relevance: 'direct', sortOrder: 'date' });
      expect(restored.relevance).toBe('direct');
    });

    it('preserva sortOrder=score', () => {
      const restored = roundTrip({ panel: 'kpis', cluster: 'all', type: 'all',
        scope: 'all', relevance: 'relevant', sortOrder: 'score' });
      expect(restored.sortOrder).toBe('score');
    });

    it('defaults resultam em URL limpa "/" (sem query string)', () => {
      setStateToUrl({ panel: 'tendencia', cluster: 'all', type: 'all',
        scope: 'all', relevance: 'relevant', sortOrder: 'date' });
      expect(mockReplaceState.mock.calls[0][2]).toBe('/');
    });
  });
});
