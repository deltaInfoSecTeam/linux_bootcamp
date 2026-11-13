// LocalStorage Wrapper (aus app.js übernommen für sicheren Zugriff)
const safeStorage = {
    getItem: function(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: function(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { console.error("LocalStorage Fehler", e); }
    }
};

async function fetchWithProxyFallback(url, options) {
    try {
        const response = await fetch(url, options);
        return response;
    } catch (e) {
        console.warn("Direct fetch failed (CORS/Network Error), using local proxy...", e);
        return await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + safeStorage.getItem('bootcamp_token') },
            body: JSON.stringify({
                url: url,
                method: options.method || 'GET',
                headers: options.headers || {},
                body: options.body
            })
        });
    }
}

function initGenerator() {
    const btnGenerate = document.getElementById('btn-generate-questions');
    const selectCat = document.getElementById('gen-category-select');
    const inputNewCatContainer = document.getElementById('gen-new-category-container');
    const inputNewCat = document.getElementById('gen-new-category-name');
    const inputNewChapter = document.getElementById('gen-new-chapter-name');
    const statusEl = document.getElementById('gen-status');

    if (!btnGenerate) return;

    const defaultCats = ["1. Aufbau von Linux", "1. Verzeichnisstruktur", "2. Textverarbeitung", "2. Rechtesystem", "3. Systemverwaltung"];
    
    const custom = safeStorage.getItem('custom_questions');
    let customCats = [];
    if (custom) {
        try {
            const parsed = JSON.parse(custom);
            if (Array.isArray(parsed)) {
                customCats = parsed.map(q => q.category);
            }
        } catch(e) {}
    }

    // Only show unique base modules in the select dropdown for simplicity
    const allCats = Array.from(new Set([...defaultCats, ...customCats]));
    
    allCats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        selectCat.appendChild(opt);
    });

    selectCat.addEventListener('change', () => {
        if (selectCat.value === 'new') {
            inputNewCatContainer.style.display = 'flex';
        } else {
            inputNewCatContainer.style.display = 'none';
        }
    });

    btnGenerate.addEventListener('click', async () => {
        const fileInput = document.getElementById('gen-file-upload');
        const topicInput = document.getElementById('gen-topic-input').value.trim();
        
        let category = selectCat.value;
        if (category === 'new') {
            const modName = inputNewCat.value.trim();
            let chapName = inputNewChapter.value.trim();
            if (!modName) {
                alert("Bitte gib ein Modul (Überthema) an.");
                return;
            }
            
            // Calculate highest existing chapter ID FOR THIS MODULE
            let maxId = 0;
            const targetModPrefix = modName + "::";
            allCats.forEach(c => {
                let checkStr = "";
                if (c.startsWith(targetModPrefix)) {
                    checkStr = c.substring(targetModPrefix.length);
                } else if (modName.toLowerCase().replace(/\s+/g, '.') === c.toLowerCase().replace(/\s+/g, '.')) {
                    checkStr = c; // Standalone match
                }
                
                if (checkStr) {
                    const match = checkStr.match(/^\s*(\d+)/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num > maxId) maxId = num;
                    }
                }
            });
            const nextId = maxId + 1;
            
            if (chapName) {
                // If it doesn't already start with a number, prepend it
                if (!/^\d+/.test(chapName)) {
                    chapName = `${nextId}. ${chapName}`;
                }
            } else {
                // If no chapter name is given, assign a default with ID
                chapName = `${nextId}. Allgemein`;
            }
            
            category = modName + "::" + chapName;
        }

        if (!topicInput && (!fileInput.files || fileInput.files.length === 0)) {
            alert("Bitte lade eine Datei hoch ODER gib ein Thema/Anweisung ein.");
            return;
        }
        
        // Load llmConfig
        const configData = safeStorage.getItem('llm_config');
        let llmConfig = { url: '', model: '', key: '' };
        if (configData) {
            try { llmConfig = JSON.parse(configData); } catch(e){}
        }

        if (!llmConfig.key) {
            alert("Du musst zuerst im Quiz in den Einstellungen deinen API-Key hinterlegen!");
            return;
        }

        try {
            btnGenerate.disabled = true;
            btnGenerate.textContent = "⏳ Analysiere und Generiere...";
            statusEl.style.display = 'block';
            statusEl.style.color = 'var(--dis-warn)';
            statusEl.textContent = "Bereite Daten vor...";

            let fileContentText = "";
            let fileBase64 = null;
            let fileMime = "";

            if (fileInput.files && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                fileMime = file.type;
                
                // Read as text if md/txt, otherwise base64 for PDF
                if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
                    fileContentText = await file.text();
                } else if (file.type === 'application/pdf') {
                    // Gemini supports PDF as inlineData
                    const arrayBuffer = await file.arrayBuffer();
                    const bytes = new Uint8Array(arrayBuffer);
                    let binary = '';
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    fileBase64 = window.btoa(binary);
                } else {
                    fileContentText = await file.text(); // Fallback
                }
            }

            statusEl.textContent = "Kontaktiere KI-Modell...";

            const systemPrompt = `Du bist ein strenger aber kompetenter Linux-Ausbilder (Tux) und ein Experte für das Erstellen von Quizfragen.
Erstelle 3 hochwertige, anspruchsvolle Quizfragen zum vorgegebenen Thema oder basierend auf dem hochgeladenen Dokument.
GIB EXAKT UND AUSSCHLIESSLICH EIN GÜLTIGES JSON-ARRAY ZURÜCK! Keine Markdown-Formatierung (kein \`\`\`json), nur das reine Array.

Jedes Objekt im Array muss folgende Struktur haben:
{
  "category": "${category}",
  "question": "Die Quizfrage hier...",
  "answer": "Die korrekte, kurze Antwort...",
  "moreInfo": "### 1. tl;dr\\n[WICHTIG: Schreibe hier eine echte, inhaltliche Kurzzusammenfassung (1-2 Sätze)! Schreibe NIEMALS 'Siehe Erklärung unten' oder ähnliches!]\\n---\\n> **Tux-Ansage:** [Ein bissiger, aber motivierender Ausbilderspruch von Tux passend zur Frage]\\n---\\n### 3. Deep Dive\\n[Tiefergehende Erklärung, Hintergrundinfos und Praxis-Beispiele]",
  "difficulty": "leicht", // oder "mittel" oder "schwer"
  "validationType": "concept",
  "keywords": ["stichwort1", "stichwort2", "stichwort3"]
}

Thema/Anweisung des Nutzers:
${topicInput || "Keine spezifische Anweisung, generiere Fragen basierend auf der Datei."}

${fileContentText ? "\nInhalt der Datei:\n" + fileContentText : ""}`;

            const url = llmConfig.url || '';
            const model = llmConfig.model || '';
            const key = llmConfig.key || '';
            
            let response;
            if (url.includes('generativelanguage.googleapis.com')) {
                let endpoint = url;
                if (!endpoint.includes('generateContent')) {
                    endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
                }
                
                const parts = [{ text: systemPrompt }];
                if (fileBase64 && fileMime) {
                    parts.push({
                        inlineData: { mimeType: fileMime, data: fileBase64 }
                    });
                }

                response = await fetchWithProxyFallback(`${endpoint}?key=${key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: parts }],
                        generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
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
                        messages: [{ role: 'user', content: systemPrompt }],
                        temperature: 0.7
                    })
                });
            }

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            let textResult = url.includes('generativelanguage.googleapis.com') ? data.candidates[0].content.parts[0].text : data.choices[0].message.content;
            
            textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
            const newQuestions = JSON.parse(textResult);

            if (!Array.isArray(newQuestions)) {
                throw new Error("KI hat kein Array zurückgegeben.");
            }

            // Speichern in localStorage
            const existingCustom = JSON.parse(safeStorage.getItem('custom_questions') || '[]');
            existingCustom.push(...newQuestions);
            safeStorage.setItem('custom_questions', JSON.stringify(existingCustom));

            statusEl.style.color = 'var(--dis-matrix)';
            statusEl.textContent = `Erfolg! ${newQuestions.length} neue Fragen generiert und gespeichert.`;
            
            setTimeout(() => {
                window.location.href = 'index.html'; // Zurück zum Quiz
            }, 2000);

        } catch (e) {
            console.error("Generator Fehler:", e);
            statusEl.style.color = 'var(--dis-danger)';
            statusEl.textContent = "Fehler: " + e.message;
            btnGenerate.disabled = false;
            btnGenerate.textContent = "🚀 Fragen jetzt generieren";
        }
    });
}

window.addEventListener('DOMContentLoaded', initGenerator);
