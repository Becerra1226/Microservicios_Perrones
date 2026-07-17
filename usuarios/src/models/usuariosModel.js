const mysql = require("mysql2/promise");
require("dotenv").config();

const conection = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
// =========================================
// Obtener todos los usuarios
// =========================================

async function getUsuarios() {
  const result = await conection.query(
    "SELECT id, nombre, apellido, correo, telefono, rol, fecha_creacion FROM usuarios",
  );
  return result[0];
}

// =========================================
// Obtener usuario por ID
// =========================================

async function getUsuarioById(id) {
  const result = await conection.query(
    "SELECT id, nombre, apellido, correo, telefono, rol, fecha_creacion FROM usuarios WHERE id = ?",
    [id],
  );
  return result[0];
}

// =========================================
// Obtener usuario por correo
// =========================================

async function getUsuarioByCorreo(correo) {
  const result = await conection.query(
    "SELECT * FROM usuarios WHERE correo = ?",
    [correo],
  );
  return result[0];
}

// =========================================
// Crear usuario
// =========================================

async function createUsuario(
  nombre,
  apellido,
  correo,
  telefono,
  password,
  rol,
) {
  const result = await conection.query(
    `INSERT INTO usuarios
        (nombre, apellido, correo, telefono, password, rol)
        VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, correo, telefono, password, rol],
  );
  return result[0];
}

// =========================================
// Actualizar usuario
// =========================================

async function updateUsuario(
  id,
  nombre,
  apellido,
  correo,
  telefono,
  password,
  rol,
) {
  let campos = [];
  let valores = [];
  if (nombre !== undefined) {
    campos.push("nombre = ?");
    valores.push(nombre);
  }
  if (apellido !== undefined) {
    campos.push("apellido = ?");
    valores.push(apellido);
  }
  if (correo !== undefined) {
    campos.push("correo = ?");
    valores.push(correo);
  }
  if (telefono !== undefined) {
    campos.push("telefono = ?");
    valores.push(telefono);
  }
  if (password !== undefined) {
    campos.push("password = ?");
    valores.push(password);
  }
  if (rol !== undefined) {
    campos.push("rol = ?");
    valores.push(rol);
  }
  valores.push(id);
  const result = await conection.query(
    `UPDATE usuarios
        SET ${campos.join(", ")}
        WHERE id = ?`,
    valores,
  );
  return result[0];
}

// =========================================
// Eliminar usuario
// =========================================

async function deleteUsuario(id) {
  const result = await conection.query("DELETE FROM usuarios WHERE id = ?", [
    id,
  ]);
  return result[0];
}

module.exports = {
  getUsuarios,
  getUsuarioById,
  getUsuarioByCorreo,
  createUsuario,
  updateUsuario,
  deleteUsuario,
};
