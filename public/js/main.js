// Event-Bindings, Einstellungen, eigene Fragen, Sprache, Init, Klausur
// Event Bindings
function bindEvents() {
    // Toggle Sidebar
    if (el.btnToggleSidebar) {
        el.btnToggleSidebar.addEventListener('click', () => {
            const layout = document.querySelector('.app-layout');
            layout.classList.toggle('sidebar-hidden');
            const isHidden = layout.classList.contains('sidebar-hidden');
            safeStorage.setItem('sidebar_hidden', isHidden ? 'true' : 'false');
        });
    }

    // KI-Status: öffnet die KI-Einstellungen in der Seitenleiste
    const btnAiStatus = document.getElementById('btn-ai-status');
    if (btnAiStatus) {
        btnAiStatus.addEventListener('click', () => {
            const layout = document.querySelector('.app-layout');
            if (layout.classList.contains('sidebar-hidden')) el.btnToggleSidebar.click();
            const section = el.inputProvider.closest('details');
            if (section) section.open = true;
            el.inputProvider.scrollIntoView({ block: 'center' });
            el.inputProvider.focus({ preventScroll: true });
        });
    }

    // Toggle Mode
    el.btnQuiz.addEventListener('click', () => {
        document.getElementById('exam-result-card').style.display = 'none';
        el.card.style.display = 'flex';
        document.getElementById('diff-auto').parentElement.parentElement.style.display = 'block';
        document.getElementById('mode-exam').classList.remove('active');
        state.mode = 'quiz';
        el.btnQuiz.classList.add('active');
        el.btnFlashcard.classList.remove('active');
        renderCurrentQuestion();
    });
    
    el.btnFlashcard.addEventListener('click', () => {
        document.getElementById('exam-result-card').style.display = 'none';
        el.card.style.display = 'flex';
        document.getElementById('diff-auto').parentElement.parentElement.style.display = 'block';
        document.getElementById('mode-exam').classList.remove('active');
        state.mode = 'flashcard';
        el.btnFlashcard.classList.add('active');
        el.btnQuiz.classList.remove('active');
        updateFilteredQuestions(); // fällige Karten nach vorn
    });
    
    document.getElementById('mode-exam').addEventListener('click', () => {
        state.mode = 'exam';
        state.examScore = 0;
        state.examMistakes = [];
        state.examStartTime = Date.now();
        state.examFinished = false;
        document.getElementById('mode-exam').classList.add('active');
        el.btnQuiz.classList.remove('active');
        el.btnFlashcard.classList.remove('active');
        
        // Hide exam result if visible
        document.getElementById('exam-result-card').style.display = 'none';
        el.card.style.display = 'flex';
        
        // Hide difficulty selection in exam mode
        document.getElementById('diff-auto').parentElement.parentElement.style.display = 'none';
        
        // Pick exactly 24 random questions
        const shuffled = [...QUESTIONS].sort(() => 0.5 - Math.random());
        state.filteredQuestions = shuffled.slice(0, Math.min(24, shuffled.length));
        state.currentIndex = 0;
        
        showToast("Prüfungssimulation gestartet: " + state.filteredQuestions.length + " Fragen.", 'success');
        if (typeof updateSessionStatsUI === 'function') {
            sessionAnswered = 0;
            sessionCorrect = 0;
            updateSessionStatsUI();
        }
        renderCurrentQuestion();
    });

    const setDifficulty = (diff) => {
        state.difficulty = diff;
        if (diff !== 'auto') state.currentDifficulty = diff;
        updateDifficultyUI();
        updateFilteredQuestions();
        renderCurrentQuestion();
    };

    if (el.btnDiffAuto) el.btnDiffAuto.addEventListener('click', () => setDifficulty('auto'));
    if (el.btnDiffLeicht) el.btnDiffLeicht.addEventListener('click', () => setDifficulty('leicht'));
    if (el.btnDiffMittel) el.btnDiffMittel.addEventListener('click', () => setDifficulty('mittel'));
    if (el.btnDiffSchwer) el.btnDiffSchwer.addEventListener('click', () => setDifficulty('schwer'));

    // Reveal Button
    el.btnReveal.addEventListener('click', revealAnswer);
    if (el.btnIdk) el.btnIdk.addEventListener('click', () => revealAnswer(true));
    if (el.btnMoreInfo) el.btnMoreInfo.addEventListener('click', fetchMoreInfo);

    // Rating Buttons
    // Lernkarten: Selbsteinschätzung steuert nur die Wiederholung (flashcards.js)
    const rate = (level, self) => () => (state.mode === 'flashcard'
        ? rateFlashcard(level)
        : handleRating(self, state.lastAIRatingValue || 0));
    document.getElementById('rate-wrong').addEventListener('click', rate('again', 0));
    document.getElementById('rate-partial').addEventListener('click', rate('unsure', 0.5));
    document.getElementById('rate-correct').addEventListener('click', rate('known', 1.0));
    
    // Confirm & Flag
    document.getElementById('btn-confirm-rating').addEventListener('click', () => handleRating(state.lastAIRatingValue || 0, state.lastAIRatingValue || 0));
    document.getElementById('btn-flag-review').addEventListener('click', () => handleRating(state.lastAIRatingValue || 0, state.lastAIRatingValue || 0, true));

    // Flashcard Next Button
    el.btnFcNext.addEventListener('click', () => {
        if (state.currentIndex < state.filteredQuestions.length - 1) {
            state.currentIndex++;
            renderCurrentQuestion();
        } else {
            showToast("Alle Karten durchgesehen! Wir mischen neu.", "success");
            updateFilteredQuestions();
        }
    });

    // Nav Controls
    el.btnPrev.addEventListener('click', () => {
        if (state.currentIndex > 0) {
            state.currentIndex--;
            renderCurrentQuestion();
        }
    });
    
    el.btnSkip.addEventListener('click', () => {
        // Stop recording if it's currently running
        const dictBtn = document.getElementById('btn-dictate');
        if (dictBtn && dictBtn.classList.contains('recording-pulse')) {
            dictBtn.click();
        }
        
        if (state.currentIndex < state.filteredQuestions.length - 1) {
            state.currentIndex++;
            renderCurrentQuestion();
        } else {
            showToast("Alle Fragen durchgesehen! Wir mischen neu.", "success");
            updateFilteredQuestions();
        }
    });

    // Allow Enter key to submit
    el.userAnswer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!el.btnReveal.classList.contains('hidden')) {
                el.btnReveal.click();
            }
        }
    });

    // Provider Dropdown Logic
    el.inputProvider.addEventListener('change', (e) => {
        const val = e.target.value;
        el.inputApiUrl.style.display = (val === 'custom' || val === 'ollama_cloud') ? 'block' : 'none';
        el.inputModel.placeholder = 'Modell';
        
        switch (val) {
            case 'gemini':
                el.inputApiUrl.value = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
                el.inputModel.value = 'gemini-3.8-flash';
                // HIER: Trage deinen API-Schlüssel ein, damit er immer vorbefüllt ist
                el.inputApiKey.value = '';
                break;
            case 'openai':
                el.inputApiUrl.value = 'https://api.openai.com/v1/chat/completions';
                el.inputModel.value = 'gpt-6-luna';
                break;
            case 'ollama':
                el.inputApiUrl.value = 'http://127.0.0.1:11434/v1/chat/completions';
                el.inputModel.value = 'llama3.1';
                break;
            case 'offline':
                el.inputApiUrl.value = 'offline';
                el.inputModel.value = 'offline';
                el.inputApiKey.value = '';
                break;
            case 'groq':
                el.inputApiUrl.value = 'https://api.groq.com/openai/v1/chat/completions';
                el.inputModel.value = 'openai/gpt-oss-120b';
                break;
            case 'grok':
                el.inputApiUrl.value = 'https://api.x.ai/v1/chat/completions';
                el.inputModel.value = 'grok-4.3';
                break;
            case 'together':
                el.inputApiUrl.value = 'https://api.together.xyz/v1/chat/completions';
                // Together hat kein festes Nachfolgemodell benannt: Modell aus dem
                // aktuellen Katalog (api.together.ai/models) selbst eintragen.
                el.inputModel.value = '';
                el.inputModel.placeholder = 'Modell-ID aus dem Together-Katalog';
                break;
            case 'custom':
                el.inputApiUrl.value = '';
                el.inputModel.value = '';
                break;
        }
    });

    // Save API Key -> Save LLM Config
    el.btnSaveKey.addEventListener('click', () => { saveLlmConfigFromSidebar(); });

    // Test API Button
    el.btnTestApi.addEventListener('click', testApiConnection);

    // Reset UI wenn Konfig geändert wird
    const resetApiUI = () => {
        el.btnTestApi.style.display = 'block';
        el.btnTestApi.textContent = "Testen";
        el.btnTestApi.style.backgroundColor = 'transparent';
        el.btnTestApi.style.borderColor = 'rgba(255,255,255,0.1)';
        el.btnTestApi.style.color = 'var(--text-secondary)';
        el.btnTestApi.disabled = false;
        
        el.apiStatusLight.style.backgroundColor = 'gray';
        el.apiStatusText.textContent = "Ungeprüft";
        el.apiStatusText.style.color = 'var(--text-muted)';
    };

    el.inputProvider.addEventListener('change', resetApiUI);
    el.inputApiUrl.addEventListener('input', resetApiUI);
    el.inputModel.addEventListener('input', resetApiUI);
    el.inputApiKey.addEventListener('input', resetApiUI);
}

