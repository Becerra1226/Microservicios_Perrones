const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const facturacionController = require('./controllers/facturacionController');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use(facturacionController);

app.listen(3004, () => {
    console.log('Servidor escuchando en el puerto 3004');
});