// Theme and motion handling for the deltaInfoSec brand layer.
// Load in <head> (no defer) so theme and motion are applied before first paint.
//   <button data-theme-toggle>   light / dark (dark is the default)
//   <button data-motion-toggle>  animations on / off (on is the default; the
//                                system setting "reduce motion" always wins)
// Both choices are remembered per browser.
(function () {
    var root = document.documentElement;

    function read(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function write(key, v) {
        try { localStorage.setItem(key, v); } catch (e) { /* storage blocked */ }
    }
    function theme() {
        // Dark is the corporate default; the OS setting is deliberately ignored.
        return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }
    function motionOff() {
        return root.getAttribute('data-motion') === 'off';
    }

    var saved = read('dis-theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
    if (read('dis-motion') === 'off') root.setAttribute('data-motion', 'off');

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
            var sync = function () {
                var isLight = theme() === 'light';
                btn.setAttribute('aria-pressed', String(isLight));
                btn.setAttribute('title', isLight ? 'Dunkles Design' : 'Helles Design');
            };
            sync();
            btn.addEventListener('click', function () {
                var next = theme() === 'light' ? 'dark' : 'light';
                root.setAttribute('data-theme', next);
                write('dis-theme', next);
                sync();
            });
        });

        var motionBtns = document.querySelectorAll('[data-motion-toggle]');
        var syncMotion = function () {
            var off = motionOff();
            motionBtns.forEach(function (btn) {
                btn.setAttribute('aria-pressed', String(off));
                btn.setAttribute('title', off ? 'Animationen einschalten' : 'Animationen ausschalten');
                btn.setAttribute('aria-label', off ? 'Animationen einschalten' : 'Animationen ausschalten');
            });
        };
        syncMotion();
        motionBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var off = !motionOff();
                if (off) root.setAttribute('data-motion', 'off');
                else root.removeAttribute('data-motion');
                write('dis-motion', off ? 'off' : 'on');
                syncMotion();
                // brand.js stops or restarts the globe
                document.dispatchEvent(new CustomEvent('dis:motion', { detail: { off: off } }));
            });
        });
    });
})();
