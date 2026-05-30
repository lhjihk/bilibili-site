// ===== 视频数据（按发布日期从新到旧）=====
const videoData = [
    {
        bvid: "BV1tkvSB6E6U",
        title: "故曲如风 · 编曲版二",
        cover: "https://i2.hdslb.com/bfs/archive/d29b90cc25e5e887545fdbb539a8de4bb72f6a0a.jpg",
        date: "2025",
        category: "original",
        tag: "原创"
    },
    {
        bvid: "BV1PMGqzdEtk",
        title: "劳动节独奏 · 蛤蟆拳",
        cover: "https://i2.hdslb.com/bfs/archive/7cba62e6d39f6af1c4d671be7a84672a14378e09.jpg",
        date: "2025",
        category: "original",
        tag: "原创"
    },
    {
        bvid: "BV1ypetehEe4",
        title: "九州同 · 致悟空与时代",
        cover: "https://i1.hdslb.com/bfs/archive/6e016569e588b543edeea5959b2c1caeb41eedea.jpg",
        date: "2024",
        category: "original",
        tag: "原创"
    },
    {
        bvid: "BV1GzeWePEzJ",
        title: "Trivium Ampknob Bundle 演奏试听",
        cover: "https://i2.hdslb.com/bfs/archive/ffce5e4ff291ae16c67bc754b8930be489b44ad9.jpg",
        date: "2024",
        category: "gear",
        tag: "器材"
    },
    {
        bvid: "BV1cFeseSERJ",
        title: "故曲如风 · 送给流逝的时光",
        cover: "https://i0.hdslb.com/bfs/archive/ae7d6b9f2d710758f213a5e22c13f209e765cd4d.jpg",
        date: "2024",
        category: "original",
        tag: "原创"
    },
    {
        bvid: "BV1zc411y7gr",
        title: "随顺而已 · UADspark混音",
        cover: "https://i1.hdslb.com/bfs/archive/50fdacfd6417b74ba5da8b7016659bac51fbbef9.jpg",
        date: "2023",
        category: "original",
        tag: "原创"
    },
    {
        bvid: "BV1iD4y177rw",
        title: "RHYTHM IR - DOWNTUNED IR Demo",
        cover: "https://i2.hdslb.com/bfs/archive/f66e6013b9d9babe8537d97d81e24045c5a2b7ca.jpg",
        date: "2022",
        category: "gear",
        tag: "器材"
    },
    {
        bvid: "BV1pA411X7wr",
        title: "相忘于天涯 · 原创曲",
        cover: "https://i0.hdslb.com/bfs/archive/ba2f2d54fe7f8fe609c6562d8ed0c0c831f4726a.jpg",
        date: "2022",
        category: "original",
        tag: "原创"
    },
    {
        bvid: "BV1Yg411d7n3",
        title: "北京至西藏 · 雨拜丞相",
        cover: "https://i1.hdslb.com/bfs/archive/9e540be0172383f5e07db60b79c5dea4dac84ec8.jpg",
        date: "2022",
        category: "travel",
        tag: "旅行"
    },
    {
        bvid: "BV1KZ4y1h7Z4",
        title: "北京至西藏 · 风陵渡口",
        cover: "https://i0.hdslb.com/bfs/archive/cbf305cf28c509709feb397db5d0d5e5d087cc2a.jpg",
        date: "2022",
        category: "travel",
        tag: "旅行"
    },
    {
        bvid: "BV1hi4y1m7m6",
        title: "PEAVEY 6505 Metal Demo",
        cover: "https://i1.hdslb.com/bfs/archive/5a75e01b4cc38a00ec30e97c24b259c56c7225a0.jpg",
        date: "2022",
        category: "gear",
        tag: "器材"
    },
    {
        bvid: "BV1EP4y1J7zb",
        title: "孤灯照剑 · Demo",
        cover: "https://i1.hdslb.com/bfs/archive/38cad7b794fc53498d71a3d9cd78dde2c15b0ade.jpg",
        date: "2021",
        category: "original",
        tag: "原创"
    },
    {
        bvid: "BV1b54y1C722",
        title: "鑫源400 · 西藏骑行",
        cover: "https://i2.hdslb.com/bfs/archive/b85b8e8b6798d32602c1545cf414ff6978bd582d.jpg",
        date: "2020",
        category: "travel",
        tag: "旅行"
    },
    {
        bvid: "BV1Fp4y1S7hx",
        title: "EZBASS 贝斯音源试听",
        cover: "https://i0.hdslb.com/bfs/archive/735e8f1fcc081ed7c332b2503e2de85248fa657f.jpg",
        date: "2020",
        category: "gear",
        tag: "器材"
    },
    {
        bvid: "BV1Aa4y1v7ar",
        title: "Positive Grid BIAS FX2 Demo",
        cover: "https://i2.hdslb.com/bfs/archive/dcc77105c3afe3c26c45fb5b562b19d796a32b38.jpg",
        date: "2020",
        category: "gear",
        tag: "器材"
    },
    {
        bvid: "BV1jt411z7ZH",
        title: "Schecter Ravendark V 试听",
        cover: "https://i1.hdslb.com/bfs/archive/15ddadd5fad088e9de4bd21a14f4f8beeb16c050.jpg",
        date: "2019",
        category: "gear",
        tag: "器材"
    },
    {
        bvid: "BV1jt411z7fY",
        title: "Jamstik+ 吉他演示",
        cover: "https://i0.hdslb.com/bfs/archive/b20119cc3c53d10880f8bf67b07f07913b87d423.jpg",
        date: "2019",
        category: "gear",
        tag: "器材"
    },
    {
        bvid: "BV1Yt411e74f",
        title: "GoPro Hero7 · 骑行撸琴",
        cover: "https://i2.hdslb.com/bfs/archive/6a9aad98c0e19e9cb0d8983c8e23d66d14be6baf.jpg",
        date: "2018",
        category: "travel",
        tag: "旅行"
    },
    {
        bvid: "BV1rt411f7fJ",
        title: "山西·北京·终南山 旅行记录",
        cover: "https://i0.hdslb.com/bfs/archive/accb17624236e3d75ef9f00b1f2d1b6cb4341436.jpg",
        date: "2018",
        category: "travel",
        tag: "旅行"
    },
    {
        bvid: "BV1RW411R749",
        title: "Schecter Banshee Elite-6 测评",
        cover: "https://i0.hdslb.com/bfs/archive/faa3c143248015e1f79d3a4f82a042720dcf888d.jpg",
        date: "2018",
        category: "gear",
        tag: "器材"
    },
    {
        bvid: "BV1As411w71X",
        title: "Suicide Silence -《Disengage》Cover",
        cover: "https://i1.hdslb.com/bfs/archive/c35c5ec1ef1406d69d38714a826d0a404d4e1dbb.jpg",
        date: "2018",
        category: "cover",
        tag: "翻弹"
    },
    {
        bvid: "BV1Ps411w7LY",
        title: "过去心 · S.yairi yd25",
        cover: "https://i2.hdslb.com/bfs/archive/514b7e0a5ed1b46516393e6b559058f00bb43604.jpg",
        date: "2018",
        category: "original",
        tag: "原创"
    },
    {
        bvid: "BV1tp411R7bo",
        title: "哈雷 Forty-Eight · 归途",
        cover: "https://i1.hdslb.com/bfs/archive/693fb7b64eeac6bb92b8777195ca9b85485bf1b6.jpg",
        date: "2018",
        category: "travel",
        tag: "旅行"
    },
    {
        bvid: "BV1XW41157ME",
        title: "Don't Cry - Guns N' Roses Cover",
        cover: "https://i1.hdslb.com/bfs/archive/146f1f348c84d3d6e1c7bbd4b8e764ef0ab9237a.jpg",
        date: "2018",
        category: "cover",
        tag: "翻弹"
    },
    {
        bvid: "BV1BW411577j",
        title: "Metal 金属段落编曲",
        cover: "https://i2.hdslb.com/bfs/archive/8ba79d525fbddd90aaee120a19c13984174da1a6.jpg",
        date: "2018",
        category: "original",
        tag: "原创"
    },
    {
        bvid: "BV1Rx411V7nb",
        title: "Carvin + EZ Drummer 演奏",
        cover: "https://i2.hdslb.com/bfs/archive/6a6e5c65d23bb0f745348e6bb23024b1cde0a29d.jpg",
        date: "2017",
        category: "gear",
        tag: "器材"
    },
    {
        bvid: "BV1Jx411g7sm",
        title: "Dean Custom 450 Metal Demo",
        cover: "https://i0.hdslb.com/bfs/archive/6628a0a47d3a5450b596ac1b5ad305655f0f3b4c.jpg",
        date: "2017",
        category: "gear",
        tag: "器材"
    },
    {
        bvid: "BV1wx411g7SV",
        title: "The Wheel And The Black Light Cover",
        cover: "https://i2.hdslb.com/bfs/archive/e5612099e8de3d2be61703a84d3b4b56a5f775d4.jpg",
        date: "2017",
        category: "cover",
        tag: "翻弹"
    },
    {
        bvid: "BV1wx411g7yu",
        title: "东南亚骑行 · 曼谷华欣",
        cover: "https://i1.hdslb.com/bfs/archive/b36634766769e98f1c852f2cd8e297d95ca4c11a.jpg",
        date: "2017",
        category: "travel",
        tag: "旅行"
    },
    {
        bvid: "BV1wx411g72y",
        title: "东南亚骑行 · 启程",
        cover: "https://i1.hdslb.com/bfs/archive/342ecc6914129972b20f4bdaf56003f46a0542b0.jpg",
        date: "2017",
        category: "travel",
        tag: "旅行"
    },
    {
        bvid: "BV1vx411U7Jk",
        title: "Pantera《Revolution Is My Name》",
        cover: "https://i0.hdslb.com/bfs/archive/1de0958114e4f30288a4e5bd73e12f1a9c154a8b.jpg",
        date: "2017",
        category: "cover",
        tag: "翻弹"
    }
];

