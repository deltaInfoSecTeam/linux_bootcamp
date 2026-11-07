// Globale Fehleranzeige und Service-Worker-Registrierung
// Globaler Fehler-Fänger, damit kein Fehler mehr stumm verschluckt wird!
window.onerror = function(msg, url, line, col, error) {
    alert("💥 KRITISCHER FEHLER:\n" + msg + "\nZeile: " + line + " Spalte: " + col);
    return false;
};
window.addEventListener("unhandledrejection", function(event) {
    alert("💥 HINTERGRUND-FEHLER:\n" + (event.reason ? event.reason.stack || event.reason : event));
});

// Service Worker Registrierung für PWA / Offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registriert', reg.scope))
            .catch(err => console.error('Service Worker Fehler', err));
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
