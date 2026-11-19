// Zentral gepflegte Inhalte (Management / Content)
//   GET  /api/content                 öffentlich: eigene Fragen und ausgeblendete Module/Kapitel
//   POST /api/admin/content/questions Admin: Fragen hinzufügen (Import, Generator, Übernahme aus dem Browser)
//   POST /api/admin/content/hide      Admin: Modul oder Kapitel für alle löschen bzw. ausblenden
//   POST /api/admin/content/restore   Admin: ausgeblendete eingebaute Module/Kapitel wieder einblenden
// Fragen sind keine Geheimnisse (auch im eingebauten Katalog öffentlich), schreiben dürfen nur Admins.
const express = require('express');
const db = require('../db');
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const MAX_QUESTIONS_PER_REQUEST = 500;
const LIMITS = { category: 120, question: 2000, answer: 4000, moreInfo: 20000, keyword: 60, solution: 300 };
const DIFFICULTIES = new Set(['leicht', 'mittel', 'schwer']);

// Modul eines Kategorie-Namens, wie es die Oberfläche gruppiert ("Git::1. Klon" -> "git()")
function moduleOf(category) {
    if (/^\d/.test(category)) return 'linux.basic()';
    const base = category.includes('::') ? category.split('::')[0] : category;
    const name = base.trim().toLowerCase().replace(/\s+/g, '.');
    return name.endsWith('()') ? name : name + '()';
}

const str = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const clean = v => String(v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');

// Eine Frage prüfen und auf bekannte Felder reduzieren; null bei ungültigen Daten
function normalizeQuestion(q) {
    if (!q || typeof q !== 'object') return null;
    if (!str(q.category, LIMITS.category) || !str(q.question, LIMITS.question) || !str(q.answer, LIMITS.answer)) return null;
    const out = {
        category: clean(q.category).trim(),
        question: clean(q.question),
        answer: clean(q.answer),
        difficulty: DIFFICULTIES.has(q.difficulty) ? q.difficulty : 'mittel',
        validationType: q.validationType === 'command' ? 'command' : 'concept',
    };
    if (out.category.includes('<') || out.category.includes('>')) return null;
    if (q.moreInfo !== undefined) {
        if (typeof q.moreInfo !== 'string' || q.moreInfo.length > LIMITS.moreInfo) return null;
        out.moreInfo = clean(q.moreInfo);
    }
    if (Array.isArray(q.keywords)) {
        out.keywords = q.keywords.filter(k => str(k, LIMITS.keyword)).slice(0, 20).map(clean);
    }
    if (out.validationType === 'command') {
        if (!Array.isArray(q.solutions) || q.solutions.length === 0 || q.solutions.length > 10) return null;
        const sols = [];
        for (const s of q.solutions) {
            if (!str(s, LIMITS.solution)) return null;
            try { new RegExp(s, 'i'); } catch { return null; }
            sols.push(s);
        }
        out.solutions = sols;
    }
    return out;
}

const publicRouter = express.Router();
const readLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 60, message: 'Zu viele Anfragen.' });
publicRouter.get('/', readLimiter, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, ...db.listContent() });
});

const adminRouter = express.Router();
adminRouter.use(authenticateToken, adminOnly);
const writeLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30, message: 'Zu viele Änderungen. Bitte kurz warten.' });

adminRouter.post('/questions', writeLimiter, (req, res) => {
    const list = Array.isArray(req.body?.questions) ? req.body.questions : null;
    if (!list || list.length === 0) return res.status(400).json({ error: 'Keine Fragen übergeben' });
    if (list.length > MAX_QUESTIONS_PER_REQUEST) {
        return res.status(400).json({ error: `Höchstens ${MAX_QUESTIONS_PER_REQUEST} Fragen auf einmal` });
    }
    const valid = [];
    let skipped = 0;
    for (const raw of list) {
        const q = normalizeQuestion(raw);
        if (q) valid.push({ category: q.category, module: moduleOf(q.category), data: q });
        else skipped++;
    }
    if (valid.length === 0) return res.status(400).json({ error: 'Keine gültige Frage gefunden', skipped });
    const added = db.addContentQuestions(valid, req.user.username);
    console.log(`Content: ${added} Fragen hinzugefügt von ${req.user.username}`);
    res.json({ success: true, added, skipped });
});

adminRouter.post('/hide', writeLimiter, (req, res) => {
    const kind = req.body?.kind;
    const key = req.body?.key;
    if (!['module', 'chapter'].includes(kind) || !str(key, LIMITS.category + 2)) {
        return res.status(400).json({ error: 'Ungültige Angabe' });
    }
    const removed = db.hideContent(kind, key.trim(), req.user.username);
    console.log(`Content: ${kind} "${key}" ausgeblendet von ${req.user.username} (${removed} eigene Fragen gelöscht)`);
    res.json({ success: true, removed });
});

adminRouter.post('/restore', writeLimiter, (req, res) => {
    const restored = db.restoreHiddenContent();
    console.log(`Content: ${restored} ausgeblendete Einträge wiederhergestellt von ${req.user.username}`);
    res.json({ success: true, restored });
});

module.exports = { publicRouter, adminRouter, normalizeQuestion, moduleOf };
