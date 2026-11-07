// Routen für den angemeldeten Nutzer: Profil, Stats, Einstellungen, Klausuren, Leaderboard
const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { isIntInRange, toId, optionalString } = require('../validation');

const router = express.Router();
router.use(authenticateToken);

const MAX_EXAM_QUESTIONS = 100;
const MAX_EXAM_JSON_BYTES = 200 * 1024;

function isFiniteInRange(value, min, max) {
    return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

router.get('/user', (req, res) => {
    const user = db.getUserById(req.user.id);
    user.rank = db.getUserRank(user.id);
    delete user.token_version;
    res.json(user);
});

// Sync XP & Stats (Plausibilitätsprüfung gegen offensichtliches Cheating)
router.post('/sync', (req, res) => {
    const { xpToAdd, streak, answeredAdd, correctAdd, timePlayedAdd, lastPlayed } = req.body || {};
    if (!isFiniteInRange(xpToAdd, 0, 1000)) {
        return res.status(400).json({ error: 'Ungültige XP Menge (maximal 1000 XP pro Sync erlaubt)' });
    }
    const safeStreak = isIntInRange(streak, 0, 10000) ? streak : 0;
    const safeAns = isIntInRange(answeredAdd, 0, 50) ? answeredAdd : 0;
    const safeCor = isIntInRange(correctAdd, 0, safeAns) ? correctAdd : 0;
    const safeTime = isFiniteInRange(timePlayedAdd, 0, 3600) ? timePlayedAdd : 0;
    const safeLast = (typeof lastPlayed === 'number' && Number.isFinite(lastPlayed)) ? String(lastPlayed)
        : (typeof lastPlayed === 'string' && lastPlayed.length <= 40 ? lastPlayed : null);

    const updated = db.updateStats(req.user.id, Math.round(xpToAdd), safeStreak, safeAns, safeCor, Math.round(safeTime), safeLast);
    updated.rank = db.getUserRank(req.user.id);
    delete updated.token_version;
    res.json({ success: true, user: updated });
});

router.post('/settings', (req, res) => {
    const cfg = req.body?.llmConfig;
    if (!cfg) return res.json({ success: true });
    if (typeof cfg !== 'object' || Array.isArray(cfg)) {
        return res.status(400).json({ error: 'Ungültige Einstellungen' });
    }
    const clean = {
        provider: optionalString(cfg.provider, 50),
        url: optionalString(cfg.url, 500),
        model: optionalString(cfg.model, 200),
        key: optionalString(cfg.key, 500),
    };
    if (Object.values(clean).some(v => v === null)) {
        return res.status(400).json({ error: 'Ungültige Einstellungen' });
    }
    if (clean.url && !/^https?:\/\//i.test(clean.url)) {
        return res.status(400).json({ error: 'Die API-URL muss mit http:// oder https:// beginnen' });
    }
    db.updateLlmConfig(req.user.id, JSON.stringify(clean));
    res.json({ success: true });
});

router.post('/exams', (req, res) => {
    const { score, maxScore, examData } = req.body || {};
    const grade = Number(req.body?.grade);
    if (!isIntInRange(grade, 1, 6)) return res.status(400).json({ error: 'Ungültige Note' });
    if (!isIntInRange(maxScore, 1, MAX_EXAM_QUESTIONS * 10) || !isFiniteInRange(score, 0, maxScore)) {
        return res.status(400).json({ error: 'Ungültige Punktzahl' });
    }
    if (!Array.isArray(examData) || examData.length > MAX_EXAM_QUESTIONS
        || Buffer.byteLength(JSON.stringify(examData)) > MAX_EXAM_JSON_BYTES) {
        return res.status(400).json({ error: 'Ungültige Klausurdaten' });
    }
    db.saveExam(req.user.id, grade, score, maxScore, examData);
    res.json({ success: true });
});

router.get('/exams', (req, res) => {
    res.json({ success: true, exams: db.getUserExams(req.user.id) });
});

router.get('/exams/:id', (req, res) => {
    const examId = toId(req.params.id);
    const exam = examId && db.getExamDetails(req.user.id, examId);
    if (!exam) return res.status(404).json({ error: 'Klausur nicht gefunden' });
    let examData = [];
    try { examData = JSON.parse(exam.exam_data); } catch { /* defekte Altdaten */ }
    res.json({ success: true, examData });
});

router.get('/leaderboard', (req, res) => {
    const leaderboard = db.getLeaderboard(50).map((u, i) => ({
        rank: i + 1, username: u.username, xp: u.xp, streak: u.streak, is_admin: u.is_admin,
    }));
    res.json({ success: true, leaderboard });
});

module.exports = router;
