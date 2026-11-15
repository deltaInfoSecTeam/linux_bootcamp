// deltaInfoSec brand effects: network globe backdrop, text decode, boot log.
// External file (CSP: script-src 'self'). With prefers-reduced-motion or the
// motion switch turned off (<html data-motion="off">, see theme.js) the globe is
// drawn once as a still image and all other effects are skipped. Everything
// pauses while the tab is hidden.
(function () {
    'use strict';

    var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduce = !!(mq && mq.matches);
    // still = system "reduce motion" or the user's motion switch
    function still() { return reduce || document.documentElement.getAttribute('data-motion') === 'off'; }
    // Latin-only glyphs: guaranteed to exist in the bundled mono font (no tofu boxes)
    var GLYPHS = '0123456789ABCDEF0123456789abcdef$#/~|<>{}[]_=+*:;.';

    function pick() { return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length)); }
    function cssVar(name, fallback) {
        var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
    }

    /* ---------- Network globe ----------
       A dotted sphere with abstract land masses (procedural, no real geography)
       turns slowly; light arcs travel between random nodes and leave a short
       pulse where they land. Cyber-map look, deliberately calm. */
    function startGlobe(canvas) {
        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var FRAME_MS = 33;           // ~30 fps
        var TURN = 0.000052;         // radians per ms: one turn in about two minutes
        var TILT = -0.38;            // axis tilt towards the viewer
        var MAX_ARCS = 7;
        var w = 0, h = 0, dpr = 1, cx = 0, cy = 0, R = 0;
        var land = [], sea = [], nodes = [], arcs = [];
        var rot = 2.2, last = 0, prev = 0, raf = 0, nextArc = 0;
        var colors = {};

        // Smooth pseudo-noise on the unit sphere: sum of a few sine waves.
        function noise(x, y, z) {
            return 1.6 * Math.sin(3.1 * x + 0.7) * Math.sin(2.9 * y + 1.9) * Math.sin(3.3 * z + 0.4) +
                   0.55 * Math.sin(5.3 * x - 4.1 * z + 2.1) +
                   0.45 * Math.cos(4.7 * y + 3.9 * x + 0.3) +
                   0.30 * Math.sin(9.1 * z + 7.7 * y - 1.3) +
                   0.20 * Math.cos(11.3 * x - 8.9 * y + 2.7);
        }

        function buildSphere() {
            var n = 7000, golden = Math.PI * (3 - Math.sqrt(5));
            land = []; sea = []; nodes = [];
            for (var i = 0; i < n; i++) {
                var y = 1 - (i / (n - 1)) * 2;
                var r = Math.sqrt(1 - y * y);
                var t = golden * i;
                var p = [Math.cos(t) * r, y, Math.sin(t) * r];
                if (noise(p[0], p[1], p[2]) > 0.25) {
                    land.push(p);
                    if (Math.random() < 0.03) nodes.push(p);
                } else if (i % 4 === 0) {
                    sea.push(p);
                }
            }
        }

        function readColors() {
            colors.dot = cssVar('--dis-globe-dot', '#7f8b99');
            colors.sea = cssVar('--dis-globe-sea', '#3a4350');
            colors.rim = cssVar('--dis-globe-rim', 'rgba(63,214,138,0.10)');
            colors.arc = [cssVar('--dis-gold', '#e2a83a'), cssVar('--dis-matrix', '#3fd68a'), cssVar('--dis-info', '#5eb5f7')];
        }

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = canvas.clientWidth; h = canvas.clientHeight;
            canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // Large sphere on the right edge, partly outside the window
            if (w < 700) { R = w * 0.62; cx = w * 0.62; cy = h * 0.98; }
            else { R = Math.min(h * 0.52, w * 0.34); cx = w - R * 0.62; cy = h * 0.56; }
            if (still()) draw(last);
        }

        // rotate around Y, then tilt around X; returns [screenX, screenY, depth]
        function project(p) {
            var c = Math.cos(rot), s = Math.sin(rot);
            var x = p[0] * c + p[2] * s;
            var z = -p[0] * s + p[2] * c;
            var ct = Math.cos(TILT), st = Math.sin(TILT);
            var y = p[1] * ct - z * st;
            z = p[1] * st + z * ct;
            return [cx + x * R, cy - y * R, z];
        }

        function slerp(a, b, t) {
            var d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
            var om = Math.acos(d), so = Math.sin(om);
            if (so < 1e-6) return a.slice();
            var k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so;
            return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
        }

        function spawnArc(now) {
            if (nodes.length < 2 || arcs.length >= MAX_ARCS) return;
            var a = nodes[Math.floor(Math.random() * nodes.length)];
            var b = nodes[Math.floor(Math.random() * nodes.length)];
            var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
            if (a === b || d > 0.92 || d < -0.2) return; // not too close, not across the globe
            var roll = Math.random();
            arcs.push({
                a: a, b: b, start: now,
                dur: 1900 + Math.random() * 1600,
                lift: 0.18 + (1 - d) * 0.22,
                color: roll < 0.62 ? colors.arc[0] : roll < 0.9 ? colors.arc[1] : colors.arc[2]
            });
        }

        function arcPoint(arc, t) {
            var p = slerp(arc.a, arc.b, t);
            var lift = 1 + Math.sin(Math.PI * t) * arc.lift;
            return project([p[0] * lift, p[1] * lift, p[2] * lift]);
        }

        function drawDots(list, color, size, alphaFront) {
            ctx.fillStyle = color;
            for (var i = 0; i < list.length; i++) {
                var q = project(list[i]);
                if (q[2] < -0.05) continue;            // back side hidden
                ctx.globalAlpha = alphaFront * (0.25 + 0.75 * q[2]);
                ctx.fillRect(q[0] - size / 2, q[1] - size / 2, size, size);
            }
        }

        function draw(now) {
            ctx.globalAlpha = 1;
            ctx.clearRect(0, 0, w, h);

            // atmosphere
            var g = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.18);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(0.35, colors.rim);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2); ctx.fill();

            var dot = Math.max(1.4, R / 230);
            drawDots(sea, colors.sea, dot * 0.8, 0.7);
            drawDots(land, colors.dot, dot, 1);

            // arcs
            ctx.lineCap = 'round';
            for (var i = arcs.length - 1; i >= 0; i--) {
                var arc = arcs[i];
                var t = (now - arc.start) / arc.dur;
                if (t > 1.6) { arcs.splice(i, 1); continue; }
                var head = Math.min(1, t), tail = Math.max(0, Math.min(1, t - 0.45));
                var fade = t > 1 ? Math.max(0, 1.6 - t) / 0.6 : 1;
                var steps = 28, prevP = null;
                ctx.strokeStyle = arc.color;
                ctx.lineWidth = 1.4;
                for (var k = 0; k <= steps; k++) {
                    var p = arcPoint(arc, tail + (head - tail) * (k / steps));
                    if (prevP && p[2] > -0.15 && prevP[2] > -0.15) {
                        ctx.globalAlpha = 0.85 * (k / steps) * fade;
                        ctx.beginPath(); ctx.moveTo(prevP[0], prevP[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
                    }
                    prevP = p;
                }
                if (t <= 1) {
                    // bright head while travelling
                    var hp = arcPoint(arc, head);
                    if (hp[2] > -0.15) {
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = arc.color;
                        ctx.beginPath(); ctx.arc(hp[0], hp[1], 2.2, 0, Math.PI * 2); ctx.fill();
                    }
                } else {
                    // impact pulse at the target
                    var tp = project(arc.b);
                    if (tp[2] > 0) {
                        var k2 = (t - 1) / 0.6;
                        ctx.globalAlpha = 0.7 * (1 - k2);
                        ctx.lineWidth = 1.2;
                        ctx.beginPath(); ctx.arc(tp[0], tp[1], 2 + k2 * 12, 0, Math.PI * 2); ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
        }

        function frame(now) {
            raf = requestAnimationFrame(frame);
            if (now - last < FRAME_MS) return;
            var dt = prev ? Math.min(now - prev, 100) : FRAME_MS;
            prev = now; last = now;
            rot += dt * TURN;
            if (now > nextArc) { spawnArc(now); nextArc = now + 450 + Math.random() * 900; }
            draw(now);
        }

        readColors();
        buildSphere();
        resize();
        window.addEventListener('resize', resize);
        // Theme switch: re-read the colours
        new MutationObserver(function () { readColors(); if (still()) draw(last); })
            .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        function stop() { cancelAnimationFrame(raf); raf = 0; arcs = []; draw(last); }
        function run() { if (!raf && !still() && !document.hidden) { prev = 0; raf = requestAnimationFrame(frame); } }
        // Motion switch (theme.js): stop on the current frame, restart where it left off
        document.addEventListener('dis:motion', function () { if (still()) stop(); else run(); });
        if (reduce) return;
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
            else run();
        });
        if (still()) draw(last); else run();
    }

    /* ---------- Text decode: <span data-decode>text</span> ---------- */
    function decode(el, delay) {
        var target = el.textContent;
        el.setAttribute('aria-label', target);
        var start = null, dur = 650 + target.length * 18;
        function step(t) {
            if (start === null) start = t;
            var p = Math.min(1, (t - start) / dur);
            var fixed = Math.floor(p * target.length);
            var out = '';
            for (var i = 0; i < target.length; i++) {
                var ch = target.charAt(i);
                out += (i < fixed || ch === ' ') ? ch : pick();
            }
            el.textContent = out;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target;
        }
        setTimeout(function () { requestAnimationFrame(step); }, delay || 0);
    }

    /* ---------- Boot log: <ol data-bootlog><li>…</li></ol> ---------- */
    function bootlog(list) {
        var items = Array.prototype.slice.call(list.children);
        items.forEach(function (li) { li.classList.add('is-pending'); });
        items.forEach(function (li, i) {
            setTimeout(function () { li.classList.remove('is-pending'); }, 350 + i * 420);
        });
    }

    /* ---------- Sidebar toggle: .dis-menu hides/shows the sidebar of .dis-layout ---------- */
    function sidebarToggle() {
        var KEY = 'dis-sidebar';
        var layout = document.querySelector('.dis-layout');
        var btn = document.querySelector('.dis-bar .dis-menu');
        if (!layout || !btn || btn.hasAttribute('data-no-auto')) return;
        try { if (localStorage.getItem(KEY) === 'hidden') layout.classList.add('dis-layout--no-sidebar'); } catch (e) {}
        var sync = function () { btn.setAttribute('aria-expanded', String(!layout.classList.contains('dis-layout--no-sidebar'))); };
        sync();
        btn.addEventListener('click', function () {
            var hidden = layout.classList.toggle('dis-layout--no-sidebar');
            try { localStorage.setItem(KEY, hidden ? 'hidden' : 'shown'); } catch (e) {}
            sync();
        });
    }

    /* ---------- Header stats: hide stats from the end until the bar fits ----------
       Works at any width and browser zoom; stats with .dis-stat--keep stay. */
    function fitStats() {
        var box = document.querySelector('.dis-bar .dis-stats');
        if (!box) return;
        var bar = box.closest('.dis-bar');
        function fit() {
            var items = Array.prototype.slice.call(box.children);
            items.forEach(function (el) { el.classList.remove('dis-stat--hidden'); });
            for (var i = items.length - 1; i >= 0 && bar.scrollWidth > bar.clientWidth + 1; i--) {
                if (!items[i].classList.contains('dis-stat--keep')) items[i].classList.add('dis-stat--hidden');
            }
        }
        fit();
        window.addEventListener('resize', fit);
        if (window.ResizeObserver) new ResizeObserver(fit).observe(box);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    }

    document.addEventListener('DOMContentLoaded', function () {
        sidebarToggle();
        fitStats();
        var canvas = document.querySelector('.dis-globe');
        if (canvas) startGlobe(canvas);
        if (still()) return;
        document.querySelectorAll('[data-decode]').forEach(function (el, i) { decode(el, 120 + i * 150); });
        document.querySelectorAll('[data-bootlog]').forEach(bootlog);
    });
})();
