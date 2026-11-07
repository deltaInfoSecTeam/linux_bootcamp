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
    
    // Escape HTML first
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Code blocks ```code```
    html = html.replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>');

    // Blockquotes (starts with &gt; because of HTML escaping above)
    // We group multiple consecutive blockquote lines into one blockquote tag
    html = html.replace(/(?:^|\n)&gt;[ \t]*(.*(?:\n&gt;[ \t]*.*)*)/g, (match, p1) => {
        const cleanContent = p1.replace(/\n&gt;[ \t]*/g, '<br>');
        return `\n<blockquote>${cleanContent}</blockquote>\n`;
    });

    // Bold text **text**
    html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text *text* or _text_
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

    // Headers
    html = html.replace(/^### (.*$)/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.*$)/gm, '<h2>$1</h2>');

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Lists (bullet points starting with "* " or "- ")
    const lines = html.split('\n');
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
        // Skip list processing inside pre/code or blockquotes
        if (lines[i].includes('<pre>') || lines[i].includes('<blockquote>')) continue;
        
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
            let itemContent = trimmed.replace(/^(\* |- |\d+\.\s)/, '');
            if (!inList) {
                lines[i] = '<ul><li>' + itemContent + '</li>';
                inList = true;
            } else {
                lines[i] = '<li>' + itemContent + '</li>';
            }
        } else {
            if (inList) {
                // If line is empty, close list. If not empty, maybe it's a new paragraph?
                lines[i] = '</ul>\n' + lines[i];
                inList = false;
            }
        }
    }
    
    if (inList) {
        lines.push('</ul>');
    }
    
    html = lines.join('\n');
    
    // Convert double newlines to paragraphs (very basic)
    html = html.split(/\n\s*\n/).map(p => {
        if (p.trim().startsWith('<') && !p.trim().startsWith('<strong>') && !p.trim().startsWith('<em>')) return p; // Don't wrap existing block elements
        return p.trim() ? `<p>${p.trim().replace(/\n/g, '<br>')}</p>` : '';
    }).join('\n');

    return html;
}

// Show Toast message
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'danger' || type === 'error') icon = '❌';
    
    const iconEl = document.createElement('span');
    iconEl.className = 'toast-icon';
    iconEl.textContent = icon;
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

