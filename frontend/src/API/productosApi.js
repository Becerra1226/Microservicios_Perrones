import axios from 'axios';

const API_URL = import.meta.env.VITE_API_PRODUCTOS;

export const obtenerProductos = async () => {
    try {
        const respuesta = await axios.get(`${API_URL}/productos`);
        return respuesta.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al cargar los productos';
    }
};