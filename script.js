document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. СБОРКА ПЛЕЙЛИСТА (БАЗА ДАННЫХ)
    // ==========================================
    const playlist = [];
    const songCards = document.querySelectorAll('.song-card');
    const songData = {}; 

    songCards.forEach(card => {
        const songTitle = card.getAttribute('data-title');
        const notesEl = card.querySelector('.vocal-note');
        const notesHtml = notesEl ? notesEl.innerHTML : '<p>Нет заметок.</p>';
        
        songData[songTitle] = {
            notes: notesHtml,
            tracks: []
        };

        const blocks = card.querySelectorAll('.audio-block');

        blocks.forEach(block => {
            const index = block.getAttribute('data-index');
            const audioContainer = block.querySelector('.custom-audio');
            const src = audioContainer.getAttribute('data-src');
            const isEmpty = audioContainer.getAttribute('data-empty') === 'true';
            
            // Берем красивый текст из HTML разметки (audio-label)
            const labelEl = block.querySelector('.audio-label');
            let typeName = labelEl ? labelEl.innerText.replace('◈ ', '').trim() : "Трек";

            if (src && !isEmpty) {
                const trackObj = {
                    title: songTitle,
                    type: typeName,
                    src: src,
                    globalIndex: playlist.length
                };
                playlist.push(trackObj);
                songData[songTitle].tracks.push(trackObj);
            }
        });
    });

    let currentTrackIndex = 0;
    let isGlobalPlaying = false;

    // ==========================================
    // 2. ЭЛЕМЕНТЫ ИНТЕРФЕЙСА
    // ==========================================
    
    // Создаем оболочку для двух колонок на лету
    if (!document.querySelector('.app-layout')) {
        const layout = document.createElement('div');
        layout.className = 'app-layout';
        
        const songsSection = document.createElement('div');
        songsSection.className = 'songs-section';
        
        // Переносим шапку и сетку в левую колонку
        const topHeader = document.querySelector('.top-header');
        const songsGrid = document.querySelector('.songs-grid');
        if(topHeader) songsSection.appendChild(topHeader);
        if(songsGrid) songsSection.appendChild(songsGrid);
        
        // Создаем правую панель
        const studioPanel = document.createElement('div');
        studioPanel.className = 'studio-panel';
        studioPanel.innerHTML = `
            <div class="studio-cover">
                <h2 id="studioTitle">YUKON FLAMES</h2>
                <div id="studioNotes" class="studio-notes">
                    <p>Выберите песню слева, чтобы увидеть заметки.</p>
                </div>
            </div>
            <div id="studioTracks" class="studio-tracks"></div>
            <!-- Плеер -->
            <div class="global-player" id="globalPlayer">
                <div class="gp-container">
                    <div class="gp-info">
                        <div class="gp-title" id="gpTitle">Трек не выбран</div>
                        <div class="gp-status" id="gpStatus">Ожидание...</div>
                    </div>
                    <div class="gp-controls">
                        <button id="gpNextBtn" class="gp-btn gp-btn-secondary">
                            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                        </button>
                        <button id="gpPlayBtn" class="gp-btn gp-btn-main">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                    </div>
                </div>
                <div class="gp-progress-wrap">
                    <span id="gpCurrent">0:00</span>
                    <input type="range" id="gpSlider" value="0" min="0" max="100" step="0.1">
                    <span id="gpDuration">0:00</span>
                </div>
            </div>
        `;

        // Переносим глобальный плеер из HTML в правую панель
        const oldPlayer = document.getElementById('globalPlayer');
        if (oldPlayer) oldPlayer.remove();

        layout.appendChild(songsSection);
        layout.appendChild(studioPanel);
        
        // Заменяем body на layout
        document.body.innerHTML = '';
        document.body.appendChild(layout);
        
        // Возвращаем аудио тег на место
        const audioTag = document.createElement('audio');
        audioTag.id = 'globalAudio';
        audioTag.preload = 'metadata';
        document.body.appendChild(audioTag);
    }

    // Получаем ссылки на элементы
    const globalAudio = document.getElementById('globalAudio');
    const gpTitle = document.getElementById('gpTitle');
    const gpStatus = document.getElementById('gpStatus');
    const gpPlayBtn = document.getElementById('gpPlayBtn');
    const gpNextBtn = document.getElementById('gpNextBtn');
    const gpSlider = document.getElementById('gpSlider');
    const gpCurrent = document.getElementById('gpCurrent');
    const gpDuration = document.getElementById('gpDuration');
    
    const studioTitle = document.getElementById('studioTitle');
    const studioNotes = document.getElementById('studioNotes');
    const studioTracks = document.getElementById('studioTracks');

    const iconPlay = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    const iconPause = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    // ==========================================
    // 3. ВСПОМОГАТЕЛЬНЫЕ
    // ==========================================
    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    function updateGlobalUI() {
        if (playlist.length === 0) return;
        const track = playlist[currentTrackIndex];
        gpTitle.textContent = `${track.title} — ${track.type}`;
        gpStatus.textContent = isGlobalPlaying ? "Играет" : "Пауза";
        updateMediaSession(track);
        updateStudioTrackButtons();
    }

    // ==========================================
    // 4. МЕДИАСЕССИЯ (ДЛЯ МАГНИТОЛЫ)
    // ==========================================
    function updateMediaSession(track) {
        if ('mediaSession' in navigator) {
            // Логотип убрали, поэтому ставим пустую обложку с цветом
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: 'Yukon Flames',
                album: track.type,
                artwork: [{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="%23111"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23eaff00" font-size="60" font-family="Arial">YF</text></svg>', sizes: '512x512', type: 'image/svg+xml' }]
            });

            navigator.mediaSession.setActionHandler('play', () => {
                if (globalAudio.paused) {
                    globalAudio.play(); isGlobalPlaying = true;
                    gpPlayBtn.innerHTML = iconPause; gpStatus.textContent = "Играет";
                }
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                if (!globalAudio.paused) {
                    globalAudio.pause(); isGlobalPlaying = false;
                    gpPlayBtn.innerHTML = iconPlay; gpStatus.textContent = "Пауза";
                }
            });
            navigator.mediaSession.setActionHandler('previoustrack', () => playTrack(currentTrackIndex - 1));
            navigator.mediaSession.setActionHandler('nexttrack', () => playTrack(currentTrackIndex + 1));
        }
    }

    // ==========================================
    // 5. ЗАПУСК И УПРАВЛЕНИЕ
    // ==========================================
    function playTrack(index) {
        if (playlist.length === 0) return;
        if (index >= playlist.length) index = 0;
        if (index < 0) index = playlist.length - 1;
        
        currentTrackIndex = index;
        const track = playlist[currentTrackIndex];

        globalAudio.src = track.src;
        
        const playPromise = globalAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isGlobalPlaying = true;
                gpPlayBtn.innerHTML = iconPause;
                updateGlobalUI();
                highlightActiveSong(track.title);
            }).catch(error => {
                isGlobalPlaying = false;
                gpPlayBtn.innerHTML = iconPlay;
                gpStatus.textContent = "Нажмите Play";
            });
        }
    }

    // Подсветка песни и обновление правой панели
    function highlightActiveSong(songTitle) {
        songCards.forEach(card => {
            if (card.getAttribute('data-title') === songTitle) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        
        const data = songData[songTitle];
        if (data) {
            studioTitle.textContent = songTitle;
            studioNotes.innerHTML = data.notes;
            renderStudioTracks(data.tracks);
        }
    }

    // Отрисовка списка треков в правой панели
    function renderStudioTracks(tracks) {
        studioTracks.innerHTML = '';
        tracks.forEach(track => {
            const btn = document.createElement('button');
            btn.className = 'track-btn';
            
            const isCurrent = playlist[currentTrackIndex] && playlist[currentTrackIndex].src === track.src;

            if (isCurrent && isGlobalPlaying) {
                btn.classList.add('playing');
            }

            btn.innerHTML = `
                <span>${track.type}</span>
                <svg class="track-icon" viewBox="0 0 24 24">${isCurrent && isGlobalPlaying ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>'}</svg>
            `;

            btn.addEventListener('click', () => {
                if (isCurrent && isGlobalPlaying) {
                    globalAudio.pause();
                    isGlobalPlaying = false;
                    gpPlayBtn.innerHTML = iconPlay;
                    gpStatus.textContent = "Пауза";
                    updateStudioTrackButtons();
                } else {
                    playTrack(track.globalIndex);
                }
            });

            studioTracks.appendChild(btn);
        });
    }

    function updateStudioTrackButtons() {
        if (!playlist[currentTrackIndex]) return;
        const activeSong = playlist[currentTrackIndex].title;
        if (songData[activeSong]) {
            // Перерисовываем только если открыта та же песня
            const currentStudioTitle = studioTitle.textContent;
            if (activeSong === currentStudioTitle) {
                renderStudioTracks(songData[activeSong].tracks);
            }
        }
    }

    // ==========================================
    // 6. ОБРАБОТЧИКИ
    // ==========================================
    
    gpPlayBtn.addEventListener('click', () => {
        if (globalAudio.paused) {
            if (!globalAudio.src) playTrack(0);
            else {
                globalAudio.play(); isGlobalPlaying = true;
                gpPlayBtn.innerHTML = iconPause; gpStatus.textContent = "Играет";
                updateStudioTrackButtons();
            }
        } else {
            globalAudio.pause(); isGlobalPlaying = false;
            gpPlayBtn.innerHTML = iconPlay; gpStatus.textContent = "Пауза";
            updateStudioTrackButtons();
        }
    });

    gpNextBtn.addEventListener('click', () => playTrack(currentTrackIndex + 1));

    globalAudio.addEventListener('ended', () => {
        setTimeout(() => playTrack(currentTrackIndex + 1), 100);
    });

    globalAudio.addEventListener('timeupdate', () => {
        if (!gpSlider.matches(':active')) gpSlider.value = globalAudio.currentTime;
        gpCurrent.textContent = formatTime(globalAudio.currentTime);
    });

    globalAudio.addEventListener('loadedmetadata', () => {
        gpDuration.textContent = formatTime(globalAudio.duration);
        gpSlider.max = globalAudio.duration;
    });

    gpSlider.addEventListener('input', () => {
        gpCurrent.textContent = formatTime(gpSlider.value);
    });

    gpSlider.addEventListener('change', () => {
        globalAudio.currentTime = gpSlider.value;
    });

    // Клик по песне в левой колонке
    songCards.forEach(card => {
        const header = card.querySelector('.song-header');
        header.addEventListener('click', () => {
            const songTitle = card.getAttribute('data-title');
            
            // Если песня уже выбрана и играет — пауза
            if (card.classList.contains('active') && isGlobalPlaying && playlist[currentTrackIndex].title === songTitle) {
                globalAudio.pause(); isGlobalPlaying = false;
                gpPlayBtn.innerHTML = iconPlay; gpStatus.textContent = "Пауза";
                updateStudioTrackButtons();
            } else {
                // Иначе просто подсвечиваем и показываем треки
                highlightActiveSong(songTitle);
            }
        });
    });

    // Инициализация при загрузке
    if (playlist.length > 0) {
        // Автоматически выбираем первую песню для отображения
        highlightActiveSong(playlist[0].title);
    }
});