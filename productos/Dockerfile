# Imagen oficial de Node.js
FROM node:22-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del proyecto
COPY . .

# Exponer el puerto del microservicio
EXPOSE 3001

# Iniciar la aplicación
CMD ["npm", "start"]