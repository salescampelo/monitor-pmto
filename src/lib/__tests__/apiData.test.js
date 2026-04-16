import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock da verificação JWT (simula o que a Vercel Function faz via supabase.auth.getUser)
const mockVerifyJwt = vi.fn();

// Replica a lógica de autorização de api/data/[file].js
const validateRequest = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 401, error: 'Missing or invalid authorization header' };
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = await mockVerifyJwt(token);
    if (!decoded) return { status: 401, error: 'Invalid token' };
    return { status: 200, user: decoded };
  } catch(_err) {
    return { status: 401, error: 'Token verification failed' };
  }
};

// Replica a lógica de validação de arquivo de api/data/[file].js
const ALLOWED_FILES = new Set([
  'mention_history.json',
  'social_metrics.json',
  'social_sentiment.json',
  'geo_electoral.json',
  'campaign_kpis.json',
  'adversarios.json',
  'tendencia_voto_2022.json',
  'liderancas.json',
]);

const validateFile = (filename) => {
  if (!filename || !ALLOWED_FILES.has(filename)) {
    return { status: 404, error: 'File not found or not allowed' };
  }
  return { status: 200 };
};

// ── Authorization ────────────────────────────────────────────────────────────

describe('API Data Function — Authorization', () => {

  it('rejects request without auth header', async () => {
    const result = await validateRequest(null);
    expect(result.status).toBe(401);
  });

  it('rejects request with invalid auth header format', async () => {
    const result = await validateRequest('InvalidHeader token123');
    expect(result.status).toBe(401);
  });

  it('rejects request when token verification throws', async () => {
    mockVerifyJwt.mockImplementation(() => { throw new Error('Invalid'); });
    const result = await validateRequest('Bearer invalid_token');
    expect(result.status).toBe(401);
    expect(result.error).toBe('Token verification failed');
  });

  it('rejects request when token resolves to null', async () => {
    mockVerifyJwt.mockResolvedValue(null);
    const result = await validateRequest('Bearer empty_token');
    expect(result.status).toBe(401);
    expect(result.error).toBe('Invalid token');
  });

  it('accepts request with valid token', async () => {
    mockVerifyJwt.mockResolvedValue({ sub: 'user123', email: 'test@test.com' });
    const result = await validateRequest('Bearer valid_token');
    expect(result.status).toBe(200);
    expect(result.user.email).toBe('test@test.com');
  });
});

// ── File validation ──────────────────────────────────────────────────────────

describe('API Data Function — File validation', () => {
  it('rejects request for non-existent file', () => {
    expect(validateFile('hacker.json').status).toBe(404);
  });

  it('rejects request for file with path traversal', () => {
    expect(validateFile('../../../etc/passwd').status).toBe(404);
  });

  it('rejects request for empty filename', () => {
    expect(validateFile('').status).toBe(404);
  });

  it('rejects request for null filename', () => {
    expect(validateFile(null).status).toBe(404);
  });

  it('accepts request for allowed file', () => {
    expect(validateFile('mention_history.json').status).toBe(200);
  });

  it('accepts all allowed files', () => {
    ALLOWED_FILES.forEach(file => {
      expect(validateFile(file).status).toBe(200);
    });
  });
});
