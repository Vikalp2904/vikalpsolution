gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════
   LOADER
═══════════════════════════════ */
(function loader() {
    const bar = document.getElementById('loaderBar');
    const pct = document.getElementById('loaderPct');
    const logo = document.getElementById('loaderLogo');

    gsap.to(logo, { opacity: 1, duration: .6, ease: 'power2.out' });

    let progress = 0;
    const iv = setInterval(() => {
        progress += Math.random() * 12 + 3;
        if (progress >= 100) { progress = 100; clearInterval(iv); finish(); }
        bar.style.width = progress + '%';
        pct.textContent = Math.floor(progress) + '%';
    }, 60);

    function finish() {
        gsap.to('#loader', {
            clipPath: 'inset(0 0 100% 0)',
            duration: 1, delay: .3, ease: 'power4.inOut',
            onComplete: () => {
                document.getElementById('loader').style.display = 'none';
                ScrollTrigger.refresh();
                introAnim();
            }
        });
    }
})();


/* ═══════════════════════════════
   GSAP INTRO ANIMATION
═══════════════════════════════ */
function introAnim() {
    const tl = gsap.timeline();

    tl.to('.word span', {
        y: '0%', duration: 1.1,
        stagger: .12, ease: 'power4.out'
    })
        .to('#eyebrow', { opacity: 1, duration: .7, ease: 'power2.out' }, '-=.4')
        .to('#heroP', { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, '-=.3')
        .to('#heroCta', { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, '-=.4')
        .to('#scrollHint', { opacity: 1, duration: .5 }, '-=.2');
}


/* ═══════════════════════════════
   GSAP SCROLL ANIMATIONS
═══════════════════════════════ */
/* Skills */
gsap.from('.skill-card', {
    scrollTrigger: { trigger: '#skills', start: 'top 90%', toggleActions: 'play none none none' },
    y: 50, opacity: 0, duration: .7, stagger: .08, ease: 'power3.out'
});

/* Projects */
gsap.from('.project-row', {
    scrollTrigger: { trigger: '#projects', start: 'top 90%', toggleActions: 'play none none none' },
    x: -60, opacity: 0, duration: .6, stagger: .12, ease: 'power3.out'
});

/* Section titles */
document.querySelectorAll('.s-title').forEach(el => {
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 95%', toggleActions: 'play none none none' },
        y: 60, opacity: 0, duration: .9, ease: 'power4.out'
    });
});

/* Contact */
gsap.from('.contact-left', {
    scrollTrigger: { trigger: '#contact', start: 'top 90%', toggleActions: 'play none none none' },
    x: -60, opacity: 0, duration: .8, ease: 'power3.out'
});
gsap.from('.contact-form', {
    scrollTrigger: { trigger: '#contact', start: 'top 90%', toggleActions: 'play none none none' },
    x: 60, opacity: 0, duration: .8, delay: .15, ease: 'power3.out'
});

/* Safety fallback — if ScrollTrigger never fires, make everything visible after 2s */
setTimeout(() => {
    document.querySelectorAll('.skill-card,.project-row,.contact-left,.contact-form').forEach(el => {
        if (getComputedStyle(el).opacity === '0') {
            el.style.opacity = '1';
            el.style.transform = 'none';
        }
    });
}, 2000);

/* Galaxy subtle parallax stays within hero */

/* ═══════════════════════════════
   LIQUID GSAP CURSOR
═══════════════════════════════ */

const cursorCanvas = document.getElementById("cursorCanvas");
const cursorCtx = cursorCanvas.getContext("2d");

const TRAIL_PARAMS = {
    pointsNumber: 10, // cursor lengh
    widthFactor: 0.42,
    friction: 0.5,
    spring: 0.42
};

const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
};

function createTrail(x, y) {
    return Array.from(
        { length: TRAIL_PARAMS.pointsNumber },
        () => ({
            x,
            y,
            dx: 0,
            dy: 0
        })
    );
}

const trail = createTrail(pointer.x, pointer.y);

function resizeCursorCanvas() {

    cursorCanvas.width = window.innerWidth * devicePixelRatio;
    cursorCanvas.height = window.innerHeight * devicePixelRatio;

    cursorCanvas.style.width = window.innerWidth + "px";
    cursorCanvas.style.height = window.innerHeight + "px";

    cursorCtx.setTransform(1, 0, 0, 1, 0, 0);
    cursorCtx.scale(devicePixelRatio, devicePixelRatio);
}

resizeCursorCanvas();

window.addEventListener("resize", resizeCursorCanvas);

window.addEventListener("mousemove", (e) => {

    gsap.to(pointer, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.15,
        ease: "power3.out"
    });

    if (
        e.target.closest(
            "a, button, .btn-main, .btn-ghost, .skill-card, .project-row, .cs-link"
        )
    ) {
        cursorCanvas.style.opacity = "0.2";
    } else {
        cursorCanvas.style.opacity = "1";
    }
});

