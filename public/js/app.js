document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-form');
    const inputUrl = document.getElementById('video-url');
    const btnProcess = document.getElementById('process-btn');
    const btnText = btnProcess.querySelector('.btn-text');
    const spinner = btnProcess.querySelector('.spinner');
    const errorMsg = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    const skeleton = document.getElementById('skeleton-loader');
    const resultArea = document.getElementById('result-area');
    
    // Result elements
    const resThumbnail = document.getElementById('res-thumbnail');
    const resDuration = document.getElementById('res-duration');
    const resPlatform = document.getElementById('res-platform');
    const resTitle = document.getElementById('res-title');
    const videoQualitySelect = document.getElementById('video-quality');
    const btnDownloadVideo = document.getElementById('btn-download-video');
    const btnDownloadAudio = document.getElementById('btn-download-audio');

    let currentVideoData = null;
    let currentUrl = '';

    // Utilidades
    const formatDuration = (seconds) => {
        if (!seconds) return '00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return 'N/A';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const capitalize = (str) => {
        if (!str) return 'Video';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const showError = (msg) => {
        errorText.textContent = msg;
        errorMsg.classList.remove('hidden');
        setLoading(false);
    };

    const hideError = () => {
        errorMsg.classList.add('hidden');
    };

    const setLoading = (isLoading) => {
        if (isLoading) {
            btnText.classList.add('hidden');
            spinner.classList.remove('hidden');
            btnProcess.disabled = true;
            resultArea.classList.add('hidden');
            skeleton.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            btnProcess.disabled = false;
            skeleton.classList.add('hidden');
        }
    };

    // Procesar la URL
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = inputUrl.value.trim();
        if (!url) return;

        hideError();
        setLoading(true);
        currentUrl = url;

        try {
            const response = await axios.post('/api/info', { url });
            const data = response.data;
            
            currentVideoData = data;
            renderVideoInfo(data);
            
            setLoading(false);
            resultArea.classList.remove('hidden');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || 'No se pudo procesar el video. Revisa la URL e intenta nuevamente.';
            showError(msg);
        }
    });

    const renderVideoInfo = (data) => {
        resThumbnail.src = data.thumbnail || 'https://via.placeholder.com/640x360.png?text=Sin+Miniatura';
        resDuration.innerHTML = `<i class="fa-regular fa-clock"></i> ${formatDuration(data.duration)}`;
        resPlatform.innerHTML = `<i class="fa-solid fa-tag"></i> ${capitalize(data.platform)}`;
        resTitle.textContent = data.title;

        // Limpiar subopciones
        videoQualitySelect.innerHTML = '';

        // Filtrar y ordenar resoluciones
        const videoFormats = data.formats
            .filter(f => f.has_video)
            .sort((a, b) => {
                const heightA = a.resolution ? parseInt(a.resolution.split('x')[1]) || 0 : 0;
                const heightB = b.resolution ? parseInt(b.resolution.split('x')[1]) || 0 : 0;
                return heightB - heightA;
            });

        // Crear mapa único para resoluciones comunes (evitar duplicados de 1080p, etc)
        const uniqueResolutions = new Map();
        
        videoFormats.forEach(f => {
            if (!f.resolution || f.resolution === 'audio only') return;
            const resHeight = f.resolution.split('x')[1];
            if (resHeight) {
                const label = `${resHeight}p`;
                // Preferir las que tienen tamaño conocido de archivo o mejor codec
                if (!uniqueResolutions.has(label) || (!uniqueResolutions.get(label).filesize && f.filesize)) {
                    uniqueResolutions.set(label, {
                        ...f,
                        label: `${label} ${f.format_note ? `(${f.format_note})` : ''} ${f.filesize ? `- ${formatBytes(f.filesize)}` : ''}`
                    });
                }
            }
        });

        if (uniqueResolutions.size > 0) {
            uniqueResolutions.forEach((f, key) => {
                const option = document.createElement('option');
                // Generalmente para mejor compatibilidad se le dice a yt-dlp q descargue la resolución seleccionada + mejor audio
                const ytFormat = `bestvideo[height<=${key.replace('p', '')}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${key.replace('p', '')}][ext=mp4]/best`;
                option.value = ytFormat;
                option.textContent = f.label;
                videoQualitySelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = 'best';
            option.textContent = 'Mejor calidad disponible';
            videoQualitySelect.appendChild(option);
        }
    };

    // Funciones de descarga
    const triggerDownload = (type) => {
        if (!currentUrl || !currentVideoData) return;

        const formatId = videoQualitySelect.value;
        const title = encodeURIComponent(currentVideoData.title);
        const encodedUrl = encodeURIComponent(currentUrl);

        // Se usa apertura de nueva pestaña o iframe para aprovechar el "Content-Disposition: attachment" del servidor
        const downloadUrl = `/api/download?url=${encodedUrl}&type=${type}&title=${title}&formatId=${encodeURIComponent(formatId)}`;
        
        window.location.href = downloadUrl;
    };

    btnDownloadVideo.addEventListener('click', () => {
        triggerDownload('video');
    });

    btnDownloadAudio.addEventListener('click', () => {
        triggerDownload('audio');
    });
});
