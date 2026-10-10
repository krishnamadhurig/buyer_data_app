
const pool = require('./db');

async function createTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            mobile CHAR(10) NOT NULL,
            password_hash VARCHAR(100) NOT NULL,
            role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_users_email (email),
            UNIQUE KEY uq_users_mobile (mobile)
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
            id CHAR(36) NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            refresh_token_hash CHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            revoked_at DATETIME NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_sessions_refresh (refresh_token_hash),
            KEY idx_sessions_user (user_id),
            CONSTRAINT fk_sessions_user
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS upload_batches (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            total_rows INT UNSIGNED NOT NULL,
            saved_rows INT UNSIGNED NOT NULL,
            skipped_rows INT UNSIGNED NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            CONSTRAINT fk_batches_user
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS buyers (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            batch_id BIGINT UNSIGNED NOT NULL,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(255) NOT NULL,
            mobile CHAR(10) NOT NULL,
            address VARCHAR(500) NOT NULL DEFAULT '',
            total_invoice DECIMAL(14,2) NOT NULL DEFAULT 0,
            total_paid DECIMAL(14,2) NOT NULL DEFAULT 0,
            total_due DECIMAL(14,2) NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_buyers_user_email (user_id, email),
            KEY idx_buyers_user_name (user_id, name),
            KEY idx_buyers_user_mobile (user_id, mobile),
            CONSTRAINT fk_buyers_user
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT fk_buyers_batch
                FOREIGN KEY (batch_id) REFERENCES upload_batches (id) ON DELETE CASCADE
        )
    `);

    console.log('All tables are ready');
}

module.exports = createTables;