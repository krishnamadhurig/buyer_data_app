const pool = require('../config/db');

const CHUNK_SIZE = 500;

async function saveBatch({ userId, originalName, totalRows, skippedRows, buyers }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [batch] = await conn.query(
      `INSERT INTO upload_batches (user_id, original_name, total_rows, saved_rows, skipped_rows)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, originalName, totalRows, buyers.length, skippedRows]
    );
    const batchId = batch.insertId;

    for (let i = 0; i < buyers.length; i += CHUNK_SIZE) {
      const chunk = buyers
        .slice(i, i + CHUNK_SIZE)
        .map((b) => [userId, batchId, b.name, b.email, b.mobile, b.address, b.invoice, b.paid, b.due]);

      await conn.query(
        `INSERT INTO buyers
           (user_id, batch_id, name, email, mobile, address, total_invoice, total_paid, total_due)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           batch_id = VALUES(batch_id),
           name = VALUES(name),
           mobile = VALUES(mobile),
           address = VALUES(address),
           total_invoice = VALUES(total_invoice),
           total_paid = VALUES(total_paid),
           total_due = VALUES(total_due)`,
        [chunk]
      );
    }

    await conn.commit();
    return batchId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

function buildFilter(userId, search) {
  let where = 'user_id = ?';
  const params = [userId];

  if (search) {
    const escaped = search.replace(/[\\%_]/g, '\\$&');
    const pattern = `%${escaped}%`;
    where += ' AND (name LIKE ? OR email LIKE ? OR mobile LIKE ?)';
    params.push(pattern, pattern, pattern);
  }

  return { where, params };
}

async function listBuyers({ userId, search, limit, offset }) {
  const { where, params } = buildFilter(userId, search);

  const [rows] = await pool.query(
    `SELECT id, name, email, mobile, address,
            total_invoice AS totalInvoice,
            total_paid AS totalPaid,
            total_due AS totalDue
       FROM buyers
      WHERE ${where}
      ORDER BY name ASC, id ASC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[summary]] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(total_invoice), 0) AS invoice,
            COALESCE(SUM(total_paid), 0) AS paid,
            COALESCE(SUM(total_due), 0) AS due
       FROM buyers
      WHERE ${where}`,
    params
  );

  return {
    rows,
    total: Number(summary.total),
    totals: {
      invoice: Number(summary.invoice),
      paid: Number(summary.paid),
      due: Number(summary.due),
    },
  };
}

module.exports = { saveBatch, listBuyers };