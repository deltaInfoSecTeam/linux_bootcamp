// Quiz: Kategorien, Filter, Fragen-Rendering, Antwort-Validierung
// Load and render category checkboxes
function initCategories() {
    const categories = [...new Set(QUESTIONS.map(q => q.category))].sort();
    el.catList.innerHTML = '';
    
    // Reset catAll listener to avoid duplicates if called multiple times
    const oldCatAll = el.catAll;
    const newCatAll = oldCatAll.cloneNode(true);
    oldCatAll.parentNode.replaceChild(newCatAll, oldCatAll);
    el.catAll = newCatAll;

    // Grouping logic
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
    
    // Render the groups
    const groupCheckboxes = [];
    const allChildCheckboxes = [];

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

        const groupCheckbox = document.createElement('input');
        groupCheckbox.type = 'checkbox';
        groupCheckbox.style.marginRight = '8px';
        
        const groupLabelSpan = document.createElement('span');
        groupLabelSpan.textContent = gName;
        
        summary.appendChild(groupCheckbox);
        summary.appendChild(groupLabelSpan);
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

        const localChildCheckboxes = [];

        groupData.children.forEach(child => {
            const label = document.createElement('label');
            label.className = 'category-item';
            label.style.display = 'flex';
            label.style.width = '100%';
            label.style.justifyContent = 'space-between';
            label.style.alignItems = 'center';
            label.innerHTML = `
                <div style="display: flex; align-items: center; flex: 1;">
                    <input type="checkbox" value="${child.id}">
                    <span class="checkmark"></span>
                    <span class="cat-name">${child.name}</span>
                </div>
            `;
            
            
            
            const cb = label.querySelector('input');
            childrenContainer.appendChild(label);
            localChildCheckboxes.push(cb);
            allChildCheckboxes.push(cb);
            
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    state.selectedCategories.delete('all');
                    el.catAll.checked = false;
                    state.selectedCategories.add(e.target.value);
                } else {
                    state.selectedCategories.delete(e.target.value);
                    if (state.selectedCategories.size === 0) {
                        state.selectedCategories.add('all');
                        el.catAll.checked = true;
                    }
                }
                
                const allChecked = localChildCheckboxes.every(c => c.checked);
                const someChecked = localChildCheckboxes.some(c => c.checked);
                groupCheckbox.checked = allChecked;
                groupCheckbox.indeterminate = someChecked && !allChecked;
                
                updateFilteredQuestions();
            });
        });

        groupCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            localChildCheckboxes.forEach(cb => {
                if (cb.checked !== isChecked) {
                    cb.checked = isChecked;
                    if (isChecked) {
                        state.selectedCategories.delete('all');
                        el.catAll.checked = false;
                        state.selectedCategories.add(cb.value);
                    } else {
                        state.selectedCategories.delete(cb.value);
                    }
                }
            });
            
            if (state.selectedCategories.size === 0) {
                state.selectedCategories.add('all');
                el.catAll.checked = true;
            }
            
            updateFilteredQuestions();
        });

        groupCheckbox.addEventListener('click', (e) => e.stopPropagation());

        el.catList.appendChild(groupElement);
        groupCheckboxes.push(groupCheckbox);
    });

    el.catAll.addEventListener('change', (e) => {
        if (e.target.checked) {
            state.selectedCategories.clear();
            state.selectedCategories.add('all');
            allChildCheckboxes.forEach(cb => cb.checked = false);
            groupCheckboxes.forEach(cb => { cb.checked = false; cb.indeterminate = false; });
        } else {
            e.target.checked = true;
        }
        updateFilteredQuestions();
    });
}

