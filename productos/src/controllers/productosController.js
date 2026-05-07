const {Router} = require('express');
const router = Router();
const productosModel = require('../models/productosModel');

router.get('/productos', async (req, res) => {
    var result;

    result = await productosModel.getProductos();
    res.json(result);
});

router.get('/productos/:id', async (req, res) => {
    const id = req.params.id;
    var result;
    result = await productosModel.getProductoById(id);
    res.json(result[0]); // Devuelve el primer producto encontrado con el ID especificado
});

router.get('/productos/categoria/:categoria', async (req, res) => {
    const categoria = req.params.categoria;
    var result;
    result = await productosModel.getProductosByCategoria(categoria);
    res.json(result);
});

router.patch('/productos/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const {
            nombre,
            descripcion,
            precio,
            imagen,
            categoria
        } = req.body;

        const result = await productosModel.updateProducto(
            id,
            nombre,
            descripcion,
            precio,
            imagen,
            categoria
        );

        res.json({
            mensaje: 'Producto actualizado',
            result
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error al actualizar producto'
        });

    }

});
router.post('/productos', async (req, res) => {

    try {

        const { 
            nombre,
            descripcion,
            precio,
            imagen,
            categoria
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || !precio || !categoria) {
            return res.status(400).json({
                error: 'Nombre, precio y categoría son obligatorios'
            });
        }

        // Categorías permitidas
        const categoriasValidas = [
            'Perros',
            'Perras',
            'Desgranados/Salchipapa',
            'Bebidas',
            'Entradas',
            'Postres',
            'Domicilios',
            'Extras'
        ];

        // Validar categoría
        if (!categoriasValidas.includes(categoria)) {
            return res.status(400).json({
                error: 'Categoría inválida'
            });
        }

        // Crear producto
        const result = await productosModel.createProducto(
            nombre,
            descripcion,
            precio,
            imagen,
            categoria
        );

        res.status(201).json({
            mensaje: 'Producto creado correctamente',
            producto: result
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error al crear producto'
        });

    }
});

router.delete('/productos/:id', async (req, res) => {
    const id = req.params.id;
    var result = await productosModel.deleteProducto(id);
    res.json(result);
});

module.exports = router;