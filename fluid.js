// ============================================================
// 流体墨水 —— WebGL 流体模拟（Navier-Stokes 半拉格朗日 + 涡度回注）
// 紫墨在米白纸面上随鼠标晕开。挂在 #fluidCanvas 上。
// 需要 WebGL2 + EXT_color_buffer_float，不支持就静默隐藏。
// ============================================================
(function () {
    'use strict';

    const canvas = document.getElementById('fluidCanvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: true });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) { canvas.style.display = 'none'; return; }

    const MOBILE = window.innerWidth < 720;
    const CONF = {
        SIM_RES: MOBILE ? 96 : 128,   // 手机降档：省电不发热
        DYE_RES: MOBILE ? 440 : 720,
        DENSITY_DISSIPATION: 2.4,   // 墨迹消散速度（越大消得越快）
        VELOCITY_DISSIPATION: 0.55,
        PRESSURE: 0.8,
        PRESSURE_ITER: 20,
        CURL: 22,                   // 涡度强度：卷起漩涡
        SPLAT_RADIUS: 0.22,
        SPLAT_FORCE: 5200,
    };

    // 墨色盘：电紫为主，靛灰/墨黑作陪衬（线性空间近似值）
    const INKS_PAPER = [
        [0.28, 0.04, 1.00],
        [0.20, 0.03, 0.80],
        [0.42, 0.30, 0.70],
        [0.05, 0.05, 0.09],
    ];
    // 暗房模式：亮紫/霓虹为主，在黑底上发光
    const INKS_DARK = [
        [0.55, 0.25, 1.00],
        [0.38, 0.12, 0.95],
        [0.70, 0.55, 1.00],
        [0.90, 0.88, 0.80],
    ];
    let INKS = document.body.dataset.theme === 'dark' ? INKS_DARK : INKS_PAPER;
    window.__fluidTheme = (dark) => { INKS = dark ? INKS_DARK : INKS_PAPER; };

    // ---------- shader 工具 ----------
    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }
    function program(vs, fsSrc) {
        const p = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
        gl.linkProgram(p);
        const uniforms = {};
        const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < n; i++) {
            const name = gl.getActiveUniform(p, i).name;
            uniforms[name] = gl.getUniformLocation(p, name);
        }
        return { p, u: uniforms };
    }

    const VERT = compile(gl.VERTEX_SHADER, `#version 300 es
        precision highp float;
        in vec2 aPos;
        out vec2 vUv, vL, vR, vT, vB;
        uniform vec2 texelSize;
        void main () {
            vUv = aPos * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPos, 0.0, 1.0);
        }`);

    const HEAD = `#version 300 es
        precision highp float; precision highp sampler2D;
        in vec2 vUv, vL, vR, vT, vB; out vec4 frag;`;

    const progSplat = program(VERT, HEAD + `
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;
        void main () {
            vec2 p = vUv - point;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            frag = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
        }`);

    const progAdvect = program(VERT, HEAD + `
        uniform sampler2D uVelocity, uSource;
        uniform vec2 texelSize;
        uniform float dt, dissipation;
        void main () {
            vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
            frag = texture(uSource, coord) / (1.0 + dissipation * dt);
        }`);

    const progDiv = program(VERT, HEAD + `
        uniform sampler2D uVelocity;
        void main () {
            float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x;
            float T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
            vec2 C = texture(uVelocity, vUv).xy;
            if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x;
            if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
            frag = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
        }`);

    const progCurl = program(VERT, HEAD + `
        uniform sampler2D uVelocity;
        void main () {
            float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y;
            float T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
            frag = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
        }`);

    const progVort = program(VERT, HEAD + `
        uniform sampler2D uVelocity, uCurl;
        uniform float curl, dt;
        void main () {
            float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x;
            float T = texture(uCurl, vT).x, B = texture(uCurl, vB).x;
            float C = texture(uCurl, vUv).x;
            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C; force.y *= -1.0;
            vec2 vel = texture(uVelocity, vUv).xy + force * dt;
            frag = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
        }`);

    const progPressure = program(VERT, HEAD + `
        uniform sampler2D uPressure, uDivergence;
        void main () {
            float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
            float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
            float div = texture(uDivergence, vUv).x;
            frag = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
        }`);

    const progGradSub = program(VERT, HEAD + `
        uniform sampler2D uPressure, uVelocity;
        void main () {
            float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
            float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
            vec2 vel = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
            frag = vec4(vel, 0.0, 1.0);
        }`);

    // 显示：墨浓度 → 预乘 alpha，叠在米白页面上
    const progDisplay = program(VERT, HEAD + `
        uniform sampler2D uTexture;
        void main () {
            vec3 ink = texture(uTexture, vUv).rgb;
            float a = clamp(max(ink.r, max(ink.g, ink.b)), 0.0, 1.0);
            a = pow(a, 0.85);
            vec3 col = clamp(ink, 0.0, 1.0);
            frag = vec4(col * a, a);
        }`);

    // ---------- FBO ----------
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    function blit(target) {
        if (target == null) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
            gl.viewport(0, 0, target.w, target.h);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    function createFBO(w, h, internal, format) {
        const tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return {
            tex, fbo, w, h,
            attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; },
        };
    }
    function createDouble(w, h, internal, format) {
        let a = createFBO(w, h, internal, format), b = createFBO(w, h, internal, format);
        return {
            w, h,
            get read() { return a; }, get write() { return b; },
            swap() { const t = a; a = b; b = t; },
        };
    }

    let dye, velocity, divergence, curlFBO, pressure;
    let simW, simH, dyeW, dyeH;

    function getRes(base) {
        const aspect = canvas.width / Math.max(1, canvas.height);
        return aspect > 1
            ? { w: Math.round(base * aspect), h: base }
            : { w: base, h: Math.round(base / aspect) };
    }

    function initFBOs() {
        const s = getRes(CONF.SIM_RES), d = getRes(CONF.DYE_RES);
        simW = s.w; simH = s.h; dyeW = d.w; dyeH = d.h;
        dye = createDouble(dyeW, dyeH, gl.RGBA16F, gl.RGBA);
        velocity = createDouble(simW, simH, gl.RG16F, gl.RG);
        divergence = createFBO(simW, simH, gl.R16F, gl.RED);
        curlFBO = createFBO(simW, simH, gl.R16F, gl.RED);
        pressure = createDouble(simW, simH, gl.R16F, gl.RED);
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w; canvas.height = h;
            initFBOs();
        }
    }
    resize();
    window.addEventListener('resize', resize);

    // ---------- 模拟步 ----------
    function step(dt) {
        gl.disable(gl.BLEND);

        gl.useProgram(progCurl.p);
        gl.uniform2f(progCurl.u.texelSize, 1 / simW, 1 / simH);
        gl.uniform1i(progCurl.u.uVelocity, velocity.read.attach(0));
        blit(curlFBO);

        gl.useProgram(progVort.p);
        gl.uniform2f(progVort.u.texelSize, 1 / simW, 1 / simH);
        gl.uniform1i(progVort.u.uVelocity, velocity.read.attach(0));
        gl.uniform1i(progVort.u.uCurl, curlFBO.attach(1));
        gl.uniform1f(progVort.u.curl, CONF.CURL);
        gl.uniform1f(progVort.u.dt, dt);
        blit(velocity.write); velocity.swap();

        gl.useProgram(progDiv.p);
        gl.uniform2f(progDiv.u.texelSize, 1 / simW, 1 / simH);
        gl.uniform1i(progDiv.u.uVelocity, velocity.read.attach(0));
        blit(divergence);

        gl.useProgram(progPressure.p);
        gl.uniform2f(progPressure.u.texelSize, 1 / simW, 1 / simH);
        gl.uniform1i(progPressure.u.uDivergence, divergence.attach(0));
        for (let i = 0; i < CONF.PRESSURE_ITER; i++) {
            gl.uniform1i(progPressure.u.uPressure, pressure.read.attach(1));
            blit(pressure.write); pressure.swap();
        }

        gl.useProgram(progGradSub.p);
        gl.uniform2f(progGradSub.u.texelSize, 1 / simW, 1 / simH);
        gl.uniform1i(progGradSub.u.uPressure, pressure.read.attach(0));
        gl.uniform1i(progGradSub.u.uVelocity, velocity.read.attach(1));
        blit(velocity.write); velocity.swap();

        gl.useProgram(progAdvect.p);
        gl.uniform2f(progAdvect.u.texelSize, 1 / simW, 1 / simH);
        gl.uniform1i(progAdvect.u.uVelocity, velocity.read.attach(0));
        gl.uniform1i(progAdvect.u.uSource, velocity.read.attach(0));
        gl.uniform1f(progAdvect.u.dt, dt);
        gl.uniform1f(progAdvect.u.dissipation, CONF.VELOCITY_DISSIPATION);
        blit(velocity.write); velocity.swap();

        gl.uniform1i(progAdvect.u.uVelocity, velocity.read.attach(0));
        gl.uniform1i(progAdvect.u.uSource, dye.read.attach(1));
        gl.uniform1f(progAdvect.u.dissipation, CONF.DENSITY_DISSIPATION);
        blit(dye.write); dye.swap();
    }

    function render() {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(progDisplay.p);
        gl.uniform2f(progDisplay.u.texelSize, 1 / canvas.width, 1 / canvas.height);
        gl.uniform1i(progDisplay.u.uTexture, dye.read.attach(0));
        blit(null);
    }

    function splat(x, y, dx, dy, color, radiusScale) {
        gl.disable(gl.BLEND);
        gl.useProgram(progSplat.p);
        gl.uniform2f(progSplat.u.texelSize, 1 / simW, 1 / simH);
        gl.uniform1i(progSplat.u.uTarget, velocity.read.attach(0));
        gl.uniform1f(progSplat.u.aspectRatio, canvas.width / canvas.height);
        gl.uniform2f(progSplat.u.point, x, y);
        gl.uniform3f(progSplat.u.color, dx, dy, 0);
        const r = (CONF.SPLAT_RADIUS * (radiusScale || 1)) / 100 * (canvas.width / canvas.height > 1 ? 1 : canvas.width / canvas.height);
        gl.uniform1f(progSplat.u.radius, r);
        blit(velocity.write); velocity.swap();

        gl.uniform1i(progSplat.u.uTarget, dye.read.attach(0));
        gl.uniform3f(progSplat.u.color, color[0], color[1], color[2]);
        blit(dye.write); dye.swap();
    }

    function ink(mult) {
        const c = INKS[Math.floor(Math.random() * INKS.length)];
        const m = (mult || 1) * (0.35 + Math.random() * 0.4);
        return [c[0] * m, c[1] * m, c[2] * m];
    }

    // ---------- 交互 ----------
    let lastX = -1, lastY = -1, moved = 0;
    function pointerMove(cx, cy) {
        const rect = canvas.getBoundingClientRect();
        if (cy < rect.top - 80 || cy > rect.bottom + 80) return;
        const x = (cx - rect.left) / rect.width;
        const y = 1 - (cy - rect.top) / rect.height;
        if (lastX < 0) { lastX = x; lastY = y; return; }
        const dx = x - lastX, dy = y - lastY;
        if (Math.abs(dx) + Math.abs(dy) < 0.0005) return;
        splat(x, y, dx * CONF.SPLAT_FORCE, dy * CONF.SPLAT_FORCE, ink(1), 1);
        lastX = x; lastY = y; moved++;
    }
    window.addEventListener('pointermove', (e) => pointerMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('pointerdown', (e) => {
        const rect = canvas.getBoundingClientRect();
        if (e.clientY < rect.top || e.clientY > rect.bottom) return;
        const x = (e.clientX - rect.left) / rect.width, y = 1 - (e.clientY - rect.top) / rect.height;
        for (let i = 0; i < 6; i++) {
            splat(x, y, (Math.random() - 0.5) * 900, (Math.random() - 0.5) * 900, ink(2.2), 2 + Math.random() * 2);
        }
    }, { passive: true });

    // 开场：自动来几笔，别让首屏干等
    function opening() {
        for (let i = 0; i < 7; i++) {
            setTimeout(() => {
                splat(0.18 + Math.random() * 0.64, 0.25 + Math.random() * 0.5,
                    (Math.random() - 0.5) * 1600, (Math.random() - 0.5) * 1600, ink(1.6), 1.5 + Math.random() * 2.5);
            }, 350 + i * 160);
        }
    }
    setTimeout(opening, 1800); // 等 loader 揭幕后开笔

    // 页面滚出视野时暂停（省电）
    let running = true;
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => { running = en[0].isIntersecting; }, { rootMargin: '100px' }).observe(canvas);
    }

    // 禅 · 闲时滴墨：页面静止一阵后，自己落一滴墨慢慢晕开
    let lastActive = performance.now();
    ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'].forEach((ev) =>
        window.addEventListener(ev, () => { lastActive = performance.now(); }, { passive: true }));
    let nextDrop = 0;
    function idleDrop(now) {
        if (now - lastActive < 8000 || now < nextDrop) return;
        nextDrop = now + 12000 + Math.random() * 9000;
        splat(0.22 + Math.random() * 0.56, 0.3 + Math.random() * 0.45,
            (Math.random() - 0.5) * 260, (Math.random() - 0.5) * 260, ink(1.5), 2.4 + Math.random() * 2);
    }

    let lastT = performance.now();
    function frame(now) {
        const dt = Math.min((now - lastT) / 1000, 1 / 30);
        lastT = now;
        if (running && !document.hidden) {
            idleDrop(now);
            step(dt);
            render();
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();
