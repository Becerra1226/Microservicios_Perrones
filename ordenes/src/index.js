const express = require('express');
const morgan = require('morgan');
const ordenesController = require("./controllers/ordenesController");
const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(ordenesController);
app.listen(3002, () => {
    console.log('Servidor escuchando en el puerto 3002');
});