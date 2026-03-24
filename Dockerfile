FROM node:20
WORKDIR /app

# 1. Instalar dependencias del servidor
COPY package*.json ./
RUN npm ci

# 2. Instalar dependencias del frontend y compilar
COPY web/package*.json ./web/
RUN cd web && npm ci

# 3. Copiar todo el código
COPY . .

# 4. Compilar el frontend con Vite
RUN cd web && npm run build:prod

EXPOSE 3000
CMD ["node", "index.js"]