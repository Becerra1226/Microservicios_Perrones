const express = require('express');
const router = express.Router();
const axios = require('axios');
const idempotencyMiddleware = require('../middlewares/idempotency');
const idempotencyModel = require('../models/idempotencyModel');

const facturacionModel = require('../models/facturacionModel');


// =====================================
// Obtener todas las facturas
// =====================================
router.get('/facturas', async (req, res) => {

    try {

        const result = await facturacionModel.getFacturas();

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error al obtener las facturas'
        });

    }

});


// =====================================
// Obtener una factura por ID
// =====================================
router.get('/facturas/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const result = await facturacionModel.getFacturaById(id);

        if (!result || result.length === 0) {

            return res.status(404).json({
                error: 'Factura no encontrada'
            });

        }

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error al obtener la factura'
        });

    }

});


// =====================================
// Crear factura
// =====================================
router.post(
    '/facturas',
    idempotencyMiddleware,
    async (req, res) => {

    try {

        const { orden_id, metodo_pago, propina } = req.body;

        if (!orden_id || !metodo_pago) {

            return res.status(400).json({
                error: 'orden_id y metodo_pago son obligatorios'
            });

        }

        const metodosValidos = [
            'EFECTIVO',
            'TARJETA',
            'TRANSFERENCIA'
        ];

        if (!metodosValidos.includes(metodo_pago)) {

            return res.status(400).json({
                error: 'Método de pago inválido'
            });

        }

        // Verificar si la orden ya fue facturada
        const facturaExistente = await facturacionModel.getFacturaByOrdenId(orden_id);

        if (facturaExistente.length > 0) {

            return res.status(400).json({
                error: 'La orden ya fue facturada'
            });

        }

        // Obtener la orden desde el MS Órdenes
        const response = await axios.get(
            `http://localhost:3002/ordenes/${orden_id}`
        );

        const orden = response.data;

        if (!orden) {

            return res.status(404).json({
                error: 'Orden no encontrada'
            });

        }

        const subtotal = Number(orden.subtotal);
        const valorPropina = Number(propina) || 0;
        const total = subtotal + valorPropina;

        // Crear la factura (sin código todavía)
        const result = await facturacionModel.createFactura(
            orden_id,
            subtotal,
            valorPropina,
            total,
            metodo_pago
        );

        // Obtener el ID generado por MySQL
        const facturaId = result.insertId;

        // Generar el código profesional
        const codigo = `FAC-${String(facturaId).padStart(6, '0')}`;

        // Guardar el código en la factura
        await facturacionModel.updateCodigoFactura(
            facturaId,
            codigo
        );

       const respuesta = {

    mensaje: 'Factura creada correctamente',

    factura_id: facturaId,

    codigo,

    subtotal,

    propina: valorPropina,

    total,

    metodo_pago

};

await idempotencyModel.saveKey(
    req.idempotencyKey,
    req.originalUrl,
    respuesta
);

res.status(201).json(respuesta);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

});

module.exports = router;