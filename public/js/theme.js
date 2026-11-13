// Theme handling for the deltaInfoSec brand layer.
// Load in <head> (no defer) so the theme is applied before first paint.
(function () {
    var KEY = 'dis-theme';
    var root = document.documentElement;

    function read() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function write(v) {
        try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ }
    }
    function current() {
        var t = root.getAttribute('data-theme');
        if (t) return t;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    var saved = read();
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
            var sync = function () {
                var isLight = current() === 'light';
                btn.setAttribute('aria-pressed', String(isLight));
                btn.setAttribute('title', isLight ? 'Dunkles Design' : 'Helles Design');
            };
            sync();
            btn.addEventListener('click', function () {
                var next = current() === 'light' ? 'dark' : 'light';
                root.setAttribute('data-theme', next);
                write(next);
                sync();
            });
        });
    });
})();
