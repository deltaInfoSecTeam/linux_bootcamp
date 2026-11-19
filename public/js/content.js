// Management / Content: Reiter, Import, Export, Übernahme aus dem Browser, Wiedereinblenden.
// Schreiben geht nur mit Admin-Token; der Server prüft das zusätzlich (adminOnly).
(function () {
    'use strict';
    const $ = id => document.getElementById(id);
    const FORMAT = 'linux-bootcamp-content';
    let importList = null;

    function token() { return typeof currentToken !== 'undefined' ? currentToken : null; }
    async function api(path, method, body) {
        const res = await fetch(path, {
            method: method || 'GET',
            headers: { 'Content-Type': 'application/json', ...(token() ? { 'Authorization': 'Bearer ' + token() } : {}) },
            body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store'
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || ('Fehler ' + res.status));
        return data;
    }
    function msg(id, kind, text) {
        const el = $(id);
        if (!el) return;
        el.innerHTML = '';
        if (!text) return;
        const box = document.createElement('div');
        box.className = 'dis-alert dis-alert--' + kind;
        box.textContent = text;
        el.appendChild(box);
    }
    function localQuestions() {
        try { const l = JSON.parse(localStorage.getItem('custom_questions') || '[]'); return Array.isArray(l) ? l : []; }
        catch (e) { return []; }
    }

    // Reiter umschalten
    function showTab(name) {
        document.querySelectorAll('[data-ctab]').forEach(b => b.classList.toggle('active', b.dataset.ctab === name));
        document.querySelectorAll('[data-cpane]').forEach(p => { p.hidden = p.dataset.cpane !== name; });
        if (name === 'io') refreshIo();
        if (name === 'generator' && window.refreshGeneratorCategories) window.refreshGeneratorCategories();
    }
    window.showContentTab = showTab;

    async function refreshIo() {
        const local = localQuestions();
        $('content-local-card').hidden = local.length === 0;
        $('content-local-info').textContent = `In diesem Browser liegen ${local.length} eigene Fragen aus der Zeit vor der zentralen Verwaltung. Sie sind bisher nur hier sichtbar.`;
        try {
            const c = await api('/api/content');
            $('content-export-info').textContent = `${c.questions.length} eigene Fragen, ${c.hidden.modules.length} ausgeblendete Module, ${c.hidden.chapters.length} ausgeblendete Kapitel.`;
            const n = c.hidden.modules.length + c.hidden.chapters.length;
            $('content-hidden-info').textContent = n
                ? `Ausgeblendet: ${[...c.hidden.modules, ...c.hidden.chapters].join(', ')}`
                : 'Keine Module oder Kapitel ausgeblendet.';
            $('btn-content-restore').disabled = n === 0;
        } catch (e) {
            msg('content-io-msg', 'fail', 'Stand konnte nicht geladen werden: ' + e.message);
        }
    }

    // Import: Datei lesen und prüfen (Format dieses Exports oder reines Array)
    async function readImport(file) {
        importList = null;
        $('btn-content-import').disabled = true;
        msg('content-import-preview', '', '');
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { msg('content-import-preview', 'fail', 'Datei ist größer als 5 MB.'); return; }
        try {
            const data = JSON.parse(await file.text());
            const list = Array.isArray(data) ? data : (data && Array.isArray(data.questions) ? data.questions : null);
            if (!list) throw new Error('Keine Fragenliste gefunden.');
            const usable = list.filter(q => q && typeof q.question === 'string' && typeof q.answer === 'string' && typeof q.category === 'string');
            if (!usable.length) throw new Error('Die Datei enthält keine vollständigen Fragen (category, question, answer).');
            importList = usable.map(q => { const c = { ...q }; delete c.id; delete c.contentId; return c; });
            const cats = new Set(importList.map(q => q.category));
            msg('content-import-preview', 'info', `${importList.length} Fragen in ${cats.size} Kapiteln gefunden${list.length > usable.length ? `, ${list.length - usable.length} unvollständige werden übersprungen` : ''}.`);
            $('btn-content-import').disabled = false;
        } catch (e) {
            msg('content-import-preview', 'fail', 'Datei nicht lesbar: ' + e.message);
        }
    }

    async function doImport(list, okText) {
        const res = await api('/api/admin/content/questions', 'POST', { questions: list });
        msg('content-io-msg', 'ok', `${okText}: ${res.added} Fragen${res.skipped ? `, ${res.skipped} ungültige übersprungen` : ''}. Die Seite lädt gleich neu.`);
        setTimeout(() => location.reload(), 1800);
        return res;
    }

    // Export: zentrale Inhalte als Datei
    async function doExport() {
        const c = await api('/api/content');
        const questions = c.questions.map(q => { const o = { ...q }; delete o.contentId; delete o.id; return o; });
        const out = { format: FORMAT, version: 1, exported_at: new Date().toISOString(), questions, hidden: c.hidden };
        const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `bootcamp-content-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        msg('content-io-msg', 'ok', `${questions.length} Fragen exportiert.`);
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-ctab]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.ctab)));
        $('content-import-file')?.addEventListener('change', e => readImport(e.target.files[0]));
        $('btn-content-import')?.addEventListener('click', async () => {
            if (!importList) return;
            $('btn-content-import').disabled = true;
            try { await doImport(importList, 'Importiert'); } catch (e) { msg('content-io-msg', 'fail', e.message); $('btn-content-import').disabled = false; }
        });
        $('btn-content-export')?.addEventListener('click', async () => {
            try { await doExport(); } catch (e) { msg('content-io-msg', 'fail', e.message); }
        });
        $('btn-content-local')?.addEventListener('click', async () => {
            const local = localQuestions();
            if (!local.length) return;
            if (!confirm(`${local.length} Fragen aus diesem Browser für alle Lernenden übernehmen? Danach werden sie aus diesem Browser entfernt.`)) return;
            try {
                await doImport(local.map(q => { const c = { ...q }; delete c.id; return c; }), 'Übernommen');
                localStorage.removeItem('custom_questions');
            } catch (e) { msg('content-io-msg', 'fail', e.message); }
        });
        $('btn-content-restore')?.addEventListener('click', async () => {
            if (!confirm('Alle ausgeblendeten Module und Kapitel für alle wieder einblenden?')) return;
            try {
                const r = await api('/api/admin/content/restore', 'POST', {});
                msg('content-io-msg', 'ok', `${r.restored} Einträge wieder eingeblendet. Die Seite lädt gleich neu.`);
                setTimeout(() => location.reload(), 1500);
            } catch (e) { msg('content-io-msg', 'fail', e.message); }
        });
    });
}());
