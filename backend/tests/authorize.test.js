const test = require('node:test');
const assert = require('node:assert/strict');
const { authorize } = require('../src/middleware/authorize');

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('lets a user with an allowed role through', () => {
  let called = false;
  authorize('admin')({ user: { role: 'admin' } }, fakeRes(), () => { called = true; });
  assert.equal(called, true);
});

test('blocks a user with a different role with 403', () => {
  const res = fakeRes();
  let called = false;
  authorize('admin')({ user: { role: 'user' } }, res, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});

test('blocks a request that has no user', () => {
  const res = fakeRes();
  authorize('admin')({}, res, () => {});
  assert.equal(res.statusCode, 403);
});