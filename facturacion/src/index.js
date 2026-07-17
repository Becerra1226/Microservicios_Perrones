require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const facturacionController = require("./controllers/facturacionController");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use(facturacionController);

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
