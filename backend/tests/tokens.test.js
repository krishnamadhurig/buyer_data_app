process.env.JWT_ACCESS_SECRET = 'test-secret-for-unit-tests';
process.env.ACCESS_TOKEN_TTL_MIN = '10';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { signAccessToken, generateRefreshToken, hashToken } = require('../src/utils/tokens');

test('access token carries user, role and session id and lasts 10 minutes', () => {
  const token = signAccessToken({ userId: 7, role: 'user', sessionId: 'abc' });
  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });

  assert.equal(Number(payload.sub), 7);
  assert.equal(payload.role, 'user');
  assert.equal(payload.sid, 'abc');
  assert.equal(payload.exp - payload.iat, 600);
});

test('a token signed with another secret is rejected', () => {
  const token = signAccessToken({ userId: 1, role: 'user', sessionId: 's' });
  assert.throws(() => jwt.verify(token, 'a-different-secret', { algorithms: ['HS256'] }));
});

test('a tampered token is rejected', () => {
  const token = signAccessToken({ userId: 1, role: 'user', sessionId: 's' });
  const tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');
  assert.throws(() => jwt.verify(tampered, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }));
});

test('refresh tokens are long and unique', () => {
  const a = generateRefreshToken();
  const b = generateRefreshToken();
  assert.ok(a.length >= 48);
  assert.notEqual(a, b);
});

test('hashToken is a stable 64 character hash', () => {
  const hash = hashToken('some-token');
  assert.equal(hash, hashToken('some-token'));
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.notEqual(hash, hashToken('other-token'));
});