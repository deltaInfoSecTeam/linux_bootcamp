// Globale Fehleranzeige und Service-Worker-Registrierung
// Globaler Fehler-Fänger, damit kein Fehler mehr stumm verschluckt wird!
window.onerror = function(msg, url, line, col, error) {
    alert("[FAIL] KRITISCHER FEHLER:\n" + msg + "\nZeile: " + line + " Spalte: " + col);
    return false;
};
window.addEventListener("unhandledrejection", function(event) {
    alert("[FAIL] HINTERGRUND-FEHLER:\n" + (event.reason ? event.reason.stack || event.reason : event));
});

// Service Worker Registrierung für PWA / Offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => { console.log('Service Worker registriert', reg.scope); reg.update().catch(() => {}); })
            .catch(err => console.error('Service Worker Fehler', err));
    });

    // Nach einem Update auf dem Server zeigt der erste Aufruf noch die alte Version aus dem Cache;
    // der neue Service Worker übernimmt erst im Hintergrund. Sobald er das tut: kurz nach dem Laden
    // automatisch neu laden, später (mitten im Lernen) nur einen Hinweis zeigen.
    const loadedAt = Date.now();
    const hadController = !!navigator.serviceWorker.controller;
    let swReloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || swReloading) return;   // Erstinstallation: nichts tun
        if (Date.now() - loadedAt < 15000) { swReloading = true; location.reload(); return; }
        if (typeof showToast === 'function') showToast('Neue Version installiert. Seite neu laden, um sie zu nutzen.', 'info');
    });
}

// Ersatz für frühere Inline-Handler (CSP: script-src 'self')
document.addEventListener('DOMContentLoaded', () => {
    const btnCloseLogin = document.getElementById('btn-close-login-modal');
    if (btnCloseLogin) {
        btnCloseLogin.addEventListener('click', () => {
            document.getElementById('login-modal').style.display = 'none';
        });
    }
});
