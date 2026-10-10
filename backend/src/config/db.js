require('dotenv').config();
const mysql=require('mysql2/promise');
const pool=mysql.createPool({
    host:process.env.DB_HOST,
    port:process.env.DB_PORT,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
      ssl: process.env.DB_SSL_CA
    ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') }
    : undefined,
    waitForConnections:true,
    connectionLimit:10,
    decimalNumbers:true,
})
module.exports=pool;