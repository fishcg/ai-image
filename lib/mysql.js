let mysql;

function loadMysql2() {
  if (mysql) return mysql;
  try {
    // eslint-disable-next-line global-require
    mysql = require('mysql2/promise');
    return mysql;
  } catch (err) {
    const e = new Error('Missing dependency: mysql2 (run `npm i mysql2`)');
    e.cause = err;
    throw e;
  }
}

let pool;

function getPool(config) {
  if (pool) return pool;
  const mysql2 = loadMysql2();
  pool = mysql2.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
  return pool;
}

module.exports = { getPool };
