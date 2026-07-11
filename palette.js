// ============================================================
// palette.js — 全站配色体系（三页共用）
// 九套配色 = 天涯本色(默认) + 八套 cloudstudio 原色值
// 优先级：访客自选(localStorage) > 后台默认(settings.palette) > 天涯本色
// 界面：进站九宫色块引导（水墨简笔图标 + 中英文向导）
//       + 右下角常驻「色卡扇」随时换色
// 全部 CSS 变量驱动 + 静态 SVG，无 WebGL/粒子/逐帧循环。
// ============================================================
(function () {
    'use strict';

    var KEY = 'ljty-palette';        // 访客自选
    var GATE_AT = 'ljty-gate-at';    // 上次看引导的时间戳（限时重现）
    var gateHours = 24;              // 引导重现间隔，后台 settings.gateHours 可调，0=每次都弹

    // 水墨简笔图标（静态 SVG，stroke 跟随色块墨色）
    var IC = {
        horizon: '<svg viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 30 Q14 12 22 22 Q30 32 40 14"/><circle cx="33" cy="9" r="3.2" fill="currentColor" stroke="none"/><path d="M6 35 h32" opacity=".4"/></svg>',
        sun: '<svg viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="22" cy="20" r="7"/><path d="M22 5v4M22 31v4M7 20h4M33 20h4M11.4 9.4l2.8 2.8M29.8 27.8l2.8 2.8M32.6 9.4l-2.8 2.8M14.2 27.8l-2.8 2.8"/></svg>',
        cloud: '<svg viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 24 Q8 16 16 16 Q18 9 26 10 Q34 11 34 18 Q40 19 39 25"/><path d="M10 31 h18" opacity=".55"/><path d="M16 36 h12" opacity=".3"/></svg>',
        bolt: '<svg viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M25 4 L13 22 h8 L17 36 L31 17 h-8 L25 4 Z"/></svg>',
        coral: '<svg viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M22 36 V20 M22 20 Q14 18 12 8 M22 24 Q30 22 32 12 M12 8 l-2 4 M12 8 l4 1 M32 12 l2 4 M32 12 l-4 1"/><circle cx="22" cy="36" r="1.6" fill="currentColor" stroke="none"/></svg>',
        leaf: '<svg viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M10 34 Q10 18 26 10 Q30 22 18 30 Q14 32 10 34 Z"/><path d="M14 30 Q20 22 26 16" opacity=".55"/><path d="M30 32 Q34 28 36 22" opacity=".4"/></svg>',
        petal: '<svg viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="22" cy="13" r="4.2"/><circle cx="13" cy="20" r="4.2"/><circle cx="31" cy="20" r="4.2"/><circle cx="16.5" cy="29" r="4.2"/><circle cx="27.5" cy="29" r="4.2"/><circle cx="22" cy="21.5" r="1.8" fill="currentColor" stroke="none"/></svg>',
        sunset: '<svg viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M13 26 a9 9 0 0 1 18 0"/><path d="M4 26 h36"/><path d="M10 32 h24" opacity=".5"/><path d="M16 37 h12" opacity=".28"/></svg>',
        ice: '<svg viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M22 4 v32 M8 12 l28 16 M36 12 L8 28"/><path d="M22 4 l-4 5 M22 4 l4 5 M22 36 l-4 -5 M22 36 l4 -5" opacity=".6"/></svg>',
    };

    var PALETTES = [
        { id: '',          cn: '天涯本色', en: 'HORIZON',    tag: '电光紫夜行 · <em>the original ride</em>',  icon: IC.horizon, sw: ['#6a15ff', '#0a0a0c', '#f4f3eb'] },
        { id: 'amarillo',  cn: '明黄',     en: 'AMARILLO',   tag: '正午晒琴 · <em>high-noon warmth</em>',     icon: IC.sun,     sw: ['#9c7c12', '#131309', '#FFF48D'] },
        { id: 'cielo',     cn: '天蓝',     en: 'CIELO',      tag: '晴空赶路 · <em>clear-sky mileage</em>',    icon: IC.cloud,   sw: ['#0f7ec2', '#0a1216', '#8ED8FF'] },
        { id: 'electrico', cn: '长春花',   en: 'ELÉCTRICO',  tag: '一脚电门 · <em>full throttle</em>',        icon: IC.bolt,    sw: ['#4653d8', '#0c0d16', '#A3B1FF'] },
        { id: 'coral',     cn: '珊瑚',     en: 'CORAL',      tag: '晚霞收工 · <em>sunset session</em>',       icon: IC.coral,   sw: ['#d84a34', '#160b0a', '#FFAFA3'] },
        { id: 'menta',     cn: '薄荷',     en: 'MENTA',      tag: '雨后山风 · <em>fresh mountain air</em>',   icon: IC.leaf,    sw: ['#1f9e50', '#0b130d', '#A9E8AE'] },
        { id: 'rosa',      cn: '粉樱',     en: 'ROSA',       tag: '温柔慢板 · <em>the gentle adagio</em>',    icon: IC.petal,   sw: ['#d64f96', '#130a10', '#FFC0DD'] },
        { id: 'melocoton', cn: '蜜桃',     en: 'MELOCOTÓN',  tag: '落日蜜色 · <em>golden hour</em>',          icon: IC.sunset,  sw: ['#d88718', '#13100a', '#FFD9A0'] },
        { id: 'hielo',     cn: '冰蓝',     en: 'HIELO',      tag: '雪线之上 · <em>above the snowline</em>',   icon: IC.ice,     sw: ['#1a8ec4', '#0a1318', '#C9E9F6'] },
    ];

    // 后台可编辑的引导文案（settings.texts 到位后覆盖）
    var GATE_TEXTS = {};
    function T(key, fallback) {
        var v = GATE_TEXTS[key];
        return (v != null && v !== '') ? v : fallback;
    }

    function byId(id) {
        for (var i = 0; i < PALETTES.length; i++) if (PALETTES[i].id === id) return PALETTES[i];
        return PALETTES[0];
    }
    function stored() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function current() {
        return document.documentElement.dataset.palette || '';
    }

    function setAttr(id) {
        // 切换瞬间抑制全站 transition 风暴：即点即变、不同元素不再各拖各的
        var root = document.documentElement;
        root.classList.add('pal-instant');
        if (id) root.dataset.palette = id;
        else delete root.dataset.palette;
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { root.classList.remove('pal-instant'); });
        });
        syncFab();
    }

    function apply(id, persist) {
        setAttr(id);
        if (persist) {
            try { localStorage.setItem(KEY, id); } catch (e) { }
        }
    }

    // 后台默认配色 + 引导文案：仅当访客没有自选时套用默认色（不写入访客偏好）
    function applyDefaultFromSettings(settings) {
        if (settings && settings.texts) GATE_TEXTS = settings.texts;
        if (settings && settings.gateHours != null && settings.gateHours !== '') {
            var gh = parseFloat(settings.gateHours);
            if (isFinite(gh) && gh >= 0) gateHours = gh;
        }
        if (stored() !== null) return;
        var d = (settings && settings.palette) || '';
        if (d && byId(d).id === d) setAttr(d);
    }

    // ---------- 秒开：解析时立即套用访客自选 ----------
    var saved = stored();
    if (saved !== null && saved !== '') {
        document.documentElement.dataset.palette = saved;
    }

    // ---------- 右下角「色卡扇」常驻切换 ----------
    var fab = null, dock = null;

    function swVars(p) {
        return '--sw1:' + p.sw[0] + ';--sw2:' + p.sw[1] + ';--sw3:' + p.sw[2] + ';';
    }
    function syncFab() {
        if (!fab) return;
        var p = byId(current());
        fab.style.cssText = '--pd-c1:' + p.sw[0] + ';--pd-c2:' + p.sw[1] + ';--pd-c3:' + p.sw[2] + ';';
        fab.title = '换个行色 · ' + p.cn + ' ' + p.en;
        if (dock) {
            dock.querySelectorAll('.pd-item').forEach(function (b) {
                b.classList.toggle('cur', (b.dataset.pal || '') === current());
            });
        }
    }

    function buildFab() {
        fab = document.createElement('button');
        fab.className = 'pd-fab';
        fab.setAttribute('aria-label', '切换全站配色 Palette');
        fab.innerHTML = '<span class="pf a"></span><span class="pf b"></span><span class="pf c"></span>';
        dock = document.createElement('div');
        dock.className = 'pd-dock';
        dock.setAttribute('role', 'menu');
        var t = document.createElement('div');
        t.className = 'pd-dock-title';
        t.textContent = '行色 · PALETTE';
        dock.appendChild(t);
        PALETTES.forEach(function (p) {
            var b = document.createElement('button');
            b.className = 'pd-item';
            b.dataset.pal = p.id;
            b.innerHTML = '<span class="sw" style="' + swVars(p) + '"></span>'
                + '<span>' + p.cn + '</span><span class="en">' + p.en + '</span>';
            b.addEventListener('click', function () {
                apply(p.id, true);
                try { localStorage.setItem(GATE_AT, String(Date.now())); } catch (e) { }
            });
            dock.appendChild(b);
        });
        fab.addEventListener('click', function (e) {
            e.stopPropagation();
            dock.classList.toggle('open');
        });
        document.addEventListener('click', function (e) {
            if (dock.classList.contains('open') && !dock.contains(e.target)) dock.classList.remove('open');
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') dock.classList.remove('open');
        });
        document.body.appendChild(fab);
        document.body.appendChild(dock);
        syncFab();
    }

    // ---------- 进站行色引导：九宫色块 ----------
    function buildGate() {
        var gate = document.createElement('div');
        gate.className = 'pgate';
        gate.setAttribute('role', 'dialog');
        gate.setAttribute('aria-label', '选择网站配色');
        gate.innerHTML =
            '<span class="pgate-aur a" aria-hidden="true"></span>' +
            '<span class="pgate-aur b" aria-hidden="true"></span>' +
            '<div class="pgate-bar">' +
            '  <span class="brand">路即天涯</span>' +
            '  <span class="live"><i></i>在路上 · ON THE ROAD</span>' +
            '</div>' +
            '<div class="pgate-head">' +
            '  <p class="pgate-eyebrow">' + T('pgEyebrow', '( 选一种行色 · CHOOSE YOUR COLOR )') + '</p>' +
            '  <h2 class="pgate-title">' + T('pgTitle', '路上的天色，由你定。') + '</h2>' +
            '  <p class="pgate-sub">' + T('pgSub', '点一块颜色即刻出发，右下角的色卡随时可换。<em>Pick a sky — change it anytime.</em>') + '</p>' +
            '</div>' +
            '<div class="pgate-grid" id="pgGrid"></div>' +
            '<div class="pgate-foot">' +
            '  <button class="pgate-skip" id="pgSkip">' + T('pgSkip', '先逛逛，用默认色 · Skip →') + '</button>' +
            '  <p class="pgate-hint">' + T('pgHint', '偏好只存在你自己的设备里 · SAVED ON YOUR DEVICE ONLY') + '</p>' +
            '</div>';

        var grid = gate.querySelector('#pgGrid');
        var cur = current();

        PALETTES.forEach(function (p) {
            var cell = document.createElement('button');
            cell.className = 'pgate-cell' + (p.id === cur ? ' cur' : '');
            cell.style.background = p.sw[2];
            cell.innerHTML = p.icon +
                '<span class="nm">' + p.cn + '</span>' +
                '<span class="nm-en">' + p.en + '</span>' +
                '<span class="tag">' + p.tag + '</span>';
            // 悬停整页实时预览（CSS 变量切换，零开销）；点击选定并出发
            cell.addEventListener('mouseenter', function () { setAttr(p.id); });
            cell.addEventListener('focus', function () { setAttr(p.id); });
            cell.addEventListener('click', function () { leave(p.id); });
            grid.appendChild(cell);
        });

        function leave(chosenId) {
            try { localStorage.setItem(GATE_AT, String(Date.now())); } catch (e) { }
            if (chosenId !== null) apply(chosenId, true);
            else setAttr(stored() || '');   // 跳过：还原到进门前的状态
            gate.classList.add('hide');
            setTimeout(function () { gate.remove(); }, 650);
        }

        gate.querySelector('#pgSkip').addEventListener('click', function () { leave(null); });
        document.body.appendChild(gate);
    }

    function needGate() {
        try {
            var t = parseInt(localStorage.getItem(GATE_AT) || '0', 10);
            if (!t) return true;
            return (Date.now() - t) > gateHours * 3600 * 1000;
        } catch (e) { return false; }
    }

    // 主页有加载器动画：等它自毁后再弹引导，不打断开场
    function whenLoaderGone(cb) {
        if (!document.getElementById('loader')) { setTimeout(cb, 500); return; }
        var tries = 0;
        var timer = setInterval(function () {
            if (!document.getElementById('loader') || ++tries > 40) {
                clearInterval(timer);
                cb();
            }
        }, 300);
    }

    document.addEventListener('DOMContentLoaded', function () {
        buildFab();
        // 是否弹引导延到加载器退场后再判定：此时后台设置(间隔小时数)已就位
        whenLoaderGone(function () {
            setTimeout(function () { if (needGate()) buildGate(); }, 350);
        });
    });

    // 后台默认配色/文案：主页走 site:ready；手账/影像页自取数后调 window.__paletteDefault
    document.addEventListener('site:ready', function (e) {
        applyDefaultFromSettings(e.detail && e.detail.settings);
    });
    window.__paletteDefault = applyDefaultFromSettings;
    window.__palette = { list: PALETTES, apply: apply, current: current };
})();
