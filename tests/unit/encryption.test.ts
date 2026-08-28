import { describe, expect, it } from 'vitest';
import { encryptToken, decryptToken } from '@/lib/security/encryption';

describe('encryptToken / decryptToken', () => {
  it('round-trips a plaintext token', () => {
    const plaintext = 'EAABsbCS1234567890abcdefTokenValue';
    const encrypted = encryptToken(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decryptToken(encrypted)).toBe(plaintext);
  });

  it('produces different ciphertext each time (random IV)', () => {
    const a = encryptToken('same-input');
    const b = encryptToken('same-input');
    expect(a).not.toBe(b);
  });

  it('rejects a malformed ciphertext payload', () => {
    expect(() => decryptToken('not-a-valid-payload')).toThrow();
  });
});
