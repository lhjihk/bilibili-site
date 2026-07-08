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
        const r = document.documentElement.style;
        if (colors.purple) r.setProperty('--purple', colors.purple);
        if (colors.sealRed) r.setProperty('--seal-red', colors.sealRed);
        if (colors.paperBg) r.setProperty('--paper-bg', colors.paperBg);
        if (colors.darkBg) r.setProperty('--dark-bg', colors.darkBg);
    }

    function applyTexts(texts) {
        if (!texts) return;
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
            applyColors(s.colors);
            applyTexts(s.texts);
            applyBackgrounds(s.backgrounds);
            document.dispatchEvent(new CustomEvent('site:ready', { detail: data }));
        })
        .catch((err) => {
            console.error('content.json 加载失败', err);
            window.SITE = { settings: {}, tracks: [], featured: [], videos: [], articles: [], platformLinks: [] };
            document.dispatchEvent(new CustomEvent('site:ready', { detail: window.SITE }));
        });
})();
