import { EMAIL_RE, MOBILE_RE } from './validators.js';

export function normalizeIdentifier(value) {
  const v = value.trim();
  if (v.includes('@')) return v.toLowerCase();
  let digits = v.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function isValidIdentifier(value) {
  const id = normalizeIdentifier(value);
  return EMAIL_RE.test(id) || MOBILE_RE.test(id);
}