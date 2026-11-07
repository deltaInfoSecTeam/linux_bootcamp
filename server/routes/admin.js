const express = require('express');
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

module.exports = router;
