require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const productoscontroller = require("./controllers/productosController");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use(productoscontroller);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
