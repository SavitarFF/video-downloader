# Usar una imagen completa de Node.js (más robusta que slim)
FROM node:18

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
COPY package.json ./

# Eliminar el lockfile de Windows (si existiera) y reinstalar limpio
RUN rm -f package-lock.json && npm install

# Copiar el resto de la aplicación
COPY . .

# Exponer el puerto que usa la app
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
