/* =====================================================
   VIKALP — FUTURISTIC SYSTEM RUNTIME
===================================================== */

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_TOUCH = window.matchMedia('(hover: none), (max-width: 900px)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];


/* ═══════════════════════════════
   GSAP FALLBACK SHIM
   If the library fails to load, stand in for it so the page still renders
   and every interaction (menu, palette, nav) keeps working — just unanimated.
═══════════════════════════════ */
if (typeof window.gsap === 'undefined') {
    console.warn('[vikalp] GSAP unavailable — rendering without animation');

    const CONFIG = new Set([
        'duration', 'ease', 'delay', 'stagger', 'scrollTrigger', 'repeat', 'yoyo',
        'overwrite', 'transformPerspective', 'onStart', 'onUpdate', 'onComplete',
        'x', 'y', 'rotateX', 'rotateY', 'scale'
    ]);

    const resolve = t => {
        if (typeof t === 'string') return $$(t);
        if (t instanceof Element) return [t];
        if (t && typeof t.length === 'number') return [...t];
        return [t];
    };

    const apply = (target, vars = {}) => {
        resolve(target).forEach(el => {
            if (!(el instanceof Element)) {
                // plain object tween (e.g. the cursor pointer) — jump to end values
                Object.keys(vars).forEach(k => { if (!CONFIG.has(k)) el[k] = vars[k]; });
                if (vars.x !== undefined) el.x = vars.x;
                if (vars.y !== undefined) el.y = vars.y;
                return;
            }
            el.style.transform = 'none';
            Object.keys(vars).forEach(k => {
                if (CONFIG.has(k)) return;
                el.style[k] = vars[k];
            });
        });

        vars.onStart && vars.onStart();
        vars.onUpdate && vars.onUpdate();
        vars.onComplete && vars.onComplete();
    };

    const noop = (target, vars = {}) => {
        // gsap.from() animates *from* the given values to the element's current
        // state — with no animation the current state is already correct.
        vars.onStart && vars.onStart();
        vars.onComplete && vars.onComplete();
        return chain;
    };

    const chain = {
        to: (t, v) => (apply(t, v), chain),
        from: noop,
        fromTo: (t, f, v) => (apply(t, v), chain),
        set: (t, v) => (apply(t, v), chain)
    };

    window.gsap = {
        registerPlugin() { },
        to: (t, v) => (apply(t, v), chain),
        from: noop,
        set: (t, v) => (apply(t, v), chain),
        fromTo: (t, f, v) => (apply(t, v), chain),
        timeline: () => chain,
        utils: { toArray: resolve }
    };

    window.ScrollTrigger = {
        create(cfg) { cfg && cfg.onEnter && cfg.onEnter(); },
        refresh() { },
        batch() { }
    };
}

gsap.registerPlugin(ScrollTrigger);


/* ═══════════════════════════════
   LOADER — BOOT SEQUENCE
═══════════════════════════════ */
(function loader() {
    const bar = $('#loaderBar');
    const pct = $('#loaderPct');
    const logo = $('#loaderLogo');
    const log = $('#bootLog');
    const lines = $$('.bl', log);

    gsap.to(logo, { opacity: 1, duration: .6, ease: 'power2.out' });
    gsap.to(log, { opacity: 1, duration: .5, delay: .25 });

    let progress = 0;
    let shown = 0;

    const iv = setInterval(() => {
        progress += Math.random() * 11 + 4;
        if (progress >= 100) progress = 100;

        bar.style.width = progress + '%';
        pct.textContent = Math.floor(progress) + '%';

        // reveal boot lines as progress advances
        const should = Math.floor(progress / 100 * lines.length);
        while (shown < should && shown < lines.length) {
            gsap.to(lines[shown], { opacity: 1, duration: .25, ease: 'power2.out' });
            shown++;
        }

        if (progress >= 100) {
            clearInterval(iv);
            lines.forEach(l => gsap.to(l, { opacity: 1, duration: .2 }));
            finish();
        }
    }, 70);

    function finish() {
        gsap.to('#loader', {
            clipPath: 'inset(0 0 100% 0)',
            duration: 1, delay: .45, ease: 'power4.inOut',
            onComplete: () => {
                $('#loader').style.display = 'none';
                ScrollTrigger.refresh();
                introAnim();
            }
        });
    }
})();


/* ═══════════════════════════════
   TEXT SCRAMBLE (decode effect)
═══════════════════════════════ */
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01';
const randGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

// Remember the real text and swap in glyphs *without* animating. Used to stage
// an element before it becomes visible, so its real text is never shown first.
function freezeScramble(el) {
    if (REDUCE) return;
    const final = el.dataset.finalText || el.textContent;
    el.dataset.finalText = final;
    el.textContent = [...final].map(c => (c === ' ' ? ' ' : randGlyph())).join('');
}

function restoreScramble(el) {
    if (el.dataset.finalText) el.textContent = el.dataset.finalText;
}

function scramble(el) {
    if (REDUCE) return;

    const final = el.dataset.finalText || el.textContent;
    el.dataset.finalText = final;

    // a second call must not race the first
    if (el._scrambleRaf) cancelAnimationFrame(el._scrambleRaf);

    const queue = [...final].map((ch, i) => ({
        ch,
        end: i * 2 + 12 + Math.floor(Math.random() * 14)
    }));

    // Every slot always renders a character — never an empty string. Emitting
    // "" for not-yet-started letters collapsed the element's width and made the
    // whole line jump before settling.
    const paint = frame => {
        let out = '';
        let done = 0;

        for (const q of queue) {
            if (q.ch === ' ') { out += ' '; done++; continue; }
            if (frame >= q.end) { out += q.ch; done++; continue; }
            if (!q.g || Math.random() < .35) q.g = randGlyph();
            out += q.g;
        }

        el.textContent = out;
        return done === queue.length;
    };

    // paint the scrambled state synchronously, so there is no frame where the
    // real text is on screen before the effect begins
    if (paint(0)) { el.textContent = final; return; }

    let frame = 0;
    (function tick() {
        frame++;
        if (paint(frame)) {
            el.textContent = final;
            el._scrambleRaf = null;
            return;
        }
        el._scrambleRaf = requestAnimationFrame(tick);
    })();
}


/* ═══════════════════════════════
   INTRO ANIMATION
═══════════════════════════════ */
function introAnim() {
    // Scramble first, slide second. The words are still clipped out of view at
    // this point, so they rise already scrambled and resolve on the way up —
    // running it after the slide showed the real text before the effect.
    if (!REDUCE) $$('[data-scramble]').forEach(el => scramble(el));

    const tl = gsap.timeline();

    tl.to('.word span', {
        y: '0%', duration: 1.1, stagger: .11, ease: 'power4.out'
    })
        .to('#eyebrow', { opacity: 1, duration: .7, ease: 'power2.out' }, '-=.5')
        .to('#heroP', { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, '-=.35')
        .to('#heroCta', { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, '-=.45')
        .to('#heroRight', { opacity: 1, duration: .9, ease: 'power2.out', onStart: typeCode }, '-=.6')
        .to('#heroMeta', { opacity: 1, duration: .6, ease: 'power2.out' }, '-=.4')
        .to('#scrollHint', { opacity: 1, duration: .5 }, '-=.2');
}


/* ═══════════════════════════════
   IDE TYPEWRITER (syntax highlighted)
═══════════════════════════════ */
const CODE_LINES = [
    [['com', '// hospital opd — realtime queue']],
    [['key', 'public class '], ['fn', 'OpdService'], ['punc', ' : '], ['fn', 'IOpdService']],
    [['punc', '{']],
    [['', '    '], ['key', 'public async '], ['fn', 'Task<Token> '], ['fn', 'RegisterAsync'], ['punc', '(Patient p)']],
    [['', '    '], ['punc', '{']],
    [['', '        '], ['key', 'var '], ['', 'token = '], ['key', 'await '], ['fn', '_queue'], ['punc', '.'], ['fn', 'NextAsync'], ['punc', '(p.Dept);']],
    [['']],
    [['', '        '], ['key', 'await '], ['fn', '_db'], ['punc', '.Visits.'], ['fn', 'AddAsync'], ['punc', '('], ['key', 'new '], ['fn', 'Visit'], ['punc', ' {']],
    [['', '            '], ['', 'PatientId = p.Id,']],
    [['', '            '], ['', 'Token     = token,']],
    [['', '            '], ['', 'Status    = '], ['str', '"WAITING"']],
    [['', '        '], ['punc', '});']],
    [['']],
    [['', '        '], ['key', 'return '], ['fn', '_hub'], ['punc', '.'], ['fn', 'Broadcast'], ['punc', '(token);'], ['', '  '], ['com', '// < 40ms']],
    [['', '    '], ['punc', '}']],
    [['punc', '}']]
];

const CLS = { key: 'tk-key', fn: 'tk-fn', str: 'tk-str', num: 'tk-num', com: 'tk-com', punc: 'tk-punc', '': 'tk' };

function typeCode() {
    const codeEl = $('#ideCode');
    const gutter = $('#ideGutter');
    if (!codeEl) return;

    // flatten to a char stream, remembering token class + line breaks
    const stream = [];
    CODE_LINES.forEach((line, li) => {
        line.forEach(([cls, text]) => {
            for (const ch of (text || '')) stream.push({ ch, cls });
        });
        if (li < CODE_LINES.length - 1) stream.push({ ch: '\n', cls: '' });
    });

    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const render = n => {
        let html = '';
        let last = null;
        let buf = '';
        let lineCount = 1;

        for (let i = 0; i < n; i++) {
            const t = stream[i];
            if (t.ch === '\n') lineCount++;

            if (t.cls !== last) {
                if (buf) html += `<span class="${CLS[last] || 'tk'}">${esc(buf)}</span>`;
                buf = '';
                last = t.cls;
            }
            buf += t.ch;
        }
        if (buf) html += `<span class="${CLS[last] || 'tk'}">${esc(buf)}</span>`;

        codeEl.innerHTML = html + '<span class="caret"></span>';
        gutter.innerHTML = Array.from({ length: lineCount }, (_, i) => i + 1).join('<br>');
    };

    if (REDUCE) { render(stream.length); return; }

    let i = 0;
    (function step() {
        // type in small bursts so it feels fast but readable
        i = Math.min(i + (Math.random() < .12 ? 1 : 2), stream.length);
        render(i);

        if (i < stream.length) {
            const cur = stream[i - 1];
            const delay = cur && cur.ch === '\n' ? 90 : 16 + Math.random() * 22;
            setTimeout(step, delay);
        }
    })();
}


/* ═══════════════════════════════
   HERO CANVAS — PERSPECTIVE GRID FLOOR
═══════════════════════════════ */
(function gridFloor() {
    const cv = $('#grid-floor');
    if (!cv || REDUCE) return;

    const ctx = cv.getContext('2d');
    const hero = $('#home');
    let w = 0, h = 0, offset = 0, running = true;

    function size() {
        const r = hero.getBoundingClientRect();
        w = cv.width = r.width;
        h = cv.height = r.height;
    }

    function draw() {
        if (!running) return requestAnimationFrame(draw);

        ctx.clearRect(0, 0, w, h);

        const horizon = h * 0.58;
        const vpx = w / 2;
        const depth = h - horizon;
        if (depth <= 0) return requestAnimationFrame(draw);

        // vertical converging lines
        const cols = 26;
        for (let i = -cols; i <= cols; i++) {
            const xBottom = vpx + i * (w / 9);
            const xTop = vpx + i * (w / 190);
            const a = 0.10 * (1 - Math.abs(i) / (cols + 6));
            if (a <= 0) continue;

            ctx.strokeStyle = `rgba(0,255,231,${a})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xTop, horizon);
            ctx.lineTo(xBottom, h);
            ctx.stroke();
        }

        // horizontal lines rushing toward viewer
        const rows = 18;
        for (let i = 0; i < rows; i++) {
            const t = ((i / rows) + offset) % 1;
            const y = horizon + depth * Math.pow(t, 2.4);
            const a = 0.13 * t;

            ctx.strokeStyle = `rgba(155,93,229,${a})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // horizon glow
        const g = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 10);
        g.addColorStop(0, 'rgba(0,255,231,0)');
        g.addColorStop(1, 'rgba(0,255,231,0.09)');
        ctx.fillStyle = g;
        ctx.fillRect(0, horizon - 60, w, 62);

        offset = (offset + 0.0016) % 1;
        requestAnimationFrame(draw);
    }

    size();
    draw();
    window.addEventListener('resize', size);
    // hero height shifts once webfonts land — track the box, not just the window
    new ResizeObserver(size).observe(hero);

    // pause when hero scrolled away
    new IntersectionObserver(e => { running = e[0].isIntersecting; }, { threshold: 0 }).observe(hero);
})();


/* ═══════════════════════════════
   HERO CANVAS — CODE RAIN
═══════════════════════════════ */
(function codeRain() {
    const cv = $('#code-rain');
    if (!cv || REDUCE) return;

    const ctx = cv.getContext('2d');
    const hero = $('#home');
    const chars = '01{}[]()<>/;=*+ABCDEF';
    const fontSize = 13;

    let drops = [], w = 0, h = 0, running = true;

    function size() {
        const r = hero.getBoundingClientRect();
        w = cv.width = r.width;
        h = cv.height = r.height;
        drops = Array(Math.floor(w / fontSize)).fill(0).map(() => Math.random() * -60);
    }

    function draw() {
        if (!running) return requestAnimationFrame(draw);

        // fade trails by ERASING alpha, not by painting dark over the canvas —
        // painting would build up an opaque layer and hide the grid floor below
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.09)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';

        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const ch = chars[Math.floor(Math.random() * chars.length)];

            // head brighter than tail
            ctx.fillStyle = Math.random() > .93 ? 'rgba(180,255,246,0.95)' : 'rgba(0,255,231,0.5)';
            ctx.fillText(ch, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > h && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
        requestAnimationFrame(draw);
    }

    size();
    draw();
    window.addEventListener('resize', size);
    new ResizeObserver(size).observe(hero);
    new IntersectionObserver(e => { running = e[0].isIntersecting; }, { threshold: 0 }).observe(hero);
})();


/* ═══════════════════════════════
   AURORA PARALLAX (mouse-reactive bg)
═══════════════════════════════ */
if (!IS_TOUCH && !REDUCE) {
    window.addEventListener('mousemove', e => {
        const px = (e.clientX / window.innerWidth - .5) * 120;
        const py = (e.clientY / window.innerHeight - .5) * 120;
        document.body.style.setProperty('--px', px.toFixed(1) + 'px');
        document.body.style.setProperty('--py', py.toFixed(1) + 'px');
    }, { passive: true });
}


/* ═══════════════════════════════
   CARD SPOTLIGHT (--mx / --my)
═══════════════════════════════ */
if (!IS_TOUCH) {
    document.addEventListener('mousemove', e => {
        const card = e.target.closest('.gx');
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
}


/* ═══════════════════════════════
   IDE 3D TILT
═══════════════════════════════ */
(function ideTilt() {
    const wrap = $('#heroRight');
    const ide = $('#ide');
    if (!wrap || !ide || IS_TOUCH || REDUCE) return;

    wrap.addEventListener('mousemove', e => {
        const r = wrap.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - .5) * -8;
        const ry = ((e.clientX - r.left) / r.width - .5) * 10;
        gsap.to(ide, { rotateX: rx, rotateY: ry, duration: .5, ease: 'power2.out', transformPerspective: 900 });
    });

    wrap.addEventListener('mouseleave', () => {
        gsap.to(ide, { rotateX: 0, rotateY: 0, duration: .8, ease: 'power3.out' });
    });
})();


/* ═══════════════════════════════
   MAGNETIC BUTTONS
═══════════════════════════════ */
if (!IS_TOUCH && !REDUCE) {
    $$('.magnetic').forEach(el => {
        el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            gsap.to(el, {
                x: (e.clientX - r.left - r.width / 2) * .28,
                y: (e.clientY - r.top - r.height / 2) * .35,
                duration: .4, ease: 'power3.out'
            });
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' });
        });
    });
}


/* ═══════════════════════════════
   CURSOR — LIQUID TRAIL + RING
═══════════════════════════════ */
(function cursor() {
    const cv = $('#cursorCanvas');
    const dot = $('#cursorDot');
    if (!cv || IS_TOUCH) {
        if (cv) cv.style.display = 'none';
        if (dot) dot.style.display = 'none';
        return;
    }

    const ctx = cv.getContext('2d');
    const P = { pointsNumber: 10, widthFactor: .42, friction: .5, spring: .42 };
    const pointer = { x: innerWidth / 2, y: innerHeight / 2 };

    const trail = Array.from({ length: P.pointsNumber }, () => ({ x: pointer.x, y: pointer.y, dx: 0, dy: 0 }));

    function resize() {
        cv.width = innerWidth * devicePixelRatio;
        cv.height = innerHeight * devicePixelRatio;
        cv.style.width = innerWidth + 'px';
        cv.style.height = innerHeight + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(devicePixelRatio, devicePixelRatio);
    }
    resize();
    addEventListener('resize', resize);

    const HOT = 'a, button, .btn-main, .btn-ghost, .gx, .project-row, .cs-link, input, textarea, .burger, .cmd-hint';

    addEventListener('mousemove', e => {
        gsap.to(pointer, { x: e.clientX, y: e.clientY, duration: .15, ease: 'power3.out' });
        gsap.to(dot, { x: e.clientX, y: e.clientY, duration: .35, ease: 'power3.out' });

        const hot = !!e.target.closest(HOT);
        dot.classList.toggle('hot', hot);
        cv.style.opacity = hot ? '.25' : '1';
    });

    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; });

    (function loop() {
        ctx.clearRect(0, 0, innerWidth, innerHeight);

        trail.forEach((p, i) => {
            const prev = i === 0 ? pointer : trail[i - 1];
            const spring = i === 0 ? .4 * P.spring : P.spring;
            p.dx += (prev.x - p.x) * spring;
            p.dy += (prev.y - p.y) * spring;
            p.dx *= P.friction;
            p.dy *= P.friction;
            p.x += p.dx;
            p.y += p.dy;
        });

        const grad = ctx.createLinearGradient(trail[0].x, trail[0].y, trail.at(-1).x, trail.at(-1).y);
        grad.addColorStop(0, '#00ffe7');
        grad.addColorStop(.5, '#9b5de5');
        grad.addColorStop(1, '#f72585');

        ctx.strokeStyle = grad;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#00ffe7';

        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);

        for (let i = 1; i < trail.length - 1; i++) {
            const xc = .5 * (trail[i].x + trail[i + 1].x);
            const yc = .5 * (trail[i].y + trail[i + 1].y);
            ctx.lineWidth = P.widthFactor * (P.pointsNumber - i);
            ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
            ctx.stroke();
        }

        requestAnimationFrame(loop);
    })();
})();


