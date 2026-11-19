const API_URL = window.location.origin;

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const ranks = [
    { name: 'Schütze', minXp: 0, img: 'img/ranks/Schuetze.svg' },
    { name: 'Gefreiter', minXp: 100, img: 'img/ranks/Gefreiter.svg' },
    { name: 'Obergefreiter', minXp: 250, img: 'img/ranks/Obergefreiter.svg' },
    { name: 'Hauptgefreiter', minXp: 400, img: 'img/ranks/Hauptgefreiter.svg' },
    { name: 'Stabsgefreiter', minXp: 600, img: 'img/ranks/Stabsgefreiter.svg' },
    { name: 'Oberstabsgefreiter', minXp: 800, img: 'img/ranks/Oberstabsgefreiter.svg' },
    { name: 'Unteroffizier', minXp: 1100, img: 'img/ranks/Unteroffizier.svg' },
    { name: 'Stabsunteroffizier', minXp: 1400, img: 'img/ranks/Stabsunteroffizier.svg' },
    { name: 'Feldwebel', minXp: 1800, img: 'img/ranks/Feldwebel.svg' },
    { name: 'Oberfeldwebel', minXp: 2200, img: 'img/ranks/Oberfeldwebel.svg' },
    { name: 'Hauptfeldwebel', minXp: 2800, img: 'img/ranks/Hauptfeldwebel.svg' },
    { name: 'Stabsfeldwebel', minXp: 3500, img: 'img/ranks/Stabsfeldwebel.svg' },
    { name: 'Oberstabsfeldwebel', minXp: 4200, img: 'img/ranks/Oberstabsfeldwebel.svg' },
    { name: 'Leutnant', minXp: 5000, img: 'img/ranks/Leutnant.svg' },
    { name: 'Oberleutnant', minXp: 6000, img: 'img/ranks/Oberleutnant.svg' },
    { name: 'Hauptmann', minXp: 7500, img: 'img/ranks/Hauptmann.svg' },
    { name: 'Major', minXp: 11000, img: 'img/ranks/Major.svg' },
    { name: 'Oberstleutnant', minXp: 14500, img: 'img/ranks/Oberstleutnant.svg' },
    { name: 'Oberst', minXp: 18500, img: 'img/ranks/Oberst.svg' },
    { name: 'Brigadegeneral', minXp: 23000, img: 'img/ranks/Brigadegeneral.svg' },
    { name: 'Generalmajor', minXp: 28000, img: 'img/ranks/Generalmajor.svg' },
    { name: 'Generalleutnant', minXp: 34000, img: 'img/ranks/Generalleutnant.svg' },
    { name: 'General', minXp: 41000, img: 'img/ranks/General.svg' }
];

let currentUser = null;
let currentToken = localStorage.getItem('bootcamp_token');

function getRankForXp(xp) {
    let currentRank = ranks[0];
    for (let r of ranks) {
        if (xp >= r.minXp) currentRank = r;
    }
    return currentRank;
}

function updateUserUI(user, currentXp = 0) {
    if (user && typeof user === 'object' && user.llm_config) {
        localStorage.setItem('llm_config', user.llm_config);
        if (window.reloadLlmConfig) window.reloadLlmConfig();
    }
    const rankEl = document.getElementById('player-rank');
    const nameEl = document.getElementById('player-name');
    const imgEl = document.getElementById('rank-insignia');
    const btnLogin = document.getElementById('btn-show-login');
    const btnLogout = document.getElementById('btn-logout');
    
    // Fallback if just username string was passed (legacy internal calls)
    let username = typeof user === 'string' ? user : (user ? user.username : null);

    if (window.syncStateWithUser) {
        window.syncStateWithUser(typeof user === 'object' ? user : null);
    }
    
    if (typeof user === 'object' && user && user.is_admin === 1) {
        document.body.classList.add('is-admin');
        const btnAdminRights = document.getElementById('btn-admin-rights');
        if (btnAdminRights) btnAdminRights.style.display = 'block';
    } else {
        document.body.classList.remove('is-admin');
        const btnAdminRights = document.getElementById('btn-admin-rights');
        if (btnAdminRights) btnAdminRights.style.display = 'none';
    }

    if (user) {
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'inline-block';
        if (nameEl) nameEl.textContent = username;
        
        // Populate All-Time Stats
        if (typeof currentXp === 'number') {
            const currentRank = getRankForXp(currentXp);
            if (rankEl) rankEl.textContent = currentRank.name || currentRank.title || 'Schütze';
            if (imgEl) imgEl.src = currentRank.img;
            
            const elRank = document.getElementById('stat-rank');
            if (elRank && user.rank) elRank.textContent = "#" + user.rank;
            
            const elAns = document.getElementById('stat-answered');
            if (elAns) elAns.textContent = user.answered_total || 0;
            
            const elPerc = document.getElementById('stat-percent');
            const totalC = user.correct_total || 0;
            const totalA = user.answered_total || 0;
            if (elPerc) elPerc.textContent = totalA > 0 ? Math.round((totalC / totalA) * 100) + "%" : "0%";
            
            const elTime = document.getElementById('stat-time-total');
            const totalSec = user.time_played_total || 0;
            const hours = Math.floor(totalSec / 3600);
            const minutes = Math.floor((totalSec % 3600) / 60);
            if (elTime) elTime.textContent = `${hours}h ${minutes}m`;
        }
    } else {
        if (btnLogin) btnLogin.style.display = 'inline-block';
        if (btnLogout) btnLogout.style.display = 'none';
        if (nameEl) nameEl.textContent = 'Tux';
        if (rankEl) rankEl.textContent = 'Schütze';
        if (imgEl) imgEl.src = 'img/ranks/Schuetze.svg';
    }
}

