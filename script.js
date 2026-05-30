// ===== 视频数据 =====
const videoData = [
    { bvid: "BV1tkvSB6E6U", title: "故曲如风 · 编曲版二", cover: "https://i2.hdslb.com/bfs/archive/d29b90cc25e5e887545fdbb539a8de4bb72f6a0a.jpg", date: "2025", category: "original", tag: "原创" },
    { bvid: "BV1PMGqzdEtk", title: "劳动节独奏 · 蛤蟆拳", cover: "https://i2.hdslb.com/bfs/archive/7cba62e6d39f6af1c4d671be7a84672a14378e09.jpg", date: "2025", category: "original", tag: "原创" },
    { bvid: "BV1ypetehEe4", title: "九州同 · 致悟空与时代", cover: "https://i1.hdslb.com/bfs/archive/6e016569e588b543edeea5959b2c1caeb41eedea.jpg", date: "2024", category: "original", tag: "原创" },
    { bvid: "BV1GzeWePEzJ", title: "Trivium Ampknob Bundle 演奏试听", cover: "https://i2.hdslb.com/bfs/archive/ffce5e4ff291ae16c67bc754b8930be489b44ad9.jpg", date: "2024", category: "gear", tag: "器材" },
    { bvid: "BV1cFeseSERJ", title: "故曲如风 · 送给流逝的时光", cover: "https://i0.hdslb.com/bfs/archive/ae7d6b9f2d710758f213a5e22c13f209e765cd4d.jpg", date: "2024", category: "original", tag: "原创" },
    { bvid: "BV1zc411y7gr", title: "随顺而已 · UADspark混音", cover: "https://i1.hdslb.com/bfs/archive/50fdacfd6417b74ba5da8b7016659bac51fbbef9.jpg", date: "2023", category: "original", tag: "原创" },
    { bvid: "BV1iD4y177rw", title: "RHYTHM IR - DOWNTUNED IR Demo", cover: "https://i2.hdslb.com/bfs/archive/f66e6013b9d9babe8537d97d81e24045c5a2b7ca.jpg", date: "2022", category: "gear", tag: "器材" },
    { bvid: "BV1pA411X7wr", title: "相忘于天涯 · 原创曲", cover: "https://i0.hdslb.com/bfs/archive/ba2f2d54fe7f8fe609c6562d8ed0c0c831f4726a.jpg", date: "2022", category: "original", tag: "原创" },
    { bvid: "BV1hi4y1m7m6", title: "PEAVEY 6505 Metal Demo", cover: "https://i1.hdslb.com/bfs/archive/5a75e01b4cc38a00ec30e97c24b259c56c7225a0.jpg", date: "2022", category: "gear", tag: "器材" },
    { bvid: "BV1EP4y1J7zb", title: "孤灯照剑 · Demo", cover: "https://i1.hdslb.com/bfs/archive/38cad7b794fc53498d71a3d9cd78dde2c15b0ade.jpg", date: "2021", category: "original", tag: "原创" },
    { bvid: "BV1Fp4y1S7hx", title: "EZBASS 贝斯音源试听", cover: "https://i0.hdslb.com/bfs/archive/735e8f1fcc081ed7c332b2503e2de85248fa657f.jpg", date: "2020", category: "gear", tag: "器材" },
    { bvid: "BV1Aa4y1v7ar", title: "Positive Grid BIAS FX2 Demo", cover: "https://i2.hdslb.com/bfs/archive/dcc77105c3afe3c26c45fb5b562b19d796a32b38.jpg", date: "2020", category: "gear", tag: "器材" },
    { bvid: "BV1jt411z7ZH", title: "Schecter Ravendark V 试听", cover: "https://i1.hdslb.com/bfs/archive/15ddadd5fad088e9de4bd21a14f4f8beeb16c050.jpg", date: "2019", category: "gear", tag: "器材" },
    { bvid: "BV1jt411z7fY", title: "Jamstik+ 吉他演示", cover: "https://i0.hdslb.com/bfs/archive/b20119cc3c53d10880f8bf67b07f07913b87d423.jpg", date: "2019", category: "gear", tag: "器材" },
    { bvid: "BV1RW411R749", title: "Schecter Banshee Elite-6 测评", cover: "https://i0.hdslb.com/bfs/archive/faa3c143248015e1f79d3a4f82a042720dcf888d.jpg", date: "2018", category: "gear", tag: "器材" },
    { bvid: "BV1As411w71X", title: "Suicide Silence《Disengage》Cover", cover: "https://i1.hdslb.com/bfs/archive/c35c5ec1ef1406d69d38714a826d0a404d4e1dbb.jpg", date: "2018", category: "cover", tag: "翻弹" },
    { bvid: "BV1Ps411w7LY", title: "过去心 · S.yairi yd25", cover: "https://i2.hdslb.com/bfs/archive/514b7e0a5ed1b46516393e6b559058f00bb43604.jpg", date: "2018", category: "original", tag: "原创" },
    { bvid: "BV1XW41157ME", title: "Don't Cry - Guns N' Roses Cover", cover: "https://i1.hdslb.com/bfs/archive/146f1f348c84d3d6e1c7bbd4b8e764ef0ab9237a.jpg", date: "2018", category: "cover", tag: "翻弹" },
    { bvid: "BV1BW411577j", title: "Metal 金属段落编曲", cover: "https://i2.hdslb.com/bfs/archive/8ba79d525fbddd90aaee120a19c13984174da1a6.jpg", date: "2018", category: "original", tag: "原创" },
    { bvid: "BV1Rx411V7nb", title: "Carvin + EZ Drummer 演奏", cover: "https://i2.hdslb.com/bfs/archive/6a6e5c65d23bb0f745348e6bb23024b1cde0a29d.jpg", date: "2017", category: "gear", tag: "器材" },
    { bvid: "BV1Jx411g7sm", title: "Dean Custom 450 Metal Demo", cover: "https://i0.hdslb.com/bfs/archive/6628a0a47d3a5450b596ac1b5ad305655f0f3b4c.jpg", date: "2017", category: "gear", tag: "器材" },
    { bvid: "BV1wx411g7SV", title: "The Wheel And The Black Light Cover", cover: "https://i2.hdslb.com/bfs/archive/e5612099e8de3d2be61703a84d3b4b56a5f775d4.jpg", date: "2017", category: "cover", tag: "翻弹" },
    { bvid: "BV1vx411U7Jk", title: "Pantera《Revolution Is My Name》", cover: "https://i0.hdslb.com/bfs/archive/1de0958114e4f30288a4e5bd73e12f1a9c154a8b.jpg", date: "2017", category: "cover", tag: "翻弹" }
];

