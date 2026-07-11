const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const usuariosController = require('./controllers/usuariosController');
const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(usuariosController);
app.listen(3003, () => {
    console.log('Servidor de usuarios escuchando en el puerto 3003');
});