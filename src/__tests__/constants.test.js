import { describe, it, expect } from 'vitest';
import { CURRENCIES, SVC_AVAIL } from '../utils/constants';

describe('CURRENCIES', () => {
  it('should have 8 currencies', () => {
    expect(Object.keys(CURRENCIES)).toHaveLength(8);
  });

  it('should have required fields for each currency', () => {
    for (const [code, info] of Object.entries(CURRENCIES)) {
      expect(info).toHaveProperty('code', code);
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('flag');
      expect(info).toHaveProperty('symbol');
      expect(info).toHaveProperty('color');
      expect(info).toHaveProperty('base');
      expect(info.base).toBeGreaterThan(0);
    }
  });

  it('should have unit=100 for JPY', () => {
    expect(CURRENCIES.JPY.unit).toBe(100);
  });

  it('should not have unit for non-JPY currencies', () => {
    expect(CURRENCIES.USD.unit).toBeUndefined();
    expect(CURRENCIES.EUR.unit).toBeUndefined();
  });
});

describe('SVC_AVAIL', () => {
  it('should have 8 services', () => {
    expect(Object.keys(SVC_AVAIL)).toHaveLength(8);
  });

  it('fintech services should be available on weekends', () => {
    const fintechs = ['wise', 'sentbe', 'moin', 'wirebarley', 'toss', 'paypal'];
    for (const id of fintechs) {
      expect(SVC_AVAIL[id].weekend).toBe(true);
      expect(SVC_AVAIL[id].holiday).toBe(true);
    }
  });

  it('banks should not be available on weekends', () => {
    const banks = ['hana', 'shinhan'];
    for (const id of banks) {
      expect(SVC_AVAIL[id].weekend).toBe(false);
      expect(SVC_AVAIL[id].holiday).toBe(false);
    }
  });
});