// Filter and shuffle questions
function updateFilteredQuestions() {
    const diff = state.difficulty === 'auto' ? state.currentDifficulty : state.difficulty;
    
    if (state.selectedCategories.has('all')) {
        state.filteredQuestions = QUESTIONS.filter(q => q.difficulty === diff);
    } else {
        state.filteredQuestions = QUESTIONS.filter(q => 
            state.selectedCategories.has(q.category) && q.difficulty === diff
        );
    }
    
    // Fisher-Yates Shuffle for truly random order
    for (let i = state.filteredQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.filteredQuestions[i], state.filteredQuestions[j]] = [state.filteredQuestions[j], state.filteredQuestions[i]];
    }
    
    state.currentIndex = 0;
    
    showToast(`${state.filteredQuestions.length} Fragen geladen.`, 'success');
    renderCurrentQuestion();
    if (typeof updateSessionStatsUI === 'function') updateSessionStatsUI();
}

// Render active question
function renderCurrentQuestion() {
    if (state.filteredQuestions.length === 0) {
        el.questionText.textContent = "Keine Fragen für die ausgewählte Kategorie gefunden.";
        el.progressText.textContent = "Frage 0 von 0";
        el.categoryBadge.textContent = "-";
        el.progressBarFill.style.width = '0%';
        el.btnReveal.disabled = true;
        el.btnPrev.disabled = true;
        el.btnSkip.disabled = true;
        return;
    }

    el.btnReveal.disabled = false;
    el.btnPrev.disabled = state.currentIndex === 0;
    el.btnSkip.disabled = state.currentIndex === state.filteredQuestions.length - 1;

    // Scroll to top of the page for the new question
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const q = state.filteredQuestions[state.currentIndex];
    state.currentQuestionStartTime = Date.now();
    
    // Add slide-in animation class to card
    el.card.style.animation = 'none';
    el.card.offsetHeight; /* trigger reflow */
    el.card.style.animation = 'slideUp 0.4s ease forwards';

    el.questionText.textContent = q.question;
    el.categoryBadge.textContent = q.category;
    el.progressText.textContent = `Frage ${state.currentIndex + 1} von ${state.filteredQuestions.length}`;
    
    const progressPercent = ((state.currentIndex + 1) / state.filteredQuestions.length) * 100;
    el.progressBarFill.style.width = `${progressPercent}%`;

    // Clear and reset user input
    el.userAnswer.value = '';
    el.userAnswer.disabled = false;
    el.userInputGroup.classList.remove('correct', 'partial', 'wrong');
    
    if (state.mode === 'flashcard') {
        el.userInputGroup.classList.add('hidden');
        if (el.btnIdk) el.btnIdk.classList.add('hidden');
        el.btnReveal.textContent = 'Antwort aufdecken';
    } else {
        el.userInputGroup.classList.remove('hidden');
        if (el.btnIdk) el.btnIdk.classList.remove('hidden');
        el.btnReveal.textContent = '>> ANTWORT PRÜFEN';
    }
    
    // Reset feedback container
    el.feedbackContainer.classList.add('hidden');
    el.feedbackContainer.classList.remove('correct', 'partial', 'wrong');

    // Hide answers and reset controls
    el.answerContainer.classList.add('hidden');
    el.btnReveal.classList.remove('hidden');
    if (el.btnIdk) el.btnIdk.classList.remove('hidden');
    
    // Hide more info wrapper
    if (el.moreInfoWrapper) el.moreInfoWrapper.classList.add('hidden');
    if (el.moreInfoContent) el.moreInfoContent.classList.add('hidden');
    if (el.btnMoreInfo) el.btnMoreInfo.disabled = false;
    if (el.btnSkip) el.btnSkip.classList.remove('hidden');
    document.getElementById('btn-confirm-rating').classList.add('hidden');
    document.getElementById('btn-fc-next').classList.add('hidden');
    document.getElementById('btn-flag-review').classList.add('hidden');
    el.ratingControls.classList.add('hidden');
}

