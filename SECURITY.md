# Sicherheitslücken melden

Wenn du eine Sicherheitslücke im Linux Bootcamp gefunden hast, melde sie bitte **vertraulich** und
**nicht** als öffentliches Issue, Pull Request oder Diskussion.

## So meldest du

1. Im Repository auf **Security** gehen.
2. **Report a vulnerability** wählen.
3. Beschreiben, was betroffen ist, wie sich die Lücke nachvollziehen lässt und welche Auswirkung du
   erwartest. Ein kurzes Beispiel oder Proof of Concept hilft.

Die Meldung ist nur für dich und die Betreuer des Projekts sichtbar.

## Was du erwarten kannst

- Wir bestätigen den Eingang in der Regel innerhalb von 7 Tagen.
- Wir prüfen die Meldung, halten dich über den Stand auf dem Laufenden und sprechen mit dir ab,
  wann die Lücke veröffentlicht wird, sobald eine Korrektur bereitsteht.
- Auf Wunsch nennen wir dich in der Veröffentlichung.

## Unterstützte Versionen

Sicherheitskorrekturen gibt es für den aktuellen Stand des Branches `main`. Installationen
aktualisierst du über den Update-Knopf unter Management / System oder mit `git pull --ff-only`
und `./scripts/install.sh`.

## Bitte beachten

- Teste nur mit eigenen Installationen, nicht mit fremden Servern.
- Greife nicht auf Daten anderer Nutzer zu und verändere oder lösche keine Daten.
- Keine Last- oder Denial-of-Service-Tests.
