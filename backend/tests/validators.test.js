const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRegister } = require('../src/utils/validators');

const valid = {
  name: 'Ananya Rao',
  email: 'ananya@shop.in',
  mobile: '9876543210',
  password: 'Str0ng!Pass',
};

test('accepts a valid registration', () => {
  assert.deepEqual(validateRegister(valid), {});
});

test('rejects a name shorter than 2 characters', () => {
  assert.ok(validateRegister({ ...valid, name: 'A' }).name);
});

test('rejects an invalid email', () => {
  assert.ok(validateRegister({ ...valid, email: 'not-an-email' }).email);
  assert.ok(validateRegister({ ...valid, email: 'a@.' }).email);
});

test('rejects a mobile that is not 10 digits starting with 6-9', () => {
  assert.ok(validateRegister({ ...valid, mobile: '12345' }).mobile);
  assert.ok(validateRegister({ ...valid, mobile: '5876543210' }).mobile);
  assert.ok(validateRegister({ ...valid, mobile: '98765432101' }).mobile);
});

test('rejects passwords shorter than 8 or longer than 72 characters', () => {
  assert.ok(validateRegister({ ...valid, password: 'short1!' }).password);
  assert.ok(validateRegister({ ...valid, password: 'a'.repeat(73) }).password);
});

test('does not crash on non-string input', () => {
  const errors = validateRegister({ name: 123, email: null, mobile: 9876543210, password: {} });
  assert.ok(errors.name);
  assert.ok(errors.email);
  assert.ok(errors.mobile);
  assert.ok(errors.password);
});