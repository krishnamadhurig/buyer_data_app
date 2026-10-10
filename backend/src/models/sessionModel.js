const pool=require('../config/db');

async function createSession({id, userId, refreshHash, idleMinutes}) {
    await pool.query(
        `INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at)
        VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))`,
        [id, userId, refreshHash, idleMinutes]

    )
    
}

async function findActiveById(id) {
    const [rows]=await pool.query(
        `SELECT id, user_id, expires_at FROM sessions
        WHERE id= ? 
        AND revoked_at IS NULL
        AND expires_at > UTC_TIMESTAMP()
        LIMIT 1`,
        [id]
    );
    return rows[0] || null;
    
}
async function revokeByRefreshHash(hash) {
  const [result] = await pool.query(
    `UPDATE sessions
        SET revoked_at = UTC_TIMESTAMP()
      WHERE refresh_token_hash = ?
        AND revoked_at IS NULL`,
    [hash]
  );
  return result.affectedRows;
}

async function findActiveByRefreshHash(hash) {
    const [rows]=await pool.query(
        `SELECT id, user_id
        FROM sessions
        WHERE refresh_token_hash=?
        AND revoked_at IS NULL
        AND expires_at > UTC_TIMESTAMP()
        LIMIT 1`,
        [hash]
    );
    return rows[0] || null;
    
}

async function rotateRefreshToken({id, oldHash, newHash, idleMinutes}) {
    const [result]=await pool.query(
        `UPDATE sessions
        SET refresh_token_hash = ?,
        expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE)
        WHERE id=?
        AND refresh_token_hash =?
        AND revoked_at IS NULL
        AND expires_at > UTC_TIMESTAMP()`,
        [newHash, idleMinutes, id, oldHash]
    );
    return result.affectedRows===1
    
}
module.exports = { createSession, findActiveById, revokeByRefreshHash, findActiveByRefreshHash, rotateRefreshToken };