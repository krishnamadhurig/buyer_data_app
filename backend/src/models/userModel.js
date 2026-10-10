const pool=require('../config/db');

async function findByEmailorMobile(email, mobile) {
    const [rows]=await pool.query(
        'SELECT id, email, mobile FROM users WHERE email = ? OR mobile = ?',
        [email, mobile]
    );
    return rows;
    
}

async function createUser({ name, email, mobile, passwordHash}) {
    const [result]=await pool.query(
        'INSERT INTO users(name, email, mobile,password_hash) VALUES (?, ?, ?, ?)',
        [name, email, mobile, passwordHash]

    );
    return result.insertId;
    
}


async function findForLogin(identifier) {
    const column=identifier.includes('@') ? 'email' : 'mobile';
    const [rows]=await pool.query(
        `SELECT id, name, email, mobile, role, password_hash FROM users WHERE ${column} = ? LIMIT 1`,
        [identifier]
    );
    return rows[0] || null;
    
}

async function findById(id) {
    const [rows]=await pool.query(
        'SELECT id, name, email, mobile, role, created_at FROM users WHERE id= ? LIMIT 1',
        [id]
    );
    return rows[0] || null;
}

module.exports={findByEmailorMobile, createUser, findForLogin, findById};
