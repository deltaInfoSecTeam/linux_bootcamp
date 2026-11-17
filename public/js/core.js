// Kern: Sitzungsstatistik, Storage, State, UI-Elemente, Markdown, Toast

let sessionAnswered = 0;
let sessionCorrect = 0;

function updateSessionStatsUI() {
    const elAnswered = document.getElementById('stat-session-answered');
    const elPercent = document.getElementById('stat-session-percent');
    if (elAnswered) elAnswered.textContent = sessionAnswered;
    const elRemaining = document.getElementById('stat-remaining');
    if (elRemaining) {
        elRemaining.textContent = Math.max(0, state.filteredQuestions.length - sessionAnswered);
    }
    if (elPercent) {
        elPercent.textContent = sessionAnswered > 0 ? Math.round((sessionCorrect / sessionAnswered) * 100) + '%' : '0%';
    }
}

// Storage Helper to prevent crash on file:// protocol in some browsers
const safeStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("localStorage is not available (e.g. running from file://). Falling back to session memory.", e);
            return this._fallback[key] || null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("localStorage is not available (e.g. running from file://). Falling back to session memory.", e);
            this._fallback[key] = value;
        }
    },
    _fallback: {}
};

// App State
let state = {
    mode: 'quiz',
    examScore: 0,
    examMistakes: [],
    examStartTime: null,
    examFinished: false, // 'quiz' or 'flashcard'
    difficulty: 'auto', // 'auto', 'leicht', 'mittel', 'schwer'
    currentDifficulty: 'mittel', // Die aktuell ausgewählte Schwierigkeit für die nächste Frage
    currentQuestionStartTime: 0,
    currentIndex: 0,
    filteredQuestions: [],
    selectedCategories: new Set(['all']),
    llmConfig: {
        url: '',
        model: '',
        key: ''
    },
    stats: {
        points: 0,
        possiblePoints: 0,
        answered: 0,
        streak: 0,
        lastPlayed: null,
        adaptiveHistory: []
    }
};

