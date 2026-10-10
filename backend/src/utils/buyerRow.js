const { EMAIL_RE, MOBILE_RE, text } = require('./validators');

const MAX_AMOUNT = 999999999999.99;

function normalizeMobile(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function parseAmount(value) {
  const cleaned = String(value ?? '').replace(/[₹,\s]/g, '');
  if (cleaned === '') return { empty: true };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return { invalid: true };
  const n = Number(cleaned);
  if (n > MAX_AMOUNT) return { invalid: true };
  return { value: Math.round(n * 100) / 100 };
}

function validateBuyerRow(row) {
  const errors = [];
  const name = text(row.name);
  const email = text(row.email).toLowerCase();
  const mobile = normalizeMobile(row.mobile);
  const address = text(row.address);

  if (name.length < 2 || name.length > 150) errors.push('Name must be 2 to 150 characters');
  if (email.length > 255 || !EMAIL_RE.test(email)) errors.push('Email is not valid');
  if (!MOBILE_RE.test(mobile)) errors.push('Mobile must be 10 digits starting with 6-9');
  if (address.length > 500) errors.push('Address is longer than 500 characters');

  const invoice = parseAmount(row.invoice);
  const paid = parseAmount(row.paid);
  const due = parseAmount(row.due);

  if (invoice.empty || invoice.invalid) errors.push('Total Invoice Amount must be a number, 0 or more');
  if (paid.empty || paid.invalid) errors.push('Total Amount Paid must be a number, 0 or more');
  if (due.invalid) errors.push('Total Amount Due must be a number, 0 or more');
  if (errors.length) return { errors };

  if (paid.value > invoice.value) {
    return { errors: ['Total Amount Paid cannot be more than Total Invoice Amount'] };
  }

  const expectedDue = Math.round((invoice.value - paid.value) * 100) / 100;
  if (!due.empty && Math.abs(due.value - expectedDue) > 0.01) {
    return { errors: [`Total Amount Due should be ${expectedDue.toFixed(2)}`] };
  }

  return {
    value: { name, email, mobile, address, invoice: invoice.value, paid: paid.value, due: expectedDue },
  };
}

module.exports = { validateBuyerRow };