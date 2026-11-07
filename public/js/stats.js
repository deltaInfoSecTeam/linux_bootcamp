// Statistik, Streak, Schwierigkeit, Bewertung
// Stats and LocalStorage management
// Abgeschaltete Modell-IDs der Anbieter -> offizieller Nachfolger.
// Gespeicherte Einstellungen werden beim Laden automatisch umgestellt.
const RETIRED_MODELS = {
    'llama-3.3-70b-versatile': 'openai/gpt-oss-120b',   // Groq, abgeschaltet 16.08.2026
    'llama-3.1-8b-instant': 'openai/gpt-oss-20b',        // Groq, abgeschaltet 16.08.2026
    'gemini-3.7-flash': 'gemini-3.8-flash',              // Google, abgekündigt 08.10.2026
    'gemini-3.5-flash': 'gemini-3.8-flash',              // Google, abgekündigt 08.10.2026
    'grok-2-latest': 'grok-4.3',                         // xAI
    'grok-2': 'grok-4.3'                                 // xAI
};

function migrateLlmConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return cfg;
    let changed = false;
    if (cfg.model && RETIRED_MODELS[cfg.model]) {
        cfg.model = RETIRED_MODELS[cfg.model];
        changed = true;
    }
    // Metas Llama API wurde eingestellt; URL und Modell bleiben als benutzerdefiniert erhalten
    if (cfg.provider === 'llama_api') {
        cfg.provider = 'custom';
        changed = true;
    }
    if (changed) safeStorage.setItem('llm_config', JSON.stringify(cfg));
    return cfg;
}

