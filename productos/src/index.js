const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const productoscontroller = require("./controllers/productosController");
const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(productoscontroller);
app.listen(3001, () => {
    console.log('Servidor escuchando en el puerto 3001');
});