// ============================================================
// 踏破腐朽 — 影像馆
// 数据同 data/content.json（featured / videos / settings.texts）
// 动画：自写的逐行揭示（wildmind 手法：行从下方卷入 + 轻旋转），
// 不依赖付费 SplitText 插件；滚动视差用 ScrollTrigger scrub。
// ============================================================
(function () {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var TOUCH = window.matchMedia('(hover: none)').matches;
    // 桌面 Safari 也用 B站 H5 播放器（player.bilibili.com 外链在 macOS Safari 卡缓存）；只认 Apple Safari，其他浏览器/手机端不变
    var isAppleSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor) && !/Chrome|CriOS|Chromium|Edg|OPR|FxiOS/.test(navigator.userAgent);

    // ---------- 数据 ----------
    fetch('data/content.json?t=' + Date.now())
        .then(function (r) { return r.json(); })
        .then(init)
        .catch(function (e) {
            console.error('content.json 加载失败', e);
            init({ settings: {}, featured: [], videos: [] });
        });

    function init(SITE) {
        try { sessionStorage.removeItem('ink-in'); } catch (e) { } // 消化主页墨水转场标记

        var S = SITE.settings || {};

        // 书法字体（与主页 boot.js 同一逻辑）
        try {
            var brush = S.logoFont || '';
            if (brush) {
                document.documentElement.dataset.brush = brush;
                localStorage.setItem('ljty-brush', brush);
            } else {
                delete document.documentElement.dataset.brush;
                localStorage.removeItem('ljty-brush');
            }
        } catch (e) { }

        // 后台默认配色（访客自选优先，逻辑在 palette.js）
        if (window.__paletteDefault) window.__paletteDefault(S);

        // 可编辑文案注入（与主页同一约定：settings.texts）
        var TEXTS = S.texts || {};
        document.querySelectorAll('[data-txt], [data-txt-html]').forEach(function (el) {
            var key = el.dataset.txt || el.dataset.txtHtml;
            if (TEXTS[key] != null && TEXTS[key] !== '') el.innerHTML = TEXTS[key];
        });

        // 跑马灯：把首块内容复制到第二块，实现无缝循环
        var chunks = document.querySelectorAll('.vmarquee .chunk');
        if (chunks.length > 1) chunks[1].innerHTML = chunks[0].innerHTML;

        // 流体墨水：本页黑底，用暗色墨
        if (window.__fluidTheme) window.__fluidTheme(true);

        renderFeatured(SITE.featured || []);
        renderArchive(SITE.videos || []);
        bindFilters();
        bindModal();
        if (!reduced && window.gsap) {
            animate();
            // 封面图晚到会改变布局，载完刷新触发点，防止标题揭示错过/错位
            window.addEventListener('load', function () {
                if (window.ScrollTrigger) ScrollTrigger.refresh();
            });
        }
    }

    // ---------- 三支主打 ----------
    function renderFeatured(list) {
        var box = $('vFeatured');
        if (!box) return;
        list.slice(0, 3).forEach(function (v, i) {
            var el = document.createElement('article');
            el.className = 'vfeat';
            el.innerHTML =
                '<span class="dot tl"></span><span class="dot tr"></span><span class="dot bl"></span><span class="dot br"></span>' +
                '<div class="vfeat-media"><img loading="lazy" src="' + v.cover + '" alt="' + v.title + '"></div>' +
                '<div class="vfeat-info">' +
                '  <p class="vfeat-no">REEL ' + String(i + 1).padStart(2, '0') + ' — ' + (v.year || '') + '</p>' +
                '  <h3 class="vfeat-title">' + v.title + '</h3>' +
                '  <p class="vfeat-en">' + (v.en || '') + '</p>' +
                '  <p class="vfeat-flavor">' + (v.flavor || '') + '</p>' +
                '  <span class="vfeat-play"><b>▶</b> 就地播放 · PLAY IN PLACE</span>' +
                '</div>';
            el.addEventListener('click', function () { openVideo(v.bvid); });
            box.appendChild(el);
        });
    }

    // ---------- 片库 ----------
    function renderArchive(list) {
        var box = $('vArchive');
        if (!box) return;
        list.forEach(function (v) {
            var el = document.createElement('div');
            el.className = 'vcard';
            el.dataset.cat = v.category || 'all';
            el.innerHTML =
                '<div class="vcard-media"><img loading="lazy" src="' + v.cover + '" alt="' + v.title + '"></div>' +
                '<div class="vcard-meta"><span class="vcard-title">' + v.title + '</span>' +
                '<span class="vcard-tag">' + (v.tag || '') + ' / ' + (v.date || '') + '</span></div>';
            el.addEventListener('click', function () { openVideo(v.bvid); });
            box.appendChild(el);
        });
        var count = $('vCount');
        if (count) count.textContent = '( ' + String(list.length).padStart(2, '0') + ' FILMS )';
    }

    function bindFilters() {
        var chips = document.querySelectorAll('.vchip');
        chips.forEach(function (c) {
            c.addEventListener('click', function () {
                chips.forEach(function (x) { x.classList.remove('active'); });
                c.classList.add('active');
                var f = c.dataset.filter;
                document.querySelectorAll('.vcard').forEach(function (card) {
                    card.classList.toggle('hide', f !== 'all' && card.dataset.cat !== f);
                });
            });
        });
    }

    // ---------- 播放弹层（手机自动换 B站手机版 H5 播放器，同主页修复） ----------
    var modal, frame;
    function bindModal() {
        modal = $('videoModal'); frame = $('vmFrame');
        $('vmClose').addEventListener('click', closeVideo);
        modal.addEventListener('click', function (e) { if (e.target === modal) closeVideo(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeVideo(); });
    }
    function openVideo(bvid) {
        var src = (TOUCH || isAppleSafari)
            ? 'https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=' + bvid + '&page=1&high_quality=1&danmaku=0&posterFirst=1'
            : 'https://player.bilibili.com/player.html?bvid=' + bvid + '&autoplay=1&danmaku=0&high_quality=1';
        frame.innerHTML = '<iframe src="' + src + '" allow="autoplay; fullscreen" allowfullscreen scrolling="no"></iframe>' +
            '<a class="vm-outlink" href="https://www.bilibili.com/video/' + bvid + '" target="_blank" rel="noopener">在 BILIBILI 打开 ↗</a>';
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    function closeVideo() {
        if (!modal) return;
        frame.innerHTML = '';
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // ---------- 逐行揭示（SplitText 的免费手写版） ----------
    // 中文按字、英文按词切分成 span，量 offsetTop 归行，
    // 每行包一层溢出裁切，行体从下方 110% + 2° 旋入。
    function splitLines(el) {
        // 有子标签的元素整体位移，不逐行拆（避免拆破 <em>/<br> 结构）
        if (el.children.length) return null;
        var raw = el.innerHTML;
        var parts = el.textContent.match(/[\u2e80-\u9fff\uf900-\ufaff]|\S+|\s+/g) || [];
        // 中文逐字、英文逐词包 span；空白原样保留，避免中文被塞进多余空格
        el.innerHTML = parts.map(function (p) {
            return /^\s+$/.test(p) ? p : '<span class="rl-w" style="display:inline-block">' + p + '</span>';
        }).join('');
        var words = el.querySelectorAll('.rl-w');
        if (!words.length) { el.innerHTML = raw; return null; }
        // 按 offsetTop 归行；空白文本跟随前一个词所在行
        var nodes = Array.prototype.slice.call(el.childNodes);
        var lineOf = [], top = null, li = -1;
        nodes.forEach(function (n, i) {
            if (n.nodeType === 1) {
                if (top === null || Math.abs(n.offsetTop - top) > 4) { li++; top = n.offsetTop; }
                lineOf[i] = li;
            } else {
                lineOf[i] = li < 0 ? 0 : li;
            }
        });
        var built = [];
        nodes.forEach(function (n, i) {
            var k = Math.max(lineOf[i], 0);
            built[k] = (built[k] || '') + (n.nodeType === 1 ? n.outerHTML : n.textContent);
        });
        el.innerHTML = built.map(function (h) {
            return '<span class="rl-mask"><span class="rl-line">' + h + '</span></span>';
        }).join('');
        return el.querySelectorAll('.rl-line');
    }

    function animate() {
        gsap.registerPlugin(ScrollTrigger);

        // 开场：巨字 + 副题
        var heroBits = [document.querySelector('.vhero-title'), document.querySelector('.vhero-sub')];
        gsap.from(heroBits, {
            yPercent: 30, opacity: 0, rotate: 1.2,
            duration: 1.4, stagger: .12, ease: 'power4.out', delay: .15,
            clearProps: 'all',
        });

        // 标题逐行揭示（进入视口 80% 处触发一次）
        document.querySelectorAll('.vstate-title, .vcopy, .vfeat-title, .vfeat-flavor').forEach(function (el) {
            var lines = splitLines(el);
            if (lines && lines.length) {
                gsap.set(lines, { yPercent: 115, rotate: 2 });
                gsap.to(lines, {
                    yPercent: 0, rotate: 0,
                    duration: 1.3, stagger: .13, ease: 'power4.out',
                    scrollTrigger: { trigger: el, start: 'top 82%' },
                });
            } else { // 含子标签的整体浮入
                gsap.from(el, {
                    y: 44, opacity: 0, rotate: 1,
                    duration: 1.2, ease: 'power4.out',
                    scrollTrigger: { trigger: el, start: 'top 82%' },
                });
            }
        });

        // 时间码眉标淡入
        document.querySelectorAll('.tc').forEach(function (el) {
            gsap.from(el, {
                opacity: 0, y: 14, duration: .9, ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 90%' },
            });
        });

        // 主打卡封面滚动视差（scrub，wildmind 同款手感）
        document.querySelectorAll('.vfeat-media img').forEach(function (img) {
            gsap.from(img, {
                yPercent: 16, scale: 1.12, ease: 'none',
                scrollTrigger: { trigger: img, start: 'top 100%', end: 'top 40%', scrub: 1.6 },
            });
        });

        // 片库卡片交错浮入
        gsap.from('.vcard', {
            y: 26, opacity: 0, duration: .8, stagger: { each: .04, grid: 'auto' }, ease: 'power2.out',
            scrollTrigger: { trigger: '#vArchive', start: 'top 85%' },
        });
    }
})();