// --- KI-Tutor-Status in der Kopfleiste (>_ mit Statuspunkt und Hover-Feld) ---
// Grün nur bei bestätigter Verbindung, sonst rot (nicht verbunden); gelb pulsierend beim Prüfen.
let aiStatusState = 'off';

function aiProviderLabel() {
    const opt = el.inputProvider && el.inputProvider.selectedOptions[0];
    return opt ? opt.textContent.replace(/\s*\(.*\)\s*$/, '').trim() : 'KI';
}

function setAiStatus(status) {
    aiStatusState = status;
    const btn = document.getElementById('btn-ai-status');
    if (!btn) return;
    const cfg = state.llmConfig || {};
    const tips = {
        online: `KI-Tutor aktiv · ${aiProviderLabel()}${cfg.model ? ' · ' + cfg.model : ''}`,
        checking: 'KI-Tutor: Verbindung wird geprüft …',
        error: 'KI-Tutor nicht verbunden · Verbindung fehlgeschlagen. Klicken zum Prüfen',
        offline: 'KI-Tutor nicht verbunden · Offline-Prüfer aktiv. Klicken zum Einrichten',
        off: 'KI-Tutor nicht verbunden · Klicken zum Einrichten',
    };
    btn.dataset.state = status === 'online' ? 'online' : status === 'checking' ? 'checking' : 'disconnected';
    btn.dataset.tip = tips[status] || tips.off;
    btn.setAttribute('aria-label', btn.dataset.tip);
    btn.removeAttribute('title'); // eigenes Hover-Feld statt Browser-Tooltip
}

