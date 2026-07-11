import axios from 'axios';

const API_URL = import.meta.env.VITE_API_USUARIOS;

export const iniciarSesion = async (correo, password) => {
  try {
    // Esto enviará los datos a http://localhost:3003/usuarios/login
    const respuesta = await axios.post(`${API_URL}/usuarios/login`, { correo, password });
    return respuesta.data; 
  } catch (error) {
    // Si el backend responde con un error (ej. 400 o 401), lo capturamos aquí
    throw error.response?.data?.error || 'Error al conectar con el servidor';
  }
};