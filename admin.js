// ============================================================
// 编辑台 — 读 data/content.json → 表单化编辑 → GitHub API 发布
// token 只存本机 localStorage；无 token 可「下载配置」手动替换
// ============================================================
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const OWNER = 'lhjihk', REPO = 'bilibili-site';
    let BRANCH = 'main';
    let DATA = null;

    // ---------- 字段定义（每个集合的表单结构） ----------
    const SCHEMAS = {
        tracks: {
            title: (o) => o.title || '未命名曲目',
            fields: [
                { k: 'title', label: '歌名' },
                { k: 'type', label: '类型', type: 'select', options: ['bilibili', 'local', '163'] },
                { k: 'bvid', label: 'BV号（bilibili 用）' },
                { k: 'src', label: '音频路径（local 用，如 audio/xx.mp3）' },
                { k: 'id', label: '歌曲id（网易云用）' },
                { k: 'year', label: '年份' },
                { k: 'note', label: '备注' },
            ],
        },
        featured: {
            title: (o) => o.title || '未命名主打',
            fields: [
                { k: 'title', label: '歌名' },
                { k: 'en', label: '英文副标题' },
                { k: 'bvid', label: 'BV号' },
                { k: 'year', label: '年份' },
                { k: 'cover', label: '封面图链接', wide: true, img: true },
                { k: 'flavor', label: '风味介绍', type: 'textarea', wide: true },
                { k: 'spec', label: '规格标签（如：重失真 · 含高原动机）', wide: true },
            ],
        },
        videos: {
            title: (o) => o.title || '未命名视频',
            fields: [
                { k: 'title', label: '标题' },
                { k: 'bvid', label: 'BV号' },
                { k: 'date', label: '年份' },
                { k: 'category', label: '分类', type: 'select', options: ['original', 'cover', 'gear', 'travel'] },
                { k: 'tag', label: '角标文字（原创/翻弹/器材/旅行）' },
                { k: 'cover', label: '封面图链接', wide: true, img: true },
            ],
        },
        articles: {
            title: (o) => (o.locked ? '🔒 ' : '') + (o.title || '未命名文章'),
            fields: [
                { k: 'title', label: '标题', wide: true },
                { k: 'id', label: 'id（英文小写，唯一，别改动已发布的）' },
                { k: 'bucket', label: '分桶（旅行/乐记/随笔…）' },
                { k: 'year', label: '年份（时间轴分组用）' },
                { k: 'date', label: '日期显示（如 2022 · 冬）' },
                { k: 'place', label: '地点（如 山西 · 风陵渡）' },
                { k: 'coord', label: '坐标（如 34.60°N 110.30°E，上图钉用）' },
                { k: 'file', label: 'md 文件路径（articles/xx.md）' },
                { k: 'locked', label: '锁定（读者要口令）', type: 'checkbox' },
                { k: 'excerpt', label: '摘要', type: 'textarea', wide: true },
            ],
        },
        platformLinks: {
            title: (o) => o.name || '未命名平台',
            fields: [
                { k: 'name', label: '名称' },
                { k: 'url', label: '链接', wide: true },
            ],
        },
    };

    // ---------- 全站文案清单（key → 人话说明） ----------
    const TEXT_SCHEMA = [
        ['— 浏览器标签页 —'],
        ['docTitle', '主页浏览器标签标题（顶栏那行字，留空 = 用默认「路即天涯® / THE ROAD IS THE HORIZON」）'],
        ['— 导航 —'],
        ['nav1', '导航 · 第1项'], ['nav2', '导航 · 第2项'], ['nav3', '导航 · 第3项'],
        ['nav4', '导航 · 第4项'], ['nav5', '导航 · 第5项'], ['nav6', '导航 · 第6项'],
        ['navCta', '导航 · 右侧按钮'],
        ['— 首屏 —'],
        ['heroT1', '巨字 · 第一行（HTML）', 1], ['heroT2', '巨字 · 第二行（HTML）', 1], ['heroT3', '巨字 · 第三行中文（HTML）', 1],
        ['heroSub', '首屏副标题（HTML，<br>换行）', 1], ['heroHint', '右下角小提示'],
        ['hfTL', '左上角小字'], ['hfTR', '右上角小字'],
        ['hfBL', '左下角小字'], ['hfBR', '右下角小字'],
        ['heroColophon', '印章旁竖排诗句（坐看云起时那句）'],
        ['loaderLabel', '加载页小标签'],
        ['— 滚动大字带 —'],
        ['mq1', '第1条滚动带（HTML）', 1], ['mq2', '紫色滚动带（HTML）', 1], ['mqFoot', '页脚滚动带（HTML）', 1],
        ['— (01) 宣言 —'],
        ['sec01Eyebrow', '眉题'], ['sec01Note', '右侧小注'], ['mfCopy', '宣言正文（空格分词，滚动逐词点亮）', 1],
        ['— (02) 主打 —'],
        ['sec02Eyebrow', '眉题'], ['sec02Note', '右侧小注'], ['sec02Title', '大标题（HTML）', 1],
        ['— (03) 试听 —'],
        ['sec03Eyebrow', '眉题'], ['sec03Note', '右侧小注'], ['sec03Title', '大标题（HTML）', 1],
        ['— (04) 影像 —'],
        ['sec04Eyebrow', '眉题'], ['sec04Note', '右侧小注'], ['sec04Title', '大标题（HTML）', 1],
        ['— (05) 手账引子 —'],
        ['sec05Eyebrow', '眉题'], ['sec05Note', '右侧小注'], ['sec05Title', '大标题（HTML）', 1], ['jpPortal', '门票卡大字'],
        ['— (06) 关于 —'],
        ['sec06Eyebrow', '眉题'], ['sec06Note', '右侧小注'], ['sec06Title', '大标题（HTML）', 1],
        ['aboutP1', '第一段', 1], ['aboutP2', '第二段', 1],
        ['spec1', '装备行1'], ['spec2', '装备行2'], ['spec3', '装备行3'], ['spec4', '装备行4'],
        ['bigLink', '大按钮文字'],
        ['— 页脚 —'],
        ['footGiant', '巨字'], ['footNote', '版权行'],
        ['— 手账 · 夜航开篇 —'],
        ['jhEyebrow', '眉题'], ['jhTitle', '碑铭大字'], ['jhEn', '英文斜体'], ['jhSub', '副标题（HTML）', 1],
        ['jhSideL', '标题左侧竖排字'], ['jhSideR', '标题右侧竖排字'],
        ['jQuote1', '滚动引言 · 一'], ['jQuote2', '滚动引言 · 二'], ['jQuote3', '滚动引言 · 三'],
        ['jfLine', '手账卷尾一行'],
        ['— 手账 · 返回按钮与小标题 —'],
        ['jBackLab', '顶栏返回链接（← 声音实验室）'],
        ['jFootBack', '卷尾返回链接（← 回声音实验室）'],
        ['jGateBack', '封存页返回链接（← 退回实验室）'],
        ['jMapHead', '征途图小标题（ROUTE CHART — 征途图）'],
        ['jTapeHead', '随身听小标题（ROAD WALKMAN — 路上的随身听）'],
        ['jScrollHint', '开篇滚动提示（往下滚 — 天就亮了 ↓）'],
        ['jGateTitle', '封存页大字（此账已封存）'],
        ['jGateSub', '封存页副题（HTML）', 1],
        ['jGateBtn', '封存页启封按钮字'],
        ['— 影像馆子页 —'],
        ['vpBrand', '导航标题（默认：踏破腐朽）'],
        ['vpTitle', '开场巨字（HTML）', 1],
        ['vpSub', '开场副题', 1],
        ['vpState', '「为什么拍」大标语（HTML）', 1],
        ['vpCopy', '「为什么拍」正文', 1],
        ['vpMarquee', '跑马灯词组（词间用 <i>●</i> 分隔）', 1],
        ['vpGiant', '尾声巨字（HTML）', 1],
        ['vpTcHero', '时间码 · 开场'], ['vpTc1', '时间码 · 为什么拍'],
        ['vpTc2', '时间码 · 三支主打（就是「三支主打」四个字所在处）'], ['vpTc3', '时间码 · 片库'], ['vpTcEnd', '时间码 · 尾声'],
        ['vNavLab', '顶栏返回链接（← 声音实验室）'], ['vNavJournal', '顶栏手账链接（旅人手账）'],
        ['vEndLab', '尾声返回链接（← 回声音实验室 SOUND LAB）'], ['vEndJournal', '尾声手账链接（去旅人手账 JOURNAL →）'],
        ['— 主页影像区入口 —'],
        ['fvCtaCn', '入口 · 毛笔大字'], ['fvCtaEn', '入口 · 英文行'],
        ['— 行色引导（进站配色选择页） —'],
        ['pgEyebrow', '眉题小字'],
        ['pgTitle', '毛笔大标题'],
        ['pgSub', '副题（HTML，可带 <em>英文斜体</em>）', 1],
        ['pgSkip', '跳过按钮文字'],
        ['pgHint', '底部提示小字'],
        ['— 试听台 —'],
        ['deckIdle', '待机提示（选一首开始）'],
    ];

    function renderTexts() {
        const wrap = $('list-texts');
        if (!wrap) return;
        DATA.settings.texts ||= {};
        wrap.innerHTML = '';
        let group = null;
        TEXT_SCHEMA.forEach((row) => {
            if (row.length === 1) {
                group = document.createElement('div');
                group.className = 'setgroup';
                group.innerHTML = `<h3>${row[0].replace(/—/g, '').trim()}</h3><div class="grid" style="grid-template-columns:1fr"></div>`;
                wrap.appendChild(group);
                return;
            }
            const [key, label, isHtml] = row;
            const div = document.createElement('div');
            // content.json 有非空值就用它；否则回填网站 HTML 里的默认文字（让空白字段显示「网站所见」）
            const saved = DATA.settings.texts[key];
            const v = (saved != null && saved !== '') ? saved : (TEXT_DEFAULTS[key] || '');
            div.innerHTML = isHtml
                ? `<label>${label}</label><textarea rows="2" data-tk="${key}"></textarea>`
                : `<label>${label}</label><input type="text" data-tk="${key}">`;
            const inp = div.querySelector('[data-tk]');
            inp.value = v;
            inp.addEventListener('input', () => { DATA.settings.texts[key] = inp.value; });
            group.querySelector('.grid').appendChild(div);
        });
    }

    // ---------- 板块管理（主页 + 手账/影像子页共用同一套 UI） ----------
    // 子页板块的默认清单（content.json 里没有时用它初始化；id 必须与子页 HTML 里 section 的 id 一致）
    const MODULE_DEFAULTS = {
        journalModules: [
            { id: 'jnight', name: '夜航开篇（星空 · 碑铭）', show: true },
            { id: 'jmap-sec', name: '征途图（地图）', show: true },
            { id: 'jarchive-sec', name: '笔记列表（分桶 + 时间轴）', show: true },
            { id: 'jtape-sec', name: '路上的随身听（播放器）', show: true },
        ],
        videoModules: [
            { id: 'why', name: '为什么拍', show: true },
            { id: 'featured', name: '三支主打', show: true },
            { id: 'archive', name: '片库（全部影像）', show: true },
        ],
    };
    function renderModules(key, wrapId) {
        const wrap = $(wrapId);
        if (!wrap) return;
        if ((!DATA.settings[key] || !DATA.settings[key].length) && MODULE_DEFAULTS[key]) {
            DATA.settings[key] = JSON.parse(JSON.stringify(MODULE_DEFAULTS[key]));
        }
        const mods = DATA.settings[key] ||= [];
        wrap.innerHTML = '';
        mods.forEach((m, i) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.draggable = true;
            card.style.cursor = 'grab';
            card.dataset.i = i;
            card.innerHTML = `
                <div class="card-head">
                    <b>⠿ ${i + 1}. ${m.name || m.id}</b>
                    <div class="ops">
                        <button data-op="up">↑</button>
                        <button data-op="down">↓</button>
                        <label class="inline" style="margin:0;opacity:1;font-size:13px">
                            <input type="checkbox" ${m.show !== false ? 'checked' : ''}> 显示
                        </label>
                    </div>
                </div>`;
            // 拖拽排序
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', String(i));
                card.style.opacity = '.4';
            });
            card.addEventListener('dragend', () => { card.style.opacity = ''; });
            card.addEventListener('dragover', (e) => { e.preventDefault(); card.style.borderColor = 'var(--purple)'; });
            card.addEventListener('dragleave', () => { card.style.borderColor = ''; });
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (isNaN(from) || from === i) return;
                const [moved] = mods.splice(from, 1);
                mods.splice(i, 0, moved);
                markDirty();
                renderModules(key, wrapId);
            });
            card.querySelector('input').addEventListener('change', (e) => { m.show = e.target.checked; markDirty(); });
            card.querySelector('[data-op=up]').addEventListener('click', () => {
                if (i === 0) return; [mods[i - 1], mods[i]] = [mods[i], mods[i - 1]]; markDirty(); renderModules(key, wrapId);
            });
            card.querySelector('[data-op=down]').addEventListener('click', () => {
                if (i === mods.length - 1) return; [mods[i + 1], mods[i]] = [mods[i], mods[i + 1]]; markDirty(); renderModules(key, wrapId);
            });
            wrap.appendChild(card);
        });
    }

    // ---------- 图片压缩（背景/照片/文章插图统一走这里） ----------
    function compressImage(file, maxSide = 1920, quality = 0.82) {
        return new Promise((res) => {
            const img = new Image();
            img.onload = () => {
                let { width: w, height: h } = img;
                if (Math.max(w, h) > maxSide) {
                    const r = maxSide / Math.max(w, h);
                    w = Math.round(w * r); h = Math.round(h * r);
                }
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                c.getContext('2d').drawImage(img, 0, 0, w, h);
                res(c.toDataURL('image/jpeg', quality).split(',')[1]);
            };
            img.onerror = () => res(null);
            img.src = URL.createObjectURL(file);
        });
    }

    // ---------- 状态提示 + 未保存追踪 ----------
    function status(msg, cls) {
        const el = $('status');
        el.textContent = msg;
        el.className = cls || '';
    }
    let DIRTY = false;
    function markDirty() {
        if (!DIRTY) { DIRTY = true; $('btnSave').textContent = '保存并发布 ●'; }
    }
    window.addEventListener('beforeunload', (e) => {
        if (DIRTY) { e.preventDefault(); e.returnValue = ''; }
    });
    document.addEventListener('input', (e) => {
        if (e.target.closest('main')) markDirty();
    });

    // ---------- token ----------
    const tokenBox = $('tokenBox');
    function token() { return localStorage.getItem('ttd-ghtoken') || ''; }
    function refreshTokenBox() {
        if (token()) {
            tokenBox.classList.add('ok');
            tokenBox.firstElementChild.textContent = '✓ GitHub 已连接';
            $('tokenInput').placeholder = '已保存（重新粘贴可更换）';
        } else {
            tokenBox.classList.remove('ok');
        }
    }
    $('tokenSave').addEventListener('click', async () => {
        const v = $('tokenInput').value.trim();
        if (!v) return;
        localStorage.setItem('ttd-ghtoken', v);
        $('tokenInput').value = '';
        refreshTokenBox();
        status('token 已保存，正在验证…');
        try {
            const r = await gh(`/repos/${OWNER}/${REPO}`);
            BRANCH = r.default_branch || 'main';
            $('repoInfo').textContent = `${OWNER}/${REPO} @ ${BRANCH}`;
            status('✓ 连接成功', 'ok');
        } catch (e) { status('连接失败：' + e.message, 'err'); }
    });
    $('tokenClear').addEventListener('click', () => {
        localStorage.removeItem('ttd-ghtoken');
        refreshTokenBox();
        status('已断开');
    });
    refreshTokenBox();
    if (token()) {
        (async () => {
            try {
                const r = await gh(`/repos/${OWNER}/${REPO}`);
                BRANCH = r.default_branch || 'main';
                $('repoInfo').textContent = `${OWNER}/${REPO} @ ${BRANCH} ✓`;
            } catch { $('repoInfo').textContent = 'TOKEN 已失效，请重新连接'; }
        })();
    }

    // ---------- GitHub API ----------
    async function gh(path, opts = {}) {
        const r = await fetch('https://api.github.com' + path, {
            ...opts,
            headers: {
                'Authorization': 'Bearer ' + token(),
                'Accept': 'application/vnd.github+json',
                ...(opts.headers || {}),
            },
        });
        if (!r.ok) {
            const t = await r.text();
            throw new Error(r.status + ' ' + t.slice(0, 120));
        }
        return r.json();
    }
    async function commitFile(path, contentBase64, message) {
        let sha;
        try {
            const cur = await gh(`/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`);
            sha = cur.sha;
        } catch { /* 新文件 */ }
        return gh(`/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`, {
            method: 'PUT',
            body: JSON.stringify({ message, content: contentBase64, branch: BRANCH, ...(sha ? { sha } : {}) }),
        });
    }
    function toB64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }
    function fromB64(b64) {
        return decodeURIComponent(escape(atob((b64 || '').replace(/\s/g, ''))));
    }
    // 统一的安全文件名：去后缀 → 清洗非法字符 → 加短时间戳（避免重名覆盖导致 CDN 缓存旧图）
    function safeName(name) {
        return (name || 'img').replace(/\.[^.]+$/, '').replace(/[^\w一-鿿-]/g, '_') + '-' + Date.now().toString(36);
    }
    function fileToB64(file) {
        return new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result.split(',')[1]);
            fr.onerror = rej;
            fr.readAsDataURL(file);
        });
    }

    // ---------- 渲染集合编辑卡 ----------
    function renderList(key) {
        const wrap = $('list-' + key);
        if (!wrap) return;
        const schema = SCHEMAS[key];
        const arr = DATA[key] || (DATA[key] = []);
        wrap.innerHTML = '';
        arr.forEach((obj, i) => {
            const card = document.createElement('div');
            card.className = 'card';
            const inputs = schema.fields.map((f) => {
                const val = obj[f.k] ?? '';
                const cls = f.wide ? ' class="wide"' : '';
                if (f.type === 'select') {
                    return `<div${cls}><label>${f.label}</label><select data-k="${f.k}">${f.options.map((o) => `<option${o === val ? ' selected' : ''}>${o}</option>`).join('')}</select></div>`;
                }
                if (f.type === 'textarea') {
                    return `<div${cls}><label>${f.label}</label><textarea rows="2" data-k="${f.k}">${val}</textarea></div>`;
                }
                if (f.type === 'checkbox') {
                    return `<div${cls}><label>${f.label}</label><input type="checkbox" data-k="${f.k}"${val ? ' checked' : ''}></div>`;
                }
                if (f.img) {
                    return `<div${cls}><label>${f.label}（可填外链，或用下面按钮传本机图）</label>
                        <input type="text" data-k="${f.k}" value="${String(val).replace(/"/g, '&quot;')}">
                        <label class="mini-up" title="从本机选图，自动压缩上传并填好路径">⬆ 上传本地图片<input type="file" accept="image/*" data-imgk="${f.k}"></label></div>`;
                }
                return `<div${cls}><label>${f.label}</label><input type="text" data-k="${f.k}" value="${String(val).replace(/"/g, '&quot;')}"></div>`;
            }).join('');
            card.innerHTML = `
                <div class="card-head">
                    <b>${i + 1}. ${schema.title(obj)}</b>
                    <div class="ops">
                        <button data-op="up" title="上移">↑</button>
                        <button data-op="down" title="下移">↓</button>
                        <button data-op="del" class="danger">删除</button>
                    </div>
                </div>
                <div class="grid">${inputs}</div>`;
            // 双向绑定
            card.querySelectorAll('[data-k]').forEach((inp) => {
                inp.addEventListener('input', () => {
                    obj[inp.dataset.k] = inp.type === 'checkbox' ? inp.checked : inp.value;
                    card.querySelector('.card-head b').textContent = `${i + 1}. ${schema.title(obj)}`;
                });
            });
            // 封面「上传本地图片」：压缩 → 提交 assets/covers/ → 自动回填路径
            card.querySelectorAll('[data-imgk]').forEach((fi) => {
                fi.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (!token()) { status('先连接 GitHub token 才能上传', 'err'); e.target.value = ''; return; }
                    const k = fi.dataset.imgk;
                    status('压缩上传封面中…');
                    try {
                        const b64 = await compressImage(file, 1400);
                        if (!b64) throw new Error('图片读取失败');
                        const path = 'assets/covers/' + safeName(file.name) + '.jpg';
                        await commitFile(path, b64, '上传封面 ' + path);
                        obj[k] = path;
                        const textInp = card.querySelector(`[data-k="${k}"]`);
                        if (textInp) textInp.value = path;
                        markDirty();
                        status('✓ 封面已上传并填好路径，记得点「保存并发布」', 'ok');
                        logUp('✓ ' + path + `（${(file.size / 1024).toFixed(0)}KB）`, true);
                    } catch (err) { status('上传失败：' + err.message, 'err'); }
                    e.target.value = '';
                });
            });
            card.querySelector('[data-op=del]').addEventListener('click', () => {
                if (!confirm('确定删除「' + schema.title(obj) + '」？')) return;
                arr.splice(i, 1); renderList(key);
            });
            card.querySelector('[data-op=up]').addEventListener('click', () => {
                if (i === 0) return;
                [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; renderList(key);
            });
            card.querySelector('[data-op=down]').addEventListener('click', () => {
                if (i === arr.length - 1) return;
                [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; renderList(key);
            });
            // 文章卡片附加：编辑正文按钮
            if (key === 'articles') {
                const btn = document.createElement('button');
                btn.textContent = '📝 编辑正文';
                btn.style.marginTop = '10px';
                btn.addEventListener('click', () => openMdEditor(obj));
                card.appendChild(btn);
            }
            wrap.appendChild(card);
        });
    }

    // ---------- 文章正文编辑器 ----------
    let mdTarget = null;
    function openMdEditor(article) {
        if (!article.file) { alert('这篇还没有 md 文件路径'); return; }
        mdTarget = article;
        $('mdEditorTitle').textContent = article.title || article.file;
        $('mdEditorBox').value = '加载中…';
        $('mdEditor').style.display = 'flex';
        fetch(article.file + '?t=' + Date.now())
            .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
            .then((t) => { $('mdEditorBox').value = t; })
            .catch(() => { $('mdEditorBox').value = ''; status('空白新笔记，直接在这里写正文即可', ''); });
    }
    // 正文里「插入图片」：压缩 → 提交 assets/notes/<文章id>/ → 光标处插入 markdown
    // （渲染时自动套 .jr-body img 的居中/拉伸/拍立得美化样式）
    $('mdImgUp')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!token()) { status('先连接 GitHub token 才能传图', 'err'); e.target.value = ''; return; }
        if (!mdTarget) { e.target.value = ''; return; }
        const id = (mdTarget.id || 'note').replace(/[^\w-]/g, '-');
        status('压缩上传插图中…');
        try {
            const b64 = await compressImage(file, 1600);
            if (!b64) throw new Error('图片读取失败');
            const path = 'assets/notes/' + id + '/' + safeName(file.name) + '.jpg';
            await commitFile(path, b64, '上传笔记插图 ' + path);
            const box = $('mdEditorBox');
            const pos = box.selectionStart ?? box.value.length;
            const snippet = '\n\n![](' + path + ')\n\n';
            box.value = box.value.slice(0, pos) + snippet + box.value.slice(pos);
            box.focus();
            status('✓ 插图已插入正文，别忘了点「保存正文并发布」', 'ok');
            logUp('✓ ' + path + `（${(file.size / 1024).toFixed(0)}KB）`, true);
        } catch (err) { status('上传失败：' + err.message, 'err'); }
        e.target.value = '';
    });
    $('mdEditorClose')?.addEventListener('click', () => { $('mdEditor').style.display = 'none'; mdTarget = null; });
    $('mdEditorSave')?.addEventListener('click', async () => {
        if (!mdTarget) return;
        if (!token()) { status('先连接 GitHub token', 'err'); return; }
        status('正文保存中…');
        try {
            await commitFile(mdTarget.file, toB64($('mdEditorBox').value), '编辑正文 ' + mdTarget.file);
            status('✓ 正文已发布（约1分钟生效）', 'ok');
            $('mdEditor').style.display = 'none';
        } catch (e) { status('保存失败：' + e.message, 'err'); }
    });
    // 造一条空白文章记录（自动分配 id 和 md 文件路径，建好即可直接写正文）
    function newArticleRecord() {
        const blank = {};
        SCHEMAS.articles.fields.forEach((f) => { blank[f.k] = f.type === 'checkbox' ? false : ''; });
        blank.bucket = '随笔';
        blank.id = 'note-' + Date.now().toString(36);
        blank.year = String(new Date().getFullYear());
        blank.file = 'articles/' + blank.id + '.md';
        return blank;
    }
    document.querySelectorAll('[data-add]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.add;
            if (key === 'articles') { DATA.articles.unshift(newArticleRecord()); markDirty(); renderList('articles'); return; }
            const blank = {};
            SCHEMAS[key].fields.forEach((f) => { blank[f.k] = f.type === 'checkbox' ? false : ''; });
            if (key === 'tracks') blank.type = 'bilibili';
            if (key === 'videos') blank.category = 'original';
            DATA[key].unshift(blank);
            markDirty();
            renderList(key);
        });
    });
    // 「写新笔记」：直接建一条并立刻打开正文编辑器写（无需先上传 md 文件）
    $('btnNewNote')?.addEventListener('click', () => {
        const art = newArticleRecord();
        art.title = '未命名笔记';
        DATA.articles.unshift(art);
        markDirty();
        renderList('articles');
        openMdEditor(art);
        status('新笔记已建好：填标题/日期，写完点「保存正文并发布」，再点右上角「保存并发布」让它出现在手账里', 'ok');
    });

    // ---------- 站点设置绑定 ----------
    function get(obj, path) { return path.split('.').reduce((o, k) => (o || {})[k], obj); }
    function set(obj, path, val) {
        const ks = path.split('.');
        let o = obj;
        ks.slice(0, -1).forEach((k) => { o = o[k] || (o[k] = {}); });
        o[ks[ks.length - 1]] = val;
    }
    function bindSettings() {
        document.querySelectorAll('[data-set]').forEach((inp) => {
            const path = 'settings.' + inp.dataset.set;
            const v = get(DATA, path);
            if (v != null) inp.value = v;
            inp.addEventListener('input', () => set(DATA, path, inp.value));
        });
        $('lyricsBox').value = (DATA.settings.lyrics || []).join('\n');
        $('lyricsBox').addEventListener('input', () => {
            DATA.settings.lyrics = $('lyricsBox').value.split('\n').map((s) => s.trim()).filter(Boolean);
        });
        $('lockAll').checked = !!(DATA.settings.journal || {}).lockAll;
        $('lockAll').addEventListener('change', () => {
            (DATA.settings.journal ||= {}).lockAll = $('lockAll').checked;
        });
    }
    async function sha256(str) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // ---------- 保存/发布 ----------
    async function collectData() {
        const np = $('newPass').value.trim();
        if (np) {
            (DATA.settings.journal ||= {}).passHash = await sha256(np);
            $('newPass').value = '';
        }
        return JSON.stringify(DATA, null, 2) + '\n';
    }
    $('btnSave').addEventListener('click', async () => {
        if (!token()) { status('先在上面连接 GitHub token', 'err'); return; }
        status('发布中…');
        try {
            const json = await collectData();
            await commitFile('data/content.json', toB64(json), '编辑台更新内容 ' + new Date().toLocaleString('zh-CN'));
            status('✓ 已发布！约 1 分钟后线上生效（Cloudflare 自动部署）', 'ok');
            DIRTY = false;
            $('btnSave').textContent = '保存并发布 ↗';
        } catch (e) { status('发布失败：' + e.message, 'err'); }
    });
    $('btnDownload').addEventListener('click', async () => {
        const json = await collectData();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        a.download = 'content.json';
        a.click();
        status('已下载，替换仓库里的 data/content.json 即可', 'ok');
    });

    // ---------- 文件上传 ----------
    function logUp(msg, ok) {
        $('upLog').insertAdjacentHTML('afterbegin',
            `<div style="color:${ok ? 'var(--ok)' : 'var(--red)'}">${new Date().toLocaleTimeString('zh-CN')} — ${msg}</div>`);
    }
    function bindUpload(inputId, dir, after) {
        $(inputId).addEventListener('change', async (e) => {
            if (!token()) { status('先连接 GitHub token 才能传文件', 'err'); return; }
            for (const f of e.target.files) {
                const safe = f.name.replace(/[^\w.一-鿿-]/g, '_');
                const path = dir + safe;
                status(`上传 ${safe} 中…`);
                try {
                    const b64 = await fileToB64(f);
                    await commitFile(path, b64, '上传 ' + path);
                    logUp(`✓ ${path}（${(f.size / 1024).toFixed(0)}KB）`, true);
                    status(`✓ ${safe} 已上传`, 'ok');
                    if (after) after(path, f);
                } catch (err) {
                    logUp(`✗ ${path} — ${err.message}`, false);
                    status(`上传失败：${err.message}`, 'err');
                }
            }
            e.target.value = '';
        });
    }
    bindUpload('upAudio', 'audio/');

    // 背景图上传：压缩 → 提交 → 自动回填路径
    function bindBgUpload(inputId, setPath, maxSide) {
        $(inputId)?.addEventListener('change', async (e) => {
            const f = e.target.files[0];
            if (!f) return;
            if (!token()) { status('先连接 GitHub token', 'err'); return; }
            status('压缩上传中…');
            try {
                const b64 = await compressImage(f, maxSide || 1920);
                if (!b64) throw new Error('图片读取失败');
                const path = 'assets/bg/' + f.name.replace(/\.[^.]+$/, '').replace(/[^\w一-鿿-]/g, '_') + '.jpg';
                await commitFile(path, b64, '上传背景图 ' + path);
                set(DATA, 'settings.' + setPath, path);
                document.querySelector(`[data-set="${setPath}"]`).value = path;
                status(`✓ 已上传并填好路径，记得点「保存并发布」`, 'ok');
                logUp(`✓ ${path}`, true);
            } catch (err) { status('上传失败：' + err.message, 'err'); }
            e.target.value = '';
        });
    }
    bindBgUpload('upBgHero', 'backgrounds.hero', 2200);
    bindBgUpload('upBgSky', 'backgrounds.journalSky', 2200);
    bindBgUpload('upBgJnPhoto', 'backgrounds.journalPhoto', 2000);
    bindBgUpload('upBgAbout', 'backgrounds.aboutPhoto', 1200);
    bindUpload('upMd', 'articles/', (path, f) => {
        // 传完 md 自动帮你把文章记录建好
        if (confirm(`已上传 ${path}\n要顺手在「手账文章」里建一条记录吗？`)) {
            DATA.articles.unshift({
                id: f.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^\w-]/g, '-'),
                title: f.name.replace(/\.[^.]+$/, ''),
                date: '', year: String(new Date().getFullYear()),
                place: '', coord: '', bucket: '随笔', locked: false,
                excerpt: '', file: path,
            });
            renderList('articles');
            document.querySelector('[data-p=articles]').click();
        }
    });
    $('upImg').addEventListener('change', async (e) => {
        if (!token()) { status('先连接 GitHub token', 'err'); return; }
        for (const f of e.target.files) {
            status(`压缩上传 ${f.name}…`);
            try {
                const b64 = await compressImage(f, 1600);
                const path = 'articles/assets/' + f.name.replace(/\.[^.]+$/, '').replace(/[^\w一-鿿-]/g, '_') + '.jpg';
                await commitFile(path, b64, '上传插图 ' + path);
                logUp(`✓ ${path}`, true);
                status(`✓ ${f.name} 已上传`, 'ok');
            } catch (err) { logUp(`✗ ${f.name} — ${err.message}`, false); status('上传失败', 'err'); }
        }
        e.target.value = '';
    });

    // ---------- tabs ----------
    $('tabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
        tab.classList.add('active');
        $('p-' + tab.dataset.p).classList.add('active');
        if (tab.dataset.p === 'images') loadImageManager();
    });

    // ---------- 网站现有默认文案（HTML 里写死的那份，用于回填空白字段） ----------
    // content.json 里为空/缺失的文案键，网站显示的是 HTML 里的默认文字（boot.js 不覆盖空值）。
    // 这里把三张页面的 data-txt 默认文字解析出来，让编辑台空白字段直接显示「网站所见」。
    let TEXT_DEFAULTS = {};
    async function loadTextDefaults() {
        for (const f of ['index.html', 'journal.html', 'videos.html']) {
            try {
                const html = await (await fetch(f + '?t=' + Date.now())).text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                doc.querySelectorAll('[data-txt], [data-txt-html]').forEach((el) => {
                    const key = el.dataset.txt || el.dataset.txtHtml;
                    const val = el.innerHTML.trim();
                    if (key && val && TEXT_DEFAULTS[key] == null) TEXT_DEFAULTS[key] = val;
                });
            } catch (e) { /* 某页取不到不致命 */ }
        }
    }

    // ---------- 上传文件管理（列出 + 删除仓库里上传的 图片/音频/其他文件） ----------
    async function loadImageManager() {
        const wrap = $('list-images');
        if (!wrap) return;
        if (!token()) { wrap.innerHTML = '<p style="opacity:.6">先在上方连接 GitHub token，才能列出和管理上传的文件。</p>'; return; }
        wrap.innerHTML = '<p style="opacity:.6">正在读取上传文件清单…</p>';
        // 只列「编辑台会上传到的目录」，避免误列字体/代码等仓库自带文件
        const ROOTS = /^(audio\/|articles\/|assets\/covers\/|assets\/notes\/|assets\/bg\/)/;
        const IMG = /\.(jpe?g|png|gif|webp|avif)$/i;
        const AUD = /\.(mp3|wav|m4a|ogg|flac|aac)$/i;
        try {
            const tree = await gh(`/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1&t=${Date.now()}`);
            const files = (tree.tree || []).filter((n) => n.type === 'blob' && ROOTS.test(n.path));
            const groups = {
                image: { title: '🖼 图片', warn: '若还有主打封面 / 文章正文在引用它，页面上会显示裂图。', items: [] },
                audio: { title: '🎧 音频', warn: '若还有试听曲目的 src 指向它，试听台会 404 放不出这首。', items: [] },
                other: { title: '📄 其他文件（笔记 .md 等）', warn: '若还有文章在引用它，对应页面会受影响。', items: [] },
            };
            files.forEach((n) => {
                const g = IMG.test(n.path) ? 'image' : AUD.test(n.path) ? 'audio' : 'other';
                groups[g].items.push(n);
            });
            const total = files.length;
            if (!total) { wrap.innerHTML = '<p style="opacity:.6">仓库里还没有上传的文件。</p>'; return; }
            wrap.innerHTML = '';
            ['image', 'audio', 'other'].forEach((key) => {
                const g = groups[key];
                if (!g.items.length) return;
                const sec = document.createElement('div');
                sec.style.marginBottom = '22px';
                sec.innerHTML = `<h3 style="margin:0 0 10px">${g.title}（${g.items.length}）</h3><div class="imgrid"></div>`;
                const grid = sec.querySelector('.imgrid');
                g.items.forEach((n) => grid.appendChild(makeFileCell(n, key, g.warn)));
                wrap.appendChild(sec);
            });
            status(`共 ${total} 个文件（图片 ${groups.image.items.length} / 音频 ${groups.audio.items.length} / 其他 ${groups.other.items.length}）`, 'ok');
        } catch (e) { wrap.innerHTML = '<p style="color:var(--red)">读取失败：' + e.message + '</p>'; }
    }
    function makeFileCell(n, kind, warn) {
        const kb = (n.size / 1024).toFixed(0);
        const cell = document.createElement('div');
        cell.className = 'imgcell';
        let preview;
        if (kind === 'image') {
            preview = `<img loading="lazy" src="${n.path}?t=${Date.now()}" alt="">`;
        } else if (kind === 'audio') {
            preview = `<audio controls preload="none" style="width:100%" src="${n.path}?t=${Date.now()}"></audio>`;
        } else {
            preview = `<div class="filetype">${(n.path.split('.').pop() || 'file').toUpperCase()}</div>`;
        }
        cell.innerHTML =
            `${preview}
             <div class="imgpath mono">${n.path}</div>
             <div class="imgmeta">${kb}KB</div>
             <button class="danger imgdel">删除</button>`;
        const img = cell.querySelector('img');
        if (img) img.addEventListener('error', (ev) => { ev.target.style.opacity = '.2'; });
        cell.querySelector('.imgdel').addEventListener('click', async () => {
            if (!confirm('确定删除这个文件？\n' + n.path + '\n\n⚠️ ' + warn + '\n删除后 git 历史里仍能找回。')) return;
            status('删除中…');
            try {
                await gh(`/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(n.path)}`, {
                    method: 'DELETE',
                    body: JSON.stringify({ message: '删除文件 ' + n.path, sha: n.sha, branch: BRANCH }),
                });
                cell.remove();
                status('✓ 已删除 ' + n.path, 'ok');
                logUp('🗑 删除 ' + n.path, true);
            } catch (err) { status('删除失败：' + err.message, 'err'); }
        });
        return cell;
    }
    $('btnImgRefresh')?.addEventListener('click', loadImageManager);

    // ---------- 启动 ----------
    let SOURCE_NOTE = '内容已载入，改完点「保存并发布」';
    async function loadData() {
        // 有 token 时直接从 GitHub 读「源头」，保证永远是最新版
        // （修复：过去从已部署站点读 content.json，部署有滞后 → 刷新后回退旧内容）
        if (token()) {
            try {
                const r = await gh(`/repos/${OWNER}/${REPO}/contents/data/content.json?ref=${BRANCH}&t=${Date.now()}`);
                SOURCE_NOTE = '内容已从 GitHub 载入（最新版），改完点「保存并发布」';
                return JSON.parse(fromB64(r.content));
            } catch (e) { /* token 无效等情况，落回公开 fetch */ }
        }
        return (await fetch('data/content.json?t=' + Date.now())).json();
    }
    (async () => {
        await loadTextDefaults();
        try {
            DATA = await loadData();
        } catch (e) { status('content.json 加载失败：' + e.message, 'err'); return; }
        DATA.settings ||= {};
        ['tracks', 'featured', 'videos', 'articles', 'platformLinks'].forEach(renderList);
        renderTexts();
        renderModules('modules', 'list-modules');
        renderModules('journalModules', 'list-journalmods');
        renderModules('videoModules', 'list-videomods');
        bindSettings();
        status(SOURCE_NOTE);
    })();
})();
