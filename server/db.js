const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { DB_PATH, ROOT_DIR } = require('./config');
const {
    generateRecoveryCode, hashRecoveryCode, verifyRecoveryCode, isHashedRecoveryCode, encrypt, decrypt,
} = require('./crypto');

// Einmalige Migration: alte DB aus dem Projektwurzelverzeichnis übernehmen
const legacyDb = path.join(ROOT_DIR, 'bootcamp.db');
if (!fs.existsSync(DB_PATH) && fs.existsSync(legacyDb) && fs.statSync(legacyDb).size > 0) {
    fs.copyFileSync(legacyDb, DB_PATH);
    console.log(`Alte Datenbank nach ${DB_PATH} übernommen. ${legacyDb} kann gelöscht werden.`);
}

const db = new Database(DB_PATH);
fs.chmodSync(DB_PATH, 0o600);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    answered_total INTEGER DEFAULT 0,
    correct_total INTEGER DEFAULT 0,
    time_played_total INTEGER DEFAULT 0,
    last_played TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    llm_config TEXT,
    recovery_code TEXT,
    is_banned INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    token_version INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date_played DATETIME DEFAULT CURRENT_TIMESTAMP,
    grade INTEGER NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    exam_data TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Zentral gepflegte Inhalte (Management / Content): eigene Fragen für alle Lernenden und
// ausgeblendete Module/Kapitel des eingebauten Katalogs. Die Frage selbst liegt als JSON in "data".
db.exec(`
  CREATE TABLE IF NOT EXISTS content_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    module TEXT NOT NULL,
    data TEXT NOT NULL,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_content_questions_category ON content_questions(category);
  CREATE INDEX IF NOT EXISTS idx_content_questions_module ON content_questions(module);
  CREATE TABLE IF NOT EXISTS content_hidden (
    kind TEXT NOT NULL CHECK (kind IN ('module', 'chapter')),
    key TEXT NOT NULL,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (kind, key)
  );
`);

// Spalten für ältere Datenbanken nachrüsten
const userColumns = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
for (const [col, def] of [['is_admin', 'INTEGER DEFAULT 0'], ['token_version', 'INTEGER DEFAULT 0']]) {
    if (!userColumns.includes(col)) db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
}

// Altbestand: Klartext-Recovery-Codes hashen und LLM-Konfigurationen verschlüsseln
db.transaction(() => {
    const rows = db.prepare('SELECT id, recovery_code, llm_config FROM users').all();
    const setCode = db.prepare('UPDATE users SET recovery_code = ? WHERE id = ?');
    const setCfg = db.prepare('UPDATE users SET llm_config = ? WHERE id = ?');
    for (const r of rows) {
        if (r.recovery_code && !isHashedRecoveryCode(r.recovery_code)) setCode.run(hashRecoveryCode(r.recovery_code), r.id);
        if (r.llm_config && !String(r.llm_config).startsWith('enc:')) setCfg.run(encrypt(r.llm_config), r.id);
    }
})();

// Nur diese Felder verlassen jemals den Server (nie password_hash / recovery_code)
const PUBLIC_USER_FIELDS = 'id, username, xp, streak, answered_total, correct_total, time_played_total, last_played, llm_config, is_banned, is_admin, token_version';

function withDecryptedConfig(user) {
    if (user) user.llm_config = decrypt(user.llm_config);
    return user;
}