// ===== 渲染文章卡片 =====
function renderArticles(filter = 'all') {
    const grid = document.getElementById('articleGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const filtered = filter === 'all' 
        ? videoData 
        : videoData.filter(v => v.category === filter);
    
    filtered.forEach((video) => {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.innerHTML = `
            <div class="card-img">
                <img src="${video.cover}" alt="${video.title}" loading="lazy">
            </div>
            <div class="card-body">
                <span class="card-tag">${video.tag}</span>
                <h3 class="card-title">${video.title}</h3>
                <span class="card-date">${video.date}</span>
            </div>
        `;
        card.addEventListener('click', () => {
            window.open(`https://www.bilibili.com/video/${video.bvid}`, '_blank');
        });
        grid.appendChild(card);
    });
}

// ===== Tab 筛选 =====
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderArticles(tab.dataset.filter);
    });
});

// ===== 侧边栏推荐点击 =====
document.querySelectorAll('.recommend-item').forEach(item => {
    item.addEventListener('click', () => {
        const bvid = item.dataset.bvid;
        if (bvid) window.open(`https://www.bilibili.com/video/${bvid}`, '_blank');
    });
});

// ===== 音乐卡片点击 =====
document.querySelectorAll('.music-item').forEach(item => {
    item.addEventListener('click', () => {
        const bvid = item.dataset.bvid;
        if (bvid) window.open(`https://www.bilibili.com/video/${bvid}`, '_blank');
    });
});

// ===== 旅行卡片点击 =====
document.querySelectorAll('.travel-card').forEach(card => {
    card.addEventListener('click', () => {
        const bvid = card.dataset.bvid;
        if (bvid) window.open(`https://www.bilibili.com/video/${bvid}`, '_blank');
    });
});

// ===== 导航高亮 =====
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('[id]');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const top = section.offsetTop - 150;
        if (window.scrollY >= top) {
            current = section.id;
        }
    });
    
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${current}`) {
            item.classList.add('active');
        }
    });
});

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    renderArticles();
});
