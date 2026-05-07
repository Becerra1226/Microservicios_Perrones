const mysql = require('mysql2/promise');
const conection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',   
    database: 'perrones',
});

async function getProductos() {
    const result = await conection.query('SELECT * FROM productos');
    return result[0];
}

async function getProductoById(id) {
    const result = await conection.query('SELECT * FROM productos WHERE id = ?', [id]);
    return result[0];
}

async function getProductosByCategoria(categoria) {
    const result = await conection.query('SELECT * FROM productos WHERE categoria = ?', [categoria]);
    return result[0];
}

async function createProducto(nombre, descripcion, precio, imagen, categoria) {
    const result = await conection.query('INSERT INTO productos (nombre, descripcion, precio, imagen, categoria) VALUES (?, ?, ?, ?, ?)', [nombre, descripcion, precio, imagen, categoria]);
    return result[0];
}

async function updateProducto(
    id,
    nombre,
    descripcion,
    precio,
    imagen,
    categoria
) {

    let campos = [];
    let valores = [];

    if (nombre !== undefined) {
        campos.push('nombre = ?');
        valores.push(nombre);
    }

    if (descripcion !== undefined) {
        campos.push('descripcion = ?');
        valores.push(descripcion);
    }

    if (precio !== undefined) {
        campos.push('precio = ?');
        valores.push(precio);
    }

    if (imagen !== undefined) {
        campos.push('imagen = ?');
        valores.push(imagen);
    }

    if (categoria !== undefined) {
        campos.push('categoria = ?');
        valores.push(categoria);
    }

    if (campos.length === 0) {
        throw new Error('No hay campos para actualizar');
    }

    valores.push(id);

    const query = `
        UPDATE productos
        SET ${campos.join(', ')}
        WHERE id = ?
    `;

    const result = await conection.query(query, valores);

    return result[0];
}

async function deleteProducto(id) {
    const result = await conection.query('DELETE FROM productos WHERE id = ?', [id]);
    return result[0];
}

module.exports = {
    getProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto,
    getProductosByCategoria
};
