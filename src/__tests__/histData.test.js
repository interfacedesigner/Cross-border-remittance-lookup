import { describe, it, expect } from 'vitest';
import { HIST } from '../utils/histData';

describe('HIST (Historical Data)', () => {
  it('should have data for all 8 currencies', () => {
    const expected = ['USD', 'JPY', 'EUR', 'GBP', 'CNY', 'AUD', 'CAD', 'SGD'];
    for (const code of expected) {
      expect(HIST[code]).toBeDefined();
      expect(HIST[code].length).toBeGreaterThan(0);
    }
  });

  it('should have entries with date (d) and rate (r) fields', () => {
    for (const [code, data] of Object.entries(HIST)) {
      for (const entry of data) {
        expect(entry).toHaveProperty('d');
        expect(entry).toHaveProperty('r');
        expect(entry.d).toMatch(/^\d{4}-\d{2}$/);
        expect(entry.r).toBeGreaterThan(0);
      }
    }
  });

  it('should have data starting from 2020-01', () => {
    for (const [code, data] of Object.entries(HIST)) {
      expect(data[0].d).toBe('2020-01');
    }
  });

  it('should have same number of entries for all currencies', () => {
    const lengths = Object.values(HIST).map(d => d.length);
    expect(new Set(lengths).size).toBe(1);
  });

  it('all rates should be reasonable numbers (> 100 for KRW-based rates)', () => {
    for (const [code, data] of Object.entries(HIST)) {
      for (const entry of data) {
        expect(entry.r).toBeGreaterThan(100);
        expect(entry.r).toBeLessThan(3000);
      }
    }
  });
});
