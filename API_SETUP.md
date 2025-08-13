# Настройка API ключей

## Spotify API

Для использования Spotify API вам нужно:

1. Перейти на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Войти в свой аккаунт Spotify
3. Создать новое приложение
4. Получить `Client ID` и `Client Secret`
5. Обновить файл `script.js`:

```javascript
spotify: {
    name: 'Spotify',
    searchUrl: 'https://api.spotify.com/v1/search',
    clientId: 'ВАШ_CLIENT_ID_ЗДЕСЬ',
    clientSecret: 'ВАШ_CLIENT_SECRET_ЗДЕСЬ'
}
```

## YouTube Music API

YouTube Music API работает без ключей, но использует прокси для обхода CORS.

## Важно!

- Никогда не публикуйте ваши API ключи в публичных репозиториях
- Используйте переменные окружения для продакшена
- Spotify API предоставляет только 30-секундные превью треков
- Для полного воспроизведения YouTube Music треков пользователи будут перенаправлены на YouTube