function loadStats() {
    const saved = safeStorage.getItem('linux_quiz_stats_v2');
    if (saved) {
        state.stats = JSON.parse(saved);
        if (!state.stats.adaptiveHistory) state.stats.adaptiveHistory = [];
        checkStreak();
    } else {
        state.stats = {
            pointsSelf: 0,
            pointsAI: 0,
            possiblePoints: 0,
            answered: 0,
            streak: 0,
            lastPlayed: null,
            adaptiveHistory: []
        };
    }
    // Load LLM Config
    
    window.reloadLlmConfig = () => {
        const cfg = safeStorage.getItem('llm_config');
        if (cfg) {
            try {
                state.llmConfig = migrateLlmConfig(JSON.parse(cfg));
                el.inputApiUrl.value = state.llmConfig.url || '';
                el.inputModel.value = state.llmConfig.model || '';
                el.inputApiKey.value = state.llmConfig.key || '';
                if (state.llmConfig.provider) {
                    el.inputProvider.value = state.llmConfig.provider;
                    if (state.llmConfig.provider === 'custom') {
                        el.inputApiUrl.style.display = 'block';
                    }
                }
                resetApiUI();
            } catch(e){}
        }
    };

    const llmCfg = safeStorage.getItem('llm_config');
    if (llmCfg) {
        try {
            state.llmConfig = migrateLlmConfig(JSON.parse(llmCfg));
            el.inputApiUrl.value = state.llmConfig.url || '';
            el.inputModel.value = state.llmConfig.model || '';
            el.inputApiKey.value = state.llmConfig.key || '';
            if (state.llmConfig.provider) {
                el.inputProvider.value = state.llmConfig.provider;
                if (state.llmConfig.provider === 'custom') {
                    el.inputApiUrl.style.display = 'block';
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
    
    updateStatsUI();
}

function saveStats() {
    safeStorage.setItem('linux_quiz_stats_v2', JSON.stringify(state.stats));
    updateStatsUI();
}

window.syncStateWithUser = function(user) {
    if (!user) {
        // Reset to local or zero
        state.stats.answered = 0;
        state.stats.streak = 0;
        state.stats.pointsSelf = 0;
        state.stats.lastPlayed = null;
    } else {
        state.stats.answered = user.answered_total || 0;
        state.stats.streak = user.streak || 0;
        state.stats.lastPlayed = user.last_played ? parseInt(user.last_played, 10) : null;
        // Keep pointsSelf local for now or derive from XP if needed
    }
    updateStatsUI();
};

function checkStreak() {
    if (!state.stats.lastPlayed) return;
    
    let lastTs = state.stats.lastPlayed;
    if (typeof lastTs === 'string') lastTs = parseInt(lastTs, 10);
    
    const today = new Date().toDateString();
    const last = new Date(lastTs).toDateString();
    
    if (today === last) return; // Already played today
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (last === yesterdayStr) {
        // Continuous play
        // Streak is incremented on first answer of the day, handled separately or kept here
    } else {
        // Streak broken
        state.stats.streak = 0;
    }
}

function updateStatsUI() {
    el.streakVal.textContent = `${state.stats.streak} Tage`;
    
    // Daily Stats
    const today = new Date().toDateString();
    let dailyAnswered = 0;
    let dailyPoints = 0;
    
    if (state.stats.dailyStats && state.stats.dailyStats.date === today) {
        dailyAnswered = state.stats.dailyStats.answered || 0;
        dailyPoints = state.stats.dailyStats.points || 0;
    }
    
    const dailyAccuracy = dailyAnswered > 0 ? Math.round((dailyPoints / dailyAnswered) * 100) : 0;
    
    const elDailyQ = document.getElementById('daily-q');
    const elDailyR = document.getElementById('daily-r');
    const elDailyP = document.getElementById('daily-p');
    
    if (elDailyQ && elDailyR && elDailyP) {
        elDailyQ.textContent = dailyAnswered;
        elDailyR.textContent = Number.isInteger(dailyPoints) ? dailyPoints : dailyPoints.toFixed(1);
        elDailyP.textContent = `${dailyAccuracy}%`;
        
        // Traffic light color coding for the percentage only
        if (dailyAnswered === 0) {
            elDailyP.style.color = 'var(--text-color)';
        } else if (dailyAccuracy === 100) {
            elDailyP.style.color = '#4ade80'; // Green
        } else if (dailyAccuracy >= 70) {
            elDailyP.style.color = '#eab308'; // Yellow
        } else {
            elDailyP.style.color = '#ef4444'; // Red
        }
    }
    
    // Separate Point displays
    const pSelf = state.stats.pointsSelf || 0;
    const pAI = state.stats.pointsAI || 0;
    const pPossible = state.stats.possiblePoints || 0;
    
    const statSelf = document.getElementById('stat-points-self');
    if(statSelf) statSelf.textContent = `${pSelf.toFixed(1)} / ${pPossible}`;
    
    const statAi = document.getElementById('stat-points-ai');
    if(statAi) statAi.textContent = `${pAI.toFixed(1)} / ${pPossible}`;
    
    const accuracy = pPossible > 0 
        ? Math.round((pSelf / pPossible) * 100)
        : 0;
    const statAcc = document.getElementById('stat-accuracy');
    if(statAcc) statAcc.textContent = `${accuracy}%`;
    
    const statAns = document.getElementById('stat-answered');
    if(statAns) statAns.textContent = state.stats.answered;

    const elTotalQ = document.getElementById('total-q');
    if (elTotalQ) elTotalQ.textContent = state.stats.answered;
}

function updateDifficultyUI() {
    if (el.btnDiffAuto) {
        el.btnDiffAuto.classList.toggle('active', state.difficulty === 'auto');
        el.btnDiffLeicht.classList.toggle('active', state.difficulty === 'leicht');
        el.btnDiffMittel.classList.toggle('active', state.difficulty === 'mittel');
        el.btnDiffSchwer.classList.toggle('active', state.difficulty === 'schwer');
    }
    if (el.diffBubbleVal) {
        let text = state.currentDifficulty.charAt(0).toUpperCase() + state.currentDifficulty.slice(1);
        if (state.difficulty === 'auto') text += ' (Auto)';
        el.diffBubbleVal.textContent = text;
        
        el.diffBubble.style.borderColor = 
            state.currentDifficulty === 'leicht' ? '#4ade80' : 
            state.currentDifficulty === 'mittel' ? '#eab308' : '#ef4444';
        el.diffBubbleVal.style.color = el.diffBubble.style.borderColor;
    }
}

function handleRating(pointsSelf, pointsAI, isFlagged = false) {
    const q = state.filteredQuestions[state.currentIndex];
    let difficultyWeight = 1;
    if (q && q.difficulty === 'medium') difficultyWeight = 2;
    if (q && q.difficulty === 'hard') difficultyWeight = 3;
    
    const scaledPointsSelf = pointsSelf * difficultyWeight;
    const scaledPointsAI = pointsAI * difficultyWeight;

    const today = new Date().toDateString();
    let lastTs = state.stats.lastPlayed;
    if (typeof lastTs === 'string') lastTs = parseInt(lastTs, 10);
    const last = lastTs ? new Date(lastTs).toDateString() : null;
    
    // Initialize or reset daily stats if it's a new day
    if (!state.stats.dailyStats || state.stats.dailyStats.date !== today) {
        state.stats.dailyStats = {
            date: today,
            answered: 0,
            points: 0
        };
    }
    
    if (last !== today) {
        state.stats.streak += 1;
        showToast(`Tägliche Serie aktiv! ${state.stats.streak} Tage 🔥`, 'success');
    }
    
    state.stats.lastPlayed = new Date().getTime();
    state.stats.pointsSelf += scaledPointsSelf;
    state.stats.pointsAI += scaledPointsAI;
    state.stats.possiblePoints += difficultyWeight;
    state.stats.answered += 1;
    sessionAnswered += 1;
    if (scaledPointsSelf > 0) sessionCorrect += 1;
    if (typeof updateSessionStatsUI === 'function') updateSessionStatsUI();
    
    // Update daily stats
    state.stats.dailyStats.answered += 1;
    state.stats.dailyStats.points += scaledPointsSelf;
    
    // Adaptive Logik
    if (state.difficulty === 'auto') {
        const timeTaken = (Date.now() - state.currentQuestionStartTime) / 1000;
        let score = 0;
        if (pointsSelf === 1.0 && timeTaken < 25) score = 1;
        else if (pointsSelf <= 0.5) score = -1;
        
        state.stats.adaptiveHistory.push(score);
        if (state.stats.adaptiveHistory.length > 5) {
            state.stats.adaptiveHistory.shift();
        }
        
        let diffChanged = false;
        if (state.stats.adaptiveHistory.length === 5) {
            const sum = state.stats.adaptiveHistory.reduce((a, b) => a + b, 0);
            if (sum === 5) {
                if (state.currentDifficulty === 'leicht') { state.currentDifficulty = 'mittel'; diffChanged = true; }
                else if (state.currentDifficulty === 'mittel') { state.currentDifficulty = 'schwer'; diffChanged = true; }
                if (diffChanged) state.stats.adaptiveHistory = [];
            } else if (sum === -5) {
                if (state.currentDifficulty === 'schwer') { state.currentDifficulty = 'mittel'; diffChanged = true; }
                else if (state.currentDifficulty === 'mittel') { state.currentDifficulty = 'leicht'; diffChanged = true; }
                if (diffChanged) state.stats.adaptiveHistory = [];
            }
        }
        if (diffChanged) {
            showToast("Schwierigkeit automatisch angepasst auf: " + state.currentDifficulty.toUpperCase(), "warning");
            updateDifficultyUI();
            updateFilteredQuestions();
            saveStats();
            if (typeof syncBackendXp === 'function') {
                syncBackendXp(scaledPointsSelf, state.stats.streak, 1, pointsSelf === 1 ? 1 : 0, 0, state.stats.lastPlayed);
            }
            setTimeout(() => {
                renderCurrentQuestion();
            }, 1000);
            return;
        }
    }

    saveStats();
    
    // Auth-Sync
    if (typeof syncBackendXp === 'function') {
        syncBackendXp(scaledPointsSelf, state.stats.streak, 1, pointsSelf === 1 ? 1 : 0, 0, state.stats.lastPlayed);
    }
    
    if (isFlagged) {
        showToast("🚩 Frage zum Nachlernen markiert. (Gewertet mit " + pointsSelf + " Pt)", "warning");
    } else {
        showToast("Gewertet: Du " + pointsSelf + " | KI " + pointsAI, 'info');
    }
    
    // Auto advance
    setTimeout(() => {
        if (state.currentIndex < state.filteredQuestions.length - 1) {
            state.currentIndex++;
            renderCurrentQuestion();
        } else {
            showToast("Quiz beendet! Du hast alle Fragen dieser Runde beantwortet.", "success");
            // Reshuffle and start over
            updateFilteredQuestions();
        }
    }, 800);
}

// Reset stats
function resetStats() {
    if (confirm("Möchtest du deine Lernstatistiken wirklich zurücksetzen?")) {
        state.stats = {
            pointsSelf: 0,
            pointsAI: 0,
            possiblePoints: 0,
            answered: 0,
            streak: 0,
            lastPlayed: null
        };
        saveStats();
        showToast("Statistik zurückgesetzt.", 'info');
    }
}

