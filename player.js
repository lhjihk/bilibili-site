// ============================================================
// 声 · 试听台
// 本地音频：Web Audio 真波形 + 进度控制
// B站/网易云：隐藏画面只留声音，波形为节奏模拟（浏览器拿不到
//            跨域 iframe 的音频数据），可点「画面」按钮显出视频
// 全局输出 window.__level (0..1) 供全站"随乐呼吸"
// ============================================================
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);

    document.addEventListener('site:ready', () => {
        const listEl = $('tracklist');
        const npTitle = $('npTitle');
        const btnPlay = $('btnPlay');
        const btnPrev = $('btnPrev');
        const btnNext = $('btnNext');
        const btnVideo = $('btnVideo');
        const deckTime = $('deckTime');
        const seekEl = $('deckSeek');
        const seekFill = $('deckSeekFill');
        const deckIdle = $('deckIdle');
        const deckEmbed = $('deckEmbed');
        const waveCanvas = $('waveCanvas');
        if (!listEl || !waveCanvas) return;

        const tracks = (window.SITE.tracks || []).slice();
        const TOUCH = window.matchMedia('(hover: none)').matches; // 手机：隐藏 iframe 不允许自动出声
        let current = -1;
        let mode = 'idle';           // idle | audio | embed
        let embedOn = false;         // embed 是否在"播放"（点击后即视为在播）
        window.__level = 0;

        // ---------- audio 引擎 ----------
        const audio = new Audio();
        audio.preload = 'metadata';
        let actx = null, analyser = null, freq = null;

        function ensureAnalyser() {
            if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
            try {
                actx = new (window.AudioContext || window.webkitAudioContext)();
                const src = actx.createMediaElementSource(audio);
                analyser = actx.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.82;
                src.connect(analyser);
                analyser.connect(actx.destination);
                freq = new Uint8Array(analyser.frequencyBinCount);
            } catch (e) { /* 老浏览器没有 WebAudio 也能裸播 */ }
        }

        // ---------- 波形画布 ----------
        const wctx = waveCanvas.getContext('2d');
        function resizeWave() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            waveCanvas.width = waveCanvas.clientWidth * dpr;
            waveCanvas.height = waveCanvas.clientHeight * dpr;
        }
        window.addEventListener('resize', resizeWave);
        resizeWave();

        // embed 模式的节奏模拟：平滑噪声，看起来像真的
        const fakePhase = Array.from({ length: 72 }, () => Math.random() * Math.PI * 2);
        const fakeSpeed = Array.from({ length: 72 }, () => 0.7 + Math.random() * 1.8);

        let waveOn = false;
        function drawWave() {
            if (mode === 'idle') { // 待机：清一次画布就停帧，不空转
                wctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
                window.__level = 0;
                waveOn = false;
                return;
            }
            requestAnimationFrame(drawWave);
            const w = waveCanvas.width, h = waveCanvas.height;
            wctx.clearRect(0, 0, w, h);
            const playingAudio = mode === 'audio' && !audio.paused;
            const playingEmbed = mode === 'embed' && embedOn;

            let data = null;
            if (playingAudio && analyser) {
                analyser.getByteFrequencyData(freq);
                data = freq;
            }

            const t = performance.now() / 1000;
            const bars = 64;
            const gap = w / bars;
            const mid = h / 2;

            // 采样每根柱的能量
            const vals = new Array(bars);
            let sum = 0;
            for (let i = 0; i < bars; i++) {
                const p = i / bars;
                let v = 0.04;
                if (data) {
                    const idx = Math.floor(Math.pow(p, 1.4) * data.length * 0.85);
                    v = Math.max(data[idx] / 255, 0.04);
                } else if (playingEmbed) {
                    const env = 1 - p * 0.72;
                    v = Math.max(0.05, env * (0.32
                        + 0.24 * Math.sin(t * fakeSpeed[i] * 2.1 + fakePhase[i])
                        + 0.18 * Math.sin(t * 3.7 + i * 0.7)
                        + 0.12 * Math.sin(t * 9.3 + i * 2.3)));
                }
                vals[i] = v;
                sum += v;
            }
            const avg = sum / bars;

            // 底层：实验室网格细点
            wctx.fillStyle = 'rgba(244,243,235,0.06)';
            const step = Math.max(18, w / 48);
            for (let gx = step / 2; gx < w; gx += step)
                for (let gy = step / 2; gy < h; gy += step)
                    wctx.fillRect(gx, gy, 1.5, 1.5);

            // 中层：上下镜像圆头柱（高端播放器质感）
            const bw = Math.max(gap * 0.36, 2);
            const rad = bw / 2;
            for (let i = 0; i < bars; i++) {
                const p = i / bars, v = vals[i];
                const bh = Math.max(v * h * 0.4, rad + 1);
                const x = i * gap + (gap - bw) / 2;
                const r = Math.round(106 + p * 71);
                const g = Math.round(21 + p * 158);
                const b = Math.round(255 - p * 60);
                wctx.fillStyle = `rgba(${r},${g},${b},${0.45 + v * 0.55})`;
                wctx.beginPath();
                wctx.roundRect(x, mid - bh, bw, bh * 2, rad);
                wctx.fill();
            }

            // 顶层：平滑光带曲线 + 随节拍呼吸的柔光
            wctx.save();
            wctx.shadowColor = 'rgba(139,69,255,' + (0.35 + avg * 0.6) + ')';
            wctx.shadowBlur = 14 + avg * 30;
            wctx.strokeStyle = 'rgba(196,164,255,0.9)';
            wctx.lineWidth = 2;
            wctx.beginPath();
            for (let i = 0; i < bars; i++) {
                const x = i * gap + gap / 2;
                const y = mid - Math.max(vals[i] * h * 0.4, rad + 1) - 4;
                if (i === 0) wctx.moveTo(x, y);
                else {
                    const px = (i - 1) * gap + gap / 2;
                    const py = mid - Math.max(vals[i - 1] * h * 0.4, rad + 1) - 4;
                    wctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
                }
            }
            wctx.stroke();
            wctx.restore();
            // 全站呼吸用的能量值（平滑）
            const raw = playingAudio || playingEmbed ? sum / bars : 0;
            window.__level += (raw - window.__level) * 0.12;

            if (mode === 'audio' && audio.duration) {
                seekFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
                deckTime.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
            }
        }
        function wakeWave() { if (!waveOn) { waveOn = true; requestAnimationFrame(drawWave); } }

        function fmt(s) {
            s = Math.floor(s || 0);
            return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
        }

        // ---------- 曲目单渲染 ----------
        const BADGE = { local: 'AUDIO', 163: '网易云', bilibili: 'BILI', file: 'TEMP' };
        function render() {
            listEl.innerHTML = '';
            tracks.forEach((t, i) => {
                const li = document.createElement('li');
                li.className = 'track' + (i === current ? ' playing' : '');
                li.innerHTML = `
                    <span class="tk-no">${String(i + 1).padStart(2, '0')}</span>
                    <span class="tk-title">${t.title}</span>
                    <span class="tk-note">${t.note || ''}</span>
                    <span class="tk-year">${t.year || ''}</span>
                    <span class="tk-badge tk-badge-${t.type}">${BADGE[t.type] || t.type}</span>
                    <span class="tk-eq" aria-hidden="true"><i></i><i></i><i></i></span>`;
                li.addEventListener('click', () => play(i));
                listEl.appendChild(li);
            });
        }

        // ---------- 播放控制 ----------
        function stopAll() {
            audio.pause();
            deckEmbed.innerHTML = '';
            deckEmbed.classList.remove('on', 'show');
            btnVideo?.classList.remove('active');
            deckIdle.classList.add('off');
            embedOn = false;
        }

        const deckMini = $('deckMini');
        function play(i) {
            const t = tracks[i];
            if (!t) return;
            current = i;
            stopAll();
            npTitle.textContent = t.title;
            deckMini?.classList.add('on');

            if (t.type === 'local' || t.type === 'file') {
                mode = 'audio';
                ensureAnalyser();
                audio.src = t.src;
                audio.play().catch(() => {});
                btnPlay.textContent = '❚❚';
                if (btnVideo) btnVideo.style.display = 'none';
            } else if (t.type === '163') {
                mode = 'embed'; embedOn = true;
                deckEmbed.innerHTML = `<iframe frameborder="no" marginwidth="0" marginheight="0" width="100%" height="86"
                    allow="autoplay" src="https://music.163.com/outchain/player?type=2&id=${t.id}&auto=1&height=66"></iframe>`;
                deckEmbed.classList.add('on');
                btnPlay.textContent = '■';
                deckTime.textContent = 'B站 / 外链播放中';
                if (btnVideo) btnVideo.style.display = '';
            } else if (t.type === 'bilibili') {
                mode = 'embed'; embedOn = true;
                deckEmbed.innerHTML = `<iframe src="https://player.bilibili.com/player.html?bvid=${t.bvid}&autoplay=1&danmaku=0"
                    frameborder="no" allow="autoplay; fullscreen" allowfullscreen scrolling="no"></iframe>`;
                deckEmbed.classList.add('on'); // 默认隐藏画面（CSS 控制），只出声
                btnPlay.textContent = '■';
                deckTime.textContent = '声音来自 B站 · 点「画面」看视频';
                if (btnVideo) btnVideo.style.display = '';
            }
            // 手机：隐藏播放器出不了声，直接把播放器亮出来让人点
            if (mode === 'embed' && TOUCH) {
                deckEmbed.classList.add('show');
                btnVideo?.classList.add('active');
                deckTime.textContent = '在播放器里点 ▶ 开始';
            }
            wakeWave();
            render();
        }

        btnPlay.addEventListener('click', () => {
            if (current < 0) { play(0); return; }
            if (mode === 'audio') {
                if (audio.paused) { ensureAnalyser(); audio.play().catch(() => {}); btnPlay.textContent = '❚❚'; }
                else { audio.pause(); btnPlay.textContent = '▶'; }
            } else if (mode === 'embed') {
                // embed 无法暂停跨域播放器 → 停止=卸载
                stopAll();
                mode = 'idle';
                deckIdle.classList.remove('off');
                deckMini?.classList.remove('on');
                btnPlay.textContent = '▶';
                deckTime.textContent = '00:00 / 00:00';
                render();
            }
        });
        btnPrev.addEventListener('click', () => { if (tracks.length) play((current - 1 + tracks.length) % tracks.length); });
        btnNext.addEventListener('click', () => { if (tracks.length) play((current + 1) % tracks.length); });
        audio.addEventListener('ended', () => { if (tracks.length) play((current + 1) % tracks.length); });

        // 「画面」开关：隐藏/显示 B站视频
        btnVideo?.addEventListener('click', () => {
            if (mode !== 'embed') return;
            deckEmbed.classList.toggle('show');
            btnVideo.classList.toggle('active', deckEmbed.classList.contains('show'));
        });

        seekEl.addEventListener('click', (e) => {
            if (mode !== 'audio' || !audio.duration) return;
            const r = seekEl.getBoundingClientRect();
            audio.currentTime = (e.clientX - r.left) / r.width * audio.duration;
        });

        // ---------- 本地文件拖入试听 ----------
        const dz = $('dropzone');
        const fi = $('fileInput');
        function addFiles(files) {
            let first = -1;
            Array.from(files).forEach((f) => {
                if (!f.type.startsWith('audio/') && !/\.(mp3|wav|flac|m4a|ogg)$/i.test(f.name)) return;
                tracks.push({
                    type: 'file',
                    src: URL.createObjectURL(f),
                    title: f.name.replace(/\.[^.]+$/, ''),
                    year: '', note: '本地试听',
                });
                if (first < 0) first = tracks.length - 1;
            });
            if (first >= 0) play(first);
            else render();
        }
        if (dz && fi) {
            fi.addEventListener('change', () => addFiles(fi.files));
            ['dragover', 'dragenter'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); }));
            ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); }));
            dz.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
        }

        // ---------- 平台链接 ----------
        const pl = $('platformLinks');
        if (pl) {
            (window.SITE.platformLinks || []).forEach((p) => {
                const a = document.createElement('a');
                a.className = 'platform-link';
                a.href = p.url;
                a.target = '_blank';
                a.rel = 'noopener';
                a.textContent = p.name + ' ↗';
                pl.appendChild(a);
            });
        }

        render();
    });
})();
