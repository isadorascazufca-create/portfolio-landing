const container = document.getElementById('particle-container');
const textToDisplay = container.getAttribute('data-text');
const linkElement = document.getElementById('portfolio-link');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
container.appendChild(canvas);

let particles = [];
let mouse = { x: 0, y: 0, active: false };
let isExplodingOut = false;

// --- CONFIGURAÇÕES ---
const particleGap = 1;       
const particleSize = 1;      
const mouseRadius = 200;     
const fontName = 'Inter';    
const lineHeightMult = 1.2;

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = textToDisplay.split('|');
    let baseFontSize = Math.min(canvas.width / 12, canvas.height / 7);
    const lineHeight = baseFontSize * lineHeightMult;
    const totalHeight = (lines.length * lineHeight);
    let startY = (canvas.height / 2) - (totalHeight / 2) + (baseFontSize / 2);

    lines.forEach((line, index) => {
        ctx.font = (index === 0) ? `400 ${baseFontSize * 0.6}px ${fontName}` : `900 ${baseFontSize}px ${fontName}`;
        ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
    });

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    particles = [];

    for (let y = 0; y < canvas.height; y += particleGap) {
        for (let x = 0; x < canvas.width; x += particleGap) {
            const i = (y * imageData.width + x) * 4;
            if (imageData.data[i + 3] > 128) {
                particles.push(new Particle(x, y));
            }
        }
    }
}

class Particle {
    constructor(x, y) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = x;
        this.baseY = y;
        this.size = particleSize;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.95;
        this.returnSpeed = Math.random() * 0.05 + 0.04;
        this.opacity = 1;
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.size, this.size);
        ctx.fill();
    }

    scramble(forceMultiplier = 1) {
        const angle = Math.random() * Math.PI * 2;
        const force = (Math.random() * 20 + 10) * forceMultiplier;
        this.vx = Math.cos(angle) * force;
        this.vy = Math.sin(angle) * force;
    }

    update() {
        if (isExplodingOut) {
            this.opacity -= 0.015;
        }

        if (mouse.active && !isExplodingOut) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouseRadius) {
                let force = (mouseRadius - distance) / mouseRadius;
                let angle = Math.atan2(dy, dx);
                this.x -= Math.cos(angle) * force * 10;
                this.y -= Math.sin(angle) * force * 10;
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;

        if (!isExplodingOut) {
            let dx = this.baseX - this.x;
            let dy = this.baseY - this.y;
            this.x += dx * this.returnSpeed;
            this.y += dy * this.returnSpeed;
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.draw();
        p.update();
    });
    requestAnimationFrame(animate);
}

// LOGICA DO CLIQUE/TOQUE NO BOTÃO
linkElement.addEventListener('click', function(e) {
    e.preventDefault();
    const targetUrl = this.href;
    isExplodingOut = true;
    this.classList.add('clicked');
    particles.forEach(p => p.scramble(2.5));
    setTimeout(() => {
        window.location.href = targetUrl;
    }, 800);
});

// EVENTOS DE MOUSE
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
});

window.addEventListener('mouseout', () => {
    mouse.active = false;
});

// --- AJUSTE PARA CELULAR (TOUCH) ---
window.addEventListener('touchstart', (e) => {
    // Se o toque for fora do link, ativa as partículas
    if (e.target !== linkElement) {
        mouse.active = true;
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        // Bagunça as partículas levemente no toque inicial
        if (!isExplodingOut) particles.forEach(p => p.scramble(0.5));
    }
}, {passive: true});

window.addEventListener('touchmove', (e) => {
    if (mouse.active) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
}, {passive: true});

window.addEventListener('touchend', () => {
    mouse.active = false;
});

// Bagunça no clique geral (Desktop)
window.addEventListener('click', (e) => {
    if (e.target !== linkElement && !isExplodingOut) {
        particles.forEach(p => p.scramble());
    }
});

window.addEventListener('resize', () => init());

document.fonts.ready.then(() => {
    init();
    animate();
});