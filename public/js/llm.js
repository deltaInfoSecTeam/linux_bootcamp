// LLM-Anbindung: Proxy-Fallback, Bewertung, Zusatzinfos
// Generic fetch with CORS proxy fallback
async function fetchWithProxyFallback(url, options) {
    try {
        const response = await fetch(url, options);
        return response;
    } catch (e) {
        if (e.name === 'TypeError' || (e.message && e.message.toLowerCase().includes('fetch'))) {
            console.warn("Direct fetch failed (CORS/Network Error), using local proxy...", e);
            const token = safeStorage.getItem('bootcamp_token');
            const proxyResponse = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({
                    url: url,
                    method: options.method || 'GET',
                    headers: options.headers || {},
                    body: options.body
                })
            });
            return proxyResponse;
        }
        throw e;
    }
}

// Serverless API Call (Direct to LLM API, no local Node Server required)
async function callLLMAPI(question, modelAnswer, userAnswer, config, isIdk = false) {
    let prompt;
    
    if (isIdk) {
        prompt = `Du bist ein professioneller Linux-Systemadministrator und Drill-Instructor Tux.
Der Benutzer wusste die Antwort auf folgende Frage nicht:

Frage:
${question}

Musterlösung:
${modelAnswer}

Erkläre die Musterlösung kurz, einsteigerfreundlich und motivierend (max 3 Sätze).
Gib deine Antwort exakt im folgenden JSON-Format ab. Keine Einleitung, nur JSON:
{
  "rating": "wrong",
  "feedback": "Deine kurze, hilfreiche Erklärung der Lösung."
}`;
    } else {
        prompt = `Du bist ein professioneller Linux-Systemadministrator und Prüfer.
Bewerte die Antwort des Benutzers auf die folgende Frage im Vergleich zur vorgegebenen Musterlösung.

Frage:
${question}

Musterlösung:
${modelAnswer}

Antwort des Benutzers:
${userAnswer}

Gib deine Bewertung exakt im folgenden JSON-Format ab. Keine Einleitung, nur JSON:
{
  "rating": "correct" | "partial" | "wrong",
  "feedback": "Ein kurzes, prägnantes Feedback auf Deutsch (max 3 Sätze), was gut war und was ggf. gefehlt hat. Hebe wichtige Begriffe fett hervor."
}`;
    }

    const url = config.url || '';
    const model = config.model || '';
    let key = config.key || '';
    
    // Cleanup key if user accidentally pasted "Bearer "
    if (key.toLowerCase().startsWith('bearer ')) {
        key = key.substring(7).trim();
    }

    if (!url || !model || !key) {
        throw new Error('API Konfiguration unvollständig.');
    }

    // Google Gemini API direkt aufrufen
    if (url.includes('generativelanguage.googleapis.com')) {
        let endpoint = url;
        if (!endpoint.includes('generateContent')) {
            endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        }
        
        const response = await fetchWithProxyFallback(`${endpoint}?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
        const data = await response.json();
        
        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(rawText);
    } 
    // OpenAI Compatible API (OpenAI, Groq, local LLM)
    else {
        const response = await fetchWithProxyFallback(url, {
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

        if (!response.ok) throw new Error(`OpenAI API Error: ${response.status}`);
        const data = await response.json();
        
        let rawText = data.choices[0].message.content;
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(rawText);
    }
}

// Reveal Answer and Validate (Asynchronous)
async function revealAnswer(e) {
    const isIdk = e === true;
    
    // Stop recording if it's currently running
    const dictBtn = document.getElementById('btn-dictate');
    if (dictBtn && dictBtn.classList.contains('recording-pulse')) {
        dictBtn.click();
    }
    
    try {
        if (state.filteredQuestions.length === 0) return;
        
        const q = state.filteredQuestions[state.currentIndex];
        const input = el.userAnswer.value.trim();
        
        if (state.mode === 'flashcard') {
            // Im Flashcard-Modus prüfen wir keine Eingabe, sondern zeigen nur die Lösung.
            el.userInputGroup.classList.add('hidden');
            el.btnReveal.classList.add('hidden');
            if (el.btnIdk) el.btnIdk.classList.add('hidden');
            if (el.btnSkip) el.btnSkip.classList.add('hidden');
            
            el.answerText.innerHTML = parseMarkdown(q.answer);
            el.answerContainer.classList.remove('hidden');
            
            // Bewertungs-Buttons anzeigen, keine KI-Vorwertung
            state.lastAIRatingValue = 0; // Spielt keine Rolle, Nutzer wertet selbst
            el.ratingControls.classList.remove('hidden');
            document.getElementById('btn-confirm-rating').classList.add('hidden');
            document.getElementById('btn-flag-review').classList.add('hidden');
            return;
        }

        if (!input && !isIdk) {
            showToast("Bitte gib eine Antwort ein oder wähle 'Keine Ahnung'.", "warning");
            return;
        }
        
        // Hide reveal buttons, but KEEP the input group visible
        el.btnReveal.classList.add('hidden');
        if (el.btnIdk) el.btnIdk.classList.add('hidden');
        if (el.btnSkip) el.btnSkip.classList.add('hidden');
        
        // Disable text area so they can't edit their submitted answer
        el.userAnswer.disabled = true;
        
        let result = null;
        
        if (state.llmConfig.model && state.llmConfig.url && state.llmConfig.url !== 'offline') {
            // Show loading state
            el.feedbackContainer.classList.remove('hidden', 'correct', 'partial', 'wrong');
            el.feedbackContainer.classList.add('info');
            el.feedbackBadge.className = 'feedback-badge info';
            el.feedbackBadge.textContent = isIdk ? 'KI erklärt...' : 'KI analysiert...';
            el.feedbackDetails.innerHTML = '<span class="loading-spinner">🔄</span> Bitte warten, LLM verarbeitet...';
            
            try {
                const apiResponse = await callLLMAPI(q.question, q.answer, input, state.llmConfig, isIdk);
                result = {
                    rating: apiResponse.rating,
                    // LLM-Ausgabe ist nicht vertrauenswürdig: escapen + Markdown
                    text: parseMarkdown(String(apiResponse.feedback || ''))
                };
            } catch (e) {
                console.error("LLM API Call failed:", e);
                showToast("KI-Bewertung fehlgeschlagen. Lokale Auswertung geladen.", "danger");
                result = validateAnswer(q, input);
            }
        } else {
            result = validateAnswer(q, input);
            if (state.llmConfig.url !== 'offline') {
                result.text += `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 10px; border-top: 1px dashed var(--bg-card-border); padding-top: 8px;">💡 Tipp: Trage ein LLM in der Sidebar ein, um eine detaillierte KI-Auswertung deiner Antworten zu erhalten.</p>`;
            }
        }
        
        // Set feedback CSS classes
        el.feedbackContainer.classList.remove('hidden', 'info', 'correct', 'partial', 'wrong');
        el.feedbackContainer.classList.add(result.rating);
        el.feedbackBadge.className = `feedback-badge ${result.rating}`;
        
        if (result.rating === 'correct') {
            el.feedbackBadge.textContent = 'Richtig';
        } else if (result.rating === 'partial') {
            el.feedbackBadge.textContent = 'Teils';
        } else {
            el.feedbackBadge.textContent = 'Wiederholen';
        }
        
        el.feedbackDetails.innerHTML = result.text;
        
        // Reveal correct answer
        el.answerText.innerHTML = parseMarkdown(q.answer);
        el.answerContainer.classList.remove('hidden', 'correct', 'partial', 'wrong');
        el.answerContainer.classList.add(result.rating);
        
        // Color the input group as well
        el.userInputGroup.classList.remove('correct', 'partial', 'wrong');
        el.userInputGroup.classList.add(result.rating);
        
        // Set global state for rating logic
        if (state.mode === 'exam') {
            let pts = 0;
            if (result.rating === 'correct') pts = 1.0;
            if (result.rating === 'partial') pts = 0.5;
            state.examScore += pts;
            
            // Push to mistakes if not fully correct
            // Always push to array
                state.examMistakes.push({
                    qIndex: state.currentIndex + 1,
                    question: q.question,
                    userAnswer: input,
                    correctAnswer: q.answer,
                    feedback: result.text,
                    pts: pts
                });
            
            // Save to backend (optional, just as 1 normal correct answer)
            if (typeof syncBackendXp === 'function') {
                syncBackendXp(pts, state.stats.streak, 1, pts === 1 ? 1 : 0, 0, state.stats.lastPlayed);
            }
            
            // Clean up loading UI
            el.feedbackContainer.classList.add('hidden');
            el.userAnswer.disabled = false;
            el.userAnswer.value = '';
            
            if (state.currentIndex < state.filteredQuestions.length - 1) {
                state.currentIndex++;
                renderCurrentQuestion();
            } else {
                finishExam();
            }
            return;
        }

        let points = 0;
        if (result.rating === 'correct') points = 1.0;
        if (result.rating === 'partial') points = 0.5;
        state.lastAIRatingValue = points;

        // Reset highlight classes
        document.getElementById('rate-wrong').classList.remove('rating-suggested');
        document.getElementById('rate-partial').classList.remove('rating-suggested');
        document.getElementById('rate-correct').classList.remove('rating-suggested');

        // Highlight AI suggestion
        if (result.rating === 'correct') document.getElementById('rate-correct').classList.add('rating-suggested');
        else if (result.rating === 'partial') document.getElementById('rate-partial').classList.add('rating-suggested');
        else document.getElementById('rate-wrong').classList.add('rating-suggested');

        el.btnReveal.classList.add('hidden');
        
        // Show More Info Option if LLM configured
        if (state.llmConfig && state.llmConfig.url) {
            if (el.moreInfoWrapper) el.moreInfoWrapper.classList.remove('hidden');
        }

        if (state.mode === 'quiz') {
            el.ratingControls.classList.remove('hidden');
            document.getElementById('btn-confirm-rating').classList.remove('hidden');
            document.getElementById('btn-flag-review').classList.remove('hidden');
            // Give focus to the confirm button so enter can press it
            setTimeout(() => document.getElementById('btn-confirm-rating').focus(), 100);
        } else {
            document.getElementById('btn-fc-next').classList.remove('hidden');
            setTimeout(() => document.getElementById('btn-fc-next').focus(), 100);
        }
    } catch (error) {
        alert("KRITISCHER FEHLER in revealAnswer:\n" + error.message + "\n" + error.stack);
        console.error("Critical Error in revealAnswer:", error);
    }
}