/* ═══════════════════════════════
   MARQUEE BUILD
═══════════════════════════════ */
(function marquee() {
    const items = [
        'Hospital OPD System', 'Health Camp Management', 'Patient Management',
        'Billing Software', 'ERP Solutions', 'Custom Software',
        'Inventory System', 'Web Applications'
    ];
    const track = $('#mtrack');
    if (!track) return;

    [...items, ...items].forEach((t, i) => {
        const s = document.createElement('span');
        s.className = i % 4 === 2 ? 'accent' : '';
        s.textContent = i % 3 === 0 ? '✦  ' + t : t;
        track.appendChild(s);
    });
})();


/* ═══════════════════════════════
   NAV + MOBILE MENU
═══════════════════════════════ */
(function navigation() {
    const nav = $('#nav');
    const burger = $('#burger');
    const menu = $('#mobileMenu');
    const links = $$('.mobile-menu a');

    addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', scrollY > 50);
    }, { passive: true });

    function setMenu(open) {
        burger.classList.toggle('open', open);
        menu.classList.toggle('open', open);
        document.body.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', open);

        if (open) {
            gsap.to(links, { opacity: 1, y: 0, duration: .5, stagger: .06, delay: .25, ease: 'power3.out' });
        } else {
            gsap.set(links, { opacity: 0, y: 28 });
        }
    }

    burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    links.forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
})();


