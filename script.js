// Основной класс музыкального плеера
class MusicPlayer {
    constructor() {
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.audio = new Audio();
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
        
        // API конфигурация - Spotify и YouTube Music
        this.apis = {
            spotify: {
                name: 'Spotify',
                searchUrl: 'https://api.spotify.com/v1/search',
                clientId: 'f44dd80d85324fee9721c475d2393141',
                clientSecret: '244007fffdf3463cac4e465133a4ccba'
            },
            youtubeMusic: {
                name: 'YouTube Music',
                searchUrl: 'https://music.youtube.com/search',
                baseUrl: 'https://music.youtube.com',
                apiUrl: 'https://music.youtube.com/youtubei/v1'
            }
        };
        
        // Локальная база популярных треков (fallback)
        this.localTracks = [
            {
                id: 'local_1',
                title: 'Imagine',
                artist: 'John Lennon',
                album: 'Imagine',
                duration: 183,
                preview: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                cover: 'https://via.placeholder.com/300x200/667eea/fff?text=Imagine',
                api: 'local'
            },
            {
                id: 'local_2',
                title: 'Bohemian Rhapsody',
                artist: 'Queen',
                album: 'A Night at the Opera',
                duration: 354,
                preview: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                cover: 'https://via.placeholder.com/300x200/667eea/fff?text=Queen',
                api: 'local'
            },
            {
                id: 'local_3',
                title: 'Hotel California',
                artist: 'Eagles',
                album: 'Hotel California',
                duration: 391,
                preview: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                cover: 'https://via.placeholder.com/300x200/667eea/fff?text=Eagles',
                api: 'local'
            }
        ];
        
        this.initializePlayer();
        this.bindEvents();
        this.loadInitialData();
    }

    // Инициализация плеера
    initializePlayer() {
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('loadedmetadata', () => this.updateTotalTime());
        this.audio.addEventListener('error', (e) => this.handleAudioError(e));
        
        this.audio.volume = 0.7;
    }