function animateLiquidCursor() {

    cursorCtx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    trail.forEach((point, index) => {

        const prev = index === 0
            ? pointer
            : trail[index - 1];

        const spring = index === 0
            ? 0.4 * TRAIL_PARAMS.spring
            : TRAIL_PARAMS.spring;

        point.dx += (prev.x - point.x) * spring;
        point.dy += (prev.y - point.y) * spring;

        point.dx *= TRAIL_PARAMS.friction;
        point.dy *= TRAIL_PARAMS.friction;

        point.x += point.dx;
        point.y += point.dy;
    });

    cursorCtx.beginPath();

    cursorCtx.moveTo(
        trail[0].x,
        trail[0].y
    );

    for (let i = 1; i < trail.length - 1; i++) {

        const xc =
            0.5 * (trail[i].x + trail[i + 1].x);

        const yc =
            0.5 * (trail[i].y + trail[i + 1].y);

        cursorCtx.quadraticCurveTo(
            trail[i].x,
            trail[i].y,
            xc,
            yc
        );

        cursorCtx.lineWidth =
            TRAIL_PARAMS.widthFactor *
            (TRAIL_PARAMS.pointsNumber - i);

        cursorCtx.lineCap = "round";

        /* THEME COLORS */
        const gradient = cursorCtx.createLinearGradient(
            trail[0].x,
            trail[0].y,
            trail[trail.length - 1].x,
            trail[trail.length - 1].y
        );

        gradient.addColorStop(0, "#00ffe7");
        gradient.addColorStop(0.5, "#9b5de5");
        gradient.addColorStop(1, "#f72585");

        cursorCtx.strokeStyle = gradient;

        /* glow */
        cursorCtx.shadowBlur = 2;
        cursorCtx.shadowColor = "#00ffe7";

        cursorCtx.stroke();
    }

    cursorCtx.lineTo(
        trail[trail.length - 1].x,
        trail[trail.length - 1].y
    );

    cursorCtx.stroke();

    requestAnimationFrame(animateLiquidCursor);
}

animateLiquidCursor();
/* ═══════════════════════════════
   MARQUEE BUILD
═══════════════════════════════ */
const items = [
    'Hospital OPD System',
    'Health Camp Management',
    'Patient Management',
    'Billing Software',
    'ERP Solutions',
    'Custom Software',
    'Inventory System',
    'Web Applications'
];
const track = document.getElementById('mtrack');
[...items, ...items].forEach((t, i) => {
    const s = document.createElement('span');
    s.className = i % 4 === 2 ? 'accent' : '';
    s.textContent = i % 3 === 0 ? '✦  ' + t : t;
    track.appendChild(s);
});


/* ═══════════════════════════════
   NAV SCROLL
═══════════════════════════════ */
window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', scrollY > 50);
});


/* ═══════════════════════════════
CODE RAIN (MODERN GLASS STYLE)
═══════════════════════════════ */

const canvas = document.getElementById("code-rain");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// const chars = "01<>/{}[]()XMLSOAPSELECTINSERTUPDATEDELETEfunction=>asyncawaitconstletvarSAPAPIJSON";
const chars = "01010101101101010101010101110101010101010010101010100110100110100101010101010101010101";
const fontSize = 12;
const columns = Math.floor(canvas.width / fontSize);

const drops = Array(columns).fill(1);

function drawRain() {
    ctx.fillStyle = "rgba(4,5,12,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0,255,231,0.55)";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }

    requestAnimationFrame(drawRain);
}

drawRain();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

//         ═══════════════════════════════
//    FLOATING CODE CARDS (SOAP / JS / XML STYLE)
// ═══════════════════════════════

const snippets = [
    `// FUTURE ERP SYNC ENGINE
            await ERP.connect({
                                                mode: "quantum-sync",
                                                latency: "0ms"
            });`,

    `<api gateway="/sap/v2/orders">
                                                <auth type="oauth2" secure="true"/>
                                                <pipeline mode="realtime"/>
            </api>`,

    `SELECT lifecycle FROM enterprise
            WHERE status = 'FUTURISTIC'
            AND performance > 99.9;`,

    `const experience = await UI.render({
                                                style: "cinematic",
                                                motion: "gsap",
                                                theme: "galaxy-neon"
            });`,

    `function buildFuture() {
                                                return "scalable + intelligent + immersive";
            }`
];



const cloud = document.getElementById("codeCloud");

for (let i = 0; i < 7; i++) {
    const el = document.createElement("div");
    el.className = "code-card";
    el.textContent = snippets[Math.floor(Math.random() * snippets.length)];

    // RIGHT HALF ONLY
    el.style.left = Math.random() * 100 + "%";   // inside container
    el.style.top = Math.random() * 100 + "vh";

    el.style.transform = `scale(${0.7 + Math.random()})`;
    el.style.opacity = 0.6 + Math.random() * 0.4;
    el.style.filter = "blur(0.2px)";

    cloud.appendChild(el);

    gsap.to(el, {
        y: "random(-60,60)",
        x: "random(-40,40)", // small movement only (inside right half)
        duration: 6 + Math.random() * 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
}

/* ═══════════════════════════════
STATS COUNTER ANIMATION
═══════════════════════════════ */

gsap.utils.toArray('#stats .skill-card h2').forEach(counter => {

    const text = counter.innerText.trim();

    // extract numeric value
    const value = parseFloat(text.replace(/[^0-9.]/g, ''));

    // preserve suffix like + or %
    const suffix = text.replace(/[0-9.]/g, '');

    const obj = { val: 0 };

    gsap.to(obj, {
        val: value,
        duration: 2,
        ease: "power3.out",

        scrollTrigger: {
            trigger: counter,
            start: "top 90%",
            toggleActions: "play none none none"
        },

        onUpdate: () => {

            let current;

            // decimal support
            if (text.includes('.')) {
                current = obj.val.toFixed(1);
            } else {
                current = Math.floor(obj.val);
            }

            counter.innerText = current + suffix;
        }
    });

});
