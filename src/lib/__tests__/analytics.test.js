import { describe, it, expect } from 'vitest';
import { fmtK, fmtDt, metrics, sC, iC } from '../analytics.js';

// ── fmtK ────────────────────────────────────────────────────────────────────

describe('fmtK', () => {
  it('retorna string de número abaixo de 1000', () => {
    expect(fmtK(0)).toBe('0');
    expect(fmtK(999)).toBe('999');
  });

  it('formata milhares com uma casa decimal', () => {
    expect(fmtK(1000)).toBe('1.0K');
    expect(fmtK(1500)).toBe('1.5K');
    expect(fmtK(9999)).toBe('10.0K');
  });

  it('formata dezenas de milhares sem casa decimal', () => {
    expect(fmtK(10000)).toBe('10K');
    expect(fmtK(25300)).toBe('25K');
  });

  it('trata null/undefined como zero', () => {
    expect(fmtK(null)).toBe('0');
    expect(fmtK(undefined)).toBe('0');
  });
});

// ── fmtDt ────────────────────────────────────────────────────────────────────

describe('fmtDt', () => {
  it('retorna — para valor falsy', () => {
    expect(fmtDt(null)).toBe('—');
    expect(fmtDt('')).toBe('—');
    expect(fmtDt(undefined)).toBe('—');
  });

  it('formata "YYYY-MM-DD HH:MM:SS" corretamente', () => {
    expect(fmtDt('2024-03-15 14:30:00')).toBe('15/03/2024 14:30');
  });

  it('formata ISO "YYYY-MM-DDTHH:MM:SS" corretamente', () => {
    expect(fmtDt('2024-03-15T14:30:00')).toBe('15/03/2024 14:30');
  });

  it('formata data sem hora corretamente', () => {
    expect(fmtDt('2024-03-15')).toBe('15/03/2024 00:00');
  });

  it('retorna — para string inválida', () => {
    expect(fmtDt('nao-e-data')).toBe('—');
  });
});

// ── metrics ──────────────────────────────────────────────────────────────────

describe('metrics', () => {
  it('retorna zeros para array vazio', () => {
    const r = metrics([]);
    expect(r.tot).toBe(0);
    expect(r.tox).toBe('0.0');
    expect(r.src).toBe(0);
  });

  it('calcula toxicidade como (1 - média de scores) * 100', () => {
    const data = [{ score: 0.8, mentionType: 'direta', scope: 'TO', source: 'g1' }];
    const r = metrics(data);
    expect(r.tox).toBe('20.0');
    expect(r.tot).toBe(1);
  });

  it('conta tipos de menção corretamente', () => {
    const data = [
      { score: 0.5, mentionType: 'direta',        scope: 'TO', source: 'a' },
      { score: 0.5, mentionType: 'institucional', scope: 'BR', source: 'b' },
      { score: 0.5, mentionType: 'eleitoral',     scope: 'TO', source: 'a' },
    ];
    const r = metrics(data);
    expect(r.dir).toBe(1);
    expect(r.ins).toBe(1);
    expect(r.ele).toBe(1);
    expect(r.nac).toBe(1);
    expect(r.loc).toBe(2);
    expect(r.src).toBe(2); // fontes únicas: 'a' e 'b'
  });
});

// ── sC (score color) ─────────────────────────────────────────────────────────

describe('sC', () => {
  it('retorna vermelho escuro para score <= 0.2', () => {
    expect(sC(0.1).t).toBe('#7F1D1D');
    expect(sC(0.2).t).toBe('#7F1D1D');
  });

  it('retorna vermelho médio para score <= 0.4', () => {
    expect(sC(0.3).t).toBe('#B91C1C');
  });

  it('retorna cinza para score <= 0.6', () => {
    expect(sC(0.5).t).toBe('#8C93A8');
  });

  it('retorna verde para score > 0.6', () => {
    expect(sC(0.8).t).toBe('#15803D');
    expect(sC(1.0).t).toBe('#15803D');
  });
});

// ── iC (impact color) ────────────────────────────────────────────────────────

describe('iC', () => {
  it('retorna cor correta por nível de impacto', () => {
    expect(iC('Alto')).toBe('#ef4444');
    expect(iC('Médio')).toBe('#f59e0b');
    expect(iC('Baixo')).toBe('#22c55e');
  });

  it('retorna cor padrão (Médio) para valor desconhecido', () => {
    expect(iC('Desconhecido')).toBe('#f59e0b');
    expect(iC(null)).toBe('#f59e0b');
  });
});
