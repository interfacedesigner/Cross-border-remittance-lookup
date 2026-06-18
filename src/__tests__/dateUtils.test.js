import { describe, it, expect, vi } from 'vitest';
import { isBusinessDay, getNextBusinessDay, getNonBusinessReason } from '../utils/dateUtils';

describe('dateUtils', () => {
  describe('isBusinessDay', () => {
    it('should return false on Saturday', () => {
      // 2026-06-20 is a Saturday
      vi.setSystemTime(new Date('2026-06-20T03:00:00Z')); // 12:00 KST
      expect(isBusinessDay()).toBe(false);
    });

    it('should return false on Sunday', () => {
      // 2026-06-21 is a Sunday
      vi.setSystemTime(new Date('2026-06-21T03:00:00Z'));
      expect(isBusinessDay()).toBe(false);
    });

    it('should return true on a weekday', () => {
      // 2026-06-15 is a Monday
      vi.setSystemTime(new Date('2026-06-15T03:00:00Z'));
      expect(isBusinessDay()).toBe(true);
    });

    it('should return false on Korean public holiday', () => {
      // 2026-03-01 is 삼일절 (Sunday in 2026, but also holiday)
      vi.setSystemTime(new Date('2026-08-14T15:00:00Z')); // 2026-08-15 00:00 KST (광복절)
      expect(isBusinessDay()).toBe(false);
    });
  });

  describe('getNonBusinessReason', () => {
    it('should return "토요일" on Saturday', () => {
      vi.setSystemTime(new Date('2026-06-20T03:00:00Z'));
      expect(getNonBusinessReason()).toBe('토요일');
    });

    it('should return "일요일" on Sunday', () => {
      vi.setSystemTime(new Date('2026-06-21T03:00:00Z'));
      expect(getNonBusinessReason()).toBe('일요일');
    });

    it('should return "공휴일" on Korean holiday', () => {
      vi.setSystemTime(new Date('2026-08-14T15:00:00Z')); // 2026-08-15 KST 광복절
      expect(getNonBusinessReason()).toBe('공휴일');
    });

    it('should return empty string on business day', () => {
      vi.setSystemTime(new Date('2026-06-15T03:00:00Z'));
      expect(getNonBusinessReason()).toBe('');
    });
  });

  describe('getNextBusinessDay', () => {
    it('should return next Monday when called on Friday', () => {
      // 2026-06-19 is Friday
      vi.setSystemTime(new Date('2026-06-19T03:00:00Z'));
      const result = getNextBusinessDay();
      expect(result).toContain('6월 22일');
      expect(result).toContain('월');
    });
  });
});