// Nach dem Laden einer Konfiguration: Status setzen und eine KI einmal prüfen
function refreshAiStatus() {
    const cfg = state.llmConfig || {};
    if (!cfg.url) return setAiStatus('off');
    if (cfg.url === 'offline') return setAiStatus('offline');
    if (aiStatusState !== 'online' && aiStatusState !== 'checking') testApiConnection();
}

// Speichert die Felder der Seitenleiste als LLM-Konfiguration (Browser + Konto) und testet sie.
// Liefert true, wenn die Verbindung steht.
function saveLlmConfigFromSidebar() {
    state.llmConfig = {
        provider: el.inputProvider.value,
        url: el.inputApiUrl.value.trim(),
        model: el.inputModel.value.trim(),
        key: el.inputApiKey.value.trim()
    };
    safeStorage.setItem('llm_config', JSON.stringify(state.llmConfig));
    // Sync to backend if logged in (dort verschlüsselt gespeichert)
    const token = safeStorage.getItem('bootcamp_token') || localStorage.getItem('bootcamp_token');
    if (token) {
        fetch(`${API_URL}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ llmConfig: state.llmConfig })
        }).catch(e => console.error("Failed to sync config:", e));
    }
    showToast("LLM-Konfiguration gespeichert!", "success");
    return testApiConnection();
}

// API Test Function (true = verbunden)
async function testApiConnection() {
    setAiStatus('checking');
    el.apiStatusLight.style.backgroundColor = 'gray';
    el.apiStatusText.textContent = "Prüfe...";
    el.apiStatusText.style.color = 'var(--text-muted)';
    
    el.btnTestApi.style.display = 'block';
    el.btnTestApi.textContent = "Prüfe...";
    el.btnTestApi.style.backgroundColor = 'transparent';
    el.btnTestApi.style.borderColor = 'rgba(255,255,255,0.1)';
    el.btnTestApi.style.color = 'var(--text-secondary)';
    el.btnTestApi.disabled = true;

    try {
        const config = state.llmConfig;
        const prompt = "Antworte exakt und ausschließlich mit folgendem JSON: {\"status\": \"ok\"}";
        
        const url = config.url || '';
        const model = config.model || '';
        let key = config.key || '';

        if (key.toLowerCase().startsWith('bearer ')) {
            key = key.substring(7).trim();
        }

        if (!url || !model || !key) {
            throw new Error('API Konfiguration unvollständig.');
        }

        let response;
        if (url.includes('generativelanguage.googleapis.com')) {
            let endpoint = url;
            if (!endpoint.includes('generateContent')) {
                endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
            }
            response = await fetchWithProxyFallback(`${endpoint}?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
                })
            });
        } else {
            response = await fetchWithProxyFallback(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.2
                })
            });
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText}`);
        }
        
        const data = await response.json();
        let textResult = url.includes('generativelanguage.googleapis.com') ? data.candidates[0].content.parts[0].text : data.choices[0].message.content;
        textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
        const json = JSON.parse(textResult);
        
        if (json.status && json.status.toLowerCase() === 'ok') {
            el.apiStatusLight.style.backgroundColor = 'var(--dis-matrix)'; // Grün
            el.apiStatusText.textContent = "Verbunden";
            el.apiStatusText.style.color = 'var(--dis-matrix)';
            
            // Button ausblenden, da nicht mehr benötigt
            el.btnTestApi.style.display = 'none';
            setAiStatus('online');
            return true;
        } else {
            throw new Error("Unerwartete Antwort vom Modell: " + text);
        }
    } catch (e) {
        console.error("API Test fehlgeschlagen:", e.message);
        el.apiStatusLight.style.backgroundColor = 'var(--dis-danger)'; // Rot
        el.apiStatusText.textContent = "Fehler";
        el.apiStatusText.style.color = 'var(--dis-danger)';
        
        // Button wieder auf Fehler/Standard zurücksetzen und einblenden
        el.btnTestApi.style.display = 'block';
        el.btnTestApi.textContent = "Testen";
        el.btnTestApi.style.backgroundColor = 'transparent';
        el.btnTestApi.style.borderColor = 'rgba(255,255,255,0.1)';
        el.btnTestApi.style.color = 'var(--text-secondary)';
        
        // Versuche das OpenAI Error-JSON hübscher zu formatieren
        let errorMsg = e.message;
        try {
            const match = errorMsg.match(/HTTP \d+: (.*)/);
            if (match) {
                const parsed = JSON.parse(match[1]);
                if (parsed.error && parsed.error.error && parsed.error.error.message) {
                    errorMsg = parsed.error.error.message;
                } else if (parsed.error && parsed.error.message) {
                    errorMsg = parsed.error.message;
                }
            }
        } catch(ignore) {}
        
        showToast("Verbindung fehlgeschlagen: " + errorMsg, "error");
        // Offline-Prüfer oder unvollständige Konfiguration ist kein Verbindungsfehler
        const cfg = state.llmConfig || {};
        setAiStatus(!cfg.url ? 'off' : cfg.url === 'offline' ? 'offline' : 'error');
        return false;
    } finally {
        el.btnTestApi.disabled = false;
    }
}

// Zentral gepflegte Inhalte (Management / Content) vom Server laden. Ohne Verbindung (offline,
// PWA) gilt die zuletzt geladene Kopie aus dem Browser.
let CONTENT_HIDDEN = { modules: [], chapters: [] };
async function loadServerContent() {
    let content = null;
    try {
        // Höchstens 4 Sekunden warten: bei schlechter Verbindung lieber mit der Kopie starten
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch('/api/content', { cache: 'no-store', signal: ctrl.signal }).finally(() => clearTimeout(timer));
        if (res.ok) {
            content = await res.json();
            safeStorage.setItem('content_cache', JSON.stringify({ questions: content.questions, hidden: content.hidden }));
        }
    } catch (e) { /* offline: Kopie verwenden */ }
    if (!content) {
        try { content = JSON.parse(safeStorage.getItem('content_cache') || 'null'); } catch (e) { content = null; }
    }
    if (!content) return;
    CONTENT_HIDDEN = {
        modules: Array.isArray(content.hidden?.modules) ? content.hidden.modules : [],
        chapters: Array.isArray(content.hidden?.chapters) ? content.hidden.chapters : [],
    };
    (Array.isArray(content.questions) ? content.questions : []).forEach(q => {
        if (!q || typeof q.question !== 'string' || typeof q.category !== 'string') return;
        // Stabile ID je zentraler Frage, damit Statistik und Wiederholung über Neuladen hinweg passen
        q.id = 100000 + (Number(q.contentId) || 0);
        if (!q.moreInfo) q.moreInfo = q.answer;
        if (!q.moreInfo.toLowerCase().includes('tl;dr')) {
            q.moreInfo = `### 1. tl;dr\n${q.answer}\n---\n### 3. Deep Dive\n${q.moreInfo}`;
        }
        QUESTIONS.push(q);
    });
}

