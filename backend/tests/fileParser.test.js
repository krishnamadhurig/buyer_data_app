const test = require('node:test');
const assert = require('node:assert/strict');
const XLSX = require('xlsx');
const { parseBuyerFile } = require('../src/services/fileParser');

const HEADER = 'Name,Email,Mobile,Address,Total Invoice Amount,Total Amount Paid,Total Amount Due';
const csv = (text) => Buffer.from(text, 'utf8');

test('reads rows from a CSV and numbers them from row 2', () => {
  const result = parseBuyerFile(
    '.csv',
    csv(`${HEADER}\nRavi Kumar,ravi@shop.in,9876543210,Pune,50000,20000,30000`)
  );
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].rowNumber, 2);
  assert.equal(result.rows[0].data.name, 'Ravi Kumar');
  assert.equal(result.rows[0].data.invoice, '50000');
});

test('accepts quoted values that contain commas', () => {
  const result = parseBuyerFile(
    '.csv',
    csv(`${HEADER}\nRavi Kumar,ravi@shop.in,9876543210,"12 MG Road, Pune",50000,20000,30000`)
  );
  assert.equal(result.rows[0].data.address, '12 MG Road, Pune');
});

test('reports missing required columns', () => {
  const result = parseBuyerFile('.csv', csv('Name,Email\nA,b@c.in'));
  assert.match(result.error, /Missing column/);
  assert.match(result.error, /Mobile/);
});

test('skips blank lines but keeps real row numbers', () => {
  const result = parseBuyerFile(
    '.csv',
    csv(`${HEADER}\n\nRavi Kumar,ravi@shop.in,9876543210,Pune,50000,20000,30000`)
  );
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].rowNumber, 3);
});

test('reports a file with no data rows', () => {
  assert.ok(parseBuyerFile('.csv', csv(HEADER)).error);
});

test('reads an .xlsx workbook', () => {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Name', 'Email', 'Mobile', 'Total Invoice Amount', 'Total Amount Paid'],
    ['Meena Iyer', 'meena@store.in', 9123456780, 12500.5, 12500.5],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Buyers');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  const result = parseBuyerFile('.xlsx', buffer);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].data.name, 'Meena Iyer');
  assert.equal(result.rows[0].data.mobile, '9123456780');
});