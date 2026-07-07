const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const prefersReducedMotion = reducedMotionQuery.matches;
function initTypewriter() {
    const targetElement = document.getElementById("typewriter-text");
    if (!targetElement) {
        return;
    }

    const typewriterText = targetElement.dataset.typewriterText
        || "Computational Physics Student & Developer";

    if (prefersReducedMotion) {
        targetElement.textContent = typewriterText;
        return;
    }

    targetElement.innerHTML = '<span id="tw-text"></span><span class="cursor"></span>';
    const textSpan = document.getElementById("tw-text");
    let index = 0;

    function typeWriter() {
        if (index < typewriterText.length) {
            textSpan.textContent += typewriterText.charAt(index);
            index += 1;
            window.setTimeout(typeWriter, 45);
        }
    }

    window.setTimeout(typeWriter, 250);
}

function initRevealAnimations() {
    const hiddenElements = document.querySelectorAll(".hidden");
    if (!hiddenElements.length) {
        return;
    }

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
        hiddenElements.forEach((element) => element.classList.add("show"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    hiddenElements.forEach((element) => observer.observe(element));
}

function initPrintButton() {
    const printButton = document.getElementById("print-resume-btn");
    if (!printButton) {
        return;
    }

    printButton.addEventListener("click", () => {
        window.print();
    });
}

function initHomepageTracker() {
    if (document.body.classList.contains("demo-page")) {
        return;
    }

    const isBot = navigator.webdriver
        || /bot|googlebot|crawler|spider|crawling/i.test(navigator.userAgent);
    if (isBot) {
        return;
    }

    const webhookUrl = "https://hook.us2.make.com/mdqtn4ujjndc5a3uc34pnm3jfkko765x";
    const visitTime = new Date().toLocaleString();

    fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            page: "Resume",
            time: visitTime
        })
    }).catch((error) => {
        console.debug("Tracker blocked silently.", error);
    });
}

let currentMode = "simple";
let debounceTimer = null;
let isComputing = false;
let lastSolution = null;
let animPlaying = true;
let animSpeed = 1;
let animRAF = null;
let lastTimestamp = null;
let animTime = 0;

let canvas;
let actx;
let canvasWidth;
let canvasHeight;

function hasPhysicsWidget() {
    return Boolean(document.getElementById("physics-canvas"));
}

function setStatus(message, color) {
    const statusElement = document.getElementById("status");
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = color;
    }
}

function updateLabels() {
    const forceInput = document.getElementById("F0");
    const driveInput = document.getElementById("wd");
    const positionInput = document.getElementById("x0");
    const massInput = document.getElementById("mass");

    if (!forceInput || !driveInput || !positionInput || !massInput) {
        return;
    }

    document.getElementById("F0-val").textContent = parseFloat(forceInput.value).toFixed(1);
    document.getElementById("wd-val").textContent = parseFloat(driveInput.value).toFixed(1);
    document.getElementById("x0-val").textContent = parseFloat(positionInput.value).toFixed(1);
    document.getElementById("m-val").textContent = parseFloat(massInput.value).toFixed(1);
}

function scheduleCompute() {
    if (!hasPhysicsWidget()) {
        return;
    }

    updateLabels();
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(runWasmSimulation, 150);
}

async function runWasmSimulation() {
    if (isComputing || !hasPhysicsWidget()) {
        return;
    }

    const calculate = globalThis.calculateWasmOscillation;
    if (typeof calculate !== "function") {
        setStatus("Simulation engine unavailable.", "#ef4444");
        return;
    }

    isComputing = true;

    const params = {
        mode: currentMode,
        F0: document.getElementById("F0").value,
        omega_drive: document.getElementById("wd").value,
        x0: document.getElementById("x0").value,
        m: document.getElementById("mass").value
    };

    setStatus("Computing ODE via Python WASM...", "#00ffcc");

    try {
        const data = await calculate(params);
        lastSolution = { t: data.t, x: data.x, v: data.v };
        setStatus("System Ready", "#1D9E75");
    } catch (error) {
        setStatus(`WASM Error: ${error.message}`, "#ef4444");
        console.error(error);
    } finally {
        isComputing = false;
    }
}

function drawSpring(x1, y1, x2, y2, coils, color) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / length;
    const uy = dy / length;
    const px = -uy;
    const py = ux;
    const amplitude = 10;
    const steps = coils * 2;

    actx.beginPath();
    actx.moveTo(x1, y1);
    for (let index = 0; index <= steps; index += 1) {
        const t = index / steps;
        const mid = x1 + ux * length * t;
        const side = (index % 2 === 0 ? 1 : -1) * amplitude * Math.sin(Math.PI * t * steps);
        actx.lineTo(mid + px * side, y1 + uy * length * t + py * side);
    }
    actx.lineTo(x2, y2);
    actx.strokeStyle = color;
    actx.lineWidth = 2;
    actx.stroke();
}

function drawDamper(x1, y1, x2, y2, color) {
    const midY = (y1 + y2) / 2;
    const halfWidth = 14;
    const rodWidth = 5;

    actx.beginPath();
    actx.rect(x1 - halfWidth, midY - 18, halfWidth * 2, 36);
    actx.strokeStyle = color;
    actx.lineWidth = 1.5;
    actx.stroke();
    actx.fillStyle = "rgba(100,100,100,0.2)";
    actx.fill();

    actx.beginPath();
    actx.moveTo(x1, y1);
    actx.lineTo(x1, midY - 18);
    actx.strokeStyle = color;
    actx.lineWidth = rodWidth;
    actx.stroke();

    actx.beginPath();
    actx.moveTo(x1, midY + 18);
    actx.lineTo(x1, y2);
    actx.strokeStyle = color;
    actx.lineWidth = rodWidth;
    actx.stroke();
}

