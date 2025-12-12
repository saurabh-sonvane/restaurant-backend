
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();


const connectionUrl = process.env.MYSQL_URL || process.env.DB_URL || process.env.DATABASE_URL || null;

function getPoolConfigFromEnv() {
 
  const host = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
  const port = process.env.MYSQLPORT || process.env.DB_PORT || 3306;
  const user = process.env.MYSQLUSER || process.env.DB_USER || 'root';
  const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME || 'restaurant_search';

  return {
    host,
    port: Number(port),
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0
  };
}

let pool;

if (connectionUrl) {

  pool = mysql.createPool(connectionUrl);
} else {
  pool = mysql.createPool(getPoolConfigFromEnv());
}

module.exports = pool;
