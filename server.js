const express = require('express');
const cors = require('cors');
const path = require('path');
const ytDlpWrap = require('youtube-dl-exec');
const fs = require('fs');
const ytDlpPath = path.join(__dirname, 'yt-dlp.exe');
const ytDlp = fs.existsSync(ytDlpPath) ? ytDlpWrap.create(ytDlpPath) : ytDlpWrap;


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para obtener la información del video
app.post('/api/info', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Debes proporcionar una URL válida.' });
    }
        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
        const dlpOptions = {
            dumpJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            noPlaylist: true,
            preferFreeFormats: true,
            userAgent: isYouTube 
                ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
            referer: isYouTube ? 'https://www.youtube.com/' : url
        };

        if (isYouTube) {
            dlpOptions.geoPrecedence = true;
            dlpOptions.noVideoMultistreams = true;
            // Intentar usar un cliente diferente para evitar bloqueo de "Sign in"
            dlpOptions.extractorArgs = 'youtube:player_client=ios,web';
        }

    try {
        console.log(`Obteniendo información para: ${url}`);
        const info = await ytDlp(url, dlpOptions);

        // Extraer formatos relevantes
        const formats = info.formats
            .filter(f => f.video_ext === 'mp4' || f.audio_ext !== 'none')
            .map(f => ({
                format_id: f.format_id,
                ext: f.ext,
                resolution: f.resolution,
                filesize: f.filesize,
                has_video: f.video_ext !== 'none',
                has_audio: f.audio_ext !== 'none',
                format_note: f.format_note,
                vcodec: f.vcodec,
                acodec: f.acodec
            }));

        const responseData = {
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            platform: info.extractor_key,
            formats: formats
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error al obtener la info del video:', error.message);
        res.status(500).json({ error: 'Error al procesar el video. Verifica que la URL sea válida o intenta de nuevo.' });
    }
});

// Ruta para descargar el video/audio
app.get('/api/download', (req, res) => {
    const { url, formatId, type, title } = req.query;

    if (!url) {
        return res.status(400).send('URL es requerida.');
    }

    let filename = title ? title.replace(/[^\w\s]/gi, '') : 'video';
    filename = filename.trim().substring(0, 50); // Límite de caracteres
    
    // Identificador único para los archivos temporales de esta descarga
    const tempId = Date.now() + Math.floor(Math.random() * 10000);
    let tempFilePath;

    // Configuración base de yt-dlp
    const dlpOptions = {
        noWarnings: true,
        noCheckCertificate: true,
        noPlaylist: true,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0'
    };

    if (type === 'audio') {
        filename += '.mp3';
        tempFilePath = path.join(__dirname, `temp_${tempId}.mp3`);
        dlpOptions.extractAudio = true;
        dlpOptions.audioFormat = 'mp3';
        dlpOptions.o = tempFilePath;
    } else {
        filename += '.mp4';
        tempFilePath = path.join(__dirname, `temp_${tempId}.mp4`);
        dlpOptions.format = formatId || 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
        dlpOptions.mergeOutputFormat = 'mp4';
        dlpOptions.o = tempFilePath;
    }

    console.log(`Iniciando descarga: ${filename} (Tipo: ${type}, Formato: ${formatId})`);

    const downloadProcess = ytDlp.exec(url, dlpOptions);

    downloadProcess.stdout.on('data', (data) => {
        // En lugar de enviarlo todo al usuario, mostramos progreso en el server
        // console.log(`[yt-dlp] ${data.toString().trim()}`);
    });

    downloadProcess.on('close', (code) => {
        if (code === 0 && fs.existsSync(tempFilePath)) {
            res.download(tempFilePath, filename, (err) => {
                if (err) {
                    console.error('Error enviando archivo a cliente:', err);
                }
                limpiarTemporales(tempId);
            });
        } else {
            console.error(`Proceso finalizó con código ${code} o no se generó el archivo.`);
            if (!res.headersSent) {
                res.status(500).send('Error al procesar el archivo en el servidor.');
            }
            limpiarTemporales(tempId);
        }
    });

    downloadProcess.on('error', (err) => {
        console.error('Error en proceso de descarga:', err);
        if (!res.headersSent) {
            res.status(500).send('Error externo al descargar el archivo.');
        }
        limpiarTemporales(tempId);
    });

    // Cerrar el proceso si el usuario cancela la conexión de forma temprana
    req.on('close', () => {
        if (!res.headersSent && !res.writableFinished) {
            console.log('Cliente cerró la conexión prematuramente, terminando proceso...');
            if (downloadProcess && !downloadProcess.killed) {
                downloadProcess.kill('SIGINT');
            }
            // Dar tiempo a que el proceso muera para limpiar parciales
            setTimeout(() => limpiarTemporales(tempId), 2000);
        }
    });

    // Función auxiliar para borrar cualquier "temp_1234.mp4.part", etc.
    function limpiarTemporales(id) {
        fs.readdir(__dirname, (err, files) => {
            if (err) return;
            files.forEach(file => {
                if (file.startsWith(`temp_${id}`)) {
                    fs.unlink(path.join(__dirname, file), () => {});
                }
            });
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
