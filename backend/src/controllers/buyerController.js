const path = require('path');
const { matchesSignature } = require('../utils/fileSignature');
const { parseBuyerFile } = require('../services/fileParser');
const { validateBuyerRow } = require('../utils/buyerRow');
const { text } = require('../utils/validators');
const { saveBatch, listBuyers: findBuyers } = require('../models/buyerModel');

const MAX_REPORTED_ERRORS = 50;

async function uploadBuyers(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Choose a .csv, .xls or .xlsx file to upload.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!matchesSignature(ext, req.file.buffer)) {
      return res.status(415).json({ message: 'The file content does not match its extension.' });
    }

    let parsed;
    try {
      parsed = parseBuyerFile(ext, req.file.buffer);
    } catch {
      return res.status(422).json({ message: 'The file could not be read. Check that it is a valid spreadsheet.' });
    }
    if (parsed.error) return res.status(422).json({ message: parsed.error });

    const buyers = [];
    const errors = [];
    for (const { rowNumber, data } of parsed.rows) {
      const result = validateBuyerRow(data);
      if (result.errors) errors.push({ row: rowNumber, messages: result.errors });
      else buyers.push(result.value);
    }

    if (buyers.length === 0) {
      return res.status(422).json({
        message: 'No valid rows found. Nothing was saved.',
        skipped: errors.length,
        errors: errors.slice(0, MAX_REPORTED_ERRORS),
      });
    }

    const batchId = await saveBatch({
      userId: req.user.id,
      originalName: req.file.originalname.slice(0, 255),
      totalRows: parsed.rows.length,
      skippedRows: errors.length,
      buyers,
    });

    res.status(201).json({
      message: 'Upload complete',
      batchId,
      totalRows: parsed.rows.length,
      saved: buyers.length,
      skipped: errors.length,
      errors: errors.slice(0, MAX_REPORTED_ERRORS),
    });
  } catch (err) {
    next(err);
  }
}

async function listBuyers(req, res, next) {
  try {
    const search = text(req.query.search).slice(0, 100);

    let page = Number.parseInt(req.query.page, 10);
    if (!Number.isInteger(page) || page < 1) page = 1;

    let limit = Number.parseInt(req.query.limit, 10);
    if (!Number.isInteger(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const { rows, total, totals } = await findBuyers({
      userId: req.user.id,
      search,
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      buyers: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      totals,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadBuyers, listBuyers };