// ===== 渲染视频网格 =====
function renderVideoGrid(filter = 'all') {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';
    
    const filtered = filter === 'all' 
        ? videoData 
        : videoData.filter(v => v.category === filter);
    
    filtered.forEach((video, index) => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.category = video.category;
        card.style.transitionDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="card-cover">
                <img src="${video.cover}" alt="${video.title}" loading="lazy">
                <div class="play-icon">▶</div>
                <span class="card-tag">${video.tag}</span>
            </div>
            <div class="card-info">
                <h3 class="card-title">${video.title}</h3>
                <div class="card-meta">
                    <span>${video.date}</span>
                </div>
            </div>
        `;
        card.addEventListener('click', () => {
            window.open(`https://www.bilibili.com/video/${video.bvid}`, '_blank');
        });
        grid.appendChild(card);
        
        // 触发动画
        requestAnimationFrame(() => {
            setTimeout(() => card.classList.add('visible'), index * 50);
        });
    });
}

// ===== 筛选按钮 =====
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderVideoGrid(btn.dataset.filter);
    });
});

// ===== 音乐卡片点击 =====
document.querySelectorAll('.music-card').forEach(card => {
    card.addEventListener('click', () => {
        const bvid = card.dataset.bvid;
        window.open(`https://www.bilibili.com/video/${bvid}`, '_blank');
    });
});

