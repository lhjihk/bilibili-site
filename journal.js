// ============================================================
// 旅人手账 · 逻辑
// 数据同 data/content.json；支持整账/单篇封存（SHA-256 口令）
// Obsidian 语法兼容：frontmatter / [[双链]] / ![[图片]] / ==高亮==
// ============================================================
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- 口令 ----------
    async function sha256(str) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    const unlocked = () => sessionStorage.getItem('journal-unlocked') === '1';
    function setUnlocked() { sessionStorage.setItem('journal-unlocked', '1'); }

    // ---------- Obsidian 语法转换 ----------
    function obsidianToMd(md) {
        // 去 YAML frontmatter
        md = md.replace(/^---\n[\s\S]*?\n---\n?/, '');
        // ![[img.png]] → 标准图片（assets 目录）
        md = md.replace(/!\[\[([^\]|]+?)(\|[^\]]*)?\]\]/g, (_, f) => {
            const file = f.trim();
            const path = /^(https?:|\/|articles\/)/.test(file) ? file : 'articles/assets/' + file;
            return `![](${path})`;
        });
        // [[链接|别名]] → 别名；[[链接]] → 链接文字
        md = md.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
        md = md.replace(/\[\[([^\]]+)\]\]/g, '$1');
        // ==高亮== → <mark>
        md = md.replace(/==([^=\n]+)==/g, '<mark>$1</mark>');
        return md;
    }

    // ---------- 主流程 ----------
    fetch('data/content.json?t=' + Date.now())
        .then((r) => r.json())
        .then(init)
        .catch((e) => console.error('content.json 加载失败', e));

    function init(SITE) {
        // 书法字体切换（与主页 boot.js 同一逻辑，以后台设置为准）
        try {
            const brush = (SITE.settings && SITE.settings.logoFont) || '';
            if (brush) {
                document.documentElement.dataset.brush = brush;
                localStorage.setItem('ljty-brush', brush);
            } else {
                delete document.documentElement.dataset.brush;
                localStorage.removeItem('ljty-brush');
            }
        } catch (e) { /* localStorage 不可用不影响本页 */ }

        const J = (SITE.settings && SITE.settings.journal) || {};
        const ARTICLES = SITE.articles || [];
        const PASS_HASH = J.passHash || '';

        // ===== 可编辑文案注入 =====
        const TEXTS = (SITE.settings && SITE.settings.texts) || {};
        document.querySelectorAll('[data-txt], [data-txt-html]').forEach((el) => {
            const key = el.dataset.txt || el.dataset.txtHtml;
            if (TEXTS[key] != null && TEXTS[key] !== '') el.innerHTML = TEXTS[key];
        });

        // ===== 夜航开篇：星空 =====
        const starCanvas = $('starCanvas');
        if (starCanvas) {
            const ctx = starCanvas.getContext('2d');
            const mobile = innerWidth < 720;
            const N = mobile ? 90 : 230;
            let W, H, stars = [], meteors = [];
            const bg = (SITE.settings.backgrounds || {}).journalSky || '';
            if (bg) {
                starCanvas.style.backgroundImage = `url("${bg}")`;
                starCanvas.style.backgroundSize = 'cover';
            }
            function resize() {
                const dpr = Math.min(devicePixelRatio || 1, 2);
                W = starCanvas.width = starCanvas.clientWidth * dpr;
                H = starCanvas.height = starCanvas.clientHeight * dpr;
                stars = Array.from({ length: N }, () => ({
                    x: Math.random() * W, y: Math.random() * H * 0.82,
                    z: 0.3 + Math.random() * 0.7,          // 深度：视差 + 大小
                    tw: Math.random() * Math.PI * 2,
                    sp: 0.4 + Math.random() * 1.4,
                    gold: Math.random() < 0.06,
                }));
            }
            resize();
            addEventListener('resize', resize);
            let mx = 0, my = 0, nightAlive = true;
            addEventListener('pointermove', (e) => {
                mx = (e.clientX / innerWidth - 0.5);
                my = (e.clientY / innerHeight - 0.5);
            }, { passive: true });
            function spawnMeteor() {
                if (Math.random() < 0.6) {
                    meteors.push({ x: W * (0.2 + Math.random() * 0.7), y: H * Math.random() * 0.3, vx: -(4 + Math.random() * 5), vy: 2.5 + Math.random() * 2.5, life: 1 });
                }
                setTimeout(spawnMeteor, 4000 + Math.random() * 7000);
            }
            if (!reduced) setTimeout(spawnMeteor, 2500);
            function draw(now) {
                if (!nightAlive) return;
                requestAnimationFrame(draw);
                if (document.hidden) return;
                ctx.clearRect(0, 0, W, H);
                const t = now / 1000;
                for (const s of stars) {
                    const flick = 0.55 + 0.45 * Math.sin(t * s.sp + s.tw);
                    const px = s.x + mx * 40 * s.z, py = s.y + my * 26 * s.z;
                    const r = s.z * (s.gold ? 2.6 : 1.5);
                    ctx.fillStyle = s.gold
                        ? `rgba(240, 205, 130, ${0.5 + flick * 0.5})`
                        : `rgba(226, 230, 246, ${0.25 + flick * 0.55 * s.z})`;
                    ctx.beginPath();
                    ctx.arc(px, py, r, 0, 7);
                    ctx.fill();
                }
                // 流星
                for (let i = meteors.length - 1; i >= 0; i--) {
                    const m = meteors[i];
                    m.x += m.vx; m.y += m.vy; m.life -= 0.016;
                    if (m.life <= 0) { meteors.splice(i, 1); continue; }
                    const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 10, m.y - m.vy * 10);
                    grad.addColorStop(0, `rgba(250, 244, 224, ${m.life * 0.9})`);
                    grad.addColorStop(1, 'transparent');
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    ctx.moveTo(m.x, m.y);
                    ctx.lineTo(m.x - m.vx * 10, m.y - m.vy * 10);
                    ctx.stroke();
                }
            }
            requestAnimationFrame(draw);

            // 滚动叙事：题字→引言三段→天亮
            if (!reduced) {
                gsap.registerPlugin(ScrollTrigger);
                document.body.classList.add('at-night');
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: '#jnight', start: 'top top', end: 'bottom bottom', scrub: 0.4,
                        onLeave: () => document.body.classList.remove('at-night'),
                        onEnterBack: () => document.body.classList.add('at-night'),
                    },
                });
                tl.to('.jn-core', { opacity: 0, yPercent: -14, ease: 'power1.in', duration: 2 }, 0.6)
                  .fromTo('#jnQuote1', { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 1.2 }, 2.2)
                  .to('#jnQuote1', { opacity: 0, y: -30, duration: 1 }, 3.8)
                  .fromTo('#jnQuote2', { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 1.2 }, 4.6)
                  .to('#jnQuote2', { opacity: 0, y: -30, duration: 1 }, 6.2)
                  .fromTo('#jnQuote3', { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 1.2 }, 7)
                  .to('#jnQuote3', { opacity: 0, y: -30, duration: 1 }, 8.6)
                  .to('.jn-moon', { yPercent: 240, xPercent: -30, opacity: 0, duration: 5 }, 4.5)
                  .to('#starCanvas', { opacity: 0.12, duration: 3 }, 6.5)
                  .to('.jn-mtn-far', { opacity: 0.25, duration: 3 }, 7)
                  .to('.jn-mtn-near', { opacity: 0.4, duration: 3 }, 7)
                  .to('#jnDawn', { opacity: 1, duration: 2.4, ease: 'power1.in' }, 7.6)
                  .to('.jn-scrollhint', { opacity: 0, duration: 1 }, 1);
                ScrollTrigger.create({
                    trigger: '.jmap-wrap', start: 'top 80%',
                    onEnter: () => { nightAlive = false; },
                    onLeaveBack: () => { if (!nightAlive) { nightAlive = true; requestAnimationFrame(draw); } },
                });
            } else {
                document.querySelector('.jn-dawn').style.opacity = 0;
            }
        }

        // ===== 路上的随身听 =====
        const tape = $('jtape');
        if (tape && (SITE.tracks || []).length) {
            const TR = SITE.tracks;
            let cur = 0, playing = false;
            const tTitle = $('tapeTitle'), tNote = $('tapeNote'), tStatus = $('tapeStatus'), tEmbed = $('tapeEmbed');
            function show(i) {
                cur = (i + TR.length) % TR.length;
                tTitle.textContent = TR[cur].title;
                tNote.textContent = (TR[cur].note || '') + (TR[cur].year ? ' · ' + TR[cur].year : '');
            }
            const TOUCH = window.matchMedia('(hover: none)').matches; // 手机：隐藏 iframe 出不了声
            // 桌面 Safari 也用 B站 H5 播放器（外链在 macOS Safari 卡缓存）；只认 Apple Safari，其他浏览器/手机端不变
            const isAppleSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor) && !/Chrome|CriOS|Chromium|Edg|OPR|FxiOS/.test(navigator.userAgent);
            function stop() {
                playing = false;
                tEmbed.innerHTML = '';
                tape.classList.remove('playing', 'showplayer');
                tStatus.textContent = 'STOPPED';
                $('tapePlay').textContent = '▶ PLAY';
            }
            function playTape() {
                const t = TR[cur];
                // 手机浏览器放不了电脑版外链播放器，换 B站手机 H5 播放器（内嵌直播，不跳APP）
                const biliSrc = (TOUCH || isAppleSafari)
                    ? `https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=${t.bvid}&page=1&high_quality=1&danmaku=0&posterFirst=1`
                    : `https://player.bilibili.com/player.html?bvid=${t.bvid}&autoplay=1&danmaku=0&high_quality=1`;
                tEmbed.innerHTML = t.type === 'bilibili'
                    ? `<iframe src="${biliSrc}" allow="autoplay; fullscreen" allowfullscreen></iframe>`
                    : t.type === '163'
                        ? `<iframe src="https://music.163.com/outchain/player?type=2&id=${t.id}&auto=1&height=66" allow="autoplay"></iframe>`
                        : `<audio src="${t.src}" autoplay></audio>`;
                playing = true;
                tape.classList.add('playing');
                if (TOUCH) { // 手机：亮出播放器让人点
                    tape.classList.add('showplayer');
                    tStatus.textContent = 'TAP ▶ — 在下方播放器点播放';
                } else {
                    tStatus.textContent = 'PLAYING — 声音来自B站';
                }
                $('tapePlay').textContent = '■ STOP';
            }
            $('tapePlay').addEventListener('click', () => playing ? stop() : playTape());
            $('tapePrev').addEventListener('click', () => { show(cur - 1); if (playing) playTape(); });
            $('tapeNext').addEventListener('click', () => { show(cur + 1); if (playing) playTape(); });
            show(0);
        }

        // ===== 墨水退场（从实验室带墨进来） =====
        const veil = $('inkVeil');
        if (sessionStorage.getItem('ink-in') === '1' && !reduced && veil) {
            sessionStorage.removeItem('ink-in');
            veil.style.display = 'block';
            veil.style.clipPath = `circle(${Math.hypot(innerWidth, innerHeight)}px at 50% 50%)`;
            requestAnimationFrame(() => {
                gsap.to(veil, {
                    clipPath: `circle(0px at 50% 42%)`, duration: 0.85, ease: 'power3.inOut', delay: 0.1,
                    onComplete: () => { veil.style.display = 'none'; },
                });
            });
        }
        // 回实验室也带墨走
        [$('backLink'), $('footBack')].forEach((a) => {
            a?.addEventListener('click', (e) => {
                if (reduced || !veil) return;
                e.preventDefault();
                veil.style.display = 'block';
                gsap.fromTo(veil, { clipPath: `circle(0px at ${e.clientX}px ${e.clientY}px)` },
                    { clipPath: `circle(${Math.hypot(innerWidth, innerHeight)}px at ${e.clientX}px ${e.clientY}px)`,
                      duration: 0.6, ease: 'power3.in',
                      onComplete: () => { location.href = a.getAttribute('href'); } });
            });
        });

        // ===== 整账封存之门 =====
        const gate = $('gate');
        async function tryGate() {
            const v = $('gatePass').value;
            if (!v) return;
            if (await sha256(v) === PASS_HASH) {
                setUnlocked();
                gsap.to(gate, { opacity: 0, duration: 0.7, ease: 'power2.in', onComplete: () => gate.classList.remove('on') });
            } else {
                $('gateErr').textContent = '口令不对，风把它吹走了。';
                gsap.fromTo('.gate-paper', { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(2, 0.3)' });
            }
        }
        if (J.lockAll && !unlocked()) {
            gate.classList.add('on');
            $('gateBtn').addEventListener('click', tryGate);
            $('gatePass').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryGate(); });
        }

        // ===== 卷首入场（夜航题字浮现） =====
        if (!reduced) {
            gsap.registerPlugin(ScrollTrigger);
            gsap.from('.jn-eyebrow, .jn-title, .jn-en, .jn-sub', {
                opacity: 0, y: 30, filter: 'blur(6px)',
                duration: 1.4, ease: 'power3.out', stagger: 0.22, delay: 0.4,
            });
            gsap.from('.jn-moon', { opacity: 0, scale: 0.7, duration: 2, ease: 'power2.out', delay: 0.3 });
            gsap.from('.jheader', { opacity: 0, duration: 0.8, delay: 1.2 });
        }

        // ===== 征途图 =====
        const pinsSorted = ARTICLES.filter((a) => a.coord).map((a) => {
            const m = a.coord.match(/([\d.]+)°N\s+([\d.]+)°E/);
            return m ? { ...a, lat: +m[1], lon: +m[2] } : null;
        }).filter(Boolean).sort((a, b) => (a.year || '0') > (b.year || '0') ? 1 : -1);

        if (pinsSorted.length) {
            // 投影范围（数据外扩一圈）
            const lats = pinsSorted.map((p) => p.lat), lons = pinsSorted.map((p) => p.lon);
            const latMin = Math.min(...lats) - 5, latMax = Math.max(...lats) + 6;
            const lonMin = Math.min(...lons) - 7, lonMax = Math.max(...lons) + 9;
            const X = (lon) => 70 + (lon - lonMin) / (lonMax - lonMin) * 860;
            const Y = (lat) => 500 - (lat - latMin) / (latMax - latMin) * 440;

            // 经纬网格
            const grid = $('mapGrid');
            let g = '';
            for (let lat = Math.ceil(latMin / 5) * 5; lat <= latMax; lat += 5) {
                g += `<line class="map-grid-line" x1="0" y1="${Y(lat)}" x2="1000" y2="${Y(lat)}"/>`;
                g += `<text class="map-grid-label" x="8" y="${Y(lat) - 4}">${lat}°N</text>`;
            }
            for (let lon = Math.ceil(lonMin / 5) * 5; lon <= lonMax; lon += 5) {
                g += `<line class="map-grid-line" x1="${X(lon)}" y1="0" x2="${X(lon)}" y2="560"/>`;
                g += `<text class="map-grid-label" x="${X(lon) + 4}" y="550">${lon}°E</text>`;
            }
            grid.innerHTML = g;

            // 征途虚线（按年份连线）
            const pts = pinsSorted.map((p) => `${X(p.lon)},${Y(p.lat)}`).join(' ');
            $('mapRoute').innerHTML = `<polyline class="map-route" id="routeLine" points="${pts}"/>`;

            // 图钉
            $('mapPins').innerHTML = pinsSorted.map((p) => {
                const x = X(p.lon), y = Y(p.lat);
                const labelUp = y > 120;
                return `<g class="map-pin" data-id="${p.id}" transform="translate(${x},${y})">
                    <circle class="ring" r="13"/>
                    <circle class="core" r="5"/>
                    <text x="18" y="${labelUp ? -10 : 24}">${p.locked ? '🔒 ' : ''}${p.place.split('·').pop().trim()}</text>
                    <text class="pin-year" x="18" y="${labelUp ? 6 : 40}">${p.date || p.year || ''}</text>
                </g>`;
            }).join('');
            $('mapPins').querySelectorAll('.map-pin').forEach((pin) => {
                pin.addEventListener('click', () => openById(pin.dataset.id));
            });

            const years = pinsSorted.map((p) => p.year).filter(Boolean);
            $('mapRange').textContent = years.length ? `${years[0]} — ${years[years.length - 1]} · ${pinsSorted.length} STOPS` : '';

            // 路线描画动画
            if (!reduced) {
                const line = $('routeLine');
                const len = line.getTotalLength();
                gsap.fromTo(line, { strokeDasharray: `${len}`, strokeDashoffset: len },
                    { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut',
                      scrollTrigger: { trigger: '#jmap', start: 'top 75%' },
                      onComplete: () => { line.style.strokeDasharray = '7 7'; } });
                gsap.from('.map-pin', {
                    scale: 0, opacity: 0, transformOrigin: 'center', duration: 0.7, ease: 'back.out(2.4)',
                    stagger: 0.35, delay: 0.5,
                    scrollTrigger: { trigger: '#jmap', start: 'top 75%' },
                });
            }
        }

        // ===== 分桶 + 时间轴 =====
        const buckets = ['全部', ...new Set(ARTICLES.map((a) => a.bucket || '未分类'))];
        const bucketEl = $('jbuckets');
        bucketEl.innerHTML = buckets.map((b) => {
            const cnt = b === '全部' ? ARTICLES.length : ARTICLES.filter((a) => (a.bucket || '未分类') === b).length;
            return `<button class="jbucket${b === '全部' ? ' active' : ''}" data-b="${b}">${b}<span class="cnt">${cnt}</span></button>`;
        }).join('');
        bucketEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.jbucket');
            if (!btn) return;
            bucketEl.querySelectorAll('.jbucket').forEach((x) => x.classList.remove('active'));
            btn.classList.add('active');
            renderTimeline(btn.dataset.b);
        });

        const timeline = $('jtimeline');
        function renderTimeline(bucket) {
            const list = ARTICLES.filter((a) => bucket === '全部' || (a.bucket || '未分类') === bucket);
            // 按年份倒序分组
            const byYear = {};
            list.forEach((a) => { (byYear[a.year || '未知'] ||= []).push(a); });
            const years = Object.keys(byYear).sort().reverse();
            timeline.innerHTML = years.map((y) => `
                <div class="jyear">${y}</div>
                ${byYear[y].map((a) => `
                <div class="jcard${a.locked ? ' locked' : ''}" data-id="${a.id}">
                    ${a.locked ? '<span class="jcard-lockmark">封</span>' : ''}
                    <h3 class="jcard-title">${a.title}</h3>
                    <p class="jcard-excerpt">${a.excerpt || ''}</p>
                    <div class="jcard-meta mono">
                        <span>${a.place || ''}</span>
                        <span>${a.date || ''}</span>
                        <span>${a.coord || ''}</span>
                        <span>${a.bucket || ''}</span>
                    </div>
                </div>`).join('')}
            `).join('');
            timeline.querySelectorAll('.jcard').forEach((c) => {
                c.addEventListener('click', () => openById(c.dataset.id));
            });
            if (!reduced) {
                gsap.from(timeline.querySelectorAll('.jcard'), {
                    opacity: 0, y: 34, rotate: () => (Math.random() - 0.5) * 3,
                    duration: 0.7, ease: 'power3.out', stagger: 0.08,
                });
            }
        }
        renderTimeline('全部');

        // ===== 启封小窗（单篇） =====
        const um = $('unlockModal');
        let pendingId = null;
        async function tryUnlock() {
            const v = $('umPass').value;
            if (!v) return;
            if (await sha256(v) === PASS_HASH) {
                setUnlocked();
                um.classList.remove('on');
                $('umErr').textContent = '';
                if (pendingId) { const id = pendingId; pendingId = null; openById(id); }
            } else {
                $('umErr').textContent = '口令不对。';
            }
        }
        $('umOk').addEventListener('click', tryUnlock);
        $('umPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryUnlock(); });
        $('umCancel').addEventListener('click', () => { um.classList.remove('on'); pendingId = null; });

        // ===== 阅读页 =====
        const reader = $('jreader');
        function openById(id) {
            const a = ARTICLES.find((x) => x.id === id);
            if (!a) return;
            if (a.locked && !unlocked()) {
                pendingId = id;
                $('umPass').value = '';
                $('umErr').textContent = '';
                um.classList.add('on');
                $('umPass').focus();
                return;
            }
            openArticle(a);
        }
        async function openArticle(a) {
            $('jrTitle').textContent = a.title;
            $('jrCoord').textContent = `${a.coord || ''}`;
            $('jrStamps').innerHTML = [a.place, a.date, a.bucket, a.coord]
                .filter(Boolean).map((s) => `<span>${s}</span>`).join('');
            $('jrBody').innerHTML = '<p style="opacity:.5">翻页中…</p>';
            reader.classList.add('open');
            reader.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            try {
                const md = await fetch(a.file).then((r) => {
                    if (!r.ok) throw new Error(r.status);
                    return r.text();
                });
                $('jrBody').innerHTML = marked.parse(obsidianToMd(md));
                // 标题已在页眉展示，去掉正文重复的首个大标题
                $('jrBody').querySelector('h1')?.remove();
            } catch {
                $('jrBody').innerHTML = '<p>这一页被风吹走了（文章加载失败）。</p>';
            }
            reader.scrollTop = 0;
            history.replaceState(null, '', '#' + a.id);
        }
        function closeReader() {
            reader.classList.remove('open');
            reader.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            history.replaceState(null, '', location.pathname);
        }
        $('jrClose').addEventListener('click', closeReader);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeReader(); um.classList.remove('on'); } });

        // 直达锚点（从主页引子点进来）
        if (location.hash.length > 1) {
            const id = decodeURIComponent(location.hash.slice(1));
            setTimeout(() => openById(id), reduced ? 0 : 900);
        }
    }
})();
