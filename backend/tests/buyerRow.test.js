const test = require('node:test');
const assert = require('node:assert/strict');
const { validateBuyerRow } = require('../src/utils/buyerRow');

const row = {
  name: 'Ravi Kumar',
  email: 'Ravi@Shop.in',
  mobile: '9876543210',
  address: 'Pune',
  invoice: '50000',
  paid: '20000',
  due: '30000',
};

test('accepts a valid row and normalises the email', () => {
  const result = validateBuyerRow(row);
  assert.equal(result.errors, undefined);
  assert.equal(result.value.email, 'ravi@shop.in');
  assert.equal(result.value.due, 30000);
});

test('calculates the due amount when it is blank', () => {
  const result = validateBuyerRow({ ...row, due: '' });
  assert.equal(result.value.due, 30000);
});

test('accepts commas and currency symbols in amounts', () => {
  const result = validateBuyerRow({ ...row, invoice: '₹1,200.50', paid: '200.50', due: '' });
  assert.equal(result.value.invoice, 1200.5);
  assert.equal(result.value.due, 1000);
});

test('cleans a +91 mobile number', () => {
  const result = validateBuyerRow({ ...row, mobile: '+91 98765 43210' });
  assert.equal(result.value.mobile, '9876543210');
});

test('rejects an invalid email and a short mobile', () => {
  assert.ok(validateBuyerRow({ ...row, email: 'nope' }).errors);
  assert.ok(validateBuyerRow({ ...row, mobile: '12345' }).errors);
});

test('rejects paid greater than invoice', () => {
  const result = validateBuyerRow({ ...row, paid: '60000', due: '' });
  assert.match(result.errors[0], /cannot be more/);
});

test('rejects a due amount that does not match invoice minus paid', () => {
  const result = validateBuyerRow({ ...row, due: '100' });
  assert.match(result.errors[0], /should be 30000.00/);
});

test('rejects negative or non-numeric amounts', () => {
  assert.ok(validateBuyerRow({ ...row, invoice: '-5' }).errors);
  assert.ok(validateBuyerRow({ ...row, paid: 'abc' }).errors);
});