// UI Elements
const el = {
    btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
    btnQuiz: document.getElementById('mode-quiz'),
    btnFlashcard: document.getElementById('mode-flashcard'),
    btnDiffAuto: document.getElementById('diff-auto'),
    btnDiffLeicht: document.getElementById('diff-leicht'),
    btnDiffMittel: document.getElementById('diff-mittel'),
    btnDiffSchwer: document.getElementById('diff-schwer'),
    diffBubbleVal: document.getElementById('difficulty-val'),
    diffBubble: document.getElementById('diff-bubble'),
    catList: document.getElementById('dynamic-modules-container'),
    catAll: document.getElementById('cat-all'),
    questionText: document.getElementById('question-text'),
    answerContainer: document.getElementById('answer-container'),
    answerText: document.getElementById('answer-text'),
    btnReveal: document.getElementById('btn-reveal'),
    btnIdk: document.getElementById('btn-idk'),
    ratingControls: document.getElementById('rating-controls'),
    btnFcNext: document.getElementById('btn-fc-next'),
    btnPrev: document.getElementById('btn-prev'),
    btnSkip: document.getElementById('btn-skip'),
    btnMoreInfo: document.getElementById('btn-more-info'),
    moreInfoWrapper: document.getElementById('more-info-wrapper'),
    moreInfoContent: document.getElementById('more-info-content'),
    moreInfoText: document.getElementById('more-info-text'),
    progressText: document.getElementById('question-progress-text'),
    categoryBadge: document.getElementById('question-category-badge'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    streakVal: document.getElementById('streak-val'),
    progressPercent: document.getElementById('progress-percent'),
    statPoints: document.getElementById('stat-points'),
    statAccuracy: document.getElementById('stat-accuracy'),
    toastContainer: document.getElementById('toast-container'),
    card: document.getElementById('quiz-card'),
    userAnswer: document.getElementById('user-answer'),
    feedbackContainer: document.getElementById('feedback-container'),
    feedbackBadge: document.getElementById('feedback-badge'),
    feedbackDetails: document.getElementById('feedback-details'),
    userInputGroup: document.getElementById('user-input-group'),
    inputApiUrl: document.getElementById('llm-api-url'),
    inputProvider: document.getElementById('llm-provider'),
    inputModel: document.getElementById('llm-model'),
    inputApiKey: document.getElementById('llm-api-key'),
    btnSaveKey: document.getElementById('btn-save-key'),
    apiStatusLight: document.getElementById('api-status-light'),
    apiStatusText: document.getElementById('api-status-text'),
    btnTestApi: document.getElementById('btn-test-api')
};

function parseMarkdown(text) {
    if (!text) return '';

    const escapeHtml = (str) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    // Platzhalter mit Steuerzeichen, die im Text selbst nicht vorkommen dürfen
    const PH = '\u0000';
    let src = String(text).replace(/\u0000/g, '').replace(/\r\n?/g, '\n');

    // 1) Codeblöcke ```sprache ... ``` zuerst herausnehmen: Sie dürfen weder von
    //    Fett/Kursiv noch von der Listenlogik verändert werden. Auch eingerückte
    //    Blöcke (innerhalb von Aufzählungen) werden erkannt, die Sprachkennung
    //    ("bash", "python" …) wird nicht als Code angezeigt.
    const blocks = [];
    src = src.replace(/^([ \t]*)```[ \t]*([\w+#.-]*)[^\n]*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm, (m, indent, lang, code) => {
        let lines = code.replace(/\n$/, '').split('\n');
        if (indent) lines = lines.map(l => (l.startsWith(indent) ? l.slice(indent.length) : l));
        const langAttr = lang ? ` data-lang="${escapeHtml(lang)}"` : '';
        blocks.push(`<pre><code${langAttr}>${escapeHtml(lines.join('\n'))}</code></pre>`);
        return `\n\n${PH}B${blocks.length - 1}${PH}\n\n`;
    });
    // Einzeilige ```code``` ohne Zeilenumbruch
    src = src.replace(/```([^`\n]+)```/g, (m, code) => {
        blocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
        return `\n\n${PH}B${blocks.length - 1}${PH}\n\n`;
    });

    // 2) Inline-Code `...` ebenfalls schützen (z.B. -name "*.log")
    const inlines = [];
    src = src.replace(/`([^`\n]+)`/g, (m, code) => {
        inlines.push(`<code>${escapeHtml(code)}</code>`);
        return `${PH}I${inlines.length - 1}${PH}`;
    });

    // 3) Restlichen Text escapen, danach die Markdown-Regeln
    let html = escapeHtml(src);

    // Blockquotes (beginnen mit &gt; wegen des Escapings)
    html = html.replace(/(?:^|\n)&gt;[ \t]*(.*(?:\n&gt;[ \t]*.*)*)/g, (match, p1) => {
        const cleanContent = p1.replace(/\n&gt;[ \t]*/g, '<br>');
        return `\n<blockquote>${cleanContent}</blockquote>\n`;
    });

    // Fett **text** und kursiv *text* / _text_ – nur innerhalb einer Zeile und nicht
    // an Leerzeichen angrenzend, damit Aufzählungen ("* Punkt") nicht kaputtgehen
    html = html.replace(/\*\*(?=\S)([^\n]*?\S)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^\w*])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?!\w)/g, '$1<em>$2</em>');
    html = html.replace(/(^|[^\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '$1<em>$2</em>');

    // Überschriften
    html = html.replace(/^#### (.*$)/gm, '<h5>$1</h5>');
    html = html.replace(/^### (.*$)/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.*$)/gm, '<h2>$1</h2>');

    // Trennlinien
    html = html.replace(/^[ \t]*(?:---|\*\*\*)[ \t]*$/gm, '<hr>');

    // Listen ("* ", "- ", "1. ")
    const isBlockPlaceholder = (line) => new RegExp(`^${PH}B\\d+${PH}$`).test(line.trim());
    const lines = html.split('\n');
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (lines[i].includes('<blockquote>')) continue;
        if (isBlockPlaceholder(lines[i])) {
            // Codeblock unterbricht die Liste sauber (kein </ul> mitten im Code)
            if (inList) { lines[i] = '</ul>\n' + trimmed; inList = false; }
            continue;
        }
        if (/^(\* |- |\d+\.\s)/.test(trimmed)) {
            const itemContent = trimmed.replace(/^(\* |- |\d+\.\s)/, '');
            lines[i] = (inList ? '' : '<ul>') + '<li>' + itemContent + '</li>';
            inList = true;
        } else if (inList && trimmed !== '') {
            lines[i] = '</ul>\n' + lines[i];
            inList = false;
        } else if (inList && trimmed === '') {
            // Leerzeile zwischen Listenpunkten: Liste offen lassen, Zeile entfernen
            const next = lines.slice(i + 1).find(l => l.trim() !== '');
            if (next && /^(\* |- |\d+\.\s)/.test(next.trim())) { lines[i] = ''; continue; }
            lines[i] = '</ul>';
            inList = false;
        }
    }
    if (inList) lines.push('</ul>');
    html = lines.join('\n');

    // Absätze: Leerzeilen trennen; Zeilen mit Blockelementen (Listen, Überschriften,
    // Zitate, Codeblöcke) stehen für sich, nur reiner Text wird in <p> gepackt
    const isBlockLine = (t) => t.startsWith(PH + 'B')
        || /^<\/?(ul|ol|li|h[2-5]|blockquote|hr|pre)\b/.test(t);
    html = html.split(/\n\s*\n/).map(p => {
        const out = [];
        let buf = [];
        const flush = () => { if (buf.length) out.push(`<p>${buf.join('<br>')}</p>`); buf = []; };
        for (const line of p.split('\n')) {
            const t = line.trim();
            if (!t) continue;
            if (isBlockLine(t)) { flush(); out.push(t); } else { buf.push(t); }
        }
        flush();
        return out.join('\n');
    }).filter(Boolean).join('\n');

    // 4) Geschützte Teile wieder einsetzen
    html = html.replace(new RegExp(`${PH}I(\\d+)${PH}`, 'g'), (m, i) => inlines[Number(i)] || '');
    html = html.replace(new RegExp(`${PH}B(\\d+)${PH}`, 'g'), (m, i) => blocks[Number(i)] || '');
    return html;
}

// Show Toast message
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    // Status mark instead of an emoji (deltaInfoSec CD: .dis-mark)
    let mark = ['info', 'ii'];
    if (type === 'success') mark = ['ok', 'OK'];
    if (type === 'warning') mark = ['warn', '!!'];
    if (type === 'danger' || type === 'error') mark = ['fail', 'FAIL'];

    const iconEl = document.createElement('span');
    iconEl.className = `toast-icon dis-mark dis-mark--${mark[0]}`;
    iconEl.textContent = mark[1];
    const msgEl = document.createElement('span');
    msgEl.textContent = message;
    toast.append(iconEl, ' ', msgEl);
    el.toastContainer.appendChild(toast);
    
    // Fehler sollen 10 Sekunden sichtbar bleiben, alles andere 3 Sekunden.
    const duration = (type === 'danger' || type === 'error') ? 10000 : 3000;
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

