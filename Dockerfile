# Etapa 1: Compilación de la aplicación Vite + React
FROM node:20-alpine AS build

WORKDIR /app

# Copiar manifiestos e instalar dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Variable de entorno de Vite para la API (ruta relativa para proxy inverso)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Copiar el código fuente y compilar los archivos estáticos
COPY . .
RUN npm run build

# Etapa 2: Servidor web ultraligero Nginx
FROM nginx:alpine

# Copiar configuración personalizada de Nginx con Reverse Proxy para /api/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el bundle estático compilado desde la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto de Vite
EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
