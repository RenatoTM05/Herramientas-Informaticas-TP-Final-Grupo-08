# =============================================================================
# Stage 1: Compilación de la aplicación Angular con Node.js
# =============================================================================
FROM node:22-alpine AS build

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias respetando el árbol de dependencias
RUN npm ci --legacy-peer-deps

# Copiar el código fuente del frontend
COPY . .

# Compilar para producción (Angular 21 Application Builder)
RUN npm run build -- --configuration production

# =============================================================================
# Stage 2: Servidor web Nginx Alpine de alta eficiencia para producción
# =============================================================================
FROM nginx:alpine

# Copiar configuración personalizada optimizada para SPA y compresión gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los estáticos compilados desde el Stage 1
COPY --from=build /app/dist/TPFinalFront/browser /usr/share/nginx/html

# Exponer puerto HTTP
EXPOSE 80

# Ejecutar Nginx en foreground
CMD ["nginx", "-g", "daemon off;"]