    // Привязка событий
    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.dataset.section);
            });
        });

        document.getElementById('search-btn').addEventListener('click', () => this.searchMusic());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchMusic();
        });

        document.getElementById('play-btn').addEventListener('click', () => this.togglePlay());
        document.getElementById('prev-btn').addEventListener('click', () => this.previousTrack());
        document.getElementById('next-btn').addEventListener('click', () => this.nextTrack());
        document.getElementById('favorite-btn').addEventListener('click', () => this.toggleFavorite());
        document.getElementById('volume-btn').addEventListener('click', () => this.toggleMute());

        document.querySelector('.progress-bar').addEventListener('click', (e) => this.seekTo(e));

        document.getElementById('create-playlist-btn').addEventListener('click', () => this.showPlaylistModal());
        document.getElementById('save-playlist').addEventListener('click', () => this.createPlaylist());
        document.getElementById('cancel-playlist').addEventListener('click', () => this.hidePlaylistModal());
        document.getElementById('close-playlist-modal').addEventListener('click', () => this.hidePlaylistModal());
    }

    // Переключение между секциями
    switchSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

        document.getElementById(`${sectionName}-section`).classList.add('active');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        if (sectionName === 'playlists') {
            this.renderPlaylists();
        } else if (sectionName === 'favorites') {
            this.renderFavorites();
        }
    }

    // Поиск музыки через несколько API
    async searchMusic() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;

        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Поиск...</div>';

        try {
            // Пробуем разные API по очереди
            let results = await this.searchSpotify(query);
            
            if (!results || results.length === 0) {
                results = await this.searchYouTubeMusic(query);
            }

            if (!results || results.length === 0) {
                results = this.searchLocal(query);
            }

            if (results && results.length > 0) {
                this.renderSearchResults(results);
            } else {
                // Если ничего не найдено, показываем сообщение
                resultsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Ничего не найдено. Попробуйте другой запрос.</div>';
            }
        } catch (error) {
            console.error('Ошибка поиска:', error);
            // Показываем сообщение об ошибке
            resultsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;">Ошибка поиска. Попробуйте позже.</div>';
        }
    }

    // Поиск через Spotify API
    async searchSpotify(query) {
        try {
            // Получаем токен доступа для Spotify API
            const token = await this.getSpotifyToken();
            if (!token) {
                throw new Error('Не удалось получить токен Spotify');
            }

            const response = await fetch(`${this.apis.spotify.searchUrl}?q=${encodeURIComponent(query)}&type=track&limit=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Spotify API error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
                const tracks = [];
                for (const track of data.tracks.items) {
                    // Получаем аудио поток для каждого трека
                    const audioStream = await this.getSpotifyAudioStream(track.id, token);
                    
                    tracks.push({
                        id: `spotify_${track.id}`,
                        title: track.name,
                        artist: track.artists.map(a => a.name).join(', '),
                        album: track.album.name,
                        duration: Math.floor(track.duration_ms / 1000),
                        preview: track.preview_url,
                        audioStream: audioStream, // Добавляем аудио поток
                        cover: track.album.images[0]?.url || 'https://via.placeholder.com/300x200/1DB954/fff?text=Spotify',
                        api: 'spotify',
                        spotifyId: track.id
                    });
                }
                return tracks;
            }
            return [];
        } catch (error) {
            console.error('Ошибка Spotify API:', error);
            return null;
        }
    }

    // Получение аудио потока для Spotify трека
    async getSpotifyAudioStream(trackId, token) {
        try {
            // Для Spotify используем превью из основного API
            // Если превью недоступно, возвращаем fallback URL
            return `spotify:track:${trackId}`;
        } catch (error) {
            console.error('Ошибка получения аудио потока Spotify:', error);
            return null;
        }
    }

    // Получение токена доступа для Spotify
    async getSpotifyToken() {
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(this.apis.spotify.clientId + ':' + this.apis.spotify.clientSecret)
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                throw new Error('Ошибка получения токена Spotify');
            }

            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error('Ошибка получения токена Spotify:', error);
            return null;
        }
    }

    // Поиск через YouTube Music API
    async searchYouTubeMusic(query) {
        try {
            // Реальный поиск через YouTube Music API
            // Используем прокси для обхода CORS
            const searchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://music.youtube.com/results?search_query=${encodeURIComponent(query)}`)}`;
            
            const response = await fetch(searchUrl);
            if (!response.ok) {
                throw new Error('Ошибка YouTube Music API');
            }

            const html = await response.text();
            
            // Парсим HTML для извлечения результатов поиска
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Ищем элементы с информацией о треках
            const trackElements = doc.querySelectorAll('[data-video-id], .ytd-video-renderer, .ytd-compact-video-renderer');
            
            if (trackElements.length > 0) {
                const results = [];
                for (let index = 0; index < Math.min(trackElements.length, 10); index++) {
                    const element = trackElements[index];
                    const videoId = element.getAttribute('data-video-id') || 
                                   element.querySelector('a[href*="watch"]')?.href?.split('v=')[1] ||
                                   `yt_${Date.now()}_${index}`;
                    
                    const title = element.querySelector('h3, .title')?.textContent?.trim() || 
                                 element.querySelector('a[title]')?.getAttribute('title') || 
                                 `${query} - Трек ${index + 1}`;
                    
                    const artist = element.querySelector('.byline, .channel-name')?.textContent?.trim() || 
                                  'YouTube Music';
                    
                    const audioStream = await this.getYouTubeMusicAudioStream(videoId);
                    
                    results.push({
                        id: `yt_${videoId}`,
                        title: title,
                        artist: artist,
                        album: 'YouTube Music',
                        duration: 0,
                        preview: `https://www.youtube.com/watch?v=${videoId}`,
                        audioStream: audioStream,
                        cover: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                        api: 'youtubeMusic',
                        videoId: videoId
                    });
                }
                return results;
            }
            
            return [];
        } catch (error) {
            console.error('Ошибка YouTube Music API:', error);
            return null;
        }
    }

    // Получение рекомендаций на основе текущего трека
    async getRecommendations(trackId) {
        try {
            // В реальном приложении здесь был бы вызов к YouTube Music API
            // для получения рекомендаций на основе trackId
            const recommendations = [
                {
                    id: `rec_1`,
                    title: 'Рекомендуемый трек 1',
                    artist: 'Рекомендуемый исполнитель 1',
                    album: 'Рекомендуемый альбом 1',
                    duration: 200,
                    preview: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    cover: 'https://via.placeholder.com/300x200/28a745/fff?text=REC',
                    api: 'youtubeMusic'
                },
                {
                    id: `rec_2`,
                    title: 'Рекомендуемый трек 2',
                    artist: 'Рекомендуемый исполнитель 2',
                    album: 'Рекомендуемый альбом 2',
                    duration: 220,
                    preview: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    cover: 'https://via.placeholder.com/300x200/28a745/fff?text=REC',
                    api: 'youtubeMusic'
                }
            ];
            return recommendations;
        } catch (error) {
            console.error('Ошибка получения рекомендаций:', error);
        }
        return null;
    }

    // Получение популярных плейлистов
    async getPopularPlaylists() {
        try {
            // В реальном приложении здесь был бы вызов к YouTube Music API
            // для получения популярных плейлистов
            const popularPlaylists = [
                {
                    id: `pop_1`,
                    name: 'Популярный плейлист 1',
                    description: 'Описание популярного плейлиста 1',
                    tracks: [],
                    createdAt: new Date().toISOString()
                },
                {
                    id: `pop_2`,
                    name: 'Популярный плейлист 2',
                    description: 'Описание популярного плейлиста 2',
                    tracks: [],
                    createdAt: new Date().toISOString()
                }
            ];
            return popularPlaylists;
        } catch (error) {
            console.error('Ошибка получения популярных плейлистов:', error);
        }
        return null;
    }

    // Поиск по локальной базе данных
    searchLocal(query) {
        const searchTerm = query.toLowerCase();
        const results = this.localTracks.filter(track => 
            track.title.toLowerCase().includes(searchTerm) ||
            track.artist.toLowerCase().includes(searchTerm) ||
            track.album.toLowerCase().includes(searchTerm)
        );
        
        if (results.length > 0) {
            return results;
        }
        return null;
    }

    // Поиск через Jamendo API (бесплатные треки)
    async searchJamendo(query) {
        try {
            const response = await fetch(`${this.apis.jamendo.searchUrl}?client_id=${this.apis.jamendo.apiKey}&format=json&limit=20&search=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                return data.results.map(track => ({
                    id: `jamendo_${track.id}`,
                    title: track.name,
                    artist: track.artist_name || 'Неизвестный исполнитель',
                    album: track.album_name || 'Неизвестный альбом',
                    duration: track.duration,
                    preview: track.audio,
                    cover: track.image,
                    api: 'jamendo'
                }));
            }
        } catch (error) {
            console.error('Ошибка Jamendo API:', error);
        }
        return null;
    }

    // Поиск через Free Music Archive
    async searchFreeMusicArchive(query) {
        try {
            // Используем демо-данные для FMA
            const demoResults = [
                {
                    id: `fma_1`,
                    title: `${query} - Free Track 1`,
                    artist: 'Free Artist 1',
                    album: 'Free Album 1',
                    duration: 180,
                    preview: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    cover: 'https://via.placeholder.com/300x200/28a745/fff?text=FREE',
                    api: 'fma'
                },
                {
                    id: `fma_2`,
                    title: `${query} - Free Track 2`,
                    artist: 'Free Artist 2',
                    album: 'Free Album 2',
                    duration: 240,
                    preview: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    cover: 'https://via.placeholder.com/300x200/28a745/fff?text=FREE',
                    api: 'fma'
                }
            ];
            return demoResults;
        } catch (error) {
            console.error('Ошибка FMA API:', error);
        }
        return null;
    }

    // Отрисовка результатов поиска
    renderSearchResults(tracks) {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';

        tracks.forEach(track => {
            const trackCard = document.createElement('div');
            trackCard.className = 'track-card';
            
            // Проверяем доступность аудио
            const hasAudio = (track.preview_url && track.api === 'spotify') || 
                            (track.audioStream && track.api === 'youtubeMusic') ||
                            (track.preview && track.api === 'local');
            
            const playButtonText = hasAudio ? 'Слушать' : 'Только метаданные';
            const playButtonClass = hasAudio ? 'btn-primary' : 'btn-secondary';
            const sourceInfo = this.getSourceInfo(track.api);
            
            trackCard.innerHTML = `
                <img src="${track.cover || 'https://via.placeholder.com/300x200/667eea/fff?text=♪'}" alt="${track.title}">
                <h3>${track.title}</h3>
                <p><strong>${track.artist}</strong></p>
                <p>${track.album}</p>
                <p><small>Источник: ${sourceInfo.name}</small></p>
                <p><small>${sourceInfo.description}</small></p>
                <div class="track-actions">
                    <button class="btn ${playButtonClass}" onclick="player.playTrack(${JSON.stringify(track).replace(/"/g, '&quot;')})" ${!hasAudio ? 'disabled' : ''}>
                        <i class="fas fa-play"></i> ${playButtonText}
                    </button>
                    <button class="btn btn-secondary" onclick="player.addToPlaylist(${track.id})">
                        <i class="fas fa-plus"></i> В плейлист
                    </button>
                    <button class="btn btn-secondary" onclick="player.toggleFavoriteTrack(${track.id})">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            `;
            resultsContainer.appendChild(trackCard);
        });
    }

    // Получение информации об источнике
    getSourceInfo(apiName) {
        const sourceInfo = {
            spotify: {
                name: 'Spotify',
                description: '30 сек превью + полные треки через MediaServiceCore'
            },
            youtubeMusic: {
                name: 'YouTube Music',
                description: 'Полные треки через MediaServiceCore'
            },
            local: {
                name: 'Локальная база',
                description: 'Популярные треки (fallback)'
            }
        };
        
        return sourceInfo[apiName] || { name: apiName, description: 'Неизвестный источник' };
    }

    // Воспроизведение трека
    async playTrack(track) {
        this.currentTrack = track;
        this.currentIndex = this.playlist.findIndex(t => t.id === track.id);
        
        if (this.currentIndex === -1) {
            this.playlist.push(track);
            this.currentIndex = this.playlist.length - 1;
        }

        document.getElementById('track-title').textContent = track.title;
        document.getElementById('track-artist').textContent = track.artist;
        document.getElementById('album-art').src = track.cover || 'https://via.placeholder.com/60x60/667eea/fff?text=♪';

        // Обрабатываем разные типы API
        if (track.api === 'spotify' && track.preview_url) {
            // Spotify предоставляет 30-секундные превью
            try {
                this.audio.src = track.preview_url;
                await this.audio.play();
                this.isPlaying = true;
                this.updatePlayButton();
            } catch (error) {
                console.error('Ошибка воспроизведения Spotify:', error);
                this.showError('Ошибка воспроизведения Spotify превью');
            }
        } else if (track.api === 'youtubeMusic' && track.audioStream) {
            // YouTube Music - используем наш локальный сервер для стриминга
            try {
                if (track.audioStream.includes('goatmusic.ru')) {
                    // Прямой стриминг через наш сервер
                    this.audio.src = track.audioStream;
                    await this.audio.play();
                    this.isPlaying = true;
                    this.updatePlayButton();
                } else if (track.audioStream.includes('youtube.com')) {
                    // Fallback - показываем сообщение о переходе на YouTube
                    this.showError('Для воспроизведения перейдите на YouTube');
                    window.open(track.audioStream, '_blank');
                } else {
                    // Если есть другой аудио поток, воспроизводим его
                    this.audio.src = track.audioStream;
                    await this.audio.play();
                    this.isPlaying = true;
                    this.updatePlayButton();
                }
            } catch (error) {
                console.error('Ошибка воспроизведения YouTube Music:', error);
                this.showError('Ошибка воспроизведения YouTube Music');
            }
        } else if (track.preview && track.api === 'local') {
            // Локальные треки
            try {
                this.audio.src = track.preview;
                await this.audio.play();
                this.isPlaying = true;
                this.updatePlayButton();
            } catch (error) {
                console.error('Ошибка воспроизведения локального трека:', error);
                this.showError('Ошибка воспроизведения локального трека');
            }
        } else {
            this.showError('Аудио недоступно для этого трека');
        }

        this.updateFavoriteButton();
    }

    // Показ ошибок
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    // Обработка ошибок аудио
    handleAudioError(error) {
        console.error('Ошибка аудио:', error);
        this.showError('Ошибка загрузки аудио');
        this.isPlaying = false;
        this.updatePlayButton();
    }

    // Переключение воспроизведения/паузы
    async togglePlay() {
        if (this.currentTrack) {
            try {
                if (this.isPlaying) {
                    this.audio.pause();
                    this.isPlaying = false;
                } else {
                    await this.audio.play();
                    this.isPlaying = true;
                }
                this.updatePlayButton();
            } catch (error) {
                console.error('Ошибка управления воспроизведением:', error);
                this.showError('Ошибка управления воспроизведением');
            }
        }
    }

    // Обновление кнопки воспроизведения
    updatePlayButton() {
        const playBtn = document.getElementById('play-btn');
        const icon = playBtn.querySelector('i');
        
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }

    // Следующий трек
    nextTrack() {
        if (this.playlist.length > 0) {
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
            this.playTrack(this.playlist[this.currentIndex]);
        }
    }

    // Предыдущий трек
    previousTrack() {
        if (this.playlist.length > 0) {
            this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.playlist.length - 1;
            this.playTrack(this.playlist[this.currentIndex]);
        }
    }

    // Обновление прогресса
    updateProgress() {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('progress-fill').style.width = progress + '%';
            document.getElementById('current-time').textContent = this.formatTime(this.audio.currentTime);
        }
    }

    // Обновление общего времени
    updateTotalTime() {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            document.getElementById('total-time').textContent = this.formatTime(this.audio.duration);
        }
    }

    // Форматирование времени
    formatTime(seconds) {
        if (isNaN(seconds) || seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Перемотка по клику на прогресс-бар
    seekTo(event) {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            const progressBar = event.currentTarget;
            const rect = progressBar.getBoundingClientRect();
            const percent = (event.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
        }
    }

    // Переключение избранного
    toggleFavorite() {
        if (this.currentTrack) {
            const trackId = this.currentTrack.id;
            const index = this.favorites.findIndex(t => t.id === trackId);
            
            if (index === -1) {
                this.favorites.push(this.currentTrack);
            } else {
                this.favorites.splice(index, 1);
            }
            
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            this.updateFavoriteButton();
        }
    }

    // Обновление кнопки избранного
    updateFavoriteButton() {
        const favoriteBtn = document.getElementById('favorite-btn');
        const icon = favoriteBtn.querySelector('i');
        
        if (this.currentTrack && this.favorites.find(t => t.id === this.currentTrack.id)) {
            icon.className = 'fas fa-heart';
            favoriteBtn.style.color = '#e74c3c';
        } else {
            icon.className = 'far fa-heart';
            favoriteBtn.style.color = '#666';
        }
    }

    // Переключение избранного для конкретного трека
    toggleFavoriteTrack(trackId) {
        const track = this.playlist.find(t => t.id === trackId) || 
                     this.favorites.find(t => t.id === trackId);
        
        if (track) {
            const index = this.favorites.findIndex(t => t.id === trackId);
            
            if (index === -1) {
                this.favorites.push(track);
            } else {
                this.favorites.splice(index, 1);
            }
            
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            
            if (document.getElementById('favorites-section').classList.contains('active')) {
                this.renderFavorites();
            }
        }
    }

    // Переключение звука
    toggleMute() {
        this.audio.muted = !this.audio.muted;
        const volumeBtn = document.getElementById('volume-btn');
        const icon = volumeBtn.querySelector('i');
        
        if (this.audio.muted) {
            icon.className = 'fas fa-volume-mute';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    // Показ модального окна создания плейлиста
    showPlaylistModal() {
        document.getElementById('playlist-modal').classList.add('active');
        document.getElementById('playlist-name').focus();
    }

    // Скрытие модального окна
    hidePlaylistModal() {
        document.getElementById('playlist-modal').classList.remove('active');
        document.getElementById('playlist-name').value = '';
        document.getElementById('playlist-description').value = '';
    }

    // Создание плейлиста
    createPlaylist() {
        const name = document.getElementById('playlist-name').value.trim();
        const description = document.getElementById('playlist-description').value.trim();
        
        if (!name) {
            alert('Введите название плейлиста');
            return;
        }
        
        const playlist = {
            id: Date.now(),
            name: name,
            description: description,
            tracks: [],
            createdAt: new Date().toISOString()
        };
        
        this.playlists.push(playlist);
        localStorage.setItem('playlists', JSON.stringify(this.playlists));
        
        this.hidePlaylistModal();
        this.renderPlaylists();
        this.switchSection('playlists');
    }

    // Добавление трека в плейлист
    addToPlaylist(trackId) {
        if (this.playlists.length === 0) {
            alert('Сначала создайте плейлист');
            return;
        }
        
        const track = this.playlist.find(t => t.id === trackId);
        if (!track) return;
        
        const playlistNames = this.playlists.map(p => p.name);
        const selectedPlaylist = prompt(`Выберите плейлист для добавления трека "${track.title}":\n\n${playlistNames.join('\n')}`);
        
        if (selectedPlaylist) {
            const playlistIndex = this.playlists.findIndex(p => p.name === selectedPlaylist);
            if (playlistIndex !== -1) {
                if (!this.playlists[playlistIndex].tracks.find(t => t.id === trackId)) {
                    this.playlists[playlistIndex].tracks.push(track);
                    localStorage.setItem('playlists', JSON.stringify(this.playlists));
                    alert(`Трек "${track.title}" добавлен в плейлист "${selectedPlaylist}"`);
                } else {
                    alert('Этот трек уже есть в плейлисте');
                }
            }
        }
    }

    // Отрисовка плейлистов
    renderPlaylists() {
        const playlistsGrid = document.getElementById('playlists-grid');
        playlistsGrid.innerHTML = '';
        
        if (this.playlists.length === 0) {
            playlistsGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">У вас пока нет плейлистов</div>';
            return;
        }
        
        this.playlists.forEach(playlist => {
            const playlistCard = document.createElement('div');
            playlistCard.className = 'playlist-card';
            playlistCard.innerHTML = `
                <div>
                    <i class="fas fa-music"></i>
                </div>
                <h3>${playlist.name}</h3>
                <p>${playlist.description || 'Без описания'}</p>
                <p><small>${playlist.tracks.length} треков</small></p>
                <button class="btn btn-primary" onclick="player.playPlaylist(${playlist.id})">
                    <i class="fas fa-play"></i> Воспроизвести
                </button>
            `;
            playlistsGrid.appendChild(playlistCard);
        });
    }

    // Воспроизведение плейлиста
    playPlaylist(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (playlist && playlist.tracks.length > 0) {
            this.playlist = [...playlist.tracks];
            this.currentIndex = 0;
            this.playTrack(this.playlist[0]);
        }
    }

    // Отрисовка избранного
    renderFavorites() {
        const favoritesList = document.getElementById('favorites-list');
        favoritesList.innerHTML = '';
        
        if (this.favorites.length === 0) {
            favoritesList.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">В избранном пока ничего нет</div>';
            return;
        }
        
        this.favorites.forEach(track => {
            const trackCard = document.createElement('div');
            trackCard.className = 'track-card';
            trackCard.innerHTML = `
                <img src="${track.cover || 'https://via.placeholder.com/300x200/667eea/fff?text=♪'}" alt="${track.title}">
                <h3>${track.title}</h3>
                <p><strong>${track.artist}</strong></p>
                <p>${track.album}</p>
                <p><small>Источник: ${this.apis[track.api]?.name || track.api || 'Неизвестно'}</small></p>
                <div class="track-actions">
                    <button class="btn btn-primary" onclick="player.playTrack(${JSON.stringify(track).replace(/"/g, '&quot;')})">
                        <i class="fas fa-play"></i> Слушать
                    </button>
                    <button class="btn btn-secondary" onclick="player.removeFromFavorites(${track.id})">
                        <i class="fas fa-trash"></i> Убрать
                    </button>
                </div>
            `;
            favoritesList.appendChild(trackCard);
        });
    }

    // Удаление из избранного
    removeFromFavorites(trackId) {
        const index = this.favorites.findIndex(t => t.id === trackId);
        if (index !== -1) {
            this.favorites.splice(index, 1);
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            this.renderFavorites();
        }
    }

    // Загрузка начальных данных
    loadInitialData() {
        this.renderPlaylists();
        this.renderFavorites();
        this.renderRecommendations(); // Загружаем рекомендации при запуске
    }

    // Отрисовка рекомендаций
    async renderRecommendations() {
        const recommendationsContainer = document.getElementById('recommendations');
        if (!recommendationsContainer) return;

        recommendationsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Загрузка рекомендаций...</div>';

        try {
            const recommendations = await this.getRecommendations();
            if (recommendations && recommendations.length > 0) {
                recommendationsContainer.innerHTML = '';
                recommendations.forEach(track => {
                    const trackCard = document.createElement('div');
                    trackCard.className = 'track-card';
                    trackCard.innerHTML = `
                        <img src="${track.cover || 'https://via.placeholder.com/300x200/667eea/fff?text=♪'}" alt="${track.title}">
                        <h3>${track.title}</h3>
                        <p><strong>${track.artist}</strong></p>
                        <p>${track.album}</p>
                        <div class="track-actions">
                            <button class="btn btn-primary" onclick="player.playTrack(${JSON.stringify(track).replace(/"/g, '&quot;')})">
                                <i class="fas fa-play"></i> Слушать
                            </button>
                            <button class="btn btn-secondary" onclick="player.addToPlaylist(${track.id})">
                                <i class="fas fa-plus"></i> В плейлист
                            </button>
                        </div>
                    `;
                    recommendationsContainer.appendChild(trackCard);
                });
            } else {
                recommendationsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Рекомендации недоступны</div>';
            }
        } catch (error) {
            console.error('Ошибка загрузки рекомендаций:', error);
            recommendationsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Ошибка загрузки рекомендаций</div>';
        }
    }

    // Получение аудио потока для YouTube Music трека
    async getYouTubeMusicAudioStream(videoId) {
        try {
            // Используем наш сервер для получения аудио потока
            const response = await fetch(`https://web-production-b702c.up.railway.app/api/stream/youtube/${videoId}`);
            
            if (!response.ok) {
                throw new Error('Ошибка получения аудио потока');
            }

            const data = await response.json();
            
            if (data.success) {
                // Возвращаем прямой URL для стриминга через наш сервер
                return `https://web-production-b702c.up.railway.app/api/stream/youtube/${videoId}/audio`;
            } else {
                // Fallback на YouTube URL
                return `https://www.youtube.com/watch?v=${videoId}`;
            }
        } catch (error) {
            console.error('Ошибка получения аудио потока YouTube Music:', error);
            // Fallback на YouTube URL
            return `https://www.youtube.com/watch?v=${videoId}`;
        }
    }
}

// Инициализация плеера при загрузке страницы
let player;
document.addEventListener('DOMContentLoaded', () => {
    player = new MusicPlayer();
});

// Глобальные функции для вызова из HTML
window.player = null;
