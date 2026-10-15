const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || (process.env.USE_HTTP ? 8000 : 443);

// Sicherheits-Härtung: Persistentes Zufalls-Secret (bleibt auch nach Server-Neustart erhalten)
const JWT_SECRET = process.env.JWT_SECRET || (() => {
    const secretFile = path.join(__dirname, '.jwt_secret');
    try {
        if (fs.existsSync(secretFile)) {
            return fs.readFileSync(secretFile, 'utf8').trim();
        }
        const newSecret = crypto.randomBytes(32).toString('hex');
        fs.writeFileSync(secretFile, newSecret, { mode: 0o600 });
        return newSecret;
    } catch (e) {
        return 'bootcamp-persistent-fallback-jwt-secret-key-32chars';
    }
})();

// Sicherheits-Header
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(cors());
app.use(express.json({ limit: '500kb' }));

// Information Disclosure Schutz: Niemals Datenbank, Sourcecode, WAL-Files oder Secrets ausliefern!
app.use((req, res, next) => {
    const blockedFiles = [
        '.db', '.db-journal', '.db-wal', '.db-shm', '.pfx', '.pem', '.key', '.env', 
        'server.js', 'database.js', 'dockerfile', 'docker-compose.yml', 
        'package.json', 'package-lock.json', '.git'
    ];
    const reqPath = req.path.toLowerCase();
    if (blockedFiles.some(blocked => reqPath.endsWith(blocked) || reqPath.includes('/' + blocked))) {
        return res.status(403).json({ error: "Zugriff verweigert (Geschützte Systemdatei)" });
    }
    next();
});

// Serve static files (PWA)
app.use(express.static(path.join(__dirname)));

// Rate Limiter für Auth-Endpunkte (Schutz vor Brute-Force & DoS)
const authLimiterMap = new Map();
const authRateLimiter = (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 Minute
    const maxAttempts = 12;

    let record = authLimiterMap.get(ip);
    if (!record || now - record.startTime > windowMs) {
        record = { count: 1, startTime: now };
        authLimiterMap.set(ip, record);
    } else {
        record.count++;
        if (record.count > maxAttempts) {
            return res.status(429).json({ error: "Zu viele Anmeldeversuche. Bitte warte eine Minute." });
        }
    }
    next();
};

// --- Middleware to verify JWT ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Kein Token übergeben" });

    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
        if (err) return res.status(401).json({ error: "Sitzung abgelaufen. Bitte erneut anmelden." });
        
        const user = db.getUserById(userPayload.id);
        if (!user) return res.status(404).json({ error: "Nutzer existiert nicht mehr" });
        if (user.is_banned) return res.status(403).json({ error: "Account gesperrt" });
        
        req.user = user;
        next();
    });
};

const adminOnly = (req, res, next) => {
    if (req.user.is_admin !== 1) {
        return res.status(403).json({ error: "Zugriff verweigert. Nur Administratoren." });
    }
    next();
};

// --- API Endpoints ---

// Register
app.post('/api/register', authRateLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username und Passwort werden benötigt" });
    }

    const trimmedUser = String(username).trim();
    // Strenge Validierung: Verhindert Stored XSS, HTML Injection und Sonderzeichen-Missbrauch
    const usernameRegex = /^[a-zA-Z0-9_\-\.]{3,24}$/;
    if (!usernameRegex.test(trimmedUser)) {
        return res.status(400).json({ error: "Ungültiger Username. Erlaubt sind 3-24 Zeichen (nur Buchstaben, Zahlen, _, -, .)." });
    }
    
    if (String(password).length < 4) {
        return res.status(400).json({ error: "Das Passwort muss mindestens 4 Zeichen lang sein." });
    }
    
    const existingUser = db.getUserByUsername(trimmedUser);
    if (existingUser) {
        return res.status(400).json({ error: "Dieser Username existiert bereits" });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { id: userId, recovery_code } = db.createUser(trimmedUser, hashedPassword);
        
        // Auto-login after registration
        const token = jwt.sign({ id: userId, username: trimmedUser }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: userId, username: trimmedUser, xp: 0, streak: 0, answered_total: 0, last_played: null, is_admin: 0 }, recovery_code });
    } catch (err) {
        res.status(500).json({ error: "Interner Server Fehler" });
    }
});

// Login
app.post('/api/login', authRateLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username und Passwort werden benötigt" });
    }
    
    const user = db.getUserByUsername(username);
    if (!user) {
        return res.status(401).json({ error: "Falscher Username oder Passwort" });
    }

    if (user.is_banned) {
        return res.status(403).json({ error: "Dein Account wurde gesperrt. Bitte kontaktiere den Administrator." });
    }
    
    try {
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: "Falscher Username oder Passwort" });
        }
        
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user.id, username: user.username, xp: user.xp, streak: user.streak, answered_total: user.answered_total, last_played: user.last_played, llm_config: user.llm_config, is_admin: user.is_admin } });
    } catch (err) {
        res.status(500).json({ error: "Interner Server Fehler" });
    }
});

