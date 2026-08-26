import { describe, expect, it } from 'vitest';
import { matchAutomation, isPotentiallyCatastrophicRegex } from '@/lib/automation/matcher';

describe('matchAutomation — CONTAINS', () => {
  it('matches case-insensitively', () => {
    const result = matchAutomation('I WANT THE LINK', { keyword: 'want', matchType: 'CONTAINS' });
    expect(result.matched).toBe(true);
  });

  it('does not match when keyword is absent', () => {
    const result = matchAutomation('great post!', { keyword: 'want', matchType: 'CONTAINS' });
    expect(result.matched).toBe(false);
  });
});

describe('matchAutomation — EXACT', () => {
  it('matches after normalizing whitespace and case', () => {
    const result = matchAutomation('  LINK   PLEASE ', { keyword: 'link please', matchType: 'EXACT' });
    expect(result.matched).toBe(true);
  });

  it('does not match a substring', () => {
    const result = matchAutomation('link please now', { keyword: 'link please', matchType: 'EXACT' });
    expect(result.matched).toBe(false);
  });
});

describe('matchAutomation — REGEX', () => {
  it('matches a valid pattern', () => {
    const result = matchAutomation('price is $19.99', { keyword: '\\$\\d+(\\.\\d{2})?', matchType: 'REGEX' });
    expect(result.matched).toBe(true);
  });

  it('does not match when the pattern does not apply', () => {
    const result = matchAutomation('no numbers here', { keyword: '\\d+', matchType: 'REGEX' });
    expect(result.matched).toBe(false);
  });

  it('safely rejects a malformed regex instead of throwing', () => {
    const result = matchAutomation('anything', { keyword: '(unclosed', matchType: 'REGEX' });
    expect(result.matched).toBe(false);
    expect(result.reason).toMatch(/malformed/i);
  });

  it('rejects catastrophic-backtracking shaped patterns before executing them', () => {
    const result = matchAutomation('a'.repeat(30) + '!', { keyword: '(a+)+$', matchType: 'REGEX' });
    expect(result.matched).toBe(false);
    expect(result.reason).toMatch(/catastrophic/i);
  });
});

describe('matchAutomation — no match / edge cases', () => {
  it('returns not matched for empty comment text', () => {
    const result = matchAutomation('', { keyword: 'link', matchType: 'CONTAINS' });
    expect(result.matched).toBe(false);
  });
});

describe('isPotentiallyCatastrophicRegex', () => {
  it('flags nested quantifiers', () => {
    expect(isPotentiallyCatastrophicRegex('(a+)+')).toBe(true);
    expect(isPotentiallyCatastrophicRegex('(a*)*')).toBe(true);
  });

  it('allows simple safe patterns', () => {
    expect(isPotentiallyCatastrophicRegex('\\d+')).toBe(false);
    expect(isPotentiallyCatastrophicRegex('link|url')).toBe(false);
  });
});
