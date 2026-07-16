import axios from "axios";

// Base URL configurada en el .env
const apiFacturacion = axios.create({
  baseURL: import.meta.env.VITE_API_FACTURACION_URL || "http://localhost:3004",
});

export const crearFactura = async (payload, idempotencyKey) => {
  try {
    const response = await apiFacturacion.post("/facturas", payload, {
      headers: {
        "Idempotency-Key": idempotencyKey, // Header obligatorio según tu middleware
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al crear factura:", error.response?.data || error);
    throw error.response?.data?.error || "Error al procesar la facturación";
  }
};
