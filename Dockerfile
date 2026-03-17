# Usar una imagen base de Node.js
FROM node:18-slim

# Instalar dependencias del sistema: Python3 (para yt-dlp), FFmpeg y herramientas de red
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de Node.js (ignorar el lockfile si hay conflicto de entorno)
RUN npm install --no-package-lock

# Copiar el resto de la aplicación
COPY . .

# Exponer el puerto que usa la app
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
