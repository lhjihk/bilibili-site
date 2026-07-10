// ============================================================
// 踏破腐朽® — 声音实验室 · 动画总控
// 数据来自 window.SITE（boot.js 加载 data/content.json）
// 新增：随乐呼吸 / 墨水吞页转场 / 昼夜双主题 / 键盘彩蛋
// ============================================================
(function () {
    'use strict';
    document.documentElement.classList.add('js');

    const $ = (id) => document.getElementById(id);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover)').matches;

    document.addEventListener('site:ready', () => {
        gsap.registerPlugin(ScrollTrigger);
        const SITE = window.SITE;
        const FEATURED = SITE.featured || [];
        const VIDEOS = SITE.videos || [];
        const ARTICLES = SITE.articles || [];
        const TEXTS = (SITE.settings && SITE.settings.texts) || {};

        // ============ 可编辑文案注入 ============
        if (TEXTS.heroSub) document.querySelector('.hero-sub').innerHTML = '<span class="mosaic">♪</span> ' + TEXTS.heroSub;
        if (TEXTS.aboutP1) $('aboutP1').textContent = TEXTS.aboutP1;
        if (TEXTS.aboutP2) $('aboutP2').textContent = TEXTS.aboutP2;

        // ============ 模块开关 + 排序 ============
        const MODULES = (SITE.settings && SITE.settings.modules) || [];
        if (MODULES.length) {
            // 在每个板块现位置放锚点，再按配置顺序把板块填回锚点——滚动带位置不动
            const current = MODULES.map((m) => document.getElementById(m.id)).filter(Boolean);
            const anchors = current.map((sec) => {
                const a = document.createComment('slot');
                sec.parentNode.insertBefore(a, sec);
                return a;
            });
            anchors.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
            const ordered = MODULES.map((m) => document.getElementById(m.id)).filter(Boolean);
            ordered.forEach((sec, i) => anchors[i].parentNode.insertBefore(sec, anchors[i]));
            MODULES.forEach((m) => {
                const sec = document.getElementById(m.id);
                if (sec && m.show === false) sec.style.display = 'none';
            });
        }

        // ============ Lenis 平滑滚动 ============
        let lenis = null;
        let scrollVelocity = 0;
        if (!reduced && typeof Lenis !== 'undefined') {
            lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
            lenis.on('scroll', (e) => {
                scrollVelocity = e.velocity || 0;
                ScrollTrigger.update();
            });
            gsap.ticker.add((t) => lenis.raf(t * 1000));
            gsap.ticker.lagSmoothing(0);
        }
        function scrollTo(target, instant) {
            if (lenis) lenis.scrollTo(target, { offset: -70, duration: instant ? 0 : 1.4, immediate: !!instant });
            else document.querySelector(target)?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
        }

        // ============ 墨水吞页转场 ============
        const veil = $('inkVeil');
        let veilBusy = false;
        function inkTransition(x, y, midAction) {
            if (reduced || !veil) { midAction(); return; }
            if (veilBusy) return;
            veilBusy = true;
            const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 1.15;
            veil.style.display = 'block';
            gsap.timeline({ onComplete: () => { veil.style.display = 'none'; veilBusy = false; } })
                .fromTo(veil, { clipPath: `circle(0px at ${x}px ${y}px)` },
                    { clipPath: `circle(${R}px at ${x}px ${y}px)`, duration: 0.55, ease: 'power3.in' })
                .add(() => midAction())
                .to(veil, { clipPath: `circle(0px at ${innerWidth / 2}px ${innerHeight * 0.4}px)`, duration: 0.65, ease: 'power3.inOut' }, '+=0.08');
        }
        // 站内锚点：墨水吞掉→瞬移→吐出
        document.querySelectorAll('a[href^="#"]').forEach((a) => {
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href');
                if (href.length > 1 && document.querySelector(href)) {
                    e.preventDefault();
                    mmenuClose();
                    inkTransition(e.clientX || innerWidth / 2, e.clientY || 60, () => scrollTo(href, true));
                }
            });
        });
        // 跳手账子页：墨水吞掉→跳转（journal 进场自己吐出）
        document.querySelectorAll('a[data-ink-nav]').forEach((a) => {
            a.addEventListener('click', (e) => {
                if (reduced) return; // 直接默认跳转
                e.preventDefault();
                const url = a.getAttribute('href');
                const x = e.clientX || innerWidth / 2, y = e.clientY || innerHeight / 2;
                if (veilBusy) return;
                veilBusy = true;
                const R = Math.hypot(innerWidth, innerHeight) * 1.15;
                veil.style.display = 'block';
                gsap.fromTo(veil, { clipPath: `circle(0px at ${x}px ${y}px)` },
                    { clipPath: `circle(${R}px at ${x}px ${y}px)`, duration: 0.6, ease: 'power3.in',
                      onComplete: () => { sessionStorage.setItem('ink-in', '1'); location.href = url; } });
            });
        });

        // ============ 乱码扫描文字 ============
        const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#_/[]<>*';
        function scramble(el, duration) {
            if (reduced) return;
            if (el.children.length) { // 有子标签的元素不打乱，防止吃掉标记
                el = el.querySelector('[data-txt]') || el;
                if (el.children.length) return;
            }
            const original = el.dataset.originalText || el.textContent;
            el.dataset.originalText = original;
            const chars = original.split('');
            const total = duration || 600;
            const t0 = performance.now();
            function tick(now) {
                const p = Math.min((now - t0) / total, 1);
                const lock = Math.floor(p * chars.length);
                el.textContent = chars.map((c, i) => {
                    if (c === ' ' || i < lock) return c;
                    if (/[一-鿿]/.test(c)) return c;
                    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                }).join('');
                if (p < 1) requestAnimationFrame(tick);
                else el.textContent = original;
            }
            requestAnimationFrame(tick);
        }
        document.querySelectorAll('[data-scramble]').forEach((el) => {
            el.addEventListener('mouseenter', () => scramble(el, 450));
            new IntersectionObserver((en, obs) => {
                if (en[0].isIntersecting) { scramble(el, 700); obs.disconnect(); }
            }, { threshold: 0.6 }).observe(el);
        });

        // ============ 自定义光标 + 磁吸 ============
        const cursor = $('cursor');
        const cursorLabel = $('cursorLabel');
        if (cursor && canHover) {
            const pos = { x: -100, y: -100 }, target = { x: -100, y: -100 };
            window.addEventListener('pointermove', (e) => { target.x = e.clientX; target.y = e.clientY; }, { passive: true });
            gsap.ticker.add(() => {
                pos.x += (target.x - pos.x) * 0.22;
                pos.y += (target.y - pos.y) * 0.22;
                cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
            });
            document.addEventListener('mouseover', (e) => {
                const t = e.target.closest('[data-cursor]');
                if (t) { cursor.classList.add('big'); cursorLabel.textContent = t.dataset.cursor; }
                else cursor.classList.remove('big');
            });
        }
        document.querySelectorAll('[data-magnetic]').forEach((el) => {
            if (!canHover) return;
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                gsap.to(el, {
                    x: (e.clientX - r.left - r.width / 2) * 0.35,
                    y: (e.clientY - r.top - r.height / 2) * 0.35,
                    duration: 0.4, ease: 'power2.out',
                });
            });
            el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }));
        });

        // ============ LOADER ============
        const loader = $('loader');
        const loaderGrid = $('loaderGrid');
        const loaderCount = $('loaderCount');
        if (loaderGrid) {
            for (let i = 0; i < 96; i++) loaderGrid.appendChild(document.createElement('i'));
        }
        function runLoader() {
            if (!loader) return;
            if (reduced) { loader.remove(); return; }
            const n = { v: 0 };
            gsap.timeline()
                .to(n, {
                    v: 100, duration: 1.5, ease: 'power3.inOut',
                    onUpdate: () => { loaderCount.textContent = String(Math.round(n.v)).padStart(3, '0'); },
                })
                .to('.loader-core', { yPercent: -30, opacity: 0, duration: 0.45, ease: 'power2.in' })
                .to('.loader-grid i', {
                    opacity: 0, duration: 0.4, ease: 'power1.in',
                    stagger: { each: 0.012, from: 'random' },
                }, '-=0.15')
                .add(() => { loader.remove(); introPlay(); }, '-=0.25');
        }
        function introPlay() {
            if (reduced) return;
            gsap.timeline()
                .from('.ht-word', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.09 })
                .from('.hero-foot', { opacity: 0, y: 24, duration: 0.7, ease: 'power2.out' }, '-=0.55')
                .from('.hf', { opacity: 0, y: -10, duration: 0.5, stagger: 0.08 }, '-=0.5')
                .from('.navbar', { opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.5')
                .from('.colo-line', { opacity: 0, y: -18, duration: 0.9, ease: 'power2.out' }, '-=0.4')
                .from('.colo-seal', { opacity: 0, scale: 1.9, rotate: 8, duration: 0.5, ease: 'back.out(2.2)' }, '-=0.3');
        }
        runLoader();

        // ============ HERO 视差 ============
        if (!reduced) {
            gsap.to('.ht-line:nth-child(1) .ht-word', {
                xPercent: -14, ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
            });
            gsap.to('.ht-line:nth-child(2) .ht-word', {
                xPercent: 10, ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
            });
            gsap.to('.hero-title', {
                yPercent: 28, opacity: 0.25, ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
            });
        }

        // ============ 导航 ============
        const navClock = $('navClock');
        if (navClock) {
            setInterval(() => {
                navClock.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
            }, 1000);
        }
        const navbar = $('navbar');
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            navbar.classList.toggle('scrolled', y > 60);
            navbar.classList.toggle('hidden', y > 400 && y > lastScroll && !mmenuOpen);
            lastScroll = y;
        }, { passive: true });

        const burger = $('navBurger'), mmenu = $('mmenu');
        let mmenuOpen = false;
        function mmenuClose() {
            mmenuOpen = false;
            burger?.classList.remove('open');
            mmenu?.classList.remove('open');
        }
        burger?.addEventListener('click', () => {
            mmenuOpen = !mmenuOpen;
            burger.classList.toggle('open', mmenuOpen);
            mmenu.classList.toggle('open', mmenuOpen);
        });

        // ============ 昼夜双主题 ============
        const themeBtn = $('themeBtn');
        function applyThemeBtn() {
            const dark = document.body.dataset.theme === 'dark';
            if (themeBtn) themeBtn.textContent = dark ? '☀ 纸面' : '● 暗房';
            if (window.__fluidTheme) window.__fluidTheme(dark);
        }
        themeBtn?.addEventListener('click', (e) => {
            const toDark = document.body.dataset.theme !== 'dark';
            inkTransition(e.clientX || innerWidth - 60, e.clientY || 40, () => {
                document.body.dataset.theme = toDark ? 'dark' : 'paper';
                localStorage.setItem('ttd-theme', toDark ? 'dark' : 'paper');
                applyThemeBtn();
            });
        });
        applyThemeBtn();

        // ============ MARQUEE（滚动+音乐双重变速） ============
        document.querySelectorAll('[data-marquee]').forEach((mq) => {
            const inner = mq.querySelector('.marquee-inner');
            const chunk = inner.querySelector('.marquee-chunk');
            const need = Math.ceil((window.innerWidth * 2) / Math.max(chunk.offsetWidth, 200)) + 1;
            for (let i = 0; i < need; i++) inner.appendChild(chunk.cloneNode(true));
            const dir = parseFloat(mq.dataset.speed || '1');
            // 宽度只在字体就绪/窗口变化时量一次，别在每帧里读布局
            let w = Math.max(chunk.offsetWidth, 200);
            const remeasure = () => { w = Math.max(chunk.offsetWidth, 200); };
            window.addEventListener('resize', remeasure);
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
            let x = 0;
            gsap.ticker.add((t, dt) => {
                const boost = Math.min(Math.abs(scrollVelocity) * 0.06, 5);
                const music = (window.__level || 0) * 2.2;
                x -= (0.05 + boost * 0.02 + music * 0.03) * dt * dir;
                if (x <= -w) x += w;
                if (x > 0) x -= w;
                inner.style.transform = `translateX(${x}px)`;
            });
        });

        // ============ 随乐呼吸（音乐驱动全站） ============
        if (!reduced) {
            const pulseEls = () => document.querySelectorAll('.nav-logo sup, .ds-index b, .np-label, .hero-sub .mosaic, .marquee-chunk b');
            let cached = null, cacheT = 0;
            gsap.ticker.add((t) => {
                const lv = window.__level || 0;
                if (lv < 0.01) { // 没在放歌：归位一次后彻底歇着
                    if (cached) {
                        cached.forEach((el) => { el.style.transform = ''; });
                        cached = null;
                        document.documentElement.style.setProperty('--pulse', '0');
                    }
                    return;
                }
                if (!cached || t - cacheT > 3) { cached = pulseEls(); cacheT = t; }
                const s = 1 + lv * 0.5;
                cached.forEach((el) => { el.style.transform = `scale(${s})`; el.style.display = 'inline-block'; });
                document.documentElement.style.setProperty('--pulse', lv.toFixed(3));
            });
        }

        // ============ 键盘彩蛋：敲 metal ============
        const LYRICS = (SITE.settings && SITE.settings.lyrics) || [];
        let keyBuf = '';
        document.addEventListener('keydown', (e) => {
            if (e.target instanceof Element && e.target.matches('input, textarea, [contenteditable]')) return;
            keyBuf = (keyBuf + e.key.toLowerCase()).slice(-8);
            if (keyBuf.endsWith('metal')) {
                keyBuf = '';
                document.body.classList.add('egg');
                const stamp = $('eggStamp');
                if (stamp && LYRICS.length) {
                    stamp.textContent = LYRICS[Math.floor(Math.random() * LYRICS.length)];
                    stamp.classList.add('show');
                }
                setTimeout(() => {
                    document.body.classList.remove('egg');
                    stamp?.classList.remove('show');
                }, 1600);
            }
        });

        // ============ 禅 · 毛笔笔触下划线（章节标题下画一笔） ============
        const BRUSH_D = 'M3,9.5 C36,5 78,3 120,4.2 C158,5.2 196,4.4 234,2.6 C222,6.8 196,9.6 158,10.8 C118,12 62,12.2 22,11 C13,10.7 6,10.2 3,9.5 Z M239,3.2 C243,3.4 246,4.2 247,5.4 C244,5.8 241,5.2 239,3.2 Z';
        document.querySelectorAll('.sec-title').forEach((title) => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 250 14');
            svg.setAttribute('aria-hidden', 'true');
            svg.classList.add('brush-line');
            svg.innerHTML = `<path d="${BRUSH_D}" fill="currentColor"/>`;
            title.appendChild(svg);
            if (!reduced) {
                gsap.fromTo(svg, { clipPath: 'inset(0 100% 0 0)' }, {
                    clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power2.inOut', delay: 0.25,
                    scrollTrigger: { trigger: title, start: 'top 85%' },
                });
            }
        });

        // ============ 禅 · 远山墨影视差 ============
        if (!reduced) {
            document.querySelectorAll('.ink-mtns').forEach((m) => {
                const far = m.querySelector('.m-far'), near = m.querySelector('.m-near');
                const st = { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true };
                if (far) gsap.fromTo(far, { yPercent: 14 }, { yPercent: -8, ease: 'none', scrollTrigger: st });
                if (near) gsap.fromTo(near, { yPercent: 26 }, { yPercent: -4, ease: 'none', scrollTrigger: { ...st } });
            });
        }

        // ============ 章节标题 + 揭示 ============
        if (!reduced) {
            document.querySelectorAll('.sec-title').forEach((title) => {
                gsap.from(title.querySelectorAll('.st-line > span'), {
                    yPercent: 115, duration: 1, ease: 'expo.out', stagger: 0.1,
                    scrollTrigger: { trigger: title, start: 'top 85%' },
                });
            });
            document.querySelectorAll('[data-reveal]').forEach((el) => {
                gsap.to(el, {
                    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
                    scrollTrigger: { trigger: el, start: 'top 88%' },
                });
            });
        } else {
            document.querySelectorAll('[data-reveal]').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
        }

        // ============ (01) 宣言：钉屏逐词点亮 ============
        const mfCopy = $('mfCopy');
        if (mfCopy) {
            const KEY = ['真琴', '真手', '真录', '失真', '不用假弹', '不修音', '塑料'];
            const words = mfCopy.textContent.trim().split(/\s+/);
            mfCopy.innerHTML = words.map((w) => {
                const isKey = KEY.some((k) => w.includes(k));
                return `<span class="w${isKey ? ' key' : ''}">${w}</span>`;
            }).join(' ');
            const spans = mfCopy.querySelectorAll('.w');
            if (!reduced) {
                ScrollTrigger.create({
                    trigger: '#mfPin', start: 'top top', end: '+=160%', pin: true, scrub: 0.4,
                    onUpdate: (self) => {
                        const lit = Math.floor(self.progress * 1.15 * spans.length);
                        spans.forEach((s, i) => s.classList.toggle('lit', i < lit));
                    },
                });
            } else {
                spans.forEach((s) => s.classList.add('lit'));
            }
        }

        // ============ (02) 主打弹射切换台 ============
        const dsStage = $('dsStage'), dsNo = $('dsNo'), dsDots = $('dsDots');
        let dsCurrent = 0, dsBusy = false;
        function dsCardHTML(t, i) {
            return `
            <div class="ds-card" data-i="${i}">
                <div class="ds-card-media" data-cursor="PLAY"><img src="${t.cover}" alt="${t.title}" referrerpolicy="no-referrer"></div>
                <div class="ds-card-info">
                    <span class="ds-card-no">0${i + 1}</span>
                    <h3 class="ds-card-title">${t.title}<br><span class="mono" style="opacity:.5">${t.en || ''}</span></h3>
                    <p class="ds-card-note">${t.flavor || ''}</p>
                    <span class="mono" style="color:var(--purple)">${t.spec || ''} — ${t.year || ''}</span>
                </div>
            </div>`;
        }
        function dsShow(idx, dir) {
            if (!dsStage || dsBusy || (idx === dsCurrent && dsStage.children.length)) return;
            dsBusy = true;
            const old = dsStage.querySelector('.ds-card');
            dsStage.insertAdjacentHTML('beforeend', dsCardHTML(FEATURED[idx], idx));
            const fresh = dsStage.lastElementChild;
            fresh.querySelector('.ds-card-media').addEventListener('click', () => openVideo(FEATURED[idx].bvid));
            dsNo.textContent = '0' + (idx + 1);
            dsDots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i === idx));
            dsCurrent = idx;
            if (reduced || !old) {
                old?.remove();
                if (!reduced) gsap.from(fresh, { opacity: 0, duration: 0.5 });
                dsBusy = false;
                return;
            }
            const d = dir >= 0 ? 1 : -1;
            gsap.timeline({ onComplete: () => { old.remove(); dsBusy = false; } })
                .to(old, { xPercent: -55 * d, rotateY: 18 * d, opacity: 0, duration: 0.55, ease: 'power3.in' }, 0)
                .fromTo(fresh,
                    { xPercent: 75 * d, rotateY: -22 * d, opacity: 0 },
                    { xPercent: 0, rotateY: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }, 0.22);
        }
        if (dsStage && FEATURED.length) {
            FEATURED.forEach((_, i) => {
                const dot = document.createElement('i');
                dot.addEventListener('click', () => dsShow(i, i > dsCurrent ? 1 : -1));
                dsDots.appendChild(dot);
            });
            dsShow(0, 1);
            $('dsPrev').addEventListener('click', () => dsShow((dsCurrent - 1 + FEATURED.length) % FEATURED.length, -1));
            $('dsNext').addEventListener('click', () => dsShow((dsCurrent + 1) % FEATURED.length, 1));
        }

        // ============ (04) 影像：双色调 + 错落网格 + 悬停字条 ============
        const filmGrid = $('filmGrid');
        if (filmGrid) {
            VIDEOS.forEach((v, i) => {
                const card = document.createElement('div');
                card.className = 'film-card';
                card.dataset.category = v.category;
                card.setAttribute('data-cursor', 'PLAY');
                const cells = Array.from({ length: 24 }, () => '<i></i>').join('');
                card.innerHTML = `
                    <div class="fc-media">
                        <img src="${v.cover}" alt="${v.title}" loading="lazy" referrerpolicy="no-referrer">
                        <div class="fc-mosaic">${cells}</div>
                        <span class="fc-tag">${v.tag}</span>
                        <div class="fc-hoverbar mono"><span>${v.title} — ${v.date} — PLAY ↗ — ${v.title} — ${v.date} — PLAY ↗ — </span></div>
                    </div>
                    <div class="fc-info">
                        <span class="fc-no">${String(i + 1).padStart(2, '0')}</span>
                        <span class="fc-title">${v.title}</span>
                        <span class="fc-year">${v.date}</span>
                    </div>`;
                card.addEventListener('click', () => openVideo(v.bvid));
                const img = card.querySelector('img');
                if (canHover && !reduced) {
                    card.addEventListener('mousemove', (e) => {
                        const r = card.getBoundingClientRect();
                        gsap.to(img, {
                            x: ((e.clientX - r.left) / r.width - 0.5) * -14,
                            y: ((e.clientY - r.top) / r.height - 0.5) * -14,
                            duration: 0.6, ease: 'power2.out',
                        });
                    });
                    card.addEventListener('mouseleave', () => gsap.to(img, { x: 0, y: 0, duration: 0.6 }));
                }
                filmGrid.appendChild(card);
            });

            if (!reduced) {
                document.querySelectorAll('.fc-mosaic').forEach((m) => {
                    gsap.to(m.querySelectorAll('i'), {
                        opacity: 0, duration: 0.35, ease: 'power1.in',
                        stagger: { each: 0.03, from: 'random' },
                        scrollTrigger: { trigger: m, start: 'top 82%' },
                    });
                });
            } else {
                document.querySelectorAll('.fc-mosaic').forEach((m) => m.remove());
            }

            $('filmFilters').addEventListener('click', (e) => {
                const chip = e.target.closest('.chip');
                if (!chip) return;
                document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
                chip.classList.add('active');
                const f = chip.dataset.filter;
                filmGrid.querySelectorAll('.film-card').forEach((c) => {
                    c.classList.toggle('hide', !(f === 'all' || c.dataset.category === f));
                });
                if (!reduced) {
                    gsap.from(filmGrid.querySelectorAll('.film-card:not(.hide)'), {
                        opacity: 0, y: 26, duration: 0.5, ease: 'power2.out', stagger: 0.035, overwrite: true,
                    });
                }
                ScrollTrigger.refresh();
            });
        }

        // ============ (05) 手账引子 ============
        const teaser = $('teaserRows');
        if (teaser) {
            const visible = ARTICLES.slice(0, 2);
            visible.forEach((a, i) => {
                const row = document.createElement('a');
                row.className = 'article-row';
                row.href = 'journal.html#' + a.id;
                row.setAttribute('data-ink-nav', '');
                row.setAttribute('data-cursor', 'READ');
                row.innerHTML = `
                    <span class="ar-no">${i + 1}</span>
                    <h3 class="ar-title">${a.title}</h3>
                    <p class="ar-excerpt">${a.locked ? '🔒 已封存' : a.excerpt}</p>
                    <div class="ar-meta mono"><span>${a.place}</span><span>${a.date}</span></div>
                    <span class="ar-arrow">↗</span>`;
                teaser.appendChild(row);
            });
            // 重新绑定 ink-nav（上面统一绑定发生在此之前）
            teaser.querySelectorAll('a[data-ink-nav]').forEach((a) => {
                a.addEventListener('click', (e) => {
                    if (reduced) return;
                    e.preventDefault();
                    const url = a.getAttribute('href');
                    if (veilBusy) return;
                    veilBusy = true;
                    const R = Math.hypot(innerWidth, innerHeight) * 1.15;
                    veil.style.display = 'block';
                    gsap.fromTo(veil, { clipPath: `circle(0px at ${e.clientX}px ${e.clientY}px)` },
                        { clipPath: `circle(${R}px at ${e.clientX}px ${e.clientY}px)`, duration: 0.6, ease: 'power3.in',
                          onComplete: () => { sessionStorage.setItem('ink-in', '1'); location.href = url; } });
                });
            });
            const count = $('teaserCount');
            if (count) count.textContent = String(ARTICLES.length).padStart(2, '0');
        }

        // ============ 视频弹层 ============
        const videoModal = $('videoModal'), vmFrame = $('vmFrame');
        window.openVideo = function (bvid) {
            vmFrame.innerHTML = `
                <iframe src="https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=1&danmaku=0&high_quality=1"
                    allowfullscreen scrolling="no"></iframe>
                <a class="vm-outlink" href="https://www.bilibili.com/video/${bvid}" target="_blank" rel="noopener">在 BILIBILI 打开 ↗</a>`;
            videoModal.classList.add('open');
            videoModal.setAttribute('aria-hidden', 'false');
            if (lenis) lenis.stop();
        };
        function closeVideo() {
            vmFrame.innerHTML = '';
            videoModal.classList.remove('open');
            videoModal.setAttribute('aria-hidden', 'true');
            if (lenis) lenis.start();
        }
        $('vmClose')?.addEventListener('click', closeVideo);
        videoModal?.addEventListener('click', (e) => { if (e.target === videoModal) closeVideo(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { closeVideo(); mmenuClose(); }
        });

        // ============ FOOTER 巨字 ============
        const footerGiant = $('footerGiant');
        if (footerGiant) {
            footerGiant.innerHTML = footerGiant.textContent.split('').map((c) => `<span class="fg-char">${c}</span>`).join('');
            if (!reduced) {
                gsap.from('.fg-char', {
                    yPercent: 100, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08,
                    scrollTrigger: { trigger: '.footer-main', start: 'top 85%' },
                });
                footerGiant.querySelectorAll('.fg-char').forEach((ch) => {
                    ch.addEventListener('mouseenter', () => {
                        gsap.fromTo(ch, { yPercent: 0 }, { yPercent: -12, yoyo: true, repeat: 1, duration: 0.18, ease: 'power2.out', overwrite: true });
                    });
                });
            }
        }
    });
})();
