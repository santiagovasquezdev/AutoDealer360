const mysql = require('mysql2/promise');

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'autodealer360',
      waitForConnections: true,
      connectionLimit: 8,
      decimalNumbers: true,
      dateStrings: true,
      charset: 'utf8mb4'
    });
  }
  return pool;
}
module.exports = { getPool };
