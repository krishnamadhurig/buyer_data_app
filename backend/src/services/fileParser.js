const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');

const HEADER_ALIASES = {
  name: 'name', fullname: 'name', buyername: 'name',
  email: 'email', emailid: 'email', emailaddress: 'email',
  mobile: 'mobile', mobilenumber: 'mobile', phone: 'mobile',
  address: 'address',
  totalinvoiceamount: 'invoice', invoiceamount: 'invoice',
  totalamountpaid: 'paid', amountpaid: 'paid',
  totalamountdue: 'due', amountdue: 'due',
};

const REQUIRED = {
  name: 'Name',
  email: 'Email',
  mobile: 'Mobile',
  invoice: 'Total Invoice Amount',
  paid: 'Total Amount Paid',
};

const MAX_ROWS = 10000;

const normalizeHeader = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

function readMatrix(ext, buffer) {
  if (ext === '.csv') {
    return parse(buffer, { bom: true, relax_column_count: true, skip_empty_lines: false });
  }
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, blankrows: true });
}

function parseBuyerFile(ext, buffer) {
  const matrix = readMatrix(ext, buffer);
  if (matrix.length < 2) return { error: 'The file has no data rows.' };

  const fieldByColumn = matrix[0].map((h) => HEADER_ALIASES[normalizeHeader(h)] || null);
  const missing = Object.keys(REQUIRED).filter((f) => !fieldByColumn.includes(f));
  if (missing.length) {
    return { error: `Missing column(s): ${missing.map((f) => REQUIRED[f]).join(', ')}` };
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length > MAX_ROWS) {
    return { error: `Too many rows. The maximum is ${MAX_ROWS} per file.` };
  }

  const rows = [];
  dataRows.forEach((cells, i) => {
    if (cells.every((c) => String(c ?? '').trim() === '')) return;
    const data = {};
    fieldByColumn.forEach((field, col) => {
      if (field && data[field] === undefined) data[field] = cells[col];
    });
    rows.push({ rowNumber: i + 2, data });
  });

  if (rows.length === 0) return { error: 'The file has no data rows.' };
  return { rows };
}

module.exports = { parseBuyerFile };