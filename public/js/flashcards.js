// Lernkarten als Lernkartei (Leitner-System).
// Die Selbsteinschätzung steuert nur, wann eine Karte wiederkommt. Sie bringt
// keine Punkte, keinen Rang und keine Trefferquote, zählt aber für die Tagesserie.
const LEITNER_KEY = 'flashcard_boxes_v1';
const DAY_MS = 24 * 60 * 60 * 1000;
// Kasten -> Tage bis zur nächsten Wiederholung (Kasten 4 = gelernt)
const BOX_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7 };

function loadBoxes() {
    try {
        const data = JSON.parse(safeStorage.getItem(LEITNER_KEY));
        return data && typeof data === 'object' ? data : {};
    } catch {
        return {};
    }
}

function saveBoxes(boxes) {
    safeStorage.setItem(LEITNER_KEY, JSON.stringify(boxes));
}

/** Stand einer Karte: box 0 = noch nie gelernt, due = fällig ab (ms). */
function cardEntry(q, boxes = loadBoxes()) {
    const e = boxes[q.id];
    return e && Number.isInteger(e.box) ? e : { box: 0, due: 0 };
}

function isCardDue(q, boxes = loadBoxes(), now = Date.now()) {
    return cardEntry(q, boxes).due <= now;
}

/** Fällige Karten (neue eingeschlossen) nach vorn, Reihenfolge sonst unverändert. */
function sortCardsByDue(cards) {
    const boxes = loadBoxes();
    const now = Date.now();
    const due = cards.filter(q => isCardDue(q, boxes, now));
    const later = cards.filter(q => !isCardDue(q, boxes, now));
    return { cards: due.concat(later), dueCount: due.length };
}

function nextBox(current, level) {
    if (level === 'again') return 1;
    if (level === 'unsure') return 2;
    return Math.min(4, Math.max(current + 1, 3)); // 'known'
}

function daysText(days) {
    return days === 1 ? 'morgen' : `in ${days} Tagen`;
}

/** Tagesserie wie beim Quiz fortschreiben, ohne Punkte oder Statistik zu ändern. */
function markLearnedToday() {
    const today = new Date().toDateString();
    let lastTs = state.stats.lastPlayed;
    if (typeof lastTs === 'string') lastTs = parseInt(lastTs, 10);
    const last = lastTs ? new Date(lastTs).toDateString() : null;
    if (last !== today) {
        state.stats.streak += 1;
        showToast(`Tägliche Serie aktiv: ${state.stats.streak} Tage`, 'success');
    }
    state.stats.lastPlayed = Date.now();
    saveStats();
    updateStatsUI();
    if (typeof syncBackendXp === 'function') {
        syncBackendXp(0, state.stats.streak, 0, 0, 0, state.stats.lastPlayed);
    }
}

/** Selbsteinschätzung einer aufgedeckten Karte: 'again' | 'unsure' | 'known'. */
function rateFlashcard(level) {
    const q = state.filteredQuestions[state.currentIndex];
    if (!q) return;
    const boxes = loadBoxes();
    const box = nextBox(cardEntry(q, boxes).box, level);
    const days = BOX_DAYS[box];
    boxes[q.id] = { box, due: Date.now() + days * DAY_MS };
    saveBoxes(boxes);
    markLearnedToday();

    if (level === 'again') {
        // Noch einmal in dieser Runde, ein paar Karten später
        const pos = Math.min(state.currentIndex + 4, state.filteredQuestions.length);
        state.filteredQuestions.splice(pos, 0, q);
        showToast('Kommt gleich nochmal.', 'info');
    } else if (box === 4) {
        showToast(`Gelernt. Wiederholung ${daysText(days)}.`, 'success');
    } else {
        showToast(`Kasten ${box}: Wiederholung ${daysText(days)}.`, 'info');
    }
    updateLeitnerInfo();

    setTimeout(() => {
        if (state.currentIndex < state.filteredQuestions.length - 1) {
            state.currentIndex++;
            renderCurrentQuestion();
        } else {
            showToast('Runde beendet. Fällige Karten kommen zuerst.', 'success');
            updateFilteredQuestions();
        }
    }, 600);
}

/** Verteilung der aktuellen Auswahl auf die Kästen (nur im Lernkarten-Modus sichtbar). */
function updateLeitnerInfo() {
    const info = document.getElementById('leitner-info');
    if (!info) return;
    if (state.mode !== 'flashcard') {
        info.hidden = true;
        return;
    }
    const boxes = loadBoxes();
    const now = Date.now();
    const seen = new Set();
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    let due = 0;
    state.filteredQuestions.forEach(q => {
        if (seen.has(q.id)) return; // "Nochmal"-Kopien nicht doppelt zählen
        seen.add(q.id);
        counts[cardEntry(q, boxes).box]++;
        if (isCardDue(q, boxes, now)) due++;
    });
    const cells = [
        ['neu', counts[0]], ['Kasten 1', counts[1]], ['Kasten 2', counts[2]],
        ['Kasten 3', counts[3]], ['gelernt', counts[4]],
    ];
    info.innerHTML = `<span class="leitner-due">${due} fällig</span>`
        + cells.map(([label, n]) => `<span class="leitner-box"><b>${n}</b>${label}</span>`).join('');
    info.hidden = false;
}

/** Knöpfe passend zum Modus beschriften: Lernkarten steuern die Wiederholung, das Quiz wertet. */
function labelRatingButtons() {
    const flash = state.mode === 'flashcard';
    const set = (id, text, title) => {
        const b = document.getElementById(id);
        if (!b) return;
        b.textContent = text;
        b.title = title;
    };
    if (flash) {
        set('rate-wrong', 'NOCHMAL', 'Kommt in dieser Runde gleich wieder');
        set('rate-partial', 'UNSICHER', 'Kasten 2: Wiederholung morgen');
        set('rate-correct', 'SITZT', 'Nächster Kasten: Wiederholung in 3 bis 7 Tagen');
    } else {
        set('rate-wrong', '0.0 FALSCH', '');
        set('rate-partial', '0.5 TEILS', '');
        set('rate-correct', '1.0 RICHTIG', '');
    }
}
