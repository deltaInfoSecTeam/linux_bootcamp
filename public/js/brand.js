// deltaInfoSec brand effects: matrix rain backdrop, text decode, boot log.
// External file (CSP: script-src 'self'). All effects are skipped with
// prefers-reduced-motion and pause while the tab is hidden.
(function () {
    'use strict';

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Latin-only glyphs: guaranteed to exist in the bundled mono font (no tofu boxes)
    var GLYPHS = '0123456789ABCDEF0123456789abcdef$#/~|<>{}[]_=+*:;.';

    function pick() { return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length)); }
    function cssVar(name, fallback) {
        var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
    }

    /* ---------- Matrix rain ---------- */
    function startRain(canvas) {
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        var size = 15, cols = [], w = 0, h = 0, dpr = 1, last = 0, raf = 0;
        var FRAME_MS = 70; // ~14 fps keeps it calm and cheap

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = canvas.clientWidth; h = canvas.clientHeight;
            canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var n = Math.ceil(w / size);
            cols = [];
            for (var i = 0; i < n; i++) {
                // only ~45% of columns are active, so the rain stays sparse
                cols.push(Math.random() < 0.45 ? { y: Math.random() * -h, v: 0.4 + Math.random() * 0.7 } : null);
            }
            ctx.clearRect(0, 0, w, h);
        }

        function frame(t) {
            raf = requestAnimationFrame(frame);
            if (t - last < FRAME_MS) return;
            last = t;
            var color = cssVar('--dis-rain', '#3fd68a');
            var fade = cssVar('--dis-rain-fade', 'rgba(10,12,16,0.12)');
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = fade;
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
            ctx.font = '500 ' + (size - 2) + 'px "JetBrains Mono", ui-monospace, monospace';
            ctx.textBaseline = 'top';
            for (var i = 0; i < cols.length; i++) {
                var c = cols[i];
                if (!c) continue;
                var x = i * size;
                // trailing glyph
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.55;
                ctx.fillText(pick(), x, c.y - size);
                // bright head
                ctx.globalAlpha = 1;
                ctx.fillStyle = cssVar('--dis-rain-head', '#c9ffe2');
                ctx.fillText(pick(), x, c.y);
                c.y += size * c.v;
                if (c.y > h + size * 4) {
                    c.y = Math.random() * -h * 0.5;
                    c.v = 0.4 + Math.random() * 0.7;
                }
            }
            ctx.globalAlpha = 1;
        }

        resize();
        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
            else if (!raf) { raf = requestAnimationFrame(frame); }
        });
        raf = requestAnimationFrame(frame);
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

    document.addEventListener('DOMContentLoaded', function () {
        if (reduce) return;
        var canvas = document.querySelector('.dis-rain');
        if (canvas) startRain(canvas);
        document.querySelectorAll('[data-decode]').forEach(function (el, i) { decode(el, 120 + i * 150); });
        document.querySelectorAll('[data-bootlog]').forEach(bootlog);
    });
})();
