document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. СБОРКА ПЛЕЙЛИСТА
    // ==========================================
    const playlist = [];
    const songCards = document.querySelectorAll('.song-card');

    songCards.forEach(card => {
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
    // 2. ЭЛЕМЕНТЫ
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
    }

    // Запуск трека (с принудительным вызовом play)
    function playTrack(index) {
        if (playlist.length === 0) return;
        
        // Бесконечный цикл: если дошли до конца, начинаем с начала
        if (index >= playlist.length) index = 0;
        if (index < 0) index = playlist.length - 1;
        
        currentTrackIndex = index;
        const track = playlist[currentTrackIndex];

        // Ставим новый src и запускаем
        globalAudio.src = track.src;
        
        // Обработка Promise (важно для мобильных браузеров)
        const playPromise = globalAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isGlobalPlaying = true;
                gpPlayBtn.innerHTML = iconPause;
                updateGlobalUI();
                highlightActiveCard(track.title);
            }).catch(error => {
                console.log("Автовоспроизведение заблокировано браузером:", error);
                isGlobalPlaying = false;
                gpPlayBtn.innerHTML = iconPlay;
                gpStatus.textContent = "Нажмите Play";
            });
        }
    }

    // Подсветка активной карточки
    function highlightActiveCard(songTitle) {
        songCards.forEach(card => {
            if (card.getAttribute('data-title') === songTitle) {
                if (!card.classList.contains('active')) {
                    card.querySelector('.song-header').click();
                }
            }
        });
    }

    // ==========================================
    // 4. ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ
    // ==========================================
    
    gpPlayBtn.addEventListener('click', () => {
        if (playlist.length === 0) return;
        
        if (globalAudio.paused) {
            // Если плеер пустой (первое включение), запускаем нулевой трек
            if (!globalAudio.src) {
                playTrack(0);
            } else {
                globalAudio.play();
                isGlobalPlaying = true;
                gpPlayBtn.innerHTML = iconPause;
                gpStatus.textContent = "Играет";
            }
        } else {
            globalAudio.pause();
            isGlobalPlaying = false;
            gpPlayBtn.innerHTML = iconPlay;
            gpStatus.textContent = "Пауза";
        }
    });

    gpNextBtn.addEventListener('click', () => {
        playTrack(currentTrackIndex + 1);
    });

    // КРИТИЧЕСКИ ВАЖНО: Автопереход на следующий трек по окончании
    globalAudio.addEventListener('ended', () => {
        // Небольшая задержка, чтобы мобильные браузеры не глючили
        setTimeout(() => {
            playTrack(currentTrackIndex + 1);
        }, 100);
    });

    // Таймлайн глобального плеера
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

    gpSlider.addEventListener('input', () => {
        gpCurrent.textContent = formatTime(gpSlider.value);
    });

    gpSlider.addEventListener('change', () => {
        globalAudio.currentTime = gpSlider.value;
    });

    // ==========================================
    // 5. АККОРДЕОН И МИНИ-ПЛЕЕРЫ
    // ==========================================
    songCards.forEach(card => {
        const header = card.querySelector('.song-header');
        const content = card.querySelector('.song-content');
        
        header.addEventListener('click', () => {
            const isActive = card.classList.contains('active');
            songCards.forEach(c => {
                c.classList.remove('active');
                c.querySelector('.song-content').style.display = 'none';
            });
            if (!isActive) {
                card.classList.add('active');
                content.style.display = 'block';
            }
        });
    });

    const players = document.querySelectorAll('.custom-audio');
    
    players.forEach(container => {
        const src = container.getAttribute('data-src');
        const isEmpty = container.getAttribute('data-empty') === 'true';

        if (isEmpty || !src) {
            container.innerHTML = `<span style="color:#666; font-size: 0.8rem; letter-spacing: 0.1em;">[ АУДИО НЕДОСТУПНО ]</span>`;
            container.style.justifyContent = "center";
            return;
        }

        // Ищем индекс этого трека в глобальном плейлисте
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

        const playBtn = container.querySelector('.play-btn');
        const slider = container.querySelector('.seek-slider');
        const currentTimeEl = container.querySelector('.current-time');
        const durationEl = container.querySelector('.duration');

        // При клике на мини-плеер — запускаем глобальный
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            if (globalTrack) {
                // Если это тот же трек, что играет сейчас
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

        // Синхронизация состояния кнопок мини-плеера
        // Используем ID трека, чтобы не было багов с кодировкой путей
        globalAudio.addEventListener('play', () => {
            if (playlist[currentTrackIndex] && playlist[currentTrackIndex].src === src) {
                playBtn.innerHTML = iconPause;
            } else {
                playBtn.innerHTML = iconPlay;
            }
        });
        
        globalAudio.addEventListener('pause', () => {
            if (playlist[currentTrackIndex] && playlist[currentTrackIndex].src === src) {
                playBtn.innerHTML = iconPlay;
            }
        });

        globalAudio.addEventListener('timeupdate', () => {
            if (playlist[currentTrackIndex] && playlist[currentTrackIndex].src === src) {
                if (!slider.matches(':active')) {
                    slider.value = globalAudio.currentTime;
                }
                currentTimeEl.textContent = formatTime(globalAudio.currentTime);
            }
        });

        globalAudio.addEventListener('loadedmetadata', () => {
            if (playlist[currentTrackIndex] && playlist[currentTrackIndex].src === src) {
                durationEl.textContent = formatTime(globalAudio.duration);
                slider.max = globalAudio.duration;
            }
        });

        slider.addEventListener('input', () => {
            currentTimeEl.textContent = formatTime(slider.value);
        });

        slider.addEventListener('change', () => {
            if (playlist[currentTrackIndex] && playlist[currentTrackIndex].src === src) {
                globalAudio.currentTime = slider.value;
            }
        });
    });

    updateGlobalUI();
});