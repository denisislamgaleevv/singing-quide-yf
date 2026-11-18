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
    // 2. ЭЛЕМЕНТЫ ИНТЕРФЕЙСА (Авто-сборка)
    // ==========================================
    if (!document.querySelector('.app-layout')) {
        const layout = document.createElement('div');
        layout.className = 'app-layout';
        
        const songsSection = document.createElement('div');
        songsSection.className = 'songs-section';
        
        const topHeader = document.querySelector('.top-header');
        const songsGrid = document.querySelector('.songs-grid');
        if(topHeader) songsSection.appendChild(topHeader);
        if(songsGrid) songsSection.appendChild(songsGrid);
        
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

        const oldPlayer = document.getElementById('globalPlayer');
        if (oldPlayer) oldPlayer.remove();

        layout.appendChild(songsSection);
        layout.appendChild(studioPanel);
        
        document.body.innerHTML = '';
        document.body.appendChild(layout);
        
        const audioTag = document.createElement('audio');
        audioTag.id = 'globalAudio';
        audioTag.preload = 'metadata';
        document.body.appendChild(audioTag);
    }

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
    // 4. МЕДИАСЕССИЯ
    // ==========================================
    function updateMediaSession(track) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: 'Yukon Flames',
                album: track.type,
                artwork: [{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="%23111"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23eaff00" font-size="60" font-family="Arial">YF</text></svg>', sizes: '512x512', type: 'image/svg+xml' }]
            });

            try {
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
            } catch (e) {
                console.log("MediaSession actions not supported");
            }
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

        globalAudio.pause();
        globalAudio.removeAttribute('src'); 
        globalAudio.load();

        globalAudio.src = track.src;
        
        const playPromise = globalAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isGlobalPlaying = true;
                gpPlayBtn.innerHTML = iconPause;
                updateGlobalUI();
                highlightActiveSong(track.title);
            }).catch(error => {
                console.error("Ошибка воспроизведения:", error);
                gpStatus.textContent = "Ошибка формата. Пропуск...";
                isGlobalPlaying = false;
                gpPlayBtn.innerHTML = iconPlay;
                
                if (playlist.length > 1) {
                    setTimeout(() => playTrack(currentTrackIndex + 1), 1000);
                }
            });
        }
    }

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

    globalAudio.addEventListener('error', (e) => {
        console.error("Ошибка аудио: ", globalAudio.error);
        gpStatus.textContent = "Ошибка файла. Пропуск...";
        setTimeout(() => playTrack(currentTrackIndex + 1), 1000);
    });

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

    // ==========================================
    // 7. КЛИК ПО ПЕСНЕ (МГНОВЕННЫЙ СТАРТ)
    // ==========================================
    songCards.forEach(card => {
        const header = card.querySelector('.song-header');
        header.addEventListener('click', () => {
            const songTitle = card.getAttribute('data-title');
            
            // Если эта песня уже играет — ставим на паузу
            if (isGlobalPlaying && playlist[currentTrackIndex] && playlist[currentTrackIndex].title === songTitle) {
                globalAudio.pause(); 
                isGlobalPlaying = false;
                gpPlayBtn.innerHTML = iconPlay; 
                gpStatus.textContent = "Пауза";
                updateStudioTrackButtons();
            } else {
                // Иначе — запускаем первый трек этой песни
                const tracks = songData[songTitle].tracks;
                if (tracks && tracks.length > 0) {
                    playTrack(tracks[0].globalIndex);
                }
            }
        });
    });

    // Инициализация интерфейса при загрузке (без автозапуска)
    if (playlist.length > 0) {
        highlightActiveSong(playlist[0].title);
    }
});