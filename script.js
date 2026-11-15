document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. ДАННЫЕ ПЛЕЙЛИСТА
    // ==========================================
    // Собираем полный список треков в нужном порядке
    const playlist = [];
    const songCards = document.querySelectorAll('.song-card');

    songCards.forEach(card => {
        const songId = card.getAttribute('data-song-id');
        const songTitle = card.getAttribute('data-title');
        const blocks = card.querySelectorAll('.audio-block');

        blocks.forEach(block => {
            const index = block.getAttribute('data-index');
            const audioContainer = block.querySelector('.custom-audio');
            const src = audioContainer.getAttribute('data-src');
            const isEmpty = audioContainer.getAttribute('data-empty') === 'true';

            let typeName = "";
            if (index === "1") typeName = "Бек-вокал";
            if (index === "2") typeName = "Без инструментов";
            if (index === "3") typeName = "С вокалом";

            // Добавляем в плейлист только существующие файлы
            if (src && !isEmpty) {
                playlist.push({
                    songId: songId,
                    title: songTitle,
                    type: typeName,
                    src: src,
                    globalIndex: playlist.length
                });
            }
        });
    });

    let currentTrackIndex = 0;
    let isGlobalPlaying = false;

    // ==========================================
    // 2. ЭЛЕМЕНТЫ ИНТЕРФЕЙСА
    // ==========================================
    const globalAudio = document.getElementById('globalAudio');
    const gpTitle = document.getElementById('gpTitle');
    const gpStatus = document.getElementById('gpStatus');
    const gpPlayBtn = document.getElementById('gpPlayBtn');
    const gpNextBtn = document.getElementById('gpNextBtn');
    const gpSlider = document.getElementById('gpSlider');
    const gpCurrent = document.getElementById('gpCurrent');
    const gpDuration = document.getElementById('gpDuration');

    const iconPlay = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    const iconPause = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    // ==========================================
    // 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ==========================================
    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    // Обновление UI глобального плеера
    function updateGlobalUI() {
        if (playlist.length === 0) return;
        const track = playlist[currentTrackIndex];
        gpTitle.textContent = `${track.title} — ${track.type}`;
        gpStatus.textContent = isGlobalPlaying ? "Играет" : "Пауза";
    }

    // Запуск трека по индексу
    function playTrack(index) {
        if (playlist.length === 0) return;
        
        // Зацикливаем плейлист
        if (index >= playlist.length) index = 0;
        if (index < 0) index = playlist.length - 1;
        
        currentTrackIndex = index;
        const track = playlist[currentTrackIndex];

        globalAudio.src = track.src;
        globalAudio.play();
        isGlobalPlaying = true;
        gpPlayBtn.innerHTML = iconPause;
        updateGlobalUI();
        
        // Подсвечиваем активную карточку (открываем её)
        highlightActiveCard(track.songId);
    }

    function highlightActiveCard(songId) {
        songCards.forEach(card => {
            if (card.getAttribute('data-song-id') === songId) {
                // Автоматически раскрываем нужную карточку
                if (!card.classList.contains('active')) {
                    card.querySelector('.song-header').click();
                }
            }
        });
    }

    // ==========================================
    // 4. ОБРАБОТЧИКИ ГЛОБАЛЬНОГО ПЛЕЕРА
    // ==========================================
    
    // Плей / Пауза
    gpPlayBtn.addEventListener('click', () => {
        if (playlist.length === 0) return;
        
        if (globalAudio.paused) {
            globalAudio.play();
            isGlobalPlaying = true;
            gpPlayBtn.innerHTML = iconPause;
            gpStatus.textContent = "Играет";
        } else {
            globalAudio.pause();
            isGlobalPlaying = false;
            gpPlayBtn.innerHTML = iconPlay;
            gpStatus.textContent = "Пауза";
        }
    });

    // Следующий трек (вручную)
    gpNextBtn.addEventListener('click', () => {
        playTrack(currentTrackIndex + 1);
    });

    // Автоматическое переключение на следующий трек
    globalAudio.addEventListener('ended', () => {
        playTrack(currentTrackIndex + 1);
    });

    // Синхронизация таймлайна глобального плеера
    globalAudio.addEventListener('timeupdate', () => {
        if (!gpSlider.matches(':active')) {
            gpSlider.value = globalAudio.currentTime;
        }
        gpCurrent.textContent = formatTime(globalAudio.currentTime);
    });

    globalAudio.addEventListener('loadedmetadata', () => {
        gpDuration.textContent = formatTime(globalAudio.duration);
        gpSlider.max = globalAudio.duration;
    });

    // Перемотка на глобальном плеере
    gpSlider.addEventListener('input', () => {
        gpCurrent.textContent = formatTime(gpSlider.value);
    });

    gpSlider.addEventListener('change', () => {
        globalAudio.currentTime = gpSlider.value;
    });

    // ==========================================
    // 5. ЛОГИКА АККОРДЕОНА И МИНИ-ПЛЕЕРОВ
    // ==========================================
    songCards.forEach(card => {
        const header = card.querySelector('.song-header');
        const content = card.querySelector('.song-content');
        
        header.addEventListener('click', () => {
            const isActive = card.classList.contains('active');
            
            // Закрываем все
            songCards.forEach(c => {
                c.classList.remove('active');
                c.querySelector('.song-content').style.display = 'none';
            });

            // Открываем кликнутую
            if (!isActive) {
                card.classList.add('active');
                content.style.display = 'block';
            }
        });
    });

    // Инициализация мини-плееров в карточках
    const players = document.querySelectorAll('.custom-audio');
    
    players.forEach(container => {
        const src = container.getAttribute('data-src');
        const isEmpty = container.getAttribute('data-empty') === 'true';

        if (isEmpty || !src) {
            container.innerHTML = `<span style="color:#666; font-size: 0.8rem; letter-spacing: 0.1em;">[ АУДИО НЕДОСТУПНО ]</span>`;
            container.style.justifyContent = "center";
            return;
        }

        // Находим глобальный индекс этого трека
        const globalTrack = playlist.find(t => t.src === src);

        container.innerHTML = `
            <button class="play-btn" aria-label="Play">${iconPlay}</button>
            <div class="progress-container">
                <span class="time-display current-time">0:00</span>
                <input type="range" class="seek-slider" value="0" min="0" max="100" step="0.1">
                <span class="time-display duration">0:00</span>
            </div>
            <audio src="${src}" preload="metadata"></audio>
        `;

        const audio = container.querySelector('audio');
        const playBtn = container.querySelector('.play-btn');
        const slider = container.querySelector('.seek-slider');
        const currentTimeEl = container.querySelector('.current-time');
        const durationEl = container.querySelector('.duration');

        // При клике на Play в карточке — запускаем ГЛОБАЛЬНЫЙ плеер
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Чтобы не срабатывал аккордеон
            
            if (globalTrack) {
                // Если этот трек уже играет в глобальном плеере, ставим на паузу
                if (currentTrackIndex === globalTrack.globalIndex && isGlobalPlaying) {
                    globalAudio.pause();
                    isGlobalPlaying = false;
                    gpPlayBtn.innerHTML = iconPlay;
                    gpStatus.textContent = "Пауза";
                } else {
                    // Иначе запускаем его
                    playTrack(globalTrack.globalIndex);
                }
            }
        });

        // Синхронизация локального вида с глобальным плеером
        globalAudio.addEventListener('play', () => {
            if (globalAudio.src.endsWith(src)) {
                playBtn.innerHTML = iconPause;
            } else {
                playBtn.innerHTML = iconPlay;
            }
        });
        
        globalAudio.addEventListener('pause', () => {
            if (globalAudio.src.endsWith(src)) {
                playBtn.innerHTML = iconPlay;
            }
        });

        globalAudio.addEventListener('timeupdate', () => {
            if (globalAudio.src.endsWith(src)) {
                if (!slider.matches(':active')) {
                    slider.value = globalAudio.currentTime;
                }
                currentTimeEl.textContent = formatTime(globalAudio.currentTime);
            }
        });

        globalAudio.addEventListener('loadedmetadata', () => {
            if (globalAudio.src.endsWith(src)) {
                durationEl.textContent = formatTime(globalAudio.duration);
                slider.max = globalAudio.duration;
            }
        });

        slider.addEventListener('input', () => {
            currentTimeEl.textContent = formatTime(slider.value);
        });

        slider.addEventListener('change', () => {
            if (globalAudio.src.endsWith(src)) {
                globalAudio.currentTime = slider.value;
            }
        });
    });

    // Первичная инициализация интерфейса глобального плеера
    updateGlobalUI();
});