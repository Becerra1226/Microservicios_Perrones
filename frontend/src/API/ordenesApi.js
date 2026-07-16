// src/api/ordenesApi.js
import axios from 'axios';

// Usamos la variable de entorno de Vite, con un respaldo al puerto 3002 sin el '/api'
const API_URL = import.meta.env.VITE_API_ORDENES || 'http://localhost:3002';

export const crearOrden = async (datosOrden) => {
  try {
    // Esto enviará los datos directamente a http://localhost:3002/ordenes
    const respuesta = await axios.post(`${API_URL}/ordenes`, datosOrden);
    return respuesta.data; 
  } catch (error) {
    // Captura el error del backend (ej: "Debe enviar productos") de forma consistente
    throw error.response?.data?.error || 'Error al crear la orden en el servidor';
  }
};