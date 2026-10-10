export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MOBILE_RE = /^[6-9]\d{9}$/;

export function validateSignUp({ name, email, mobile, password }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Enter your full name (at least 2 characters).';
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!MOBILE_RE.test(mobile)) errors.mobile = 'Enter a 10 digit mobile number starting with 6, 7, 8 or 9.';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (password.length > 72) errors.password = 'Password must be 72 characters or fewer.';
  return errors;
}

export function passwordScore(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}