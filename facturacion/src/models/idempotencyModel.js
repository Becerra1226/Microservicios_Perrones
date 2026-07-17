const mysql = require("mysql2/promise");

require("dotenv").config();

const conection = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function getKey(idempotency_key) {
  const result = await conection.query(
    `SELECT *
         FROM idempotency_keys
         WHERE idempotency_key = ?`,
    [idempotency_key],
  );

  return result[0];
}

async function saveKey(idempotency_key, endpoint, response) {
  const result = await conection.query(
    `INSERT INTO idempotency_keys
        (idempotency_key, endpoint, response)
        VALUES (?, ?, ?)`,
    [idempotency_key, endpoint, JSON.stringify(response)],
  );

  return result[0];
}

module.exports = {
  getKey,
  saveKey,
};
