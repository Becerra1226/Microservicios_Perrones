const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const usuariosModel = require('../models/usuariosModel');

//=======================================
// obtener todos los usuarios
//=======================================

router.get('/usuarios', async (req, res) => {

    try {
        var result = await usuariosModel.getUsuarios();
        res.json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener usuarios'
        });
    }
});

//=======================================
// obtener usuario por id
//=======================================

router.get('/usuarios/:id', async (req, res) => {

    try {
        const id = req.params.id;
        var result = await usuariosModel.getUsuarioById(id);

        if (!result || result.length === 0) {
            res.status(404).json({
                error: 'Usuario no encontrado'
            });
        } else {
            res.json(result);
        }
    }
    catch (error) {

        console.error(error);
        res.status(500).json({
            error: 'Error al obtener usuario'
        });
    }
});

//=======================================
// crear usuario
//=======================================

router.post('/usuarios', async (req, res) => {
    try {
        const { nombre, apellido, correo, telefono, password, rol } = req.body;

        if (!nombre || !apellido || !correo || !telefono || !password || !rol) {
            return res.status(400).json({
                error: 'Faltan datos obligatorios'
            });
        }

        // Validar formato del correo
        const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexCorreo.test(correo)) {
            return res.status(400).json({
                error: 'Correo electrónico inválido'
            });
        }

        // Validar que el correo no exista
        const usuarioExistente = await usuariosModel.getUsuarioByCorreo(correo);
        if (usuarioExistente.length > 0) {
            return res.status(400).json({
                error: 'El correo ya está registrado'
            });
        }

        // Validar contraseña
        const regexPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if (!regexPassword.test(password)) {
            return res.status(400).json({
                error: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.'
            });
        }

        // Validar rol
        const rolesValidos = ['ADMIN', 'CAJERO'];
        if (!rolesValidos.includes(rol)) {
            return res.status(400).json({
                error: 'Rol inválido'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await usuariosModel.createUsuario(
            nombre,
            apellido,
            correo,
            telefono,
            passwordHash,
            rol
        );

        res.status(201).json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al crear usuario'
        });
    }
});

//=======================================
// editar usuario
//=======================================

router.patch('/usuarios/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, apellido, correo, telefono, password, rol } = req.body;
        if (rol){ const roles_validos = ['admin', 'usuario'];
            if (!roles_validos.includes(rol)) {
                return res.status(400).json({
                    error: 'Rol inválido'
                });
            }
        }

    if (correo) {
        const usuarioExistente = await usuariosModel.getUsuarioByCorreo(correo);
        if (
            usuarioExistente.length > 0 &&
            usuarioExistente[0].id != id
        ) {
            return res.status(400).json({
                error: 'El correo ya está registrado'
            });
        }
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(correo)) {

        return res.status(400).json({
            error: 'Correo electrónico inválido'
        });

    }

    var result = await usuariosModel.updateUsuario(id, nombre, apellido, correo, telefono, password, rol);
    if (result.affectedRows === 0) {
        return res.status(404).json({
            error: 'Usuario no encontrado'
        });
    }

    res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al actualizar usuario'
        });
    }
});

//=======================================
// eliminar usuario
//=======================================

router.delete('/usuarios/:id', async (req, res) => {
    try {
        const id = req.params.id;
        var result = await usuariosModel.deleteUsuario(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }
        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al eliminar usuario'
        });
    }
});

//=======================================
// iniciar sesión (login)
//=======================================

router.post('/usuarios/login', async (req, res) => {
    try {
        const { correo, password } = req.body;

        // 1. Validar que envíen ambos datos
        if (!correo || !password) {
            return res.status(400).json({
                error: 'El correo y la contraseña son obligatorios'
            });
        }

        // 2. Buscar al usuario por su correo
        const usuarios = await usuariosModel.getUsuarioByCorreo(correo);
        
        if (usuarios.length === 0) {
            // Usamos un mensaje genérico por seguridad (no confirmar si el correo existe o no)
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        const usuario = usuarios[0];

        // 3. Comparar la contraseña ingresada con el hash guardado en la BD
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // 4. Por seguridad, eliminamos la contraseña del objeto antes de enviarlo al frontend
        delete usuario.password;

        // 5. Retornamos los datos del usuario logueado
        res.status(200).json(usuario);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al iniciar sesión'
        });
    }
});

module.exports = router;