window.syncBackendXp = async function(pointsSelf, streak, answeredAdd, correctAdd, timePlayedAdd, lastPlayed) {
    if (!currentToken) return;
    const amount = Math.floor(pointsSelf * 50); 
    if (amount <= 0 && (!streak || !answeredAdd) && !timePlayedAdd) return;

    try {
        const res = await fetch(`${API_URL}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
            body: JSON.stringify({ xpToAdd: amount, streak: streak, answeredAdd: answeredAdd, correctAdd: correctAdd, timePlayedAdd: timePlayedAdd, lastPlayed: lastPlayed })
        });
        const data = await res.json();
        if (data.success && data.user) {
            currentUser = data.user;
        } else if (res.status === 403 && data.error === "Account gesperrt") {
            alert("Dein Account wurde gesperrt. Bitte kontaktiere den Administrator.");
            document.getElementById('btn-logout').click();
        } else if (res.status === 401) {
            // Token abgelaufen oder ungültig: kein Fehlalarm, einfach normal ausloggen
            document.getElementById('btn-logout').click();
        }
    } catch (e) {
        console.error("Fehler beim XP Sync:", e);
    }
};

async function checkAuth() {
    if (!currentToken) {
        updateUserUI(null, 0);
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/api/user`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (res.ok) {
            currentUser = await res.json();
            localStorage.setItem('bootcamp_offline_user', JSON.stringify(currentUser));
            document.getElementById('login-modal').style.display = 'none';
            updateUserUI(currentUser, currentUser.xp);
        } else {
            localStorage.removeItem('bootcamp_token');
            localStorage.removeItem('bootcamp_offline_user');
            updateUserUI(null, 0);
        }
    } catch (e) {
        console.warn("Backend nicht erreichbar, nutze Offline-Profil", e);
        const savedProfile = localStorage.getItem('bootcamp_offline_user');
        if (savedProfile) {
            currentUser = JSON.parse(savedProfile);
            updateUserUI(currentUser, currentUser.xp);
        } else {
            updateUserUI(null, 0);
        }
    }
}

// --- Recovery-Token: einmalig anzeigen, als Datei oder per Zwischenablage sichern ---
function showRecoveryDialog(username, code) {
    return new Promise((resolve) => {
        const modal = document.getElementById('recovery-modal');
        const saved = document.getElementById('recovery-saved');
        const err = document.getElementById('recovery-error');
        const btnCopy = document.getElementById('btn-recovery-copy');
        document.getElementById('recovery-code-value').textContent = code;
        saved.checked = false;
        err.style.display = 'none';
        btnCopy.textContent = 'Kopieren';

        const onDownload = () => {
            const text = 'Linux Bootcamp – Recovery-Token\n'
                + `Benutzer: ${username}\n`
                + `Token:    ${code}\n\n`
                + 'Damit setzt du unter "Passwort vergessen?" ein neues Passwort.\n'
                + 'Sicher aufbewahren, z.B. im Passwort-Manager, und diese Datei danach löschen.\n';
            const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `linux-bootcamp-recovery-${username}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
        const onCopy = async () => {
            try {
                await navigator.clipboard.writeText(code);
                btnCopy.textContent = 'Kopiert';
            } catch {
                // Ohne Clipboard-Recht (z.B. ohne HTTPS): Token markieren, Strg+C reicht dann
                window.getSelection().selectAllChildren(document.getElementById('recovery-code-value'));
                btnCopy.textContent = 'Markiert – Strg+C';
            }
        };
        const onSaved = () => { err.style.display = 'none'; };
        const onDone = () => {
            if (!saved.checked) {
                err.textContent = 'Bestätige zuerst, dass du den Token gespeichert hast.';
                err.style.display = 'block';
                return;
            }
            document.getElementById('btn-recovery-download').removeEventListener('click', onDownload);
            btnCopy.removeEventListener('click', onCopy);
            saved.removeEventListener('change', onSaved);
            document.getElementById('btn-recovery-done').removeEventListener('click', onDone);
            document.getElementById('recovery-code-value').textContent = '';
            modal.style.display = 'none';
            resolve();
        };

        document.getElementById('btn-recovery-download').addEventListener('click', onDownload);
        btnCopy.addEventListener('click', onCopy);
        saved.addEventListener('change', onSaved);
        document.getElementById('btn-recovery-done').addEventListener('click', onDone);
        modal.style.display = 'flex';
    });
}

// --- Erst-Einrichtung: Dialog öffnen, solange es noch keinen Admin gibt ---
async function checkSetup() {
    if (currentToken) return;
    try {
        const res = await fetch(`${API_URL}/api/setup`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.needed) document.getElementById('setup-modal').style.display = 'flex';
    } catch {
        // Offline: keine Einrichtung möglich
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const modalExams = document.getElementById('exams-modal');
    const btnOpenExams = document.getElementById('btn-open-exams');
    const btnCloseExams = document.getElementById('btn-close-exams');
    
    if (btnOpenExams) {
        btnOpenExams.addEventListener('click', async () => {
            if (!currentToken) {
                alert("Bitte melde dich an, um deine Klausuren zu sehen.");
                return;
            }
            modalExams.style.display = 'flex';
            const list = document.getElementById('exams-list');
            list.innerHTML = '<p style="text-align: center; color: var(--dis-text-2);">Lade Klausuren...</p>';
            
            try {
                const res = await fetch(API_URL + '/api/exams', {
                    headers: { 'Authorization': 'Bearer ' + currentToken }
                });
                const data = await res.json();
                if (data.success) {
                    if (data.exams.length === 0) {
                        list.innerHTML = '<p style="text-align: center; color: var(--dis-text-2);">Noch keine Klausuren geschrieben.</p>';
                        return;
                    }
                    
                    list.innerHTML = '';
                    data.exams.forEach((ex, index) => {
                        const div = document.createElement('div');
                        div.style.background = 'var(--dis-surface-hover)';
                        div.style.padding = '15px';
                        div.style.borderRadius = '8px';
                        div.style.marginBottom = '10px';
                        div.style.display = 'flex';
                        div.style.justifyContent = 'space-between';
                        div.style.alignItems = 'center';
                        
                        // Parse date properly or format it
                        let dObj = new Date(ex.date_played);
                        let dateStr = !isNaN(dObj) ? dObj.toLocaleDateString('de-DE') : ex.date_played.split(' ')[0];
                        
                        div.innerHTML = `
                            <div>
                                <div style="font-weight: bold; font-size: 1.1em; color: var(--dis-matrix);">Klausur Nr.${index + 1} vom ${dateStr}</div>
                                <div style="color: var(--dis-text-2); font-size: 0.9em; margin-top: 5px;">Punkte: ${Number(ex.score)} / ${Number(ex.max_score)}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.5em; font-weight: bold; color: ${Number(ex.grade) <= 4 ? 'var(--dis-matrix)' : 'var(--dis-danger)'};">Note: ${Number(ex.grade)}</div>
                            </div>
                        `;
                        list.appendChild(div);
                    });
                }
            } catch (e) {
                list.innerHTML = '<p style="text-align: center; color: var(--dis-danger);">Fehler beim Laden.</p>';
            }
        });
    }
    
    if (btnCloseExams) {
        btnCloseExams.addEventListener('click', () => {
            modalExams.style.display = 'none';
        });
    }

    const errEl = document.getElementById('auth-error');
    
    document.getElementById('btn-show-login').addEventListener('click', () => {
        document.getElementById('login-modal').style.display = 'flex';
    });

    document.getElementById('btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        currentToken = null;
        currentUser = null;
        localStorage.removeItem('bootcamp_token');
        localStorage.removeItem('bootcamp_offline_user');
        updateUserUI(null, 0);
        showToast("Erfolgreich abgemeldet", "info");
    });



    document.getElementById('btn-register').addEventListener('click', async () => {
        const u = document.getElementById('auth-username').value;
        const p = document.getElementById('auth-password').value;
        if (!u || !p) return;
        try {
            const res = await fetch(`${API_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            });
            const data = await res.json();
            if (res.ok) {
                currentToken = data.token;
                localStorage.setItem('bootcamp_token', data.token);
                document.getElementById('login-modal').style.display = 'none';
                updateUserUI(data.user, data.user.xp);
                if (data.recovery_code) await showRecoveryDialog(data.user.username, data.recovery_code);
            } else errEl.style.display = 'block', errEl.textContent = data.error;
        } catch (e) {
            errEl.style.display = 'block', errEl.textContent = "Netzwerkfehler";
        }
    });

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('auth-username').value;
        const p = document.getElementById('auth-password').value;
        if (!u || !p) return;
        try {
            const res = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            });
            const data = await res.json();
            if (res.ok) {
                currentToken = data.token;
                localStorage.setItem('bootcamp_token', data.token);
                localStorage.setItem('bootcamp_offline_user', JSON.stringify(data.user));
                document.getElementById('login-modal').style.display = 'none';
                updateUserUI(data.user, data.user.xp);
            } else errEl.style.display = 'block', errEl.textContent = data.error;
        } catch (e) {
            errEl.style.display = 'block', errEl.textContent = "Netzwerkfehler";
        }
    });

    
    // --- Forgot Password ---
    document.getElementById('link-forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('reset-modal').style.display = 'flex';
    });
    
    document.getElementById('btn-close-reset').addEventListener('click', () => {
        document.getElementById('reset-modal').style.display = 'none';
    });
    
    document.getElementById('reset-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('reset-username').value;
        const t = document.getElementById('reset-token').value;
        const p = document.getElementById('reset-password').value;
        const errEl = document.getElementById('reset-error');
        try {
            const res = await fetch(`${API_URL}/api/reset_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, recovery_code: t, new_password: p })
            });
            const data = await res.json();
            if (res.ok) {
                document.getElementById('reset-modal').style.display = 'none';
                showToast("Passwort erfolgreich zurückgesetzt!", "success");
            } else {
                errEl.style.display = 'block';
                errEl.textContent = data.error;
            }
        } catch (e) {
            errEl.style.display = 'block';
            errEl.textContent = "Netzwerkfehler";
        }
    });

    // --- Admin Dashboard ---
    const btnAdminRights = document.getElementById('btn-admin-rights');
    if (btnAdminRights) {
        btnAdminRights.addEventListener('click', async () => {
            document.getElementById('quiz-main').style.display = 'none';
            document.getElementById('admin-content-main').style.display = 'none';
            document.getElementById('admin-main').style.display = 'flex';
            showAdminArea('users');
            loadAdminUsers();
            loadAdminExams();
        });
    }

    const btnAdminContent = document.getElementById('btn-admin-content');
    if (btnAdminContent) {
        btnAdminContent.addEventListener('click', () => {
            document.getElementById('quiz-main').style.display = 'none';
            document.getElementById('admin-main').style.display = 'none';
            document.getElementById('admin-content-main').style.display = 'flex';
            if(window.renderAdminContentTree) window.renderAdminContentTree();
        });
    }

    // Systemmanagement: eigene Ansicht im selben Bereich, ohne die Reiter des Usermanagements
    const btnAdminSystemView = document.getElementById('btn-admin-system');
    if (btnAdminSystemView) {
        btnAdminSystemView.addEventListener('click', () => {
            document.getElementById('quiz-main').style.display = 'none';
            document.getElementById('admin-content-main').style.display = 'none';
            document.getElementById('admin-main').style.display = 'flex';
            showAdminArea('system');
        });
    }

    const btnCloseAdmin = document.getElementById('btn-close-admin-view');
    if (btnCloseAdmin) {
        btnCloseAdmin.addEventListener('click', () => {
            document.getElementById('admin-main').style.display = 'none';
            document.getElementById('quiz-main').style.display = 'flex';
        });
    }

    const btnCloseContent = document.getElementById('btn-close-content-view');
    if (btnCloseContent) {
        btnCloseContent.addEventListener('click', () => {
            document.getElementById('admin-content-main').style.display = 'none';
            document.getElementById('quiz-main').style.display = 'flex';
        });
    }

    
    async function loadAdminExams() {
        const tbody = document.getElementById('admin-exams-table-body');
        if (!tbody) return;
        
        try {
            const res = await fetch(API_URL + '/api/admin/exams', {
                headers: { 'Authorization': 'Bearer ' + currentToken }
            });
            const data = await res.json();
            if (data.success) {
                tbody.innerHTML = '';
                if (data.exams.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--dis-text-2);">Keine Klausuren vorhanden.</td></tr>';
                    return;
                }
                
                data.exams.forEach(ex => {
                    let dObj = new Date(ex.date_played);
                    let dateStr = !isNaN(dObj) ? dObj.toLocaleDateString('de-DE') : ex.date_played.split(' ')[0];
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${escapeHtml(dateStr)}</td>
                        <td style="font-weight: bold; color: var(--dis-info);">${escapeHtml(ex.username)}</td>
                        <td>${Number(ex.score)} / ${Number(ex.max_score)}</td>
                        <td style="font-weight: bold; color: ${Number(ex.grade) <= 4 ? 'var(--dis-matrix)' : 'var(--dis-danger)'};">${Number(ex.grade)}</td>
                        <td><button class="mode-btn btn-view-exam" data-id="${Number(ex.id)}" style="padding: 2px 10px; font-size: 0.8em; margin: 0;">Ansehen</button></td>
                    `;
                    tbody.appendChild(row);
                });
                
                document.querySelectorAll('.btn-view-exam').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.target.getAttribute('data-id');
                        // Load exam details
                        try {
                            const resD = await fetch(API_URL + '/api/admin/exams/' + id, {
                                headers: { 'Authorization': 'Bearer ' + currentToken }
                            });
                            const dataD = await resD.json();
                            if (dataD.success) {
                                let text = "--- Klausur-Einsicht ---\n\n";
                                dataD.examData.forEach(m => {
                                    text += "Frage " + m.qIndex + " (" + m.pts + " Pkt)\n";
                                    text += "F: " + m.question + "\n";
                                    text += "Antwort Schüler: " + (m.userAnswer || "- keine -") + "\n";
                                    text += "Musterlösung: " + m.correctAnswer + "\n";
                                    text += "KI-Feedback: " + m.feedback.replace(/<[^>]+>/g, '') + "\n\n";
                                });
                                // Just a simple Blob download for the admin to inspect it
                                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                                const a = document.createElement('a');
                                const url = URL.createObjectURL(blob);
                                a.href = url;
                                a.download = 'Klausur_Schueler_' + id + '.txt';
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => {
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(url);
                                }, 0);
                            }
                        } catch(err) {
                            alert("Konnte Details nicht laden.");
                        }
                    });
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">' + escapeHtml(data.error || 'Fehler') + '</td></tr>';
            }
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Netzwerkfehler.</td></tr>';
        }
    }

    async function loadAdminUsers() {
        const tbody = document.getElementById('admin-users-list');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Lade Nutzer...</td></tr>';
        try {
            const res = await fetch(`${API_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            if (!res.ok) throw new Error("Fehler");
            const users = await res.json();
            
            tbody.innerHTML = '';
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--dis-border-strong)';
                const status = u.is_banned ? '<span style="color:red;">Gesperrt</span>' : '<span style="color:green;">Aktiv</span>';
                const role = u.is_admin ? '<span style="color:var(--dis-matrix);">Admin</span>' : '<span style="color:var(--dis-danger);">User</span>';
                
                const banBtnClass = u.is_banned ? 'btn-primary btn-sm' : 'btn-secondary btn-sm';
                
                
                tr.innerHTML = `
                    <td style="padding: 8px;">${Number(u.id)}</td>
                    <td style="padding: 8px;">${escapeHtml(u.username)}</td>
                    <td style="padding: 8px;">${Number(u.xp)} XP</td>
                    <td style="padding: 8px;">${status}</td>
                    <td style="padding: 8px;">${role}</td>
                    <td style="padding: 8px;">
                        <div style="display: flex; gap: 8px;">
                            <button class="${banBtnClass}" style="width: auto;" data-action="ban" data-id="${Number(u.id)}" data-state="${u.is_banned ? 0 : 1}">${u.is_banned ? 'Entsperren' : 'Sperren'}</button>
                            <button class="btn-primary btn-sm" style="width: auto; ${u.is_admin ? 'opacity: 0.3; cursor: not-allowed; filter: grayscale(100%);' : ''}" ${u.is_admin ? 'disabled' : `data-action="admin" data-id="${Number(u.id)}" data-state="1"`}>zu Admin machen</button>
                            <button class="btn-secondary btn-sm" style="width: auto; ${!u.is_admin ? 'opacity: 0.3; cursor: not-allowed; filter: grayscale(100%);' : ''}" ${!u.is_admin ? 'disabled' : `data-action="admin" data-id="${Number(u.id)}" data-state="0"`}>Adminrechte entziehen</button>
                            <button class="btn-secondary btn-sm" style="width: auto;" data-action="reset" data-id="${Number(u.id)}" data-name="${escapeHtml(u.username)}">Reset PW</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Fehler beim Laden.</td></tr>';
        }
    }

    
    // Admin-Aktionen per Event-Delegation (keine Inline-Handler -> strikte CSP möglich)
    const adminUsersBody = document.getElementById('admin-users-list');
    if (adminUsersBody) {
        adminUsersBody.addEventListener('click', (ev) => {
            const btn = ev.target.closest('button[data-action]');
            if (!btn) return;
            const id = Number(btn.dataset.id);
            if (btn.dataset.action === 'ban') window.toggleBan(id, btn.dataset.state === '1');
            else if (btn.dataset.action === 'admin') window.toggleAdminLevel(id, btn.dataset.state === '1');
            else if (btn.dataset.action === 'reset') window.forceReset(id, btn.dataset.name);
        });
    }

    window.toggleAdminLevel = async (userId, makeAdmin) => {
        if (!confirm(`Nutzer wirklich ${makeAdmin ? 'zum Admin machen' : 'degradieren'}?`)) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/admin_toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
                body: JSON.stringify({ userId, isAdmin: makeAdmin })
            });
            if (res.ok) loadAdminUsers();
        } catch (e) {
            alert("Fehler!");
        }
    };

    window.toggleBan = async (userId, banState) => {
        if (!confirm(`Nutzer wirklich ${banState ? 'sperren' : 'entsperren'}?`)) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/ban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
                body: JSON.stringify({ userId, isBanned: banState })
            });
            if (res.ok) loadAdminUsers();
        } catch (e) {
            alert("Fehler!");
        }
    };

    window.forceReset = async (userId, username) => {
        const newPw = prompt(`Neues temporäres Passwort für ${username} eingeben:`);
        if (!newPw) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/reset_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
                body: JSON.stringify({ userId, newPassword: newPw })
            });
            const resData = await res.json().catch(() => ({}));
            alert(res.ok ? "Passwort geändert!" : (resData.error || "Fehler!"));
        } catch (e) {
            alert("Fehler!");
        }
    };

    
    document.getElementById('btn-open-leaderboard').addEventListener('click', async () => {
        document.getElementById('quiz-main').style.display = 'none';
        document.getElementById('admin-main').style.display = 'none';
        if(document.getElementById('admin-content-main')) document.getElementById('admin-content-main').style.display = 'none';
        
        const lbMain = document.getElementById('leaderboard-main');
        lbMain.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Fetch Leaderboard
        const tbody = document.getElementById('leaderboard-table-body');
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Lade Daten...</td></tr>';
        
        try {
            const res = await fetch(`${API_URL}/api/leaderboard`, { headers: { 'Authorization': `Bearer ${currentToken}` }});
            const data = await res.json();
            if(data.success && data.leaderboard) {
                tbody.innerHTML = '';
                data.leaderboard.forEach(u => {
                    const tr = document.createElement('tr');
                    const isMe = currentUser && currentUser.username === u.username;
                    tr.style.backgroundColor = isMe ? 'color-mix(in srgb, var(--dis-matrix) 10%, transparent)' : 'transparent';
                    tr.innerHTML = `
                        <td style="padding: 10px; border-bottom: 1px solid var(--dis-border-strong);">#${Number(u.rank)}</td>
                        <td style="padding: 10px; border-bottom: 1px solid var(--dis-border-strong); font-weight: ${isMe ? 'bold' : 'normal'}; color: ${u.is_admin ? 'var(--dis-gold)' : 'inherit'}">${escapeHtml(u.username)} ${isMe ? '(Du)' : ''}</td>
                        <td style="padding: 10px; border-bottom: 1px solid var(--dis-border-strong);">${Number(u.xp)} XP</td>
                        <td style="padding: 10px; border-bottom: 1px solid var(--dis-border-strong);">${Number(u.streak)}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Fehler beim Laden.</td></tr>';
            }
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Netzwerkfehler.</td></tr>';
        }
    });

    document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
        document.getElementById('leaderboard-main').style.display = 'none';
        document.getElementById('quiz-main').style.display = 'flex';
    });

    
    const btnAdminUsers = document.getElementById('btn-admin-view-users');
    const btnAdminExams = document.getElementById('btn-admin-view-exams');
    const secAdminUsers = document.getElementById('admin-section-users');
    const secAdminExams = document.getElementById('admin-section-exams');

    const secAdminSystem = document.getElementById('admin-section-system');
    const adminTabs = [[btnAdminUsers, secAdminUsers], [btnAdminExams, secAdminExams]];
    function showAdminTab(btn) {
        adminTabs.forEach(([b, s]) => {
            if (!b || !s) return;
            b.classList.toggle('active', b === btn);
            s.style.display = b === btn ? 'block' : 'none';
        });
        if (secAdminSystem) secAdminSystem.style.display = 'none';
        stopUpdatePolling();
    }
    adminTabs.forEach(([b]) => b && b.addEventListener('click', () => showAdminTab(b)));
    // Bereich der Admin-Ansicht: 'users' (Benutzer, Klausuren) oder 'system' (Programmstand, Update)
    function showAdminArea(area) {
        const sys = area === 'system';
        document.getElementById('admin-main-title').textContent = sys ? 'Systemmanagement' : 'Usermanagement';
        adminTabs.forEach(([b]) => { if (b) b.style.display = sys ? 'none' : ''; });
        if (sys) {
            adminTabs.forEach(([, s]) => { if (s) s.style.display = 'none'; });
            secAdminSystem.style.display = 'flex';
            loadUpdateStatus();
        } else {
            showAdminTab(btnAdminUsers);
        }
    }

    // --- System: Update über den Host-Agenten ---
    let updTimer = null, updWasRunning = false;
    const updEsc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const updDate = s => { const d = new Date(s); return isNaN(d) ? '–' : d.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }); };
    function stopUpdatePolling() { clearTimeout(updTimer); updTimer = null; }
    // Fortschritt des Updates: vier Schritte, laufender Balken, Uhr. Wird nur einmal aufgebaut und dann
    // nur noch aktualisiert, damit die Animation beim Nachladen des Status nicht neu startet.
    const UPD_STEPS = ['Auftrag übergeben', 'Neue Version holen', 'Bauen und neu starten', 'Fertig'];
    let updStart = null, updClock = null;
    function updProgress(run, idx, note, done) {
        let box = run.querySelector('.upd-progress');
        if (!box) {
            run.innerHTML = `<div class="upd-progress" role="status">
                <ol class="upd-steps">${UPD_STEPS.map(s => `<li><span class="upd-dot" aria-hidden="true"></span><span class="upd-label">${s}</span></li>`).join('')}</ol>
                <div class="upd-bar" aria-hidden="true"><i></i></div>
                <div class="upd-foot"><span class="upd-note"></span><span class="upd-time">0:00</span></div></div>`;
            box = run.querySelector('.upd-progress');
        }
        box.classList.toggle('is-done', !!done);
        box.querySelectorAll('.upd-steps li').forEach((li, i) => {
            li.dataset.st = done || i < idx ? 'done' : i === idx ? 'active' : 'todo';
        });
        box.style.setProperty('--upd-p', done ? 1 : (idx + 0.5) / UPD_STEPS.length);
        box.querySelector('.upd-note').textContent = note || '';
        if (!updStart) updStart = Date.now();
        const tick = () => {
            const s = Math.max(0, Math.round((Date.now() - updStart) / 1000));
            const el2 = box.querySelector('.upd-time');
            if (el2) el2.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
        };
        tick(); clearInterval(updClock); updClock = done ? null : setInterval(tick, 1000);
    }
    function updProgressReset() { clearInterval(updClock); updClock = null; updStart = null; }
    async function updApi(path, post) {
        const res = await fetch(API_URL + '/api/admin/update' + path, {
            method: post ? 'POST' : 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + currentToken }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || ('Fehler ' + res.status));
        return data;
    }
    async function loadUpdateStatus() {
        stopUpdatePolling();
        const adminMain = document.getElementById('admin-main');
        if (!secAdminSystem || secAdminSystem.style.display === 'none' || (adminMain && adminMain.style.display === 'none')) return;
        const run = document.getElementById('upd-run');
        let d;
        try {
            d = await updApi('');
        } catch (e) {
            // Während des Updates startet der Container neu: kurz nicht erreichbar
            if (updWasRunning) updProgress(run, 2, 'Das Bootcamp startet gerade neu. Die Seite verbindet sich gleich wieder …');
            else run.innerHTML = `<div class="dis-alert dis-alert--fail">${updEsc(e.message)}</div>`;
            updTimer = setTimeout(loadUpdateStatus, 4000);
            return;
        }
        const s = d.status || {}, r = d.run || {};
        const $u = id => document.getElementById(id);
        const running = r.state === 'running' || d.pending.includes('apply.req');
        $u('upd-noagent').hidden = d.agent;
        const cur = String(s.current || ''), sp = cur.indexOf(' ');
        $u('upd-sha').textContent = cur ? (sp > 0 ? cur.slice(0, sp) : cur) : '–';
        $u('upd-subject').textContent = sp > 0 ? cur.slice(sp + 1) : (d.agent ? '' : 'Unbekannt, solange der Update-Agent fehlt.');
        $u('upd-branch').textContent = s.branch || '–';
        $u('upd-checked').textContent = s.checked_at ? updDate(s.checked_at) : '–';
        $u('upd-last').textContent = r.finished_at ? `${updDate(r.finished_at)} · ${r.state === 'ok' ? 'erfolgreich' : 'fehlgeschlagen'}` : '–';
        const badge = $u('upd-badge');
        const [bs, bt] = !d.agent ? ['', 'Agent fehlt']
            : running ? ['run', 'Update läuft']
            : s.error ? ['fail', 'Repo nicht erreichbar']
            : s.behind > 0 ? ['warn', 'Update verfügbar']
            : ['ok', 'Aktuell'];
        badge.dataset.s = bs; badge.textContent = bt;
        $u('upd-count').textContent = s.behind > 0 ? `${s.behind} neu` : '';
        $u('upd-changes').innerHTML = s.behind > 0 ? (s.commits || []).map(c => {
            const i = String(c).indexOf(' ');
            return `<li><code>${updEsc(i > 0 ? c.slice(0, i) : c)}</code><span>${updEsc(i > 0 ? c.slice(i + 1) : '')}</span></li>`;
        }).join('') : '';
        $u('upd-empty').textContent = !d.agent ? 'Erst den Update-Agenten auf dem Server einrichten (siehe unten).'
            : s.error ? s.error
            : s.behind > 0 ? '' : 'Keine neuen Änderungen. Das Bootcamp ist auf dem neuesten Stand.';
        $u('btn-upd-check').disabled = !d.agent || running || d.pending.includes('check.req');
        $u('btn-upd-apply').disabled = !d.agent || running || !(s.behind > 0);
        if (running) {
            if (r.state === 'running' && r.started_at && !updStart) updStart = Date.parse(r.started_at) || null;
            updProgress(run, r.state === 'running' ? Math.min(2, Math.max(1, r.step || 1)) : 0,
                r.state === 'running' ? r.message : 'Auftrag liegt bereit. Der Server startet das Update in wenigen Sekunden.');
        } else if (updWasRunning && r.state === 'ok') {
            updProgress(run, 3, 'Update erfolgreich. Die Seite lädt gleich neu.', true);
        } else if (r.state === 'failed') {
            updProgressReset();
            run.innerHTML = `<div class="dis-alert dis-alert--fail"><strong>Letztes Update fehlgeschlagen.</strong> ${updEsc(r.message)}</div>`;
        } else { updProgressReset(); run.innerHTML = ''; }
        document.getElementById('upd-logbox').hidden = !d.log;
        document.getElementById('upd-log').textContent = d.log || '';
        if (updWasRunning && !running && r.state === 'ok') {
            showToast('Update abgeschlossen. Die Seite lädt neu.', 'success');
            setTimeout(() => location.reload(), 2500);
        }
        updWasRunning = running;
        updTimer = setTimeout(loadUpdateStatus, running || d.pending.length ? 3000 : 30000);
    }
    document.getElementById('btn-upd-check')?.addEventListener('click', async () => {
        try { await updApi('/check', true); showToast('Prüfung angefordert.', 'info'); } catch (e) { showToast(e.message, 'error'); }
        loadUpdateStatus();
    });
    document.getElementById('btn-upd-apply')?.addEventListener('click', async () => {
        if (!confirm('Bootcamp jetzt aktualisieren? Der Server holt die neue Version und startet das Bootcamp neu. Es ist dabei etwa 1 bis 2 Minuten nicht erreichbar.')) return;
        try { await updApi('/apply', true); updWasRunning = true; showToast('Update angefordert.', 'info'); } catch (e) { showToast(e.message, 'error'); }
        loadUpdateStatus();
    });

    // --- Erst-Einrichtung ---
    document.getElementById('btn-close-setup').addEventListener('click', () => {
        document.getElementById('setup-modal').style.display = 'none';
    });

    document.getElementById('setup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('setup-error');
        const btn = document.getElementById('btn-setup');
        errEl.style.display = 'none';
        btn.disabled = true;
        try {
            const res = await fetch(`${API_URL}/api/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    setup_code: document.getElementById('setup-code').value,
                    username: document.getElementById('setup-username').value,
                    password: document.getElementById('setup-password').value,
                })
            });
            const data = await res.json();
            if (!res.ok) {
                errEl.textContent = data.error || 'Einrichtung fehlgeschlagen';
                errEl.style.display = 'block';
                if (res.status === 410) setTimeout(() => { document.getElementById('setup-modal').style.display = 'none'; }, 2000);
                return;
            }
            currentToken = data.token;
            localStorage.setItem('bootcamp_token', data.token);
            localStorage.setItem('bootcamp_offline_user', JSON.stringify(data.user));
            document.getElementById('setup-form').reset();
            document.getElementById('setup-modal').style.display = 'none';
            updateUserUI(data.user, data.user.xp);
            await showRecoveryDialog(data.user.username, data.recovery_code);
            showToast(`Admin "${data.user.username}" eingerichtet`, 'success');
        } catch {
            errEl.textContent = 'Netzwerkfehler';
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
        }
    });

    checkAuth();
    checkSetup();
});
