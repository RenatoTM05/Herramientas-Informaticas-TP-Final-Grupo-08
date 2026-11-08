# =============================================================================
# Backend Node.js / Express - Imagen optimizada para producción
# =============================================================================
FROM node:22-alpine

# Definir variables de entorno para producción
ENV NODE_ENV=production \
    PORT=3000

# Directorio de trabajo en el contenedor
WORKDIR /app

# Asegurar propiedad del directorio para el usuario sin privilegios root
RUN chown -R node:node /app

# Copiar manifiestos de dependencias con los permisos adecuados
COPY --chown=node:node package*.json ./

# Cambiar a usuario non-root por principios de mínimo privilegio y seguridad (HU-11 / DoD)
USER node

# Instalar dependencias estrictamente de producción y purgar caché
RUN npm ci --omit=dev && npm cache clean --force

# Copiar el código fuente de la aplicación manteniendo los permisos non-root
COPY --chown=node:node . .

# Exponer el puerto del servicio Express
EXPOSE 3000

# Comando de arranque de la aplicación
CMD ["node", "index.js"]
