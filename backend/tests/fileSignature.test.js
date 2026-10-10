const test = require('node:test');
const assert = require('node:assert/strict');
const { matchesSignature } = require('../src/utils/fileSignature');

test('accepts a real .xlsx signature (zip)', () => {
  assert.equal(matchesSignature('.xlsx', Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00])), true);
});

test('accepts a real .xls signature (OLE)', () => {
  const header = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00]);
  assert.equal(matchesSignature('.xls', header), true);
});

test('accepts plain text as .csv', () => {
  assert.equal(matchesSignature('.csv', Buffer.from('Name,Email\nA,b@c.in')), true);
});

test('rejects a text file renamed to .xlsx or .xls', () => {
  assert.equal(matchesSignature('.xlsx', Buffer.from('just some text')), false);
  assert.equal(matchesSignature('.xls', Buffer.from('just some text')), false);
});

test('rejects binary content renamed to .csv', () => {
  assert.equal(matchesSignature('.csv', Buffer.from([0x4d, 0x5a, 0x00, 0x03, 0x00])), false);
});

test('rejects unknown extensions and empty files', () => {
  assert.equal(matchesSignature('.exe', Buffer.from('abc')), false);
  assert.equal(matchesSignature('.csv', Buffer.alloc(0)), false);
});