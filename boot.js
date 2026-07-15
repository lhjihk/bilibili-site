// ============================================================
// boot.js — 数据引导：拉取 data/content.json → window.SITE
// 注入自定义颜色/文案/背景/主题，然后广播 site:ready
// ============================================================
(function () {
    'use strict';

    const savedTheme = localStorage.getItem('ttd-theme');
    if (savedTheme === 'dark') document.body.dataset.theme = 'dark';

    function applyColors(colors) {
        if (!colors) return;
        // 行内样式优先级最高：套了配色主题(data-palette)时不注入，
        // 否则后台自定义色会压过主题变量（天涯本色时才用后台自定义色）
        if (document.documentElement.dataset.palette) return;
        const r = document.documentElement.style;
        if (colors.purple) r.setProperty('--purple', colors.purple);
        if (colors.sealRed) r.setProperty('--seal-red', colors.sealRed);
        if (colors.paperBg) r.setProperty('--paper-bg', colors.paperBg);
        if (colors.darkBg) r.setProperty('--dark-bg', colors.darkBg);
    }

    function applyBrush(font) {
        // 书法字体切换：'' = 庞门正道（默认现状）；xia / honglei / dongfang
        try {
            if (font) {
                document.documentElement.dataset.brush = font;
                localStorage.setItem('ljty-brush', font);
            } else {
                delete document.documentElement.dataset.brush;
                localStorage.removeItem('ljty-brush');
            }
        } catch (e) { /* 隐私模式下 localStorage 不可用也不影响本页生效 */ }
    }

    function applyTexts(texts) {
        if (!texts) { document.documentElement.classList.add('txt-ready'); return; }
        document.querySelectorAll('[data-txt], [data-txt-html]').forEach((el) => {
            const key = el.dataset.txt || el.dataset.txtHtml;
            if (texts[key] != null && texts[key] !== '') el.innerHTML = texts[key];
        });
    }

    function applyBackgrounds(bg) {
        if (!bg) return;
        const hero = document.getElementById('heroBg');
        if (hero && bg.hero) {
            hero.style.backgroundImage = `url("${bg.hero}")`;
            hero.className = 'hero-bg on filter-' + (bg.heroFilter || 'duotone');
        }
        const photo = document.getElementById('aboutPhoto');
        if (photo && bg.aboutPhoto) photo.src = bg.aboutPhoto;
    }

    fetch('data/content.json?t=' + Date.now())
        .then((r) => r.json())
        .then((data) => {
            window.SITE = data;
            const s = data.settings || {};
            // 先套后台默认配色（若访客未自选），再决定要不要注入自定义色
            if (window.__paletteDefault) window.__paletteDefault(s);
            applyColors(s.colors);
            applyBrush(s.logoFont || '');
            applyTexts(s.texts);
            document.documentElement.classList.add('txt-ready'); // 文案就位，揭示（防闪旧内容）
            // 浏览器标签页标题：后台填了 docTitle 就用它（留空 = 用 HTML 里写死的默认标题）
            if (s.texts && s.texts.docTitle) document.title = s.texts.docTitle;
            applyBackgrounds(s.backgrounds);
            document.dispatchEvent(new CustomEvent('site:ready', { detail: data }));
        })
        .catch((err) => {
            console.error('content.json 加载失败', err);
            document.documentElement.classList.add('txt-ready');
            window.SITE = { settings: {}, tracks: [], featured: [], videos: [], articles: [], platformLinks: [] };
            document.dispatchEvent(new CustomEvent('site:ready', { detail: window.SITE }));
        });
    // 保险丝：任何异常导致注入没完成，3秒后也要把文字放出来
    setTimeout(() => document.documentElement.classList.add('txt-ready'), 3000);
})();
