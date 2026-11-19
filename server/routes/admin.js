const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { createRateLimiter } = require('../middleware/rateLimit');
const bcrypt = require('bcrypt');
const db = require('../db');
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { validatePassword, toId } = require('../validation');

const router = express.Router();
router.use(authenticateToken, adminOnly);

function parseExamData(raw) {
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

router.get('/exams', (req, res) => {
    res.json({ success: true, exams: db.getAllExamsAdmin() });
});

router.get('/exams/:id', (req, res) => {
    const examId = toId(req.params.id);
    const exam = examId && db.getExamDetailsAdmin(examId);
    if (!exam) return res.status(404).json({ error: 'Klausur nicht gefunden' });
    res.json({ success: true, examData: parseExamData(exam.exam_data) });
});

router.get('/users', (req, res) => {
    res.json(db.getAllUsers());
});

router.post('/admin_toggle', (req, res) => {
    const userId = toId(req.body?.userId);
    const isAdmin = req.body?.isAdmin === true;
    if (!userId) return res.status(400).json({ error: 'Ungültige Nutzer-ID' });
    if (userId === req.user.id && !isAdmin) {
        return res.status(400).json({ error: 'Du kannst dir deinen eigenen Admin-Status nicht entziehen.' });
    }
    if (!db.toggleAdmin(userId, isAdmin)) return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    res.json({ success: true });
});

router.post('/ban', (req, res) => {
    const userId = toId(req.body?.userId);
    const isBanned = req.body?.isBanned === true;
    if (!userId) return res.status(400).json({ error: 'Ungültige Nutzer-ID' });
    if (userId === req.user.id && isBanned) {
        return res.status(400).json({ error: 'Du kannst dich nicht selbst sperren.' });
    }
    if (!db.toggleBan(userId, isBanned)) return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    res.json({ success: true });
});

router.post('/reset_password', async (req, res) => {
    const userId = toId(req.body?.userId);
    if (!userId || !db.getUserById(userId)) return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    const p = validatePassword(req.body?.newPassword);
    if (p.error) return res.status(400).json({ error: p.error });
    try {
        db.updatePassword(userId, await bcrypt.hash(p.value, 12));
        res.json({ success: true });
    } catch (err) {
        console.error('Admin-Reset-Fehler:', err);
        res.status(500).json({ error: 'Fehler beim Zurücksetzen des Passworts' });
    }
});


// --- System: Update über den Host-Agenten (scripts/update-agent.sh) ---
// Der Container aktualisiert sich nicht selbst. Er legt nur einen Auftrag in data/update/ ab;
// der Agent auf dem Host führt ihn mit festen Befehlen aus und schreibt den Stand zurück.
const UPDATE_DIR = path.join(config.DATA_DIR, 'update');
const updateLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5, message: 'Zu viele Update-Anfragen. Bitte etwas warten.' });

function readUpdateFile(name, asJson = true) {
    try {
        const file = path.join(UPDATE_DIR, name);
        const st = fs.lstatSync(file);
        if (!st.isFile() || st.size > 200 * 1024) return null;
        const text = fs.readFileSync(file, 'utf8');
        return asJson ? JSON.parse(text) : text;
    } catch {
        return null;
    }
}

function placeRequest(name, user) {
    fs.mkdirSync(UPDATE_DIR, { recursive: true, mode: 0o755 });
    const file = path.join(UPDATE_DIR, name);
    try { if (fs.lstatSync(file).isSymbolicLink()) fs.unlinkSync(file); } catch { /* nicht vorhanden */ }
    fs.writeFileSync(file, String(user || '').replace(/[^A-Za-z0-9._@-]/g, '').slice(0, 40) + '\n', { mode: 0o644 });
}

router.get('/update', (req, res) => {
    const status = readUpdateFile('status.json');
    res.json({
        success: true,
        agent: !!(status && status.agent),
        status,
        run: readUpdateFile('run.json'),
        log: readUpdateFile('log.txt', false),
        pending: ['apply.req', 'check.req'].filter(n => fs.existsSync(path.join(UPDATE_DIR, n)))
    });
});

router.post('/update/check', updateLimiter, (req, res) => {
    try {
        placeRequest('check.req', req.user.username);
        res.json({ success: true });
    } catch (err) {
        console.error('Update-Prüfung konnte nicht angefordert werden:', err.message);
        res.status(500).json({ error: 'Auftrag konnte nicht abgelegt werden' });
    }
});

router.post('/update/apply', updateLimiter, (req, res) => {
    if (!readUpdateFile('status.json')) {
        return res.status(409).json({ error: 'Der Update-Agent ist auf dem Server nicht eingerichtet.' });
    }
    try {
        placeRequest('apply.req', req.user.username);
        console.log(`Update angefordert von ${req.user.username}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Update konnte nicht angefordert werden:', err.message);
        res.status(500).json({ error: 'Auftrag konnte nicht abgelegt werden' });
    }
});

module.exports = router;
