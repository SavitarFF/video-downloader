# VDownloader - Aplicación Web de Descarga de Videos

Una aplicación moderna con dashboard/SaaS look diseñada para descargar videos y audios de plataformas como YouTube, TikTok, Facebook, etc.

## Requisitos Previos

Para ejecutar este proyecto de forma local, necesitas tener instalado:

1. **Node.js** (v14 o superior) - [Descargar Node.js](https://nodejs.org/)
2. (Opcional pero recomendado) **Python 3** - Requerido asiduamente por `yt-dlp` en ciertos sistemas operativos.
3. (Opcional) **FFmpeg** - Recomendado si `yt-dlp` necesita fusionar audio y video en resoluciones altas (1080p+). [Descargar FFmpeg](https://ffmpeg.org/download.html)

> **Nota sobre `yt-dlp`**: El paquete de npm `yt-dlp-exec` utilizado en este proyecto intentará descargar automáticamente el binario de `yt-dlp` en la primera ejecución. Si tienes algún problema con la versión descargada, puedes instalar `yt-dlp` globalmente en tu sistema.

## Instalación y Ejecución

1. Abre tu terminal y navega al directorio del proyecto:
   ```bash
   cd c:\antigravityprojects\video-downloader
   ```

2. Instala las dependencias del proyecto usando npm:
   ```bash
   npm install
   ```
   Esto instalará `express` (servidor backend), `cors` (para manejar peticiones cross-origin) y `yt-dlp-exec` (el puente con la librería mágica de descargas).

3. Inicia el servidor:
   ```bash
   npm start
   ```

4. Abre tu navegador web y visita:
   ```
   http://localhost:3000
   ```

## Características

- Interfaz moderna tipo dashboard, modo oscuro.
- Extrae metadatos (título, duración, calidad, miniatura) antes de descargar.
- Permite seleccionar la resolución de video que deseas descargar.
- Permite descargar el audio de forma independiente (MP3).
- Completamente responsiva.

## Estructura del Proyecto

```text
video-downloader/
├── package.json        # Dependencias y scripts
├── server.js           # API y Backend en Express
├── public/             # Archivos del Frontend estáticos
│   ├── index.html      # Estructura de la web
│   ├── css/
│   │   └── style.css   # Estilos premium y responsive
│   └── js/
│       └── app.js      # Lógica del cliente, llamadas API con axios
└── README.md           # Este archivo
```
