import { describe, it, expect } from 'bun:test';
import {
  validatePhoneNumber,
  validateEmail,
  isValidDateFormat,
  parseDateFromDDMMYYYY,
  formatDateToDDMMYYYY,
  getDistanceBetweenCities,
} from '@/utils/validation';

describe('Validation utilities', () => {
  it('validates Indian phone numbers', () => {
    expect(validatePhoneNumber('9876543210', '+91').valid).toBe(true);
    expect(validatePhoneNumber('98765', '+91').valid).toBe(false);
    expect(validatePhoneNumber('98765432100', '+91').valid).toBe(false);
  });

  it('rejects unknown country codes', () => {
    expect(validatePhoneNumber('1234567890', '+999').valid).toBe(false);
  });

  it('validates emails', () => {
    expect(validateEmail('foo@bar.com').valid).toBe(true);
    expect(validateEmail('nope').valid).toBe(false);
    expect(validateEmail('').valid).toBe(false);
  });

  it('round-trips DD-MM-YYYY', () => {
    const d = parseDateFromDDMMYYYY('15-04-2026');
    expect(d).not.toBeNull();
    expect(formatDateToDDMMYYYY(d!)).toBe('15-04-2026');
    expect(isValidDateFormat('15-04-2026')).toBe(true);
    expect(isValidDateFormat('2026-04-15')).toBe(false);
  });

  it('computes city distance', () => {
    const d = getDistanceBetweenCities('Mumbai', 'Delhi');
    expect(d).not.toBeNull();
    expect(d!).toBeGreaterThan(1000);
    expect(d!).toBeLessThan(1500);
  });
});
