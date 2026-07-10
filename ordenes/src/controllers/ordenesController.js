const express = require('express');
const router = express.Router();
const axios = require('axios');
const ordenesModel = require('../models/ordenesModel');

router.get('/ordenes', async (req, res) => {

    try {

        var result = await ordenesModel.getOrdenes();

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error al obtener órdenes'
        });

    }

});


router.get('/ordenes/:id', async (req, res) => {

    try {

        const id = req.params.id;

        // Obtener la orden
        const orden = await ordenesModel.getOrdenById(id);

        if (!orden || orden.length === 0) {

            return res.status(404).json({
                error: 'Orden no encontrada'
            });

        }

        // Obtener el detalle de la orden
        const detalle = await ordenesModel.getDetalleOrden(id);

        // Agregar el detalle al objeto de la orden
        orden[0].detalle = detalle;

        res.json(orden[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error al obtener la orden'
        });

    }

});


router.post('/ordenes', async (req, res) => {

    try {

        const productos = req.body.productos;

        if (!productos || productos.length === 0) {

            return res.status(400).json({
                error: 'Debe enviar productos'
            });

        }

        let subtotalGeneral = 0;

        let detalleOrden = [];

        // =========================================
        // Obtener productos desde MS Productos
        // =========================================
        for (const item of productos) {

            const producto_id = item.producto_id;
            const cantidad = item.cantidad;

            if (!producto_id || !cantidad) {

                return res.status(400).json({
                    error: 'producto_id y cantidad son obligatorios'
                });

            }

            const response = await axios.get(
                `http://localhost:3001/productos/${producto_id}`
            );

            const producto = response.data;

            if (!producto) {

                return res.status(404).json({
                    error: `Producto ${producto_id} no encontrado`
                });

            }

            const subtotal = producto.precio * cantidad;

            subtotalGeneral += subtotal;

            detalleOrden.push({
                producto_id: producto.id,
                nombre_producto: producto.nombre,
                precio_unitario: producto.precio,
                cantidad: cantidad,
                subtotal: subtotal
            });

        }

        // =========================================
        // Crear orden
        // =========================================
        const codigo = `ORD-${Date.now()}`;

        var ordenResult = await ordenesModel.createOrden(
            codigo,
            subtotalGeneral,
            subtotalGeneral,
            'PAGADA'
        );

        const orden_id = ordenResult.insertId;

        // =========================================
        // Crear detalles
        // =========================================
        for (const item of detalleOrden) {

            await ordenesModel.createDetalleOrden(
                orden_id,
                item.producto_id,
                item.nombre_producto,
                item.precio_unitario,
                item.cantidad,
                item.subtotal
            );

        }

        res.status(201).json({
            mensaje: 'Orden creada correctamente',
            orden_id: orden_id,
            subtotal: subtotalGeneral,
            total: subtotalGeneral,
            productos: detalleOrden
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });


    }

});

router.patch('/ordenes/:id/estado', async (req, res) => {

    try {

        const id = req.params.id;
        const { estado } = req.body;

        const estadosValidos = [
            'PAGADA',
            'ENTREGADA',
            'CANCELADA'
        ];

        // Validar que se envíe un estado
        if (!estado) {
            return res.status(400).json({
                error: 'El estado es obligatorio'
            });
        }

        // Validar estado
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: 'Estado inválido'
            });
        }

        const result = await ordenesModel.updateEstadoOrden(id, estado);

        // Verificar si la orden existe
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Orden no encontrada'
            });
        }

        res.json({
            mensaje: 'Estado actualizado correctamente'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error al actualizar el estado de la orden'
        });

    }

});
module.exports = router;