/* ═══════════════════════════════
   SCROLL HUD — progress + active section
═══════════════════════════════ */
(function scrollHud() {
    const progress = $('#scrollProgress');
    const dots = $$('#secDots a');
    const navLinks = $$('#navLinks a');
    const sections = dots.map(d => $(d.getAttribute('href'))).filter(Boolean);

    let ticking = false;

    function update() {
        const max = document.documentElement.scrollHeight - innerHeight;
        progress.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';

        // active section = last one whose top passed 45% of viewport
        let idx = 0;
        sections.forEach((s, i) => {
            if (s.getBoundingClientRect().top <= innerHeight * .45) idx = i;
        });

        dots.forEach((d, i) => d.classList.toggle('active', i === idx));

        const id = sections[idx] ? '#' + sections[idx].id : '';
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));

        ticking = false;
    }

    addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });

    update();
})();


/* ═══════════════════════════════
   SCROLL REVEALS
═══════════════════════════════ */
(function reveals() {
    // Once an element has finished revealing, hand it back to CSS: drop the
    // inline transform GSAP left behind (it would otherwise beat the :hover
    // rule) and enable the transform transition for the hover lift.
    const settle = els => els.forEach(el => {
        el.classList.remove('rv');
        el.classList.add('ready');
        el.style.transform = '';
        el.style.opacity = '';
    });

    if (REDUCE) {
        settle($$('.rv'));
        $$('.gx').forEach(el => el.classList.add('ready'));
        return;
    }

    // Only .gx elements that never animate may take the hover transition up
    // front — anything with a reveal tween must wait for its onComplete.
    const animated = new Set([...$$('.rv'), ...$$('.cap-card'), ...$$('.contact-form')]);
    $$('.gx').forEach(el => { if (!animated.has(el)) el.classList.add('ready'); });

    // batch .rv elements per container so staggers stay tight
    ['.bento', '.stats-grid', '.projects-container', '.developers-grid', '.clients-grid'].forEach(sel => {
        const wrap = $(sel);
        if (!wrap) return;

        const els = $$('.rv', wrap);
        if (!els.length) return;

        gsap.to(els, {
            scrollTrigger: { trigger: wrap, start: 'top 88%', once: true },
            opacity: 1, y: 0, duration: .8, stagger: .08, ease: 'power3.out',
            onComplete: () => settle(els)
        });
    });

    // reveal helper for elements whose resting state is the visible one:
    // set the start explicitly rather than using gsap.from(), which re-renders
    // its starting values on ScrollTrigger.refresh() and replays the motion.
    const revealFrom = (target, vars, trigger, start = 'top 88%', delay = 0) => {
        const els = $$(target);
        if (!els.length) return;

        gsap.set(els, vars);
        gsap.to(els, {
            x: 0, y: 0, opacity: 1, duration: .8, delay, ease: 'power3.out',
            stagger: els.length > 1 ? .08 : 0,
            scrollTrigger: { trigger: $(trigger) || els[0], start, once: true },
            onComplete: () => els.forEach(el => {
                el.style.transform = '';
                el.classList.add('ready');
            })
        });
    };

    $$('.s-title').forEach(el => {
        gsap.set(el, { y: 55, opacity: 0 });
        gsap.to(el, {
            y: 0, opacity: 1, duration: .9, ease: 'power4.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
            onComplete: () => { el.style.transform = ''; }
        });
    });

    // Section tags: stage them as glyphs behind opacity 0, then fade in and
    // resolve together. Without the freeze the real text sat on screen until
    // the trigger fired, so the scramble looked like it ran on top of it.
    $$('.s-tag').forEach(el => {
        freezeScramble(el);
        gsap.set(el, { opacity: 0 });

        ScrollTrigger.create({
            trigger: el, start: 'top 92%', once: true,
            onEnter: () => {
                gsap.to(el, { opacity: 1, duration: .45, ease: 'power2.out' });
                scramble(el);
            }
        });
    });

    revealFrom('.about-copy', { y: 40, opacity: 0 }, '#about', 'top 85%');
    revealFrom('.cap-card', { y: 40, opacity: 0 }, '.cap-grid');

    // The contact halves slide in horizontally only while they sit side by side.
    // Once #contact collapses to one column each half spans the full width, and
    // a 50px x-offset would push it past the viewport edge.
    const sideBySide = window.innerWidth > 1180;
    revealFrom('.contact-left', sideBySide ? { x: -50, opacity: 0 } : { y: 40, opacity: 0 }, '#contact');
    revealFrom('.contact-form', sideBySide ? { x: 50, opacity: 0 } : { y: 40, opacity: 0 }, '#contact', 'top 88%', .12);

    // Safety net — only for the case where ScrollTrigger never wired up at all.
    // It must NOT fire when triggers exist: elements below the fold are meant to
    // be hidden until scrolled to, and force-showing them here made the reveal
    // run a second time on scroll.
    setTimeout(() => {
        const wired = typeof ScrollTrigger !== 'undefined'
            && typeof ScrollTrigger.getAll === 'function'
            && ScrollTrigger.getAll().length > 0;
        if (wired) return;

        settle($$('.rv'));
        $$('.cap-card, .contact-left, .contact-form, .s-title, .about-copy, .s-tag').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        // frozen tags would otherwise be stuck showing glyphs forever
        $$('.s-tag').forEach(restoreScramble);
        $$('.gx').forEach(el => el.classList.add('ready'));
    }, 2600);
})();


