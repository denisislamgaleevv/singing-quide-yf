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
        
        // === МЕДИАСЕССИЯ: Обновление метаданных ===
        updateMediaSession(track);
    }

    // ==========================================
    // 4. МЕДИАСЕССИЯ (MEDIA SESSION API)
    // ==========================================
    function updateMediaSession(track) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: 'Yukon Flames',
                album: track.type,
                artwork: [
                    { src: 'ЛОГОТИП.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            // Обработчики кнопок на руле / магнитоле
            navigator.mediaSession.setActionHandler('play', () => {
                if (globalAudio.paused) {
                    globalAudio.play();
                    isGlobalPlaying = true;
                    gpPlayBtn.innerHTML = iconPause;
                    gpStatus.textContent = "Играет";
                }
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                if (!globalAudio.paused) {
                    globalAudio.pause();
                    isGlobalPlaying = false;
                    gpPlayBtn.innerHTML = iconPlay;
                    gpStatus.textContent = "Пауза";
                }
            });

            navigator.mediaSession.setActionHandler('previoustrack', () => {
                playTrack(currentTrackIndex - 1);
            });

            navigator.mediaSession.setActionHandler('nexttrack', () => {
                playTrack(currentTrackIndex + 1);
            });

            // Обработка перемотки (если поддерживается)
            try {
                navigator.mediaSession.setActionHandler('seekbackward', () => {
                    globalAudio.currentTime = Math.max(0, globalAudio.currentTime - 10);
                });
                navigator.mediaSession.setActionHandler('seekforward', () => {
                    globalAudio.currentTime = Math.min(globalAudio.duration, globalAudio.currentTime + 10);
                });
            } catch (error) {
                // Некоторые браузеры не поддерживают перемотку
            }
        }
    }

    // ==========================================
    // 5. ЗАПУСК ТРЕКА
    // ==========================================
    function playTrack(index) {
        if (playlist.length === 0) return;
        
        // Бесконечный цикл
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
                updateGlobalUI(); // Здесь же обновляется и медиасессия
                highlightActiveCard(track.title);
            }).catch(error => {
                console.log("Автовоспроизведение заблокировано:", error);
                isGlobalPlaying = false;
                gpPlayBtn.innerHTML = iconPlay;
                gpStatus.textContent = "Нажмите Play";
            });
        }
    }

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
    // 6. ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ
    // ==========================================
    
    gpPlayBtn.addEventListener('click', () => {
        if (playlist.length === 0) return;
        
        if (globalAudio.paused) {
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

    globalAudio.addEventListener('ended', () => {
        setTimeout(() => {
            playTrack(currentTrackIndex + 1);
        }, 100);
    });

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
    // 7. АККОРДЕОН И МИНИ-ПЛЕЕРЫ
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

        playBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            if (globalTrack) {
                if (currentTrackIndex === globalTrack.globalIndex && isGlobalPlaying) {
                    globalAudio.pause();
                    isGlobalPlaying = false;
                    gpPlayBtn.innerHTML = iconPlay;
                    gpStatus.textContent = "Пауза";
                } else {
                    playTrack(globalTrack.globalIndex);
                }
            }
        });

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

    // Инициализация при старте
    updateGlobalUI();
});