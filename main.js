// ── TYPEWRITER & SCROLL ANIMATIONS ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // 1. Terminal Typing Effect for Subtitle
    const text = "Computational Physics Student & Developer";
    const speed = 50; 
    let i = 0;
    const targetElement = document.getElementById("typewriter-text");
    targetElement.innerHTML = '<span id="tw-text"></span><span class="cursor"></span>';
    const textSpan = document.getElementById("tw-text");

    function typeWriter() {
        if (i < text.length) {
            textSpan.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        }
    }
    setTimeout(typeWriter, 500); // Wait half a second before starting

    // 2. Intersection Observer for Scroll Reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));
});

// ── STATE MANAGEMENT (PHYSICS) ───────────────────────────────────────────────
let currentMode   = 'simple';
let debounceTimer = null;
let isComputing   = false;
let lastSolution  = null;
let animPlaying   = true;
let animSpeed     = 1;
let animRAF       = null;
let lastTimestamp = null;
let animTime      = 0; 

let canvas, actx, CW, CH;

// ── STATUS HELPER ────────────────────────────────────────────────────────────
function setStatus(msg, color) {
    const el = document.getElementById('status');
    if (el) {
        el.textContent = msg;
        el.style.color = color;
    }
}

function updateLabels() {
    document.getElementById('F0-val').textContent = parseFloat(document.getElementById('F0').value).toFixed(1);
    document.getElementById('wd-val').textContent = parseFloat(document.getElementById('wd').value).toFixed(1);
    document.getElementById('x0-val').textContent = parseFloat(document.getElementById('x0').value).toFixed(1);
    document.getElementById('m-val').textContent = parseFloat(document.getElementById('mass').value).toFixed(1);
}

function scheduleCompute() {
    updateLabels();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runWasmSimulation, 150); 
}

async function runWasmSimulation() {
    if (isComputing) return;
    isComputing = true;

    const params = {
        mode:        currentMode,
        F0:          document.getElementById('F0').value,
        omega_drive: document.getElementById('wd').value,
        x0:          document.getElementById('x0').value,
        m:           document.getElementById('mass').value,
    };

    setStatus('Computing ODE via Python WASM...', '#00ffcc');

    try {
        const data = await calculateWasmOscillation(params);
        lastSolution = { t: data.t, x: data.x, v: data.v };
        setStatus('System Ready', '#1D9E75');
    } catch (e) {
        setStatus(`WASM Error: ${e.message}`, '#ef4444');
        console.error(e);
    } finally {
        isComputing = false;
    }
}

// ── RENDERING & DRAWING ENGINE ──────────────────────────────────────────────
function drawSpring(x1, y1, x2, y2, coils, color) {
    const dx = x2 - x1; const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len; const uy = dy / len;
    const px = -uy; const py = ux;
    const amp = 10; const steps = coils * 2;

    actx.beginPath(); actx.moveTo(x1, y1);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const mid = x1 + ux * len * t;
        const side = (i % 2 === 0 ? 1 : -1) * amp * Math.sin(Math.PI * t * steps);
        actx.lineTo(mid + px * side, y1 + uy * len * t + py * side);
    }
    actx.lineTo(x2, y2);
    actx.strokeStyle = color; actx.lineWidth = 2; actx.stroke();
}

function drawDamper(x1, y1, x2, y2, color) {
    const midY = (y1 + y2) / 2;
    const halfW = 14; const rodW = 5;

    actx.beginPath(); actx.rect(x1 - halfW, midY - 18, halfW * 2, 36);
    actx.strokeStyle = color; actx.lineWidth = 1.5; actx.stroke();
    actx.fillStyle = 'rgba(100,100,100,0.2)'; actx.fill();

    actx.beginPath(); actx.moveTo(x1, y1); actx.lineTo(x1, midY - 18);
    actx.strokeStyle = color; actx.lineWidth = rodW; actx.stroke();

    actx.beginPath(); actx.moveTo(x1, midY + 18); actx.lineTo(x1, y2);
    actx.strokeStyle = color; actx.lineWidth = rodW; actx.stroke();
}

