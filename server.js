const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Статические файлы
app.use(express.static('.'));

// API для получения аудио потока YouTube
app.get('/api/stream/youtube/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        
        // Проверяем, что videoId валидный
        if (!ytdl.validateID(videoId)) {
            return res.status(400).json({ error: 'Неверный YouTube ID' });
        }

        // Получаем информацию о видео
        const info = await ytdl.getInfo(videoId);
        
        // Выбираем лучший аудио формат
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        const bestAudio = audioFormats[0];

        if (!bestAudio) {
            return res.status(404).json({ error: 'Аудио не найдено' });
        }

        // Возвращаем информацию о потоке
        res.json({
            success: true,
            videoId: videoId,
            title: info.videoDetails.title,
            duration: info.videoDetails.lengthSeconds,
            audioUrl: bestAudio.url,
            format: bestAudio.mimeType
        });

    } catch (error) {
        console.error('Ошибка YouTube стриминга:', error);
        res.status(500).json({ error: 'Ошибка получения аудио потока' });
    }
});

// API для прямого стриминга YouTube аудио
app.get('/api/stream/youtube/:videoId/audio', async (req, res) => {
    try {
        const { videoId } = req.params;
        
        if (!ytdl.validateID(videoId)) {
            return res.status(400).json({ error: 'Неверный YouTube ID' });
        }

        // Получаем информацию о видео
        const info = await ytdl.getInfo(videoId);
        
        // Выбираем лучший аудио формат
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        const bestAudio = audioFormats[0];

        if (!bestAudio) {
            return res.status(404).json({ error: 'Аудио не найдено' });
        }

        // Настраиваем заголовки для стриминга
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        // Стримим аудио
        ytdl(videoId, {
            format: bestAudio,
            quality: 'highestaudio'
        }).pipe(res);

    } catch (error) {
        console.error('Ошибка YouTube стриминга:', error);
        res.status(500).json({ error: 'Ошибка стриминга аудио' });
    }
});

// API для Spotify (эмуляция MediaServiceCore)
app.get('/api/stream/spotify/:trackId', async (req, res) => {
    try {
        const { trackId } = req.params;
        
        // В реальном приложении здесь был бы вызов к Spotify API
        // для получения аудио потока через MediaServiceCore
        
        // Для демонстрации возвращаем информацию о треке
        res.json({
            success: true,
            trackId: trackId,
            message: 'Spotify стриминг требует MediaServiceCore',
            note: 'Используйте 30-секундные превью из Spotify API'
        });

    } catch (error) {
        console.error('Ошибка Spotify стриминга:', error);
        res.status(500).json({ error: 'Ошибка получения Spotify потока' });
    }
});

// API для поиска YouTube
app.get('/api/search/youtube', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Запрос поиска обязателен' });
        }

        // Используем YouTube Data API v3 (требует API ключ)
        // Для демонстрации возвращаем базовую информацию
        res.json({
            success: true,
            query: q,
            message: 'YouTube поиск требует API ключ',
            note: 'Используйте встроенный поиск в плеере'
        });

    } catch (error) {
        console.error('Ошибка YouTube поиска:', error);
        res.status(500).json({ error: 'Ошибка поиска' });
    }
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🎵 Музыкальный сервер запущен на http://localhost:${PORT}`);
    console.log(`📡 API доступен на http://localhost:${PORT}/api`);
    console.log(`🎬 YouTube стриминг: http://localhost:${PORT}/api/stream/youtube/:videoId`);
});