// Reset Password via Recovery Code
app.post('/api/reset_password', authRateLimiter, async (req, res) => {
    const { username, recovery_code, new_password } = req.body;
    if (!username || !recovery_code || !new_password) {
        return res.status(400).json({ error: "Bitte fülle alle Felder aus" });
    }
    const user = db.getUserByUsername(username);
    if (!user) {
        return res.status(404).json({ error: "Nutzer nicht gefunden" });
    }
    if (user.recovery_code !== recovery_code.trim()) {
        return res.status(403).json({ error: "Der Root-Recovery-Token ist ungültig" });
    }
    try {
        const hashedPassword = await bcrypt.hash(new_password, 10);
        db.updatePassword(user.id, hashedPassword);
        res.json({ success: true, message: "Passwort wurde erfolgreich geändert" });
    } catch (err) {
        res.status(500).json({ error: "Interner Server Fehler" });
    }
});

// Admin: Get all users

app.get('/api/admin/exams', authenticateToken, adminOnly, (req, res) => {
    try {
        const exams = db.getAllExamsAdmin();
        res.json({ success: true, exams });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Fehler beim Laden aller Klausuren" });
    }
});

app.get('/api/admin/exams/:id', authenticateToken, adminOnly, (req, res) => {
    try {
        const exam = db.getExamDetailsAdmin(req.params.id);
        if (exam) {
            res.json({ success: true, examData: JSON.parse(exam.exam_data) });
        } else {
            res.status(404).json({ error: "Klausur nicht gefunden" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Fehler beim Laden der Klausurdetails" });
    }
});

app.get('/api/admin/users', authenticateToken, adminOnly, (req, res) => {
    try {
        const users = db.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Fehler beim Abrufen der Nutzer" });
    }
});


// Admin: Toggle Admin Status
app.post('/api/admin/admin_toggle', authenticateToken, adminOnly, (req, res) => {
    const { userId, isAdmin } = req.body;
    if (Number(userId) === Number(req.user.id) && !isAdmin) {
        return res.status(400).json({ error: "Du kannst dir deinen eigenen Admin-Status nicht entziehen." });
    }
    try {
        db.toggleAdmin(userId, isAdmin);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Fehler beim Ändern der Rechte" });
    }
});

// Admin: Toggle Ban
app.post('/api/admin/ban', authenticateToken, adminOnly, (req, res) => {
    const { userId, isBanned } = req.body;
    if (Number(userId) === Number(req.user.id) && isBanned) {
        return res.status(400).json({ error: "Du kannst dich nicht selbst sperren." });
    }
    try {
        db.toggleBan(userId, isBanned);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Fehler beim Sperren/Entsperren" });
    }
});

// Admin: Force Reset Password
app.post('/api/admin/reset_password', authenticateToken, adminOnly, async (req, res) => {
    const { userId, newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.updatePassword(userId, hashedPassword);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Fehler beim Zurücksetzen des Passworts" });
    }
});

// Get Current User Info
app.get('/api/user', authenticateToken, (req, res) => {
    const user = db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "Nutzer nicht gefunden" });
    if (user.is_banned) return res.status(403).json({ error: "Account gesperrt" });
    user.rank = db.getUserRank(user.id);
    res.json(user);
});

// Sync XP & Stats (Plausibilitäts-Validierung gegen Cheating)
app.post('/api/sync', authenticateToken, (req, res) => {
    const { xpToAdd, streak, answeredAdd, correctAdd, timePlayedAdd, lastPlayed } = req.body;
    if (typeof xpToAdd !== 'number' || xpToAdd < 0 || xpToAdd > 1000) {
        return res.status(400).json({ error: "Ungültige XP Menge (maximal 1000 XP pro Sync erlaubt)" });
    }
    
    const safeStreak = (typeof streak === 'number' && streak >= 0 && streak <= 10000) ? streak : 0;
    const safeAns = (typeof answeredAdd === 'number' && answeredAdd >= 0 && answeredAdd <= 50) ? answeredAdd : 0;
    const safeCor = (typeof correctAdd === 'number' && correctAdd >= 0 && correctAdd <= safeAns) ? correctAdd : 0;
    const safeTime = (typeof timePlayedAdd === 'number' && timePlayedAdd >= 0 && timePlayedAdd <= 3600) ? timePlayedAdd : 0;
    
    try {
        const updatedUser = db.updateStats(req.user.id, xpToAdd, safeStreak, safeAns, safeCor, safeTime, lastPlayed);
        updatedUser.rank = db.getUserRank(req.user.id);
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Fehler beim Speichern der Stats" });
    }
});
// Update Settings
app.post('/api/settings', authenticateToken, (req, res) => {
    const { llmConfig } = req.body;
    try {
        if (llmConfig) {
            db.updateLlmConfig(req.user.id, JSON.stringify(llmConfig));
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Fehler beim Speichern der Einstellungen" });
    }
});

// --- Proxy Endpoints (Abgesichert gegen SSRF & Open-Relay-Missbrauch) ---
app.post('/api/proxy', authenticateToken, async (req, res) => {
    try {
        const payload = req.body;
        if (!payload || !payload.url) {
            return res.status(400).json({ error: "Keine Ziel-URL angegeben" });
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(payload.url);
        } catch {
            return res.status(400).json({ error: "Ungültiges URL-Format" });
        }

        // SSRF-Schutz: Nur HTTP/HTTPS erlauben
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return res.status(400).json({ error: "Nur HTTP und HTTPS Protokolle sind gestattet" });
        }

        const hostname = parsedUrl.hostname.toLowerCase();
        // Schutz vor Cloud-Metadaten-Diebstahl und internen Netzwerk-Scans
        const isInternalIp = hostname === '169.254.169.254' ||
                             hostname === 'metadata.google.internal' ||
                             hostname === '0.0.0.0' ||
                             hostname === '::1' ||
                             hostname.startsWith('10.') ||
                             hostname.startsWith('192.168.') ||
                             /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        // Erlaube localhost ausschließlich für lokalen Ollama LLM Service (Port 11434)
        if (isLocalhost && parsedUrl.port !== '11434') {
            return res.status(403).json({ error: "Zugriff auf interne Ports verweigert" });
        }
        if (isInternalIp) {
            return res.status(403).json({ error: "Zugriff auf interne Netzwerkadressen verweigert (SSRF Schutz)" });
        }

        let fetchOptions = {
            method: payload.method || 'POST',
            headers: payload.headers || {},
        };
        if (payload.body) {
            fetchOptions.body = JSON.stringify(payload.body);
        }

        const response = await fetch(payload.url, fetchOptions);
        const data = await response.json();
        res.json(data);
    } catch (e) {
        console.error("Proxy error:", e);
        res.status(500).json({ error: "Proxy Request Failed", details: e.message });
    }
});

app.post('/api/evaluate', authenticateToken, async (req, res) => {
    try {
        const payload = req.body;
        const apiUrl = payload.apiUrl || 'https://api.openai.com/v1/chat/completions';
        const apiKey = payload.apiKey;
        const model = payload.model || 'gpt-4o-mini';
        const prompt = payload.prompt;

        if (!apiKey || !prompt) {
             return res.status(400).json({ error: "API Key und Prompt fehlen" });
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (e) {
        console.error("Eval error:", e);
        res.status(500).json({ error: "Evaluation Failed", details: e.message });
    }
});


let options = {};
let useHttps = true;
try {
    options = {
        pfx: fs.readFileSync('cert.pfx'),
        passphrase: 'password'
    };
} catch (e) {
    console.log("No SSL certs found. Falling back to HTTP.");
    useHttps = false;
}

if (useHttps && !process.env.USE_HTTP) {
    const server = https.createServer(options, app);
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend HTTPS Server läuft auf https://localhost:${PORT}`);
        console.log("Datenbank initialisiert in bootcamp.db");
    });
} else {
    const http = require('http');
    const server = http.createServer(app);
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend HTTP Server läuft auf http://localhost:${PORT}`);
        console.log("Datenbank initialisiert in bootcamp.db");
    });
}