async function fetchMoreInfo() {
    const q = state.filteredQuestions[state.currentIndex];
    
    // Check Pre-Baked (Offline)
    if (q.moreInfo) {
        el.moreInfoContent.classList.remove('hidden');
        el.moreInfoText.innerHTML = parseMarkdown(q.moreInfo);
        el.btnMoreInfo.textContent = "[+] THEMA VERTIEFEN / ERKLÄRUNG ANFORDERN";
        
        // Sidebar einklappen für mehr Platz
        document.querySelector('.app-layout').classList.add('sidebar-hidden');
        safeStorage.setItem('sidebar_hidden', 'true');
        
        showToast("Erklärung aus der internen Offline-Datenbank geladen.", "success");
        return;
    }

    if (!state.llmConfig || !state.llmConfig.url) {
        showToast("KI nicht konfiguriert. Bitte in der Sidebar einrichten.", "danger");
        return;
    }
    
    // Check Cache first
    const cacheKey = `linux_quiz_info_cache_q${q.id}`;
    const cachedInfo = safeStorage.getItem(cacheKey);
    if (cachedInfo) {
        el.moreInfoContent.classList.remove('hidden');
        el.moreInfoText.innerHTML = parseMarkdown(cachedInfo);
        el.btnMoreInfo.textContent = "[+] THEMA VERTIEFEN / ERKLÄRUNG ANFORDERN";
        
        // Sidebar einklappen für mehr Platz
        document.querySelector('.app-layout').classList.add('sidebar-hidden');
        safeStorage.setItem('sidebar_hidden', 'true');
        
        showToast("Erklärung aus dem lokalen Cache geladen.", "success");
        return;
    }

    // UI Feedback
    el.btnMoreInfo.disabled = true;
    el.btnMoreInfo.textContent = "Verbinde zum Mainframe...";
    el.moreInfoContent.classList.remove('hidden');
    el.moreInfoText.innerHTML = '<span class="loading-pulse" style="color: var(--text-light);">Lade detailliertes Hacker-Wissen herunter... Bitte warten...</span>';
    
    // Sidebar einklappen für mehr Platz während des Ladens
    document.querySelector('.app-layout').classList.add('sidebar-hidden');
    safeStorage.setItem('sidebar_hidden', 'true');

    try {
        const config = state.llmConfig;
        const url = config.url || '';
        const model = config.model || '';
        let key = config.key || '';

        if (key.toLowerCase().startsWith('bearer ')) {
            key = key.substring(7).trim();
        }
        
        const prompt = `Du bist ein erfahrener Linux-Hacker und Drill-Instructor Tux.
Der Benutzer möchte detailliertere Informationen und weiterführendes Wissen zu folgendem Thema erhalten:

Kategorie: ${q.category}
Frage: ${q.question}
Kern-Antwort: ${q.answer}

Bitte strukturiere deine Antwort ZWINGEND exakt wie folgt:
1. **tl;dr:** Starte immer mit einem sehr kurzen "tl;dr" in 1-2 Sätzen.
2. **Tux-Ansage:** Dein charakteristisches Drill-Instructor-Feedback oder Motivationsspruch. Setze dieses zwingend in ein Blockzitat (mit > am Zeilenanfang), damit es farblich abgesetzt wird und bei Bedarf übersprungen werden kann.
3. **Deep Dive:** Erkläre das Thema tiefgehender. Nenne praktische Anwendungsfälle, Beispiele aus der echten Welt oder nützliche Terminal-Befehle, die im Zusammenhang stehen.
4. **Visualisierung/Merkhilfe:** Nutze, falls sinnvoll, kleine ASCII-Diagramme, Text-Diagramme oder Struktur-Bäume zur Veranschaulichung der Zusammenhänge.

Formatiere deine Antwort sauber in Markdown (mit Absätzen, Code-Blöcken, Fett/Kursiv, Aufzählungen).
KEIN JSON-Format.`;

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
                    generationConfig: { temperature: 0.5 }
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
                    temperature: 0.5
                })
            });
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        let rawText = '';
        
        if (url.includes('generativelanguage.googleapis.com')) {
            rawText = data.candidates[0].content.parts[0].text;
        } else {
            rawText = data.choices[0].message.content;
        }
        
        // Speichere im Cache
        safeStorage.setItem(cacheKey, rawText);
        
        el.moreInfoText.innerHTML = parseMarkdown(rawText);
        el.btnMoreInfo.textContent = "[+] THEMA VERTIEFEN / ERKLÄRUNG ANFORDERN";
        el.btnMoreInfo.disabled = false;

    } catch (error) {
        console.error("More Info API failed:", error);
        el.moreInfoText.innerHTML = `<span style="color: var(--dis-danger);">Fehler beim Abrufen der Zusatzinformationen: ${escapeHtml(error.message)}</span>`;
        el.btnMoreInfo.textContent = "Fehler - Erneut versuchen";
        el.btnMoreInfo.disabled = false;
    }
}

