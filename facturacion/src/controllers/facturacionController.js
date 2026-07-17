const express = require("express");
const router = express.Router();
const axios = require("axios");

const idempotencyMiddleware = require("../middlewares/idempotency");
const idempotencyModel = require("../models/idempotencyModel");

const facturacionModel = require("../models/facturacionModel");

// =====================================
// Obtener todas las facturas
// =====================================
router.get("/facturas", async (req, res) => {
  try {
    const result = await facturacionModel.getFacturas();

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error al obtener las facturas",
    });
  }
});

// =====================================
// Obtener una factura por ID
// =====================================
router.get("/facturas/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const factura = await facturacionModel.getFacturaById(id);

    if (!factura) {
      return res.status(404).json({
        error: "Factura no encontrada",
      });
    }

    res.json(factura);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error al obtener la factura",
    });
  }
});

// =====================================
// Crear factura
// =====================================
router.post("/facturas", idempotencyMiddleware, async (req, res) => {
  try {
    const { orden_id, propina, pagos } = req.body;

    if (!orden_id || !pagos || pagos.length === 0) {
      return res.status(400).json({
        error: "orden_id y pagos son obligatorios",
      });
    }

    const metodosValidos = ["EFECTIVO", "TARJETA", "TRANSFERENCIA"];

    let sumaPagos = 0;

    for (const pago of pagos) {
      if (!metodosValidos.includes(pago.metodo_pago)) {
        return res.status(400).json({
          error: `Método de pago inválido: ${pago.metodo_pago}`,
        });
      }

      if (Number(pago.valor) <= 0) {
        return res.status(400).json({
          error: "Todos los pagos deben ser mayores que cero",
        });
      }

      sumaPagos += Number(pago.valor);
    }

    // =====================================
    // Verificar si la orden ya fue facturada
    // =====================================

    const facturaExistente =
      await facturacionModel.getFacturaByOrdenId(orden_id);

    if (facturaExistente.length > 0) {
      return res.status(400).json({
        error: "La orden ya fue facturada",
      });
    }

    // =====================================
    // Obtener la orden desde MS Órdenes
    // =====================================

    const response = await axios.get(
      `${process.env.ORDENES_URL}/ordenes/${orden_id}`,
    );

    const orden = response.data;

    if (!orden) {
      return res.status(404).json({
        error: "Orden no encontrada",
      });
    }

    const subtotal = Number(orden.subtotal);

    const valorPropina = Number(propina) || 0;

    const total = subtotal + valorPropina;

    // =====================================
    // Validar suma de pagos
    // =====================================

    if (sumaPagos !== total) {
      return res.status(400).json({
        error: "La suma de los pagos no coincide con el total de la factura",
      });
    }

    // =====================================
    // Crear factura
    // =====================================

    const result = await facturacionModel.createFactura(
      orden_id,
      subtotal,
      valorPropina,
      total,
    );

    const facturaId = result.insertId;

    // =====================================
    // Generar código
    // =====================================

    const codigo = `FAC-${String(facturaId).padStart(6, "0")}`;

    await facturacionModel.updateCodigoFactura(facturaId, codigo);

    // =====================================
    // Registrar pagos
    // =====================================

    for (const pago of pagos) {
      await facturacionModel.createPago(
        facturaId,
        pago.metodo_pago,
        pago.valor,
      );
    }

    // =====================================
    // Respuesta
    // =====================================

    const respuesta = {
      mensaje: "Factura creada correctamente",

      factura_id: facturaId,

      codigo,

      subtotal,

      propina: valorPropina,

      total,

      pagos,
    };

    // =====================================
    // Guardar respuesta para idempotencia
    // =====================================

    await idempotencyModel.saveKey(
      req.idempotencyKey,
      req.originalUrl,
      respuesta,
    );

    res.status(201).json(respuesta);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
