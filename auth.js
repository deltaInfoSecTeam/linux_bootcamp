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
    { name: 'Schütze', minXp: 0, img: 'public/ranks/Schuetze.svg' },
    { name: 'Gefreiter', minXp: 100, img: 'public/ranks/Gefreiter.svg' },
    { name: 'Obergefreiter', minXp: 250, img: 'public/ranks/Obergefreiter.svg' },
    { name: 'Hauptgefreiter', minXp: 400, img: 'public/ranks/Hauptgefreiter.svg' },
    { name: 'Stabsgefreiter', minXp: 600, img: 'public/ranks/Stabsgefreiter.svg' },
    { name: 'Oberstabsgefreiter', minXp: 800, img: 'public/ranks/Oberstabsgefreiter.svg' },
    { name: 'Unteroffizier', minXp: 1100, img: 'public/ranks/Unteroffizier.svg' },
    { name: 'Stabsunteroffizier', minXp: 1400, img: 'public/ranks/Stabsunteroffizier.svg' },
    { name: 'Feldwebel', minXp: 1800, img: 'public/ranks/Feldwebel.svg' },
    { name: 'Oberfeldwebel', minXp: 2200, img: 'public/ranks/Oberfeldwebel.svg' },
    { name: 'Hauptfeldwebel', minXp: 2800, img: 'public/ranks/Hauptfeldwebel.svg' },
    { name: 'Stabsfeldwebel', minXp: 3500, img: 'public/ranks/Stabsfeldwebel.svg' },
    { name: 'Oberstabsfeldwebel', minXp: 4200, img: 'public/ranks/Oberstabsfeldwebel.svg' },
    { name: 'Leutnant', minXp: 5000, img: 'public/ranks/Leutnant.svg' },
    { name: 'Oberleutnant', minXp: 6000, img: 'public/ranks/Oberleutnant.svg' },
    { name: 'Hauptmann', minXp: 7500, img: 'public/ranks/Hauptmann.svg' },
    { name: 'Major', minXp: 11000, img: 'public/ranks/Major.svg' },
    { name: 'Oberstleutnant', minXp: 14500, img: 'public/ranks/Oberstleutnant.svg' },
    { name: 'Oberst', minXp: 18500, img: 'public/ranks/Oberst.svg' },
    { name: 'Brigadegeneral', minXp: 23000, img: 'public/ranks/Brigadegeneral.svg' },
    { name: 'Generalmajor', minXp: 28000, img: 'public/ranks/Generalmajor.svg' },
    { name: 'Generalleutnant', minXp: 34000, img: 'public/ranks/Generalleutnant.svg' },
    { name: 'General', minXp: 41000, img: 'public/ranks/General.svg' }
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
        if (imgEl) imgEl.src = 'public/ranks/Schuetze.svg';
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
            list.innerHTML = '<p style="text-align: center; color: #9ca3af;">Lade Klausuren...</p>';
            
            try {
                const res = await fetch(API_URL + '/api/exams', {
                    headers: { 'Authorization': 'Bearer ' + currentToken }
                });
                const data = await res.json();
                if (data.success) {
                    if (data.exams.length === 0) {
                        list.innerHTML = '<p style="text-align: center; color: #9ca3af;">Noch keine Klausuren geschrieben.</p>';
                        return;
                    }
                    
                    list.innerHTML = '';
                    data.exams.forEach((ex, index) => {
                        const div = document.createElement('div');
                        div.style.background = 'rgba(255,255,255,0.05)';
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
                                <div style="font-weight: bold; font-size: 1.1em; color: #4ade80;">Klausur Nr.${index + 1} vom ${dateStr}</div>
                                <div style="color: #9ca3af; font-size: 0.9em; margin-top: 5px;">Punkte: ${ex.score} / ${ex.max_score}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.5em; font-weight: bold; color: ${ex.grade <= '4' ? '#4ade80' : '#ef4444'};">Note: ${ex.grade}</div>
                            </div>
                        `;
                        list.appendChild(div);
                    });
                }
            } catch (e) {
                list.innerHTML = '<p style="text-align: center; color: #ef4444;">Fehler beim Laden.</p>';
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
                if (data.recovery_code) alert("WICHTIG: Dein Root-Recovery-Token lautet:\n\n" + data.recovery_code + "\n\nBitte speichere diesen Token! Du brauchst ihn, um dein Passwort zurückzusetzen.");
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
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #9ca3af;">Keine Klausuren vorhanden.</td></tr>';
                    return;
                }
                
                data.exams.forEach(ex => {
                    let dObj = new Date(ex.date_played);
                    let dateStr = !isNaN(dObj) ? dObj.toLocaleDateString('de-DE') : ex.date_played.split(' ')[0];
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${dateStr}</td>
                        <td style="font-weight: bold; color: #60a5fa;">${escapeHtml(ex.username)}</td>
                        <td>${ex.score} / ${ex.max_score}</td>
                        <td style="font-weight: bold; color: ${ex.grade <= '4' ? '#4ade80' : '#ef4444'};">${ex.grade}</td>
                        <td><button class="mode-btn btn-view-exam" data-id="${ex.id}" style="padding: 2px 10px; font-size: 0.8em; margin: 0;">Ansehen</button></td>
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
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">' + (data.error || 'Fehler') + '</td></tr>';
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
                tr.style.borderBottom = '1px solid #222';
                const status = u.is_banned ? '<span style="color:red;">Gesperrt</span>' : '<span style="color:green;">Aktiv</span>';
                const role = u.is_admin ? '<span style="color:#4ade80;">Admin</span>' : '<span style="color:#ef4444;">User</span>';
                
                const banBtnClass = u.is_banned ? 'btn-primary btn-sm' : 'btn-secondary btn-sm';
                
                
                tr.innerHTML = `
                    <td style="padding: 8px;">${u.id}</td>
                    <td style="padding: 8px;">${escapeHtml(u.username)}</td>
                    <td style="padding: 8px;">${u.xp} XP</td>
                    <td style="padding: 8px;">${status}</td>
                    <td style="padding: 8px;">${role}</td>
                    <td style="padding: 8px;">
                        <div style="display: flex; gap: 8px;">
                            <button class="${banBtnClass}" style="width: auto;" onclick="toggleBan(${u.id}, ${!u.is_banned})">${u.is_banned ? 'Entsperren' : 'Sperren'}</button>
                            <button class="btn-primary btn-sm" style="width: auto; ${u.is_admin ? 'opacity: 0.3; cursor: not-allowed; filter: grayscale(100%);' : ''}" onclick="${u.is_admin ? '' : `toggleAdminLevel(${u.id}, true)`}">zu Admin machen</button>
                            <button class="btn-secondary btn-sm" style="width: auto; ${!u.is_admin ? 'opacity: 0.3; cursor: not-allowed; filter: grayscale(100%);' : ''}" onclick="${!u.is_admin ? '' : `toggleAdminLevel(${u.id}, false)`}">Adminrechte entziehen</button>
                            <button class="btn-secondary btn-sm" style="width: auto;" onclick="forceReset(${u.id}, '${u.username}')">Reset PW</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Fehler beim Laden.</td></tr>';
        }
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
            if (res.ok) alert("Passwort geändert!");
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
                    tr.style.backgroundColor = isMe ? 'rgba(74, 222, 128, 0.1)' : 'transparent';
                    tr.innerHTML = `
                        <td style="padding: 10px; border-bottom: 1px solid #444;">#${u.rank}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #444; font-weight: ${isMe ? 'bold' : 'normal'}; color: ${u.is_admin ? '#a855f7' : 'inherit'}">${escapeHtml(u.username)} ${isMe ? '(Du)' : ''}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #444;">${u.xp} XP</td>
                        <td style="padding: 10px; border-bottom: 1px solid #444;">🔥 ${u.streak}</td>
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

    if (btnAdminUsers && btnAdminExams) {
        btnAdminUsers.addEventListener('click', () => {
            btnAdminUsers.classList.add('active');
            btnAdminExams.classList.remove('active');
            secAdminUsers.style.display = 'block';
            secAdminExams.style.display = 'none';
        });
        btnAdminExams.addEventListener('click', () => {
            btnAdminExams.classList.add('active');
            btnAdminUsers.classList.remove('active');
            secAdminExams.style.display = 'block';
            secAdminUsers.style.display = 'none';
        });
    }

    checkAuth();
});
