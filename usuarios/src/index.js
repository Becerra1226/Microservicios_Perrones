require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const usuariosController = require("./controllers/usuariosController");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use(usuariosController);

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Servidor de usuarios escuchando en el puerto ${PORT}`);
});