// ===== 旅行卡片点击 =====
document.querySelectorAll('.travel-item').forEach(item => {
    item.addEventListener('click', () => {
        const bvid = item.dataset.bvid;
        window.open(`https://www.bilibili.com/video/${bvid}`, '_blank');
    });
});

// ===== 打字机效果 =====
const typewriterEl = document.getElementById('typewriter');
const phrases = [
    '山有木兮木有枝，心悦君兮君不知',
    '大道如青天，我独不得出',
    '长风破浪会有时，直挂云帆济沧海',
    '一弦一柱思华年',
    '踏遍青山人未老，风景这边独好'
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 120;

function typeWriter() {
    const current = phrases[phraseIndex];
    
    if (isDeleting) {
        typewriterEl.innerHTML = current.substring(0, charIndex - 1) + '<span class="cursor"></span>';
        charIndex--;
        typeSpeed = 60;
    } else {
        typewriterEl.innerHTML = current.substring(0, charIndex + 1) + '<span class="cursor"></span>';
        charIndex++;
        typeSpeed = 120;
    }
    
    if (!isDeleting && charIndex === current.length) {
        typeSpeed = 3000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 500;
    }
    
    setTimeout(typeWriter, typeSpeed);
}

typeWriter();

// ===== 鼠标跟随光效 =====
const cursorGlow = document.getElementById('cursorGlow');
document.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
});

// ===== 点击墨点粒子 =====
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.opacity = 1;
        this.decay = Math.random() * 0.02 + 0.01;
        this.color = Math.random() > 0.5 ? '#E8734A' : '#D4A574';
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX *= 0.98;
        this.speedY *= 0.98;
        this.opacity -= this.decay;
        this.size *= 0.99;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

document.addEventListener('click', (e) => {
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(e.clientX, e.clientY));
    }
});

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.opacity > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}
animateParticles();

// ===== 导航栏滚动效果 =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== 导航高亮 =====
const sections = document.querySelectorAll('.section, .hero');
const navLinks = document.querySelectorAll('.nav-link');

const observerOptions = {
    threshold: 0.3,
    rootMargin: '-80px 0px 0px 0px'
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.section === id);
            });
        }
    });
}, observerOptions);

sections.forEach(section => sectionObserver.observe(section));

// ===== 滚动淡入动画 =====
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

// 观察旅行卡片
document.querySelectorAll('.travel-item').forEach(item => {
    fadeObserver.observe(item);
});

// ===== 主题切换 =====
const themeToggle = document.getElementById('themeToggle');
const toggleIcon = themeToggle.querySelector('.toggle-icon');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    toggleIcon.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
});

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    renderVideoGrid();
});