/* ═══════════════════════════════
   STAT COUNTERS + PROGRESS RINGS
═══════════════════════════════ */
(function stats() {
    // counters
    $$('.stat-val[data-count]').forEach(el => {
        const text = el.textContent.trim();
        const value = parseFloat(text.replace(/[^0-9.]/g, ''));
        const suffix = text.replace(/[0-9.]/g, '');
        if (isNaN(value)) return;

        const obj = { val: 0 };

        gsap.to(obj, {
            val: value,
            duration: 2,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' },
            onUpdate: () => {
                const cur = text.includes('.') ? obj.val.toFixed(1) : Math.floor(obj.val);
                el.textContent = cur + suffix;
            },
            onComplete: () => { el.textContent = text; }
        });
    });

    // rings
    $$('.ring .bar').forEach(bar => {
        const pct = parseFloat(bar.dataset.pct || 0);
        const C = 226;

        gsap.fromTo(bar,
            { strokeDashoffset: C },
            {
                strokeDashoffset: C - (C * pct / 100),
                duration: 1.8,
                ease: 'power3.out',
                scrollTrigger: { trigger: bar, start: 'top 95%', toggleActions: 'play none none none' }
            }
        );
    });
})();


/* ═══════════════════════════════
   COMMAND PALETTE (Ctrl + K)
═══════════════════════════════ */
(function palette() {
    const box = $('#palette');
    const input = $('#paletteInput');
    const list = $('#paletteList');
    const hint = $('#cmdHint');
    if (!box) return;

    const COMMANDS = [
        { icon: 'fa-solid fa-house', label: 'Go to Home', hint: 'section', run: () => go('#home') },
        { icon: 'fa-solid fa-circle-info', label: 'About the system', hint: 'section', run: () => go('#about') },
        { icon: 'fa-solid fa-layer-group', label: 'Skills & Expertise', hint: 'section', run: () => go('#skills') },
        { icon: 'fa-solid fa-folder-open', label: 'Projects / Case studies', hint: 'section', run: () => go('#projects') },
        { icon: 'fa-solid fa-user', label: 'Developer profile', hint: 'section', run: () => go('#developers') },
        { icon: 'fa-solid fa-building', label: 'Clients', hint: 'section', run: () => go('#clients') },
        { icon: 'fa-solid fa-paper-plane', label: 'Contact form', hint: 'section', run: () => go('#contact') },
        { icon: 'fa-solid fa-envelope', label: 'Email — noreply.vikalp@gmail.com', hint: 'action', run: () => location.href = 'mailto:noreply.vikalp@gmail.com' },
        { icon: 'fa-solid fa-phone', label: 'Call — +91 7359 26 17 80', hint: 'action', run: () => location.href = 'tel:+917359261780' },
        { icon: 'fa-brands fa-whatsapp', label: 'WhatsApp', hint: 'action', run: () => open('https://wa.me/917359261780', '_blank') },
        { icon: 'fa-solid fa-arrow-up', label: 'Scroll to top', hint: 'action', run: () => scrollTo({ top: 0, behavior: 'smooth' }) }
    ];

    let filtered = COMMANDS;
    let sel = 0;

    function go(hash) {
        const el = $(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    function render() {
        list.innerHTML = filtered.length
            ? filtered.map((c, i) => `
                <button type="button" data-i="${i}" class="${i === sel ? 'sel' : ''}">
                    <i class="${c.icon}"></i>
                    <span>${c.label}</span>
                    <small>${c.hint}</small>
                </button>`).join('')
            : `<button type="button" disabled style="opacity:.5">no matching command</button>`;

        $$('button[data-i]', list).forEach(b => {
            b.addEventListener('click', () => {
                const cmd = filtered[+b.dataset.i];
                close();
                setTimeout(() => cmd.run(), 220);
            });
        });
    }

    function open_() {
        box.classList.add('open');
        document.body.classList.add('palette-open');
        input.value = '';
        filtered = COMMANDS;
        sel = 0;
        render();
        setTimeout(() => input.focus(), 60);
    }

    function close() {
        box.classList.remove('open');
        document.body.classList.remove('palette-open');
        input.blur();
    }

    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.hint.includes(q));
        sel = 0;
        render();
    });

    addEventListener('keydown', e => {
        const isOpen = box.classList.contains('open');

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            isOpen ? close() : open_();
            return;
        }

        if (!isOpen) return;

        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(filtered.length, 1); render(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + filtered.length) % Math.max(filtered.length, 1); render(); }
        else if (e.key === 'Enter' && filtered[sel]) {
            e.preventDefault();
            const cmd = filtered[sel];
            close();
            setTimeout(() => cmd.run(), 220);
        }
    });

    if (hint) hint.addEventListener('click', open_);
    box.addEventListener('click', e => { if (e.target === box) close(); });
})();


/* ═══════════════════════════════
   HERO SAFETY NET
   The hero starts hidden and is revealed by the loader's intro timeline.
   If that chain ever breaks, force it visible rather than show a blank screen.
═══════════════════════════════ */
setTimeout(() => {
    const loader = $('#loader');
    if (loader && loader.style.display !== 'none') {
        loader.style.display = 'none';
        introAnim();
        return;
    }

    $$('#eyebrow, #heroP, #heroCta, #heroMeta, #heroRight, #scrollHint').forEach(el => {
        if (getComputedStyle(el).opacity === '0') {
            el.style.opacity = '1';
            el.style.transform = 'none';
        }
    });

    $$('.hero-title .word span').forEach(el => {
        const t = getComputedStyle(el).transform;
        if (t && t !== 'none' && !t.includes('0, 0)')) el.style.transform = 'none';
    });

    if ($('#ideCode') && !$('#ideCode').textContent.trim()) typeCode();
}, 6000);


/* ═══════════════════════════════
   SMOOTH ANCHOR SCROLL
═══════════════════════════════ */
$$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' });
    });
});