// Gruppenname eines Kategorie-Namens (wie im Quiz-Setup)
function groupNameOf(cat) {
    if (/^\d/.test(cat)) return 'linux.basic()';
    const base = cat.includes('::') ? cat.split('::')[0] : cat;
    const name = base.trim().toLowerCase().replace(/\s+/g, '.');
    return name.endsWith('()') ? name : name + '()';
}

// Load Custom Questions from localStorage (älterer Weg: nur in diesem Browser)
function loadCustomQuestions() {
    const custom = safeStorage.getItem('custom_questions');
    if (custom) {
        try {
            const parsed = JSON.parse(custom);
            if (Array.isArray(parsed) && parsed.length > 0) {
                let maxId = Math.max(...QUESTIONS.map(q => q.id));
                let changed = false;
                
                // First pass: fallback un-numbered categories to a temporary format so they get picked up
                parsed.forEach(q => {
                    if (q.category !== 'Eigene Fragen' && !q.category.includes('::')) {
                        q.category = `${q.category}::Allgemein`;
                        changed = true;
                    }
                });
                
                // Group by module and renumber from 1
                const modChapters = {};
                parsed.forEach(q => {
                    if (q.category && q.category.includes('::')) {
                        const parts = q.category.split('::');
                        const mod = parts[0];
                        const chap = parts.slice(1).join('::');
                        if (!modChapters[mod]) modChapters[mod] = new Set();
                        modChapters[mod].add(chap);
                    }
                });
                
                const renumberMap = {};
                Object.keys(modChapters).forEach(mod => {
                    const chaps = Array.from(modChapters[mod]);
                    chaps.sort((a, b) => {
                        const numA = parseInt((a.match(/^\s*(\d+)/) || [0, 0])[1], 10);
                        const numB = parseInt((b.match(/^\s*(\d+)/) || [0, 0])[1], 10);
                        return numA - numB;
                    });
                    
                    chaps.forEach((chap, index) => {
                        const newId = index + 1;
                        let cleanChap = chap.replace(/^\s*\d+[\.\-\s]*/, '');
                        if (!cleanChap) cleanChap = "Allgemein";
                        renumberMap[`${mod}::${chap}`] = `${mod}::${newId}. ${cleanChap}`;
                    });
                });
                
                parsed.forEach(q => {
                    q.id = ++maxId;
                    if (!q.difficulty) q.difficulty = 'mittel';
                    if (!q.category) q.category = 'Eigene Fragen';
                    if (!q.moreInfo) q.moreInfo = q.answer;
                    
                    if (q.moreInfo && !q.moreInfo.toLowerCase().includes('tl;dr')) {
                        const originalText = q.moreInfo;
                        q.moreInfo = `### 1. tl;dr\n[KI hat keine Kurzantwort geliefert. Lese den Deep Dive.]\n---\n> **Tux-Ansage:** "Lass dich nicht ablenken, Rekrut! Ab in den Deep Dive!"\n---\n### 3. Deep Dive\n${originalText}`;
                        changed = true;
                    }
                    
                    if (q.category && renumberMap[q.category]) {
                        if (q.category !== renumberMap[q.category]) {
                            q.category = renumberMap[q.category];
                            changed = true;
                        }
                    }
                    
                    QUESTIONS.push(q);
                });
                
                if (changed) {
                    safeStorage.setItem('custom_questions', JSON.stringify(parsed));
                }
                console.log(`Loaded ${parsed.length} custom questions.`);
            }
        } catch (e) {
            console.error('Error loading custom questions', e);
        }
    }
}

