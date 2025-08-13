# Интеграция MediaServiceCore для стриминга аудио

## Обзор

[MediaServiceCore](https://github.com/maxrave-dev/MediaServiceCore) - это библиотека для получения аудио потоков из различных сервисов, включая YouTube Music и Spotify.

## Текущая реализация

В текущей версии плеера уже интегрированы функции для получения аудио потоков:

### Spotify API
- ✅ Поиск треков
- ✅ 30-секундные превью
- 🔄 Полные треки (требует MediaServiceCore)

### YouTube Music API
- ✅ Поиск треков
- ✅ Получение метаданных
- 🔄 Полные треки (требует MediaServiceCore)

## Для полной интеграции MediaServiceCore

### 1. Установка MediaServiceCore

```bash
# Клонирование репозитория
git clone https://github.com/maxrave-dev/MediaServiceCore.git
cd MediaServiceCore

# Сборка
./gradlew build
```

### 2. Интеграция в веб-приложение

Для веб-приложения потребуется:

1. **REST API сервер** на основе MediaServiceCore
2. **Обновление функций** в `script.js`:

```javascript
// Пример интеграции с MediaServiceCore API
async getSpotifyAudioStream(trackId, token) {
    try {
        const response = await fetch(`/api/mediaservice/spotify/stream/${trackId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.audioStreamUrl;
        }
        return null;
    } catch (error) {
        console.error('Ошибка MediaServiceCore:', error);
        return null;
    }
}

async getYouTubeMusicAudioStream(videoId) {
    try {
        const response = await fetch(`/api/mediaservice/youtube/stream/${videoId}`);
        
        if (response.ok) {
            const data = await response.json();
            return data.audioStreamUrl;
        }
        return null;
    } catch (error) {
        console.error('Ошибка MediaServiceCore:', error);
        return null;
    }
}
```

### 3. Запуск MediaServiceCore сервера

```bash
# Запуск REST API сервера
java -jar mediaservicecore-api.jar --port 8080
```

## Преимущества MediaServiceCore

- **Прямые аудио потоки** из YouTube Music
- **Обход ограничений** API
- **Высокое качество** аудио
- **Поддержка множества** сервисов

## Текущий статус

- ✅ **Поиск работает** - треки находятся через Spotify и YouTube Music API
- ✅ **Метаданные получены** - названия, исполнители, альбомы, обложки
- 🔄 **Стриминг аудио** - частично интегрирован, требует MediaServiceCore сервер
- 🔄 **Полные треки** - доступны через MediaServiceCore

## Следующие шаги

1. Настроить MediaServiceCore сервер
2. Обновить API endpoints в `script.js`
3. Протестировать стриминг полных треков
4. Добавить кэширование аудио потоков
