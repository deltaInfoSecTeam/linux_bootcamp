const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const db = new Database(path.join(__dirname, 'bootcamp.db'));

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
    is_admin INTEGER DEFAULT 0
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

try {
  db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
} catch (e) {}

function generateRecoveryCode() {
    return 'ROOT-' + crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

module.exports = {
  getUserByUsername: (username) => {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },
  
  getUserById: (id) => {
    return db.prepare('SELECT id, username, xp, streak, answered_total, correct_total, time_played_total, last_played, llm_config, is_banned, is_admin FROM users WHERE id = ?').get(id);
  },
  
  createUser: (username, passwordHash) => {
    const code = generateRecoveryCode();
    const stmt = db.prepare('INSERT INTO users (username, password_hash, recovery_code, xp, streak, answered_total, correct_total, time_played_total, is_banned) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0)');
    const info = stmt.run(username, passwordHash, code);
    return { id: info.lastInsertRowid, recovery_code: code };
  },
  
  updatePassword: (userId, newHash) => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);
  },

  getAllUsers: () => {
    return db.prepare('SELECT id, username, xp, streak, answered_total, is_banned, is_admin, created_at FROM users').all();
  },


  toggleAdmin: (userId, isAdmin) => {
    db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, userId);
  },

  toggleBan: (userId, isBanned) => {
    db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(isBanned ? 1 : 0, userId);
  },

  updateLlmConfig: (userId, configStr) => {
    const stmt = db.prepare('UPDATE users SET llm_config = ? WHERE id = ?');
    stmt.run(configStr, userId);
  },
  
  updateStats: (userId, xpAdd, newStreak, answeredAdd, correctAdd, timePlayedAdd, newLastPlayed) => {
    const stmt = db.prepare(`
        UPDATE users 
        SET xp = xp + ?, 
            streak = ?, 
            answered_total = answered_total + ?, 
            correct_total = correct_total + ?,
            time_played_total = time_played_total + ?,
            last_played = ? 
        WHERE id = ?
    `);
    stmt.run(xpAdd, newStreak, answeredAdd, correctAdd, timePlayedAdd, newLastPlayed, userId);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  },
  
  
    saveExam: (userId, grade, score, maxScore, examData) => {
        const stmt = db.prepare('INSERT INTO exams (user_id, date_played, grade, score, max_score, exam_data) VALUES (?, datetime("now"), ?, ?, ?, ?)');
        stmt.run(userId, grade, score, maxScore, JSON.stringify(examData));
    },
    
    getAllExamsAdmin: () => {
        return db.prepare('SELECT e.id, e.user_id, e.date_played, e.grade, e.score, e.max_score, u.username FROM exams e JOIN users u ON e.user_id = u.id ORDER BY e.id DESC').all();
    },

    getUserExams: (userId) => {
        return db.prepare('SELECT id, date_played, grade, score, max_score FROM exams WHERE user_id = ? ORDER BY id ASC').all(userId);
    },
    
    getExamDetailsAdmin: (examId) => {
        return db.prepare('SELECT exam_data FROM exams WHERE id = ?').get(examId);
    },

    getExamDetails: (userId, examId) => {
        return db.prepare('SELECT exam_data FROM exams WHERE id = ? AND user_id = ?').get(examId, userId);
    },

    getUserRank: (userId) => {
    // Get user XP first
    const user = db.prepare('SELECT xp FROM users WHERE id = ?').get(userId);
    if (!user) return null;
    const rank = db.prepare('SELECT COUNT(*) + 1 AS rank FROM users WHERE xp > ?').get(user.xp);
    return rank.rank;
  }
};