// Speech Recognition Setup
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btnDictate = document.getElementById('btn-dictate');
    
    if (!SpeechRecognition) {
        if (btnDictate) btnDictate.style.display = 'none';
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    let isRecording = false;
    let initialText = '';

    if (btnDictate) {
        btnDictate.addEventListener('click', () => {
            if (isRecording) {
                isRecording = false; // Prevents auto-restart
                recognition.stop();
            } else {
                initialText = el.userAnswer.value;
                if (initialText && !initialText.endsWith(' ')) {
                    initialText += ' ';
                }
                recognition.start();
            }
        });
    }
    
    recognition.onstart = () => {
        isRecording = true;
        if (btnDictate) {
            btnDictate.style.color = 'var(--dis-danger)'; // Red
            btnDictate.classList.add('recording-pulse');
        }
    };
    
    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
        }
        // Update input field appending to what was already there
        el.userAnswer.value = initialText + transcript;
    };
    
    recognition.onend = () => {
        if (isRecording) {
            // Android Chrome often kills the recognition on silence even with continuous=true.
            // We save the current text so the next session appends to it instead of wiping it.
            initialText = el.userAnswer.value;
            if (initialText && !initialText.endsWith(' ')) {
                initialText += ' ';
            }
            
            // Restart automatically unless the user clicked stop.
            try {
                recognition.start();
            } catch (e) {
                isRecording = false;
            }
        }
        
        if (!isRecording && btnDictate) {
            btnDictate.style.color = 'var(--dis-text-3)'; // Gray
            btnDictate.classList.remove('recording-pulse');
        }
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
            showToast("Mikrofon-Zugriff verweigert oder unverschlüsselte Verbindung (HTTPS erforderlich!).", "warning");
        }
        isRecording = false;
        if (btnDictate) {
            btnDictate.style.color = 'var(--dis-text-3)';
            btnDictate.classList.remove('recording-pulse');
        }
    };
}

// Init App
async function init() {
    await loadServerContent();
    loadCustomQuestions();
    
    const deletedModules = JSON.parse(safeStorage.getItem('deleted_modules') || '[]').concat(CONTENT_HIDDEN.modules);
    const deletedChapters = JSON.parse(safeStorage.getItem('deleted_chapters') || '[]').concat(CONTENT_HIDDEN.chapters);
    
    if (deletedModules.length > 0 || deletedChapters.length > 0) {
        QUESTIONS = QUESTIONS.filter(q => {
            if (deletedChapters.includes(q.category)) return false;
            if (deletedModules.includes(groupNameOf(q.category))) return false;
            return true;
        });
    }

    initCategories();
    updateDifficultyUI();
    updateFilteredQuestions();
    loadStats();
    refreshAiStatus();
    
    // Restore Sidebar State
    if (safeStorage.getItem('sidebar_hidden') === 'true') {
        document.querySelector('.app-layout').classList.add('sidebar-hidden');
    }
    
    bindEvents();
    initSpeechRecognition();
    
    // Start Session Timer
    state.sessionStartTime = Date.now();
    setInterval(updateSessionTimer, 1000);
    
    // Set Total Questions in Project
    const elTotalQ = document.getElementById('total-q');
    if (elTotalQ) elTotalQ.textContent = state.stats.answered;
}


let lastActivityTime = Date.now();
let isIdle = false;
let sessionActiveSeconds = 0;
let lastSyncTime = Date.now();

