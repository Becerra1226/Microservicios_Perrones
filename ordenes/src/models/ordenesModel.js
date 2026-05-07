const mysql = require('mysql2/promise');

const conection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ordenes',
});


// =========================================
// Obtener todas las órdenes
// =========================================
async function getOrdenes() {

    const result = await conection.query(`
        SELECT * FROM ordenes
        ORDER BY fecha_creacion DESC
    `);

    return result[0];
}


// =========================================
// Obtener orden por ID
// =========================================
async function getOrdenById(id) {

    const result = await conection.query(`
        SELECT * FROM ordenes
        WHERE id = ?
    `, [id]);

    return result[0];
}


// =========================================
// Crear orden
// =========================================
async function createOrden(
    codigo,
    subtotal,
    total,
    estado
) {

    const result = await conection.query(`
        INSERT INTO ordenes (
            codigo,
            subtotal,
            total,
            estado
        )
        VALUES (?, ?, ?, ?)
    `, [
        codigo,
        subtotal,
        total,
        estado
    ]);

    return result[0];
}


// =========================================
// Crear detalle orden
// =========================================
async function createDetalleOrden(
    orden_id,
    producto_id,
    nombre_producto,
    precio_unitario,
    cantidad,
    subtotal
) {

    const result = await conection.query(`
        INSERT INTO detalle_orden (
            orden_id,
            producto_id,
            nombre_producto,
            precio_unitario,
            cantidad,
            subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        orden_id,
        producto_id,
        nombre_producto,
        precio_unitario,
        cantidad,
        subtotal
    ]);

    return result[0];
}


// =========================================
// Obtener detalle de una orden
// =========================================
async function getDetalleOrden(orden_id) {

    const result = await conection.query(`
        SELECT * FROM detalle_orden
        WHERE orden_id = ?
    `, [orden_id]);

    return result[0];
}


// =========================================
// Actualizar estado orden
// =========================================
async function updateEstadoOrden(id, estado) {

    const result = await conection.query(`
        UPDATE ordenes
        SET estado = ?
        WHERE id = ?
    `, [estado, id]);

    return result[0];
}


// =========================================
// Eliminar orden
// =========================================
async function deleteOrden(id) {

    const result = await conection.query(`
        DELETE FROM ordenes
        WHERE id = ?
    `, [id]);

    return result[0];
}


module.exports = {
    getOrdenes,
    getOrdenById,
    createOrden,
    createDetalleOrden,
    getDetalleOrden,
    updateEstadoOrden,
    deleteOrden
};