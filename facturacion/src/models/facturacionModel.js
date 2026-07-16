const mysql = require('mysql2/promise');

const conection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'facturacion',
});

async function getFacturas() {

    const result = await conection.query(
        'SELECT * FROM facturas'
    );

    return result[0];

}

async function getFacturaById(id) {

    const result = await conection.query(
        'SELECT * FROM facturas WHERE id = ?',
        [id]
    );

    return result[0];

}

async function getFacturaByOrdenId(orden_id) {

    const result = await conection.query(
        'SELECT * FROM facturas WHERE orden_id = ?',
        [orden_id]
    );

    return result[0];

}

async function createFactura(
    orden_id,
    subtotal,
    propina,
    total,
    metodo_pago
) {

    const result = await conection.query(
        `INSERT INTO facturas
        (orden_id, subtotal, propina, total, metodo_pago)
        VALUES (?, ?, ?, ?, ?)`,
        [
            orden_id,
            subtotal,
            propina,
            total,
            metodo_pago
        ]
    );

    return result[0];

}

async function updateCodigoFactura(id, codigo) {

    const result = await conection.query(
        `UPDATE facturas
         SET codigo = ?
         WHERE id = ?`,
        [codigo, id]
    );

    return result[0];

}

module.exports = {
    getFacturas,
    getFacturaById,
    getFacturaByOrdenId,
    createFactura,
    updateCodigoFactura
};