// Track user activity
function resetIdle() {
    if (isIdle) {
        // Wake up
        isIdle = false;
        state.sessionStartTime = Date.now() - (sessionActiveSeconds * 1000);
    }
    lastActivityTime = Date.now();
}
document.addEventListener('mousemove', resetIdle);
document.addEventListener('keydown', resetIdle);
document.addEventListener('click', resetIdle);

setInterval(() => {
    // Check if idle (> 10 mins)
    if (Date.now() - lastActivityTime > 10 * 60 * 1000) {
        if (!isIdle) isIdle = true;
    }
    
    if (!isIdle && state.sessionStartTime) {
        sessionActiveSeconds = Math.floor((Date.now() - state.sessionStartTime) / 1000);
    }
    
    // Sync time to backend every 30 seconds
    if (Date.now() - lastSyncTime > 30000 && !isIdle && typeof syncBackendXp === 'function') {
        const timePlayedAdd = Math.floor((Date.now() - lastSyncTime) / 1000);
        lastSyncTime = Date.now();
        syncBackendXp(0, state.stats.streak, 0, 0, timePlayedAdd, state.stats.lastPlayed);
    }
}, 1000);

function updateSessionTimer() {
    if (!state.sessionStartTime) return;
    const elTime = document.getElementById('session-time');
    
    if (state.mode === 'exam' && state.examStartTime) {
        const elapsed = Math.floor((Date.now() - state.examStartTime) / 1000);
        const remaining = (45 * 60) - elapsed; // 45 minutes
        
        if (remaining <= 0) {
            if (elTime) {
                elTime.textContent = "00:00 (Zeit abgelaufen!)";
                elTime.style.color = 'var(--dis-danger)';
            }
            if (!state.examFinished) {
                showToast("Zeit abgelaufen! Klausur wird beendet.", "danger");
                finishExam();
            }
            return;
        }
        
        if (state.examFinished) {
            if (elTime) elTime.textContent = "Klausur beendet";
            return;
        }
        
        const m = Math.floor(remaining / 60).toString().padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        if (elTime) {
            elTime.textContent = `${m}:${s} (Verbleibend)`;
            elTime.style.color = remaining < 300 ? 'var(--dis-danger)' : 'var(--dis-warn)'; // Red if < 5 mins, else Yellow
        }
        return;
    }
    
    // Normal mode
    if (elTime) elTime.style.color = ''; // reset color
    const m = Math.floor(sessionActiveSeconds / 60).toString().padStart(2, '0');
    const s = (sessionActiveSeconds % 60).toString().padStart(2, '0');
    if (elTime) elTime.textContent = `${m}:${s}`;
    
    if (isIdle && elTime) {
        elTime.textContent = `${m}:${s} (Pausiert)`;
    }
}

// Admin: Modul/Kapitel für alle löschen bzw. ausblenden (Server), sonst wie bisher nur im Browser
async function hideContentCentral(kind, key) {
    const res = await fetch('/api/admin/content/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + currentToken },
        body: JSON.stringify({ kind, key })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ('Fehler ' + res.status));
    return data;
}

window.deleteModule = async function(targetGroupName) {
    if (document.body.classList.contains('is-admin') && typeof currentToken !== 'undefined' && currentToken) {
        try { await hideContentCentral('module', targetGroupName); showToast(`Modul "${targetGroupName}" ist für alle entfernt.`, 'success'); setTimeout(() => location.reload(), 900); }
        catch (e) { showToast(e.message, 'error'); }
        return;
    }
    const custom = safeStorage.getItem('custom_questions');
    let parsed = custom ? JSON.parse(custom) : [];
    if (!Array.isArray(parsed)) parsed = [];
    const initialLen = parsed.length;
    
    // 1. Remove from local storage (if custom)
    parsed = parsed.filter(q => {
        let cat = q.category || '';
        let groupName = '';
        if (/^\d/.test(cat)) groupName = 'linux.basic()';
        else if (cat.includes('::')) groupName = cat.split('::')[0].trim().toLowerCase().replace(/\s+/g, '.') + '()';
        else groupName = cat.trim().toLowerCase().replace(/\s+/g, '.') + '()';
        return groupName !== targetGroupName;
    });
    safeStorage.setItem('custom_questions', JSON.stringify(parsed));
    
    // 2. Add to deleted_categories to hide built-in ones
    const delList = JSON.parse(safeStorage.getItem('deleted_modules') || '[]');
    if (!delList.includes(targetGroupName)) {
        delList.push(targetGroupName);
        safeStorage.setItem('deleted_modules', JSON.stringify(delList));
    }
    
    alert(`Modul "${targetGroupName}" wurde gelöscht.`);
    location.reload();
};

