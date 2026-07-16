const mysql = require("mysql2/promise");

const conection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "facturacion",
});

async function getFacturas() {
  // Obtener todas las facturas
  const [facturas] = await conection.query(
    `SELECT *
         FROM facturas
         ORDER BY fecha_facturacion DESC`,
  );

  // Obtener todos los pagos
  const [pagos] = await conection.query(
    `SELECT
            factura_id,
            metodo_pago,
            valor,
            fecha_pago
         FROM pagos`,
  );

  // Agrupar pagos por factura
  const pagosPorFactura = {};

  for (const pago of pagos) {
    if (!pagosPorFactura[pago.factura_id]) {
      pagosPorFactura[pago.factura_id] = [];
    }

    pagosPorFactura[pago.factura_id].push({
      metodo_pago: pago.metodo_pago,
      valor: pago.valor,
      fecha_pago: pago.fecha_pago,
    });
  }

  // Agregar pagos a cada factura
  for (const factura of facturas) {
    factura.pagos = pagosPorFactura[factura.id] || [];
  }

  return facturas;
}

async function getFacturaById(id) {
  // Obtener la factura
  const [facturas] = await conection.query(
    `SELECT * FROM facturas
         WHERE id = ?`,
    [id],
  );

  if (facturas.length === 0) {
    return null;
  }

  const factura = facturas[0];

  // Obtener todos los pagos asociados
  const [pagos] = await conection.query(
    `SELECT
            metodo_pago,
            valor,
            fecha_pago
         FROM pagos
         WHERE factura_id = ?`,
    [id],
  );

  factura.pagos = pagos;

  return factura;
}

async function getFacturaByOrdenId(orden_id) {
  const result = await conection.query(
    "SELECT * FROM facturas WHERE orden_id = ?",
    [orden_id],
  );

  return result[0];
}

// =====================================
// Crear factura
// =====================================
async function createFactura(orden_id, subtotal, propina, total) {
  const result = await conection.query(
    `INSERT INTO facturas
        (orden_id, subtotal, propina, total)
        VALUES (?, ?, ?, ?)`,
    [orden_id, subtotal, propina, total],
  );

  return result[0];
}

// =====================================
// Crear un pago
// =====================================
async function createPago(factura_id, metodo_pago, valor) {
  const result = await conection.query(
    `INSERT INTO pagos
        (factura_id, metodo_pago, valor)
        VALUES (?, ?, ?)`,
    [factura_id, metodo_pago, valor],
  );

  return result[0];
}

// =====================================
// Actualizar código de la factura
// =====================================
async function updateCodigoFactura(id, codigo) {
  const result = await conection.query(
    `UPDATE facturas
         SET codigo = ?
         WHERE id = ?`,
    [codigo, id],
  );

  return result[0];
}

module.exports = {
  getFacturas,
  getFacturaById,
  getFacturaByOrdenId,
  createFactura,
  createPago,
  updateCodigoFactura,
};
