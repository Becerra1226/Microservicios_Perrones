const mysql = require('mysql2/promise');

const conection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'facturacion'
});

async function getKey(idempotency_key) {

    const result = await conection.query(
        `SELECT *
         FROM idempotency_keys
         WHERE idempotency_key = ?`,
        [idempotency_key]
    );

    return result[0];

}

async function saveKey(idempotency_key, endpoint, response) {

    const result = await conection.query(
        `INSERT INTO idempotency_keys
        (idempotency_key, endpoint, response)
        VALUES (?, ?, ?)`,
        [
            idempotency_key,
            endpoint,
            JSON.stringify(response)
        ]
    );

    return result[0];

}

module.exports = {
    getKey,
    saveKey
};