window.deleteChapter = async function(targetCatStr, targetGroupName) {
    if (document.body.classList.contains('is-admin') && typeof currentToken !== 'undefined' && currentToken) {
        try { await hideContentCentral('chapter', targetCatStr); showToast('Kapitel ist für alle entfernt.', 'success'); setTimeout(() => location.reload(), 900); }
        catch (e) { showToast(e.message, 'error'); }
        return;
    }
    const custom = safeStorage.getItem('custom_questions');
    let parsed = custom ? JSON.parse(custom) : [];
    if (!Array.isArray(parsed)) parsed = [];
    const initialLen = parsed.length;
    
    parsed = parsed.filter(q => q.category !== targetCatStr);
    safeStorage.setItem('custom_questions', JSON.stringify(parsed));
    
    const delList = JSON.parse(safeStorage.getItem('deleted_chapters') || '[]');
    if (!delList.includes(targetCatStr)) {
        delList.push(targetCatStr);
        safeStorage.setItem('deleted_chapters', JSON.stringify(delList));
    }
    
    alert(`Kapitel wurde gelöscht.`);
    location.reload();
};

window.addEventListener('DOMContentLoaded', () => {
    init();
});


window.renderAdminContentTree = function() {
    const container = document.getElementById('admin-content-tree');
    if(!container) return;
    container.innerHTML = '';
    
    const categories = [...new Set(QUESTIONS.map(q => q.category))].sort();
    
    const groups = {
        'linux.basic()': { isBasic: true, children: [] }
    };
    
    categories.forEach(cat => {
        let groupName = '';
        let displayName = cat;
        if (/^\d/.test(cat)) {
            groupName = 'linux.basic()';
        } else if (cat.includes('::')) {
            const parts = cat.split('::');
            let gName = parts[0].trim().toLowerCase().replace(/\s+/g, '.');
            if (!gName.endsWith('()')) gName += '()';
            groupName = gName;
            displayName = parts.slice(1).join('::');
        } else {
            let gName = cat.trim().toLowerCase().replace(/\s+/g, '.');
            if (!gName.endsWith('()')) gName += '()';
            groupName = gName;
            displayName = "Allgemeines Kapitel"; 
        }
        if (!groups[groupName]) {
            groups[groupName] = { isBasic: false, children: [] };
        }
        groups[groupName].children.push({ id: cat, name: displayName });
    });
    
    Object.keys(groups).forEach(gName => {
        const groupData = groups[gName];
        if (groupData.children.length === 0) return;

        const groupElement = document.createElement('details');
        groupElement.className = 'category-group';
        groupElement.open = false;

        const summary = document.createElement('summary');
        summary.style.cursor = 'pointer';
        summary.style.padding = '8px';
        summary.style.background = 'var(--dis-bg-elev)';
        summary.style.borderRadius = '4px';
        summary.style.marginBottom = '4px';
        summary.style.fontWeight = 'bold';
        summary.style.fontFamily = 'var(--dis-font-mono)';
        summary.style.color = 'var(--dis-matrix)';

        const groupLabelSpan = document.createElement('span');
        groupLabelSpan.textContent = gName;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'admin-only-btn';
        deleteBtn.textContent = 'Entfernen';
        deleteBtn.classList.add('content-del-btn');
        deleteBtn.style.float = 'right';
        deleteBtn.title = 'Modul für alle entfernen (eigene Fragen werden gelöscht, eingebaute ausgeblendet)';
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm(`Modul "${gName}" für alle entfernen? Eigene Fragen darin werden gelöscht, eingebaute ausgeblendet (unter Import / Export wiederherstellbar).`)) {
                if(window.deleteModule) window.deleteModule(gName);
            }
        });
        
        summary.appendChild(groupLabelSpan);
        summary.appendChild(deleteBtn);
        groupElement.appendChild(summary);

        const childrenContainer = document.createElement('div');
        childrenContainer.style.paddingLeft = '8px';
        childrenContainer.style.display = 'flex';
        childrenContainer.style.flexDirection = 'column';
        childrenContainer.style.gap = '2px';
        childrenContainer.style.borderLeft = '2px solid var(--dis-border)';
        childrenContainer.style.marginLeft = '12px';
        childrenContainer.style.marginTop = '4px';
        groupElement.appendChild(childrenContainer);

        groupData.children.forEach(child => {
            const label = document.createElement('div');
            label.className = 'category-item';
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.justifyContent = 'space-between';
            label.style.padding = '4px 8px';
            
            const txt = document.createElement('span');
            txt.textContent = child.name;
            label.appendChild(txt);
            
            const delChapBtn = document.createElement('button');
            delChapBtn.className = 'admin-only-btn';
            delChapBtn.textContent = 'Entfernen';
            delChapBtn.classList.add('content-del-btn');
            delChapBtn.title = 'Kapitel für alle entfernen';
            delChapBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm(`Kapitel "${child.name}" für alle entfernen? Eigene Fragen darin werden gelöscht, eingebaute ausgeblendet.`)) {
                    if(window.deleteChapter) window.deleteChapter(child.id, gName);
                }
            });
            label.appendChild(delChapBtn);
            childrenContainer.appendChild(label);
        });
        container.appendChild(groupElement);
    });
};