// Get Leaderboard

app.post('/api/exams', authenticateToken, (req, res) => {
    const { grade, score, maxScore, examData } = req.body;
    try {
        db.saveExam(req.user.id, grade, score, maxScore, examData);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Fehler beim Speichern der Klausur" });
    }
});

app.get('/api/exams', authenticateToken, (req, res) => {
    try {
        const exams = db.getUserExams(req.user.id);
        res.json({ success: true, exams });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Fehler beim Laden der Klausuren" });
    }
});

app.get('/api/exams/:id', authenticateToken, (req, res) => {
    try {
        const exam = db.getExamDetails(req.user.id, req.params.id);
        if (exam) {
            res.json({ success: true, examData: JSON.parse(exam.exam_data) });
        } else {
            res.status(404).json({ error: "Klausur nicht gefunden" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Fehler beim Laden der Klausurdetails" });
    }
});

app.get('/api/leaderboard', authenticateToken, (req, res) => {
    try {
        // We can just use getAllUsers and sort them, or write a new query in db.
        const users = db.getAllUsers().sort((a, b) => b.xp - a.xp).slice(0, 50); // top 50
        res.json({ success: true, leaderboard: users.map((u, i) => ({ rank: i + 1, username: u.username, xp: u.xp, streak: u.streak, is_admin: u.is_admin })) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Fehler beim Laden des Leaderboards" });
    }
});
