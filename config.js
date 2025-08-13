// Конфигурация для продакшена
const config = {
    // Основной домен
    domain: 'web-production-b702c.up.railway.app',
    
    // API endpoints
    api: {
        baseUrl: 'web-production-b702c.up.railway.app',
        youtube: 'web-production-b702c.up.railway.app/api/stream/youtube',
        spotify: 'web-production-b702c.up.railway.app/api/stream/spotify'
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