function finishExam() {
    state.examFinished = true;
    document.getElementById('quiz-card').style.display = 'none';
    const resCard = document.getElementById('exam-result-card');
    resCard.style.display = 'flex';
    
    const maxPts = state.filteredQuestions.length;
    const pts = state.examScore;
    const percent = maxPts > 0 ? Math.round((pts / maxPts) * 100) : 0;
    
    document.getElementById('exam-result-percent').textContent = percent + '%';
    document.getElementById('exam-result-points').textContent = pts;
    
    let grade = '6';
    let gradeText = 'Ungenügend';
    let color = 'var(--dis-danger)'; // red
    
    if (percent >= 92) { grade = '1'; gradeText = 'Sehr gut'; color = 'var(--dis-matrix)'; }
    else if (percent >= 81) { grade = '2'; gradeText = 'Gut'; color = 'var(--dis-matrix)'; }
    else if (percent >= 67) { grade = '3'; gradeText = 'Befriedigend'; color = 'var(--dis-warn)'; }
    else if (percent >= 50) { grade = '4'; gradeText = 'Ausreichend'; color = 'var(--dis-warn)'; }
    else if (percent >= 30) { grade = '5'; gradeText = 'Mangelhaft'; color = '#f97316'; }
    
    const elGrade = document.getElementById('exam-result-grade');
    elGrade.textContent = grade;
    elGrade.style.color = color;
    document.getElementById('exam-result-grade-text').textContent = gradeText;
    
    const mistakesContainer = document.getElementById('exam-mistakes-container');
    const mistakesList = document.getElementById('exam-mistakes-list');
    
    if (state.examMistakes && state.examMistakes.length > 0) {
        mistakesContainer.style.display = 'block';
        mistakesList.innerHTML = '';
        state.examMistakes.forEach(m => {
            const div = document.createElement('div');
            div.style.background = 'var(--dis-bg-elev)';
            div.style.padding = '15px';
            div.style.borderRadius = '8px';
            div.style.borderLeft = m.pts === 1.0 ? '4px solid var(--dis-matrix)' : (m.pts === 0.5 ? '4px solid var(--dis-warn)' : '4px solid var(--dis-danger)');
            
            div.innerHTML = `
                <div style="font-size: 0.9em; color: var(--dis-text-2); margin-bottom: 5px;">Frage ${escapeHtml(m.qIndex)} (${escapeHtml(m.pts)} Pkt)</div>
                <div style="font-weight: bold; margin-bottom: 10px;">${escapeHtml(m.question)}</div>
                <div style="margin-bottom: 5px; color: var(--dis-danger);"><span style="color:var(--dis-text-2)">Deine Antwort:</span> ${m.userAnswer ? escapeHtml(m.userAnswer) : '<i>Keine Eingabe</i>'}</div>
                <div style="margin-bottom: 10px; color: var(--dis-matrix);"><span style="color:var(--dis-text-2)">Musterlösung:</span> ${escapeHtml(m.correctAnswer)}</div>
                <div style="font-size: 0.9em; color: var(--dis-text-2); background: var(--dis-surface-hover); padding: 10px; border-radius: 4px;">${m.feedback}</div>
            `;
            mistakesList.appendChild(div);
        });
    } else {
        mistakesContainer.style.display = 'none';
    }
    
    // Play a sound or show confettis? Just a toast for now.
    if (grade <= '4') {
        showToast("Glückwunsch! Klausur bestanden.", "success");
    } else {
        showToast("Klausur leider nicht bestanden.", "danger");
    }
    
    // Save to backend
    if (typeof currentToken !== 'undefined' && currentToken) {
        fetch(API_URL + '/api/exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + currentToken },
            body: JSON.stringify({
                grade: grade,
                score: pts,
                maxScore: maxPts,
                examData: state.examMistakes
            })
        }).catch(e => console.error("Could not save exam", e));
    }
}

// Add event listener to the close button
document.addEventListener('DOMContentLoaded', () => {
    const btnClose = document.getElementById('btn-exam-close');
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            document.getElementById('mode-quiz').click(); // switch back to quiz
        });
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const btnExport = document.getElementById('btn-exam-export');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            if (!state.examMistakes || state.examMistakes.length === 0) {
                showToast("Es gibt keine Fehler zum Exportieren!", "info");
                return;
            }
            
            let text = "--- Auswertung Prüfungssimulation ---\n\n";
            text += "Note: " + document.getElementById('exam-result-grade').textContent + " (" + document.getElementById('exam-result-grade-text').textContent + ")\n";
            text += "Punkte: " + document.getElementById('exam-result-points').textContent + " / 24\n\n";
            text += "--- Alle Antworten der Klausur ---\n\n";
            
            state.examMistakes.forEach(m => {
                text += "Frage " + m.qIndex + " (" + m.pts + " Pkt)\n";
                text += "F: " + m.question + "\n";
                text += "Deine Antwort: " + (m.userAnswer || "- keine -") + "\n";
                text += "Musterlösung: " + m.correctAnswer + "\n";
                text += "KI-Feedback: " + m.feedback.replace(/<[^>]+>/g, '') + "\n\n"; // strip html
            });
            
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const a = document.createElement('a');
            const url = URL.createObjectURL(blob);
            a.href = url;
            a.download = 'Klausur_Auswertung.txt';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
            
            showToast("Auswertung wurde heruntergeladen!", "success");
        });
    }
});