function drawFrame(xi, vi, Fi, mode, m) {
    actx.clearRect(0, 0, CW, CH);

    const EQ = CH * 0.45; 
    const scale = 25;    
    const massH = 40; const massW = 65;
    const centerX = CW / 2;

    const xClamped = Math.max(-4.5, Math.min(4.5, xi));
    const massTop = EQ + xClamped * scale;
    const massMid = massTop + massH / 2;

    // Roof
    actx.fillStyle = '#334155';
    actx.fillRect(0, 0, CW, 15);

    // Spring & Damper (Updated colors for dark mode)
    drawSpring(centerX - 34, 15, centerX - 35, massTop, 8, '#94a3b8');
    drawDamper(centerX + 34, 15, centerX + 35, massTop, '#00ffcc');

    // Mass
    actx.fillStyle = '#1e293b'; 
    actx.fillRect(centerX - massW / 2, massTop, massW, massH);
    actx.strokeStyle = '#00ffcc';
    actx.lineWidth = 2;
    actx.strokeRect(centerX - massW / 2, massTop, massW, massH);

    actx.font = '11px monospace';
    actx.fillStyle = '#e2e8f0';
    actx.textAlign = 'center';
    actx.fillText(`m = ${m.toFixed(1)}kg`, centerX, massMid + 4);

    actx.setLineDash([4, 4]);
    actx.beginPath(); actx.moveTo(10, EQ + massH / 2); actx.lineTo(CW - 10, EQ + massH / 2);
    actx.strokeStyle = 'rgba(255,255,255,0.1)'; actx.stroke();
    actx.setLineDash([]);
}

function animLoop(timestamp) {
    if (!lastSolution) {
        animRAF = requestAnimationFrame(animLoop);
        return;
    }

    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) * animSpeed;
    lastTimestamp = timestamp;

    if (animPlaying) animTime += dt;

    const { t, x, v } = lastSolution;
    const tMax = t[t.length - 1] * 1000; 

    if (animTime > tMax) animTime = animTime % tMax;

    const tSec = animTime / 1000;
    let idx = 0;
    for (let i = 0; i < t.length - 1; i++) {
        if (t[i] <= tSec && t[i + 1] > tSec) { idx = i; break; }
    }

    const frac = t[idx + 1] ? (tSec - t[idx]) / (t[idx + 1] - t[idx]) : 0;
    const xi = x[idx] + frac * (x[idx + 1] - x[idx]);
    const vi = v[idx] + frac * (v[idx + 1] - v[idx]);

    const m = parseFloat(document.getElementById('mass').value);
    const F0val = parseFloat(document.getElementById('F0').value);
    const wdval = parseFloat(document.getElementById('wd').value);

    let Fi = 0;
    if (currentMode === 'forced') Fi = (F0val / m) * Math.cos(wdval * tSec);
    if (currentMode === 'rectangular') Fi = (F0val / m) * (Math.sin(wdval * tSec) >= 0 ? 1 : -1);

    drawFrame(xi, vi, Fi, currentMode, m);

    document.getElementById('info-x').textContent = xi.toFixed(4);
    document.getElementById('info-v').textContent = vi.toFixed(4);
    document.getElementById('info-t').textContent = tSec.toFixed(3) + ' s';

    animRAF = requestAnimationFrame(animLoop);
}

function setupEventListeners() {
    document.querySelectorAll('input[type=range]').forEach(el => {
        el.addEventListener('input', scheduleCompute);
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            scheduleCompute();
        });
    });

    document.getElementById('btn-play').addEventListener('click', function() {
        animPlaying = !animPlaying;
        this.textContent = animPlaying ? '⏸ pause' : '▶ play';
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        animTime = 0;
        lastTimestamp = null;
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    canvas = document.getElementById('physics-canvas');
    actx = canvas.getContext('2d');
    CW = canvas.width;
    CH = canvas.height;

    setupEventListeners();
    updateLabels();

    setStatus('Spinning up Python WebAssembly environment...', '#f59e0b');
    try {
        await initPythonEngine(); 
        setStatus('WASM Engine Ready', '#00ffcc');
        scheduleCompute();
        requestAnimationFrame(animLoop);
    } catch (err) {
        setStatus('Initialization vector broke.', '#ef4444');
        console.error(err);
    }
});

// ── TRACKING SCRIPT ──────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    // 1. Check for basic bots
    const isBot = navigator.webdriver || /bot|googlebot|crawler|spider|crawling|discordbot/i.test(navigator.userAgent);
    
    if (!isBot) {
        // 2. Wait 3 seconds to filter out rapid link-preview bots
        setTimeout(() => {
            // 3. Fetch location data silently
            fetch('https://ipapi.co/json/')
                .then(response => response.json())
                .then(geoData => {
                    
                    const webhookUrl = 'https://hook.us2.make.com/mdqtn4ujjndc5a3uc34pnm3jfkko765x';
                    const visitTime = new Date().toLocaleString();

                    // 4. Build payload with State/City but NO IP address
                    const payload = { 
                        page: "Resume",
                        time: visitTime,
                        city: geoData.city || "Unknown",
                        state: geoData.region || "Unknown",
                        country: geoData.country_name || "Unknown",
                        isp: geoData.org || "Unknown"
                    };

                    // 5. Send to Make.com
                    fetch(webhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    }).catch(e => console.log("Tracker blocked silently.")); 
                })
                .catch(error => console.error("Error fetching geo data:", error));
        }, 3000); // 3000ms delay
    }
});
