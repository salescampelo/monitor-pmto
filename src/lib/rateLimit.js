// Armazena tentativas por email em memória (reseta ao recarregar a página)
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5;

export const checkRateLimit = email => {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const history = (attempts.get(key) || []).filter(t => now - t < WINDOW_MS);
  if (history.length >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((history[0] + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSec };
  }
  return { allowed: true };
};

export const recordAttempt = email => {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const history = (attempts.get(key) || []).filter(t => now - t < WINDOW_MS);
  history.push(now);
  attempts.set(key, history);
};

export const clearAttempts = email => {
  attempts.delete(email.toLowerCase().trim());
};
