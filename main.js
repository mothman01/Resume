const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const prefersReducedMotion = reducedMotionQuery.matches;

function saveTheme(theme) {
    try {
        localStorage.setItem("resume_theme", theme);
    } catch (error) {
        // Storage blocked (private mode); the toggle still works for this page.
    }
}

function hasSavedTheme() {
    try {
        return Boolean(localStorage.getItem("resume_theme"));
    } catch (error) {
        return false;
    }
}

// The initial theme is applied by an inline script in <head> before first paint.
function initThemeToggle() {
    const button = document.getElementById("theme-toggle");
    if (!button) {
        return;
    }

    function syncLabel() {
        const isLight = document.documentElement.getAttribute("data-theme") === "light";
        button.textContent = isLight ? "Dark" : "Light";
        button.setAttribute("aria-pressed", String(isLight));
    }
    syncLabel();

    // Track the OS light/dark setting live until the visitor picks a theme.
    const systemLightQuery = window.matchMedia("(prefers-color-scheme: light)");
    systemLightQuery.addEventListener("change", (event) => {
        if (hasSavedTheme()) {
            return;
        }
        if (event.matches) {
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
        syncLabel();
    });

    button.addEventListener("click", () => {
        const isLight = document.documentElement.getAttribute("data-theme") === "light";
        if (isLight) {
            document.documentElement.removeAttribute("data-theme");
            saveTheme("dark");
        } else {
            document.documentElement.setAttribute("data-theme", "light");
            saveTheme("light");
        }
        syncLabel();
    });
}

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

    // Screen readers get the full text at once instead of the typing animation.
    targetElement.setAttribute("aria-label", typewriterText);
    targetElement.innerHTML = '<span id="tw-text" aria-hidden="true"></span><span class="cursor" aria-hidden="true"></span>';
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

// Project demo clips play only while on screen, and never auto-play for reduced motion.
function initProjectMedia() {
    const videos = document.querySelectorAll("video.project-media");
    if (!videos.length) {
        return;
    }

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
        videos.forEach((video) => {
            video.controls = true;
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.play().catch(() => {
                    entry.target.controls = true;
                });
            } else {
                entry.target.pause();
            }
        });
    }, { threshold: 0.25 });

    videos.forEach((video) => observer.observe(video));
}

// Quick view: a condensed, recruiter-friendly layout. Shareable as ?view=quick.
function initQuickView() {
    const button = document.getElementById("quick-view-toggle");
    if (!button) {
        return;
    }

    function apply(enabled) {
        document.body.classList.toggle("quick-view", enabled);
        button.textContent = enabled ? "Full view" : "Quick view";
        button.setAttribute("aria-pressed", String(enabled));
        // Reveal everything at once so the condensed page reads in one glance.
        if (enabled) {
            document.querySelectorAll(".hidden").forEach((element) => element.classList.add("show"));
        }
    }

    const params = new URLSearchParams(window.location.search);
    apply(params.get("view") === "quick");

    button.addEventListener("click", () => {
        const enabled = !document.body.classList.contains("quick-view");
        apply(enabled);
        const url = new URL(window.location.href);
        if (enabled) {
            url.searchParams.set("view", "quick");
        } else {
            url.searchParams.delete("view");
        }
        window.history.replaceState(null, "", url);
        window.scrollTo({ top: 0 });
    });
}

// Highlight the navbar link for the section currently on screen.
function initActiveNav() {
    const links = [...document.querySelectorAll('.navbar a[href^="#"]')];
    const sections = links
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);
    if (!sections.length || typeof IntersectionObserver === "undefined") {
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }
            links.forEach((link) => {
                link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
            });
        });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach((section) => observer.observe(section));
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

    // Don't count local development previews as visits.
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
        || window.location.protocol === "file:") {
        return;
    }

    const isBot = navigator.webdriver
        || /bot|googlebot|crawler|spider|crawling/i.test(navigator.userAgent);
    if (isBot) {
        return;
    }

    // Count each browser at most once a day, so reloads and tab hopping don't use up
    // Make.com operations. (The webhook URL is public; this can't stop deliberate spam.)
    const today = new Date().toISOString().slice(0, 10);
    try {
        if (localStorage.getItem("resume_last_visit") === today) {
            return;
        }
        localStorage.setItem("resume_last_visit", today);
    } catch (error) {
        // Storage blocked; fall through and count the visit.
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

document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initTypewriter();
    initRevealAnimations();
    initQuickView();
    initProjectMedia();
    initPrintButton();
    initActiveNav();
    initHomepageTracker();
});
