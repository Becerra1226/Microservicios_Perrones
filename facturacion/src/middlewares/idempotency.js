const idempotencyModel = require('../models/idempotencyModel');

async function idempotencyMiddleware(req, res, next) {

    try {

        const idempotencyKey = req.header('Idempotency-Key');

        if (!idempotencyKey) {

            return res.status(400).json({
                error: 'Debe enviar el header Idempotency-Key'
            });

        }

        const resultado = await idempotencyModel.getKey(idempotencyKey);

        if (resultado.length > 0) {

            return res.status(200).json(
                JSON.parse(resultado[0].response)
            );

        }

        req.idempotencyKey = idempotencyKey;

        next();

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error en middleware de idempotencia'
        });

    }

}

module.exports = idempotencyMiddleware;