module.exports = {
    // Enthält password_hash – nur für Login/Reset verwenden, nie direkt ausliefern
    getAuthUserByUsername: (username) =>
        db.prepare('SELECT * FROM users WHERE username = ?').get(username),

    getUserById: (id) =>
        withDecryptedConfig(db.prepare(`SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = ?`).get(id)),

    getUserByUsername: (username) =>
        withDecryptedConfig(db.prepare(`SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE username = ?`).get(username)),

    createUser: (username, passwordHash, { isAdmin = false } = {}) => {
        const code = generateRecoveryCode();
        const info = db.prepare(
            'INSERT INTO users (username, password_hash, recovery_code, is_admin) VALUES (?, ?, ?, ?)'
        ).run(username, passwordHash, hashRecoveryCode(code), isAdmin ? 1 : 0);
        return { id: Number(info.lastInsertRowid), recovery_code: code };
    },

    verifyRecoveryCode: (user, code) => verifyRecoveryCode(code, user.recovery_code),

    hasAdmin: () => !!db.prepare('SELECT 1 FROM users WHERE is_admin = 1 LIMIT 1').get(),

    // Notfall-Reset (CLI): neues Passwort und neuer Recovery-Code, alle Sitzungen ungültig
    resetCredentials: (userId, passwordHash) => {
        const code = generateRecoveryCode();
        db.prepare(
            'UPDATE users SET password_hash = ?, recovery_code = ?, token_version = token_version + 1 WHERE id = ?'
        ).run(passwordHash, hashRecoveryCode(code), userId);
        return code;
    },

    // Neues Passwort setzen und alle bestehenden Sitzungen (JWTs) ungültig machen
    updatePassword: (userId, newHash) => {
        db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?').run(newHash, userId);
    },

    getAllUsers: () =>
        db.prepare('SELECT id, username, xp, streak, answered_total, is_banned, is_admin, created_at FROM users').all(),

    getLeaderboard: (limit = 50) =>
        db.prepare('SELECT username, xp, streak, is_admin FROM users WHERE is_banned = 0 ORDER BY xp DESC LIMIT ?').all(limit),

    toggleAdmin: (userId, isAdmin) => {
        return db.prepare('UPDATE users SET is_admin = ?, token_version = token_version + 1 WHERE id = ?').run(isAdmin ? 1 : 0, userId).changes;
    },

    toggleBan: (userId, isBanned) => {
        return db.prepare('UPDATE users SET is_banned = ?, token_version = token_version + 1 WHERE id = ?').run(isBanned ? 1 : 0, userId).changes;
    },

    updateLlmConfig: (userId, configStr) => {
        db.prepare('UPDATE users SET llm_config = ? WHERE id = ?').run(encrypt(configStr), userId);
    },

    updateStats: (userId, xpAdd, newStreak, answeredAdd, correctAdd, timePlayedAdd, newLastPlayed) => {
        db.prepare(`
            UPDATE users
            SET xp = xp + ?,
                streak = ?,
                answered_total = answered_total + ?,
                correct_total = correct_total + ?,
                time_played_total = time_played_total + ?,
                last_played = ?
            WHERE id = ?
        `).run(xpAdd, newStreak, answeredAdd, correctAdd, timePlayedAdd, newLastPlayed, userId);
        return module.exports.getUserById(userId);
    },

    saveExam: (userId, grade, score, maxScore, examData) => {
        db.prepare(
            "INSERT INTO exams (user_id, date_played, grade, score, max_score, exam_data) VALUES (?, datetime('now'), ?, ?, ?, ?)"
        ).run(userId, grade, score, maxScore, JSON.stringify(examData));
    },

    getAllExamsAdmin: () =>
        db.prepare('SELECT e.id, e.user_id, e.date_played, e.grade, e.score, e.max_score, u.username FROM exams e JOIN users u ON e.user_id = u.id ORDER BY e.id DESC').all(),

    getUserExams: (userId) =>
        db.prepare('SELECT id, date_played, grade, score, max_score FROM exams WHERE user_id = ? ORDER BY id ASC').all(userId),

    getExamDetailsAdmin: (examId) =>
        db.prepare('SELECT exam_data FROM exams WHERE id = ?').get(examId),

    getExamDetails: (userId, examId) =>
        db.prepare('SELECT exam_data FROM exams WHERE id = ? AND user_id = ?').get(examId, userId),

    getUserRank: (userId) => {
        const user = db.prepare('SELECT xp FROM users WHERE id = ?').get(userId);
        if (!user) return null;
        return db.prepare('SELECT COUNT(*) + 1 AS rank FROM users WHERE xp > ?').get(user.xp).rank;
    },

    // --- Inhalte (Management / Content) ---
    listContent: () => ({
        questions: db.prepare('SELECT id, data FROM content_questions ORDER BY id').all()
            .map(r => { try { return { ...JSON.parse(r.data), contentId: r.id }; } catch { return null; } })
            .filter(Boolean),
        hidden: {
            modules: db.prepare("SELECT key FROM content_hidden WHERE kind = 'module' ORDER BY key").all().map(r => r.key),
            chapters: db.prepare("SELECT key FROM content_hidden WHERE kind = 'chapter' ORDER BY key").all().map(r => r.key),
        },
    }),

    addContentQuestions: (questions, username) => {
        const ins = db.prepare('INSERT INTO content_questions (category, module, data, created_by) VALUES (?, ?, ?, ?)');
        db.transaction(() => {
            for (const q of questions) ins.run(q.category, q.module, JSON.stringify(q.data), username);
        })();
        return questions.length;
    },

    // Löscht eigene Fragen eines Kapitels bzw. Moduls und blendet eingebaute aus
    hideContent: (kind, key, username) => db.transaction(() => {
        const removed = db.prepare(`DELETE FROM content_questions WHERE ${kind === 'module' ? 'module' : 'category'} = ?`).run(key).changes;
        db.prepare('INSERT OR IGNORE INTO content_hidden (kind, key, created_by) VALUES (?, ?, ?)').run(kind, key, username);
        return removed;
    })(),

    restoreHiddenContent: () => db.prepare('DELETE FROM content_hidden').run().changes,

    close: () => db.close(),
};
