// Конфигурация для продакшена
const config = {
    // Основной домен
    domain: 'goatmusic.ru',
    
    // API endpoints
    api: {
        baseUrl: 'https://goatmusic.ru',
        youtube: 'https://goatmusic.ru/api/stream/youtube',
        spotify: 'https://goatmusic.ru/api/stream/spotify'
    },
    
    // Spotify API credentials (замените на свои)
    spotify: {
        clientId: 'f44dd80d85324fee9721c475d2393141',
        clientSecret: '244007fffdf3463cac4e465133a4ccba'
    },
    
    // Настройки сервера
    server: {
        port: process.env.PORT || 3000,
        host: '0.0.0.0'
    }
};

// Экспорт для Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}

// Экспорт для браузера
if (typeof window !== 'undefined') {
    window.config = config;
}
