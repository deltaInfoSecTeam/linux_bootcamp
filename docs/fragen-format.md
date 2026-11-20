# Aufbau der Fragen

Verbindlich für alle Fragen im eingebauten Katalog (`public/js/questions.js`), für den Import unter
Management / Content und für den KI-Generator. Wer Fragen schreibt oder prüft, richtet sich danach.

## 1. Lerneinheit und Kapitel

- Eine **Lerneinheit** ist ein Modul, im Quiz-Setup eine eigene Gruppe, z. B. `git()` oder `git.grundlagen()`.
- Ein **Kapitel** hat genau **drei Fragen**: eine `leicht`, eine `mittel`, eine `schwer`. So funktionieren
  „Auto-Adaptiv“ und die Schwierigkeitsknöpfe.
- Kategorie-Namen:
  - Linux-Grundkurs: `"N. Titel"` (Gruppe `linux.basic()`)
  - Weitere Module: `"Modul::N. Titel"`, z. B. `"Git Grundlagen::3. Änderungen festhalten"`
- **IDs** im eingebauten Katalog je Kapitel (`topicId` = N): `mittel` = N, `leicht` = 100 + N, `schwer` = 200 + N.
  Neue Kapitel bekommen die nächste freie `topicId`.

## 2. Felder

| Feld | Pflicht | Inhalt |
|---|---|---|
| `category` | ja | Kategorie wie oben |
| `question` | ja | Fragetext. **Keine Backticks** (werden im Fragetext nicht formatiert), Befehle und Dateinamen in einfache Anführungszeichen |
| `answer` | ja | Musterantwort, kurz. Markdown erlaubt (`` `befehl` ``, **fett**, Listen) |
| `difficulty` | ja | `leicht`, `mittel` oder `schwer` |
| `validationType` | ja | `concept` (freie Antwort, KI oder Stichwortprüfung) oder `command` |
| `solutions` | bei `command` | Liste regulärer Ausdrücke, mit denen die Eingabe geprüft wird (ohne Groß-/Kleinschreibung, Leerzeichen werden vorher vereinheitlicht). Mehrere gleichwertige Schreibweisen aufnehmen |
| `topicId` | ja (Katalog) | Kapitelnummer |
| `moreInfo` | ja | Vertiefung, siehe unten |

Etwa ein Drittel der Fragen einer Lerneinheit sollten Befehlsfragen (`command`) sein.

## 3. Vertiefung (`moreInfo`)

Immer in dieser Reihenfolge, Abschnitte durch `---` getrennt:

```
### 1. tl;dr
Ein bis zwei Sätze, die die Antwort auf den Punkt bringen.
---
> **Tux-Ansage:** Ein Satz im Ausbilder-Ton, motivierend, nie beleidigend.
---
### 2. Deep Dive
Erklärung mit Hintergrund, Befehlen und Beispielen (Codeblöcke).
---
### 3. Schaubild
Eine Textgrafik im Codeblock, wenn das Thema davon profitiert.
```

**Schaubild:** Wenn es zum Thema passt (Abläufe, Zustände, Datenflüsse, Aufbau), endet die Vertiefung
mit einem Schaubild. Die Vertiefung erlaubt aus Sicherheitsgründen kein HTML und keine Bilder; das
Schaubild ist deshalb eine **Textgrafik im Codeblock** aus Zeichen (`-->`, `|`, `+---+`). Das passt zum
Terminal-Look, funktioniert offline und auf dem Handy. Höchstens etwa 60 Zeichen breit, damit es auf
schmalen Bildschirmen lesbar bleibt. Beispiel:

```
Arbeitsverz. --git add--> Staging --git commit--> Repo
```

Ältere Fragen nummerieren „1. tl;dr“ und „3. Deep Dive“; die Anzeige hängt nicht an den Nummern.
Neue Fragen nutzen die Nummerierung oben.

## 4. Regeln

- Deutsch, sachlich, Fachbegriffe beim ersten Auftreten kurz erklären.
- **Keine Emojis** (Corporate Design), Statusmarken nur über die Oberfläche.
- **Neutrale Beispiele:** `git.example.org`, `example.com`, `benutzer@host`, Adressen aus `192.0.2.0/24`.
  Keine echten Hostnamen, Server, Personen oder Zugangsdaten (das Repo ist öffentlich).
- Schwer heißt: Zusammenhänge, typische Fallen und Abwägungen, nicht nur seltene Optionen.

## 5. Einbau

- **Eingebauter Katalog:** Fragen in `public/js/questions.js` ergänzen und die Cache-Version in
  `public/sw.js` erhöhen, damit installierte Apps die neuen Fragen laden.
- **Ohne Code:** unter Management / Content → Import als JSON-Datei (gleiche Felder, `id` und `topicId`
  entfallen) oder über den Generator. Diese Fragen liegen in der Datenbank und gelten für alle.
