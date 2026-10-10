const pool = require('../config/db');

async function getOverview() {
  const [[row]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM buyers) AS buyers,
            (SELECT COUNT(*) FROM upload_batches) AS uploads,
            (SELECT COALESCE(SUM(total_due), 0) FROM buyers) AS totalDue`
  );
  return {
    users: Number(row.users),
    buyers: Number(row.buyers),
    uploads: Number(row.uploads),
    totalDue: Number(row.totalDue),
  };
}

module.exports = { getOverview };