function drawFrame(position, velocity, force, mode, mass) {
    actx.clearRect(0, 0, canvasWidth, canvasHeight);

    const equilibrium = canvasHeight * 0.45;
    const scale = 25;
    const massHeight = 40;
    const massWidth = 65;
    const centerX = canvasWidth / 2;

    const clampedPosition = Math.max(-4.5, Math.min(4.5, position));
    const massTop = equilibrium + clampedPosition * scale;
    const massMid = massTop + massHeight / 2;

    actx.fillStyle = "#334155";
    actx.fillRect(0, 0, canvasWidth, 15);

    drawSpring(centerX - 34, 15, centerX - 35, massTop, 8, "#94a3b8");
    drawDamper(centerX + 34, 15, centerX + 35, massTop, "#00ffcc");

    actx.fillStyle = "#1e293b";
    actx.fillRect(centerX - massWidth / 2, massTop, massWidth, massHeight);
    actx.strokeStyle = "#00ffcc";
    actx.lineWidth = 2;
    actx.strokeRect(centerX - massWidth / 2, massTop, massWidth, massHeight);

    actx.font = "11px monospace";
    actx.fillStyle = "#e2e8f0";
    actx.textAlign = "center";
    actx.fillText(`m = ${mass.toFixed(1)}kg`, centerX, massMid + 4);

    actx.setLineDash([4, 4]);
    actx.beginPath();
    actx.moveTo(10, equilibrium + massHeight / 2);
    actx.lineTo(canvasWidth - 10, equilibrium + massHeight / 2);
    actx.strokeStyle = "rgba(255,255,255,0.1)";
    actx.stroke();
    actx.setLineDash([]);

    if (mode === "forced" || mode === "rectangular") {
        actx.fillStyle = "#94a3b8";
        actx.font = "10px monospace";
        actx.fillText(`F/m = ${force.toFixed(2)}`, centerX, canvasHeight - 12);
    }

    void velocity;
}

function animLoop(timestamp) {
    if (!lastSolution) {
        animRAF = window.requestAnimationFrame(animLoop);
        return;
    }

    if (!lastTimestamp) {
        lastTimestamp = timestamp;
    }

    const dt = (timestamp - lastTimestamp) * animSpeed;
    lastTimestamp = timestamp;

    if (animPlaying) {
        animTime += dt;
    }

    const { t, x, v } = lastSolution;
    const tMax = t[t.length - 1] * 1000;

    if (animTime > tMax) {
        animTime %= tMax;
    }

    const currentTimeSeconds = animTime / 1000;
    let index = 0;
    for (let step = 0; step < t.length - 1; step += 1) {
        if (t[step] <= currentTimeSeconds && t[step + 1] > currentTimeSeconds) {
            index = step;
            break;
        }
    }

    const fraction = t[index + 1]
        ? (currentTimeSeconds - t[index]) / (t[index + 1] - t[index])
        : 0;
    const position = x[index] + fraction * (x[index + 1] - x[index]);
    const velocity = v[index] + fraction * (v[index + 1] - v[index]);

    const mass = parseFloat(document.getElementById("mass").value);
    const forceAmplitude = parseFloat(document.getElementById("F0").value);
    const driveFrequency = parseFloat(document.getElementById("wd").value);

    let force = 0;
    if (currentMode === "forced") {
        force = (forceAmplitude / mass) * Math.cos(driveFrequency * currentTimeSeconds);
    }
    if (currentMode === "rectangular") {
        force = (forceAmplitude / mass)
            * (Math.sin(driveFrequency * currentTimeSeconds) >= 0 ? 1 : -1);
    }

    drawFrame(position, velocity, force, currentMode, mass);

    document.getElementById("info-x").textContent = position.toFixed(4);
    document.getElementById("info-v").textContent = velocity.toFixed(4);
    document.getElementById("info-t").textContent = `${currentTimeSeconds.toFixed(3)} s`;

    animRAF = window.requestAnimationFrame(animLoop);
}

function setupPhysicsEventListeners() {
    document.querySelectorAll('input[type="range"]').forEach((element) => {
        element.addEventListener("input", scheduleCompute);
    });

    document.querySelectorAll(".mode-btn").forEach((button) => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".mode-btn").forEach((candidate) => {
                candidate.classList.remove("active");
            });
            button.classList.add("active");
            currentMode = button.dataset.mode;
            scheduleCompute();
        });
    });

    document.getElementById("btn-play").addEventListener("click", function onPlayToggle() {
        animPlaying = !animPlaying;
        this.textContent = animPlaying ? "⏸ pause" : "▶ play";
    });

    document.getElementById("btn-reset").addEventListener("click", () => {
        animTime = 0;
        lastTimestamp = null;
    });
}

async function initPhysicsExperience() {
    if (!hasPhysicsWidget()) {
        return;
    }

    canvas = document.getElementById("physics-canvas");
    actx = canvas.getContext("2d");
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    setupPhysicsEventListeners();
    updateLabels();

    const initEngine = globalThis.initPythonEngine;
    if (typeof initEngine !== "function") {
        setStatus("Python engine unavailable.", "#ef4444");
        return;
    }

    setStatus("Spinning up Python WebAssembly environment...", "#f59e0b");
    try {
        await initEngine();
        setStatus("WASM Engine Ready", "#00ffcc");
        scheduleCompute();
        animRAF = window.requestAnimationFrame(animLoop);
    } catch (error) {
        setStatus("Initialization failed.", "#ef4444");
        console.error(error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initTypewriter();
    initRevealAnimations();
    initPrintButton();
    void initPhysicsExperience();
    initHomepageTracker();
});
