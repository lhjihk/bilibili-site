// ============================================================
// palette.js — 全站配色体系（三页共用）
// 九套配色 = 天涯本色(默认) + 八套 cloudstudio 原色值
// 优先级：访客自选(localStorage) > 后台默认(settings.palette) > 天涯本色
// 实现只靠 html[data-palette] 属性 + CSS 变量，切换零性能开销；
// 引导层与墨碟按钮均为纯 CSS 渲染，无 WebGL/粒子/逐帧循环。
// ============================================================
(function () {
    'use strict';

    var KEY = 'ljty-palette';        // 访客自选
    var SEEN = 'ljty-palette-seen';  // 是否看过进站引导

    var PALETTES = [
        { id: '',          cn: '天涯本色', en: 'HORIZON ORIGINAL', sw: ['#6a15ff', '#0a0a0c', '#f4f3eb'] },
        { id: 'amarillo',  cn: '明黄',     en: 'AMARILLO',         sw: ['#FFF48D', '#131309', '#9c7c12'] },
        { id: 'cielo',     cn: '天蓝',     en: 'CIELO',            sw: ['#8ED8FF', '#0a1216', '#0f7ec2'] },
        { id: 'electrico', cn: '长春花',   en: 'ELÉCTRICO',        sw: ['#A3B1FF', '#0c0d16', '#4653d8'] },
        { id: 'coral',     cn: '珊瑚',     en: 'CORAL',            sw: ['#FFAFA3', '#160b0a', '#d84a34'] },
        { id: 'menta',     cn: '薄荷',     en: 'MENTA',            sw: ['#A9E8AE', '#0b130d', '#1f9e50'] },
        { id: 'rosa',      cn: '粉樱',     en: 'ROSA',             sw: ['#FFC0DD', '#130a10', '#d64f96'] },
        { id: 'melocoton', cn: '蜜桃',     en: 'MELOCOTÓN',        sw: ['#FFD9A0', '#13100a', '#d88718'] },
        { id: 'hielo',     cn: '冰蓝',     en: 'HIELO',            sw: ['#C9E9F6', '#0a1318', '#1a8ec4'] },
    ];

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
        if (id) document.documentElement.dataset.palette = id;
        else delete document.documentElement.dataset.palette;
        syncFab();
    }

    function apply(id, persist) {
        setAttr(id);
        if (persist) {
            try { localStorage.setItem(KEY, id); } catch (e) { }
        }
    }

    // 后台默认配色：仅当访客没有自选时生效（不写入访客偏好）
    function applyDefaultFromSettings(settings) {
        if (stored() !== null) return;
        var d = (settings && settings.palette) || '';
        if (d && byId(d).id === d) setAttr(d);
    }

    // ---------- 秒开：解析时立即套用访客自选 ----------
    var saved = stored();
    if (saved !== null) setAttr(saved);

    // ---------- 右下角「墨碟」常驻切换 ----------
    var fab = null, dock = null;

    function discVars(p, prefix) {
        return prefix + '1:' + p.sw[0] + ';' + prefix + '2:' + p.sw[1] + ';' + prefix + '3:' + p.sw[2] + ';';
    }
    function syncFab() {
        if (!fab) return;
        var p = byId(current());
        fab.style.cssText = '--pd-c1:' + p.sw[2] + ';--pd-c2:' + p.sw[1] + ';--pd-c3:' + p.sw[0] + ';';
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
            b.innerHTML = '<span class="sw" style="' + discVars(p, '--sw') + '"></span>'
                + '<span>' + p.cn + '</span><span class="en">' + p.en + '</span>';
            b.addEventListener('click', function () {
                apply(p.id, true);
                try { localStorage.setItem(SEEN, '1'); } catch (e) { }
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

    // ---------- 进站引导（首访一次）：路上的天色，由你定 ----------
    function buildGate() {
        var idx = 0;
        var cur = current();
        for (var i = 0; i < PALETTES.length; i++) if (PALETTES[i].id === cur) idx = i;

        var gate = document.createElement('div');
        gate.className = 'pgate';
        gate.setAttribute('role', 'dialog');
        gate.setAttribute('aria-label', '选择网站配色');
        gate.innerHTML =
            '<div class="pgate-bar">' +
            '  <span class="brand">路即天涯</span>' +
            '  <span class="live"><i></i>在路上 · ON THE ROAD</span>' +
            '</div>' +
            '<div class="pgate-core">' +
            '  <p class="pgate-eyebrow">( 选一种行色 · CHOOSE YOUR COLOR )</p>' +
            '  <h2 class="pgate-title">路上的天色，由你定。</h2>' +
            '  <p class="pgate-sub">选一种颜色陪你走完全站，右下角的墨碟随时可换。<br><em>Every road has its own sky. Pick one — change it anytime.</em></p>' +
            '  <div class="pgate-stage"><span class="pgate-disc" id="pgDisc"></span></div>' +
            '  <p class="pgate-name" id="pgName"></p>' +
            '  <div class="pgate-dock" id="pgDock"></div>' +
            '  <div class="pgate-actions">' +
            '    <button class="pgate-go" id="pgGo"></button>' +
            '    <button class="pgate-skip" id="pgSkip">先逛逛，用默认色 · Skip →</button>' +
            '  </div>' +
            '</div>' +
            '<p class="pgate-hint">← / → 切换 · Enter 出发 —— 偏好只存在你自己的设备里 · Saved on your device only.</p>';

        var disc = gate.querySelector('#pgDisc');
        var name = gate.querySelector('#pgName');
        var go = gate.querySelector('#pgGo');
        var dockEl = gate.querySelector('#pgDock');

        PALETTES.forEach(function (p, i) {
            var s = document.createElement('button');
            s.className = 'pgate-slot';
            s.style.cssText = discVars(p, '--sw');
            s.setAttribute('aria-label', p.cn + ' ' + p.en);
            s.addEventListener('click', function () { show(i); });
            dockEl.appendChild(s);
        });

        function show(i) {
            idx = (i + PALETTES.length) % PALETTES.length;
            var p = PALETTES[idx];
            disc.style.cssText = '--gd1:' + p.sw[2] + ';--gd2:' + p.sw[1] + ';--gd3:' + p.sw[0] + ';';
            name.innerHTML = p.cn + '<span class="en">' + p.en + '</span>';
            go.innerHTML = '就这个色，出发 · Ride with <b>' + p.en + '</b> →';
            dockEl.querySelectorAll('.pgate-slot').forEach(function (s, j) {
                s.classList.toggle('cur', j === idx);
            });
            setAttr(p.id); // 实时预览：整页背景跟着换（未持久化）
        }

        function leave(chosenId) {
            try { localStorage.setItem(SEEN, '1'); } catch (e) { }
            if (chosenId !== null) apply(chosenId, true);
            else setAttr(stored() || '');   // 跳过：还原到进门前的状态
            gate.classList.add('hide');
            document.removeEventListener('keydown', onKey);
            setTimeout(function () { gate.remove(); }, 700);
        }

        go.addEventListener('click', function () { leave(PALETTES[idx].id); });
        gate.querySelector('#pgSkip').addEventListener('click', function () { leave(null); });
        function onKey(e) {
            if (e.key === 'ArrowLeft') show(idx - 1);
            else if (e.key === 'ArrowRight') show(idx + 1);
            else if (e.key === 'Enter') leave(PALETTES[idx].id);
        }
        document.addEventListener('keydown', onKey);

        show(idx);
        document.body.appendChild(gate);
    }

    function needGate() {
        try { return !localStorage.getItem(SEEN); } catch (e) { return false; }
    }

    // 主页有加载器动画：等它自毁后再弹引导，不打断开场
    function whenLoaderGone(cb) {
        if (!document.getElementById('loader')) { cb(); return; }
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
        if (needGate()) whenLoaderGone(function () { setTimeout(buildGate, 400); });
    });

    // 后台默认配色：主页走 site:ready；手账/影像页自取数后调 window.__paletteDefault
    document.addEventListener('site:ready', function (e) {
        applyDefaultFromSettings(e.detail && e.detail.settings);
    });
    window.__paletteDefault = applyDefaultFromSettings;
    window.__palette = { list: PALETTES, apply: apply, current: current };
})();