// Validator for user answers
function validateAnswer(q, input) {
    if (!input) {
        return {
            rating: 'wrong',
            text: '⚠️ **Keine Antwort eingegeben.** Du hast das Textfeld leer gelassen.'
        };
    }

    if (q.validationType === 'command') {
        // Normalisiere Whitespaces und Quotes
        const normalizedInput = input.replace(/\s+/g, ' ').trim();
        
        let isCorrect = false;
        if (q.solutions) {
            for (let sol of q.solutions) {
                const regex = new RegExp(sol, 'i');
                if (regex.test(normalizedInput)) {
                    isCorrect = true;
                    break;
                }
            }
        }
        
        if (isCorrect) {
            return {
                rating: 'correct',
                text: '🎯 **Hervorragend!** Dein Befehl stimmt exakt mit der Lösung überein.'
            };
        } else {
            // Finde den ersten Befehlsnamen
            const firstWord = q.solutions && q.solutions[0] ? q.solutions[0].split(/\x5cs\x2b/)[0] : '';
            const cmdName = firstWord.replace(/\\/g, '');
            const hasCommandName = new RegExp(cmdName, 'i').test(normalizedInput);
            
            if (hasCommandName) {
                return {
                    rating: 'partial',
                    text: `⚠️ **Teilweise korrekt.** Du hast den richtigen Befehl (\`${cmdName}\`) verwendet, aber die Parameter oder Pfade weichen ab. Vergleiche deine Eingabe mit der Musterlösung.`
                };
            } else {
                return {
                    rating: 'wrong',
                    text: '❌ **Nicht korrekt.** Dein Befehl unterscheidet sich deutlich von der empfohlenen Syntax.'
                };
            }
        }
    } else {
        // Begriffsanalyse
        const matched = [];
        const unmatched = [];
        
        let keywords = q.keywords;
        if (!keywords && q.validationType === 'concept') {
            const textToAnalyze = (q.answer + " " + (q.moreInfo || "")).toLowerCase();
            const words = textToAnalyze.match(/[a-zäöüß]{5,}/g) || [];
            const stopwords = ['dieser','diese','dieses','welche','welcher','welches','einen','einem','einer','sowie','durch','unter','ueber','nicht','keine','haben','werden','kannst','dass','wird','kann','auch','sind','oder','nach','dann','mehr','wenn','aber','sein'];
            const filtered = words.filter(w => !stopwords.includes(w));
            const uniqueWords = [...new Set(filtered)];
            uniqueWords.sort((a,b) => b.length - a.length);
            keywords = uniqueWords.slice(0, 5);
        }
        
        if (keywords) {
            keywords.forEach(kw => {
                const regex = new RegExp(kw, 'i');
                if (regex.test(input)) {
                    matched.push(kw);
                } else {
                    unmatched.push(kw);
                }
            });
        }
        
        const matchedCount = matched.length;
        const totalCount = keywords ? keywords.length : 0;
        
        let rating = 'wrong';
        let ratingText = '';
        
        if (matchedCount >= 3 || (totalCount < 3 && matchedCount >= totalCount)) {
            rating = 'correct';
            ratingText = '🎯 **Super!** Du hast die wichtigsten Kernbegriffe in deiner Erklärung genannt.';
        } else if (matchedCount >= 1) {
            rating = 'partial';
            ratingText = '⚠️ **Guter Ansatz.** Du hast einige wichtige Aspekte genannt, aber es fehlen noch wichtige Details.';
        } else {
            rating = 'wrong';
            ratingText = '❌ **Wiederholen.** Deine Antwort enthält leider keinen der erwarteten Kernbegriffe.';
        }
        
        let tagsHtml = '<div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">';
        matched.forEach(kw => {
            tagsHtml += `<span class="keyword-tag matched">✓ ${escapeHtml(kw)}</span>`;
        });
        unmatched.forEach(kw => {
            tagsHtml += `<span class="keyword-tag unmatched">✗ ${escapeHtml(kw)}</span>`;
        });
        tagsHtml += '</div>';
        
        return {
            rating: rating,
            text: `${ratingText}<br><br>Erkannte Kernbegriffe (${matchedCount} von ${totalCount}):${tagsHtml}`
        };
    }
}

