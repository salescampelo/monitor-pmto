import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock do supabase ANTES do import de fetchJ (vi.mock é hoisted pelo vitest)
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
    },
  },
}));

import { fetchJ } from '../fetch';
import { supabase } from '../supabase';

// Helpers para mocks reutilizáveis
const sessionOk   = (token = 'valid-token') => ({
  data: { session: { access_token: token } }, error: null,
});
const sessionNone = () => ({
  data: { session: null }, error: null,
});
const refreshOk   = (token = 'refreshed-token') => ({
  data: { session: { access_token: token } }, error: null,
});
const refreshFail = () => ({
  data: { session: null }, error: { message: 'Refresh failed' },
});
const httpOk      = (body = {}) => ({
  ok: true, status: 200, json: () => Promise.resolve(body),
});
const httpStatus  = (status) => ({ ok: false, status });

describe('fetchJ', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    vi.mocked(supabase.auth.getSession).mockReset();
    vi.mocked(supabase.auth.refreshSession).mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ─── Authorization header ──────────────────────────────────────────────────

  describe('Authorization header', () => {
    it('inclui Bearer token na requisição', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk('meu-token'));
      mockFetch.mockResolvedValue(httpOk({ items: [] }));

      await fetchJ('/api/data/test.json');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/data/test.json'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer meu-token' }),
        }),
      );
    });

    it('acrescenta cache-bust "?t=" na URL', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk());
      mockFetch.mockResolvedValue(httpOk());

      await fetchJ('/api/data/test.json');

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toMatch(/\/api\/data\/test\.json\?t=\d+/);
    });
  });

  // ─── Sessão ausente ────────────────────────────────────────────────────────

  describe('sessão ausente', () => {
    it('relança SESSION_EXPIRED quando não há sessão e refresh falha', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionNone());
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue(refreshFail());

      await expect(fetchJ('/api/data/test.json')).rejects.toThrow('Sessão expirada');
    });

    it('chama refreshSession quando getSession retorna sem token', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionNone());
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue(refreshFail());

      await expect(fetchJ('/api/data/test.json')).rejects.toThrow();
      expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
    });

    it('faz fetch após refresh bem-sucedido quando sessão ausente', async () => {
      // Primeira chamada a getSession: sem sessão; segunda (no retry): com sessão nova
      vi.mocked(supabase.auth.getSession)
        .mockResolvedValueOnce(sessionNone())
        .mockResolvedValueOnce(sessionOk('refreshed-token'));
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue(refreshOk('refreshed-token'));
      mockFetch.mockResolvedValue(httpOk({ ok: true }));

      const result = await fetchJ('/api/data/test.json');

      expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true });
    });
  });

  // ─── Retry em 401 ─────────────────────────────────────────────────────────

  describe('retry em 401', () => {
    it('faz refresh e retry quando recebe 401', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk('old-token'));
      mockFetch
        .mockResolvedValueOnce(httpStatus(401))
        .mockResolvedValueOnce(httpOk({ data: 'success' }));
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue(refreshOk('new-token'));

      const result = await fetchJ('/api/data/test.json');

      expect(supabase.auth.refreshSession).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('relança SESSION_EXPIRED quando 401 e refresh falha', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk());
      mockFetch.mockResolvedValueOnce(httpStatus(401));
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue(refreshFail());

      await expect(fetchJ('/api/data/test.json')).rejects.toThrow('Sessão expirada');
    });

    it('retorna null (sem retry infinito) quando 401 persiste após refresh', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk());
      // Ambas as chamadas a fetch retornam 401
      mockFetch.mockResolvedValue(httpStatus(401));
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue(refreshOk());

      const result = await fetchJ('/api/data/test.json');

      expect(result).toBeNull();
      expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(2);
    });

    it('não chama refreshSession duas vezes no mesmo fluxo 401', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk());
      mockFetch
        .mockResolvedValueOnce(httpStatus(401))
        .mockResolvedValueOnce(httpOk());
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue(refreshOk());

      await fetchJ('/api/data/test.json');

      expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Erros HTTP (não SESSION_EXPIRED) ─────────────────────────────────────

  describe('erros HTTP', () => {
    it('retorna null para status 404 (não relança)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk());
      mockFetch.mockResolvedValue(httpStatus(404));

      const result = await fetchJ('/api/data/notfound.json');
      expect(result).toBeNull();
    });

    it('retorna null para status 500 (não relança)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk());
      mockFetch.mockResolvedValue(httpStatus(500));

      const result = await fetchJ('/api/data/error.json');
      expect(result).toBeNull();
    });

    it('retorna null para status 403 (não relança)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk());
      mockFetch.mockResolvedValue(httpStatus(403));

      const result = await fetchJ('/api/data/forbidden.json');
      expect(result).toBeNull();
    });
  });

  // ─── Parsing JSON ──────────────────────────────────────────────────────────

  describe('parsing JSON', () => {
    it('retorna os dados parseados corretamente', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk());
      const mockData = { items: [1, 2, 3], total: 3 };
      mockFetch.mockResolvedValue(httpOk(mockData));

      const result = await fetchJ('/api/data/data.json');
      expect(result).toEqual(mockData);
    });

    it('retorna null quando json() rejeita (JSON inválido)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk());
      mockFetch.mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.reject(new Error('Unexpected token')),
      });

      const result = await fetchJ('/api/data/invalid.json');
      expect(result).toBeNull();
    });

    it('retorna array quando resposta é um array JSON', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(sessionOk());
      const mockArray = [{ id: 1 }, { id: 2 }];
      mockFetch.mockResolvedValue(httpOk(mockArray));

      const result = await fetchJ('/api/data/list.json');
      expect(result).toEqual(mockArray);
    });
  });
});
