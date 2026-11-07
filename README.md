<div align="center">
  <img src="public/img/favicon.jpg" alt="Linux Bootcamp Logo" width="150" style="border-radius: 50%;">
  
  # 🐧 Linux Bootcamp PWA
  
  **Eine interaktive, KI-gestützte Lernplattform (Progressive Web App) für angehende Linux-Administratoren.** <br>
  *Lerne Kommandozeilen, Konfigurationen und Server-Basics spielerisch durch ein XP- und Ränge-System.*
</div>

---

## ✨ Features

- 🧠 **KI-Tutor Integration:** Verknüpfbar mit Google Gemini, OpenAI oder lokalen LLMs (Ollama), um falsch beantwortete Fragen detailliert und verständlich im "Ausbilder-Ton" zu erklären.
- 🎓 **Klausur-Modus:** Simuliert eine echte IHK-Prüfungssituation (45 Minuten Timer, 24 Fragen quer durch alle Kategorien, automatische Notenberechnung von 1 bis 6).
- 🏆 **Gamification & Ränge:** Sammle XP durch korrekte Antworten, halte deine Streak und steige im Dienstgrad auf (von *Schütze* bis *General* – basierend auf den Bundeswehr-Dienstgraden).
- 📱 **Progressive Web App (PWA):** Kann als native App auf Android, iOS oder dem Desktop installiert werden. Funktioniert auch bei schlechter Internetverbindung dank Service Worker Caching.
- 👨‍💻 **Admin-Konsole:** Integriertes Lehrer-Pult zur Verwaltung von Benutzern, Rechten und zur Einsicht aller absolvierten Schüler-Klausuren.
- 🐳 **Docker-Ready:** Vollständig isoliertes Setup für sekundenschnelles Deployment auf jedem Linux-Server.

---

## 🚀 Installation & Deployment

### Voraussetzungen
- Docker mit Docker Compose (v2.24 oder neuer)

### ⚡ Quickstart

```bash
git clone https://github.com/deltaInfoSecTeam/linux_bootcamp.git && cd linux_bootcamp && cp .env.example .env && docker compose up -d --build
```

Danach läuft die App unter `http://localhost:8000`. Standardmäßig ist sie **nur lokal** erreichbar (`127.0.0.1`).

### Ersten Admin anlegen

```bash
docker compose exec bootcamp node scripts/create-admin.js <username>
```

Existiert der Nutzer schon, wird er zum Admin. Sonst wird er neu angelegt, und Passwort plus Recovery-Token werden **einmalig** ausgegeben.

### Zugriff von außen (Server / LAN)

Öffne den Port nicht direkt, sondern setze einen Reverse Proxy mit HTTPS davor. Ein Beispiel mit Caddy, das das Zertifikat automatisch holt:

```
bootcamp.example.de {
    reverse_proxy 127.0.0.1:8000
}
```

Setze dazu in `.env` den Wert `TRUST_PROXY=1`. HTTPS ist für PWA-Funktionen auf Mobilgeräten ohnehin Pflicht.

### Daten & Secrets

- Alles Persistente liegt in `./data/`: `bootcamp.db`, `.jwt_secret`, `.encryption_secret`.
- Die Secrets werden beim ersten Start zufällig erzeugt. Alternativ trägst du sie in `.env` ein.
- **Backup:** den Ordner `./data` sichern. Ohne `.encryption_secret` sind die gespeicherten API-Keys nicht mehr lesbar.
- Der Container läuft als Nutzer `node` (UID 1000). Gehört `./data` einem anderen Nutzer: `sudo chown -R 1000:1000 data`

### Update von v1.0.0

```bash
docker compose down
mkdir -p data && mv bootcamp.db data/ && sudo chown -R 1000:1000 data
git pull && cp -n .env.example .env && docker compose up -d --build
```

Beim ersten Start werden die alten Recovery-Codes gehasht und die API-Keys verschlüsselt. Alle Nutzer müssen sich einmal neu anmelden.

### Entwicklung ohne Docker

```bash
npm ci
npm start
```

---

## 📁 Projektstruktur

```
├── server/            Backend (Express)
│   ├── index.js       Einstiegspunkt, Middleware, Static-Hosting von public/
│   ├── config.js      Konfiguration aus Umgebungsvariablen, Secrets
│   ├── db.js          SQLite-Zugriff und Migrationen
│   ├── crypto.js      Recovery-Code-Hashing, Verschlüsselung der API-Keys
│   ├── validation.js  Eingabeprüfung
│   ├── middleware/    auth, rateLimit, security (CSP & Header)
│   └── routes/        auth, admin, user, proxy
├── public/            Frontend – nur dieser Ordner wird ausgeliefert
│   ├── index.html  generator.html  manifest.json  sw.js
│   ├── css/  img/
│   └── js/            boot, auth, core, questions, quiz, llm, stats, main, generator
├── scripts/           create-admin.js
├── tools/content/     Rohdaten für Fragen (werden nicht ausgeliefert)
├── data/              Laufzeitdaten (gitignored)
├── Dockerfile  docker-compose.yml  .env.example
```

---

## 🔒 Sicherheit

- Ausgeliefert wird nur `public/`. Datenbank, Secrets und Server-Code sind nicht über HTTP erreichbar.
- Passwörter werden mit bcrypt gehasht, Recovery-Codes mit HMAC. Gespeicherte LLM-API-Keys sind mit AES-256-GCM verschlüsselt.
- Nach Passwortwechsel, Sperre oder Rechteänderung werden alle JWTs des Nutzers ungültig.
- Eine strikte Content-Security-Policy (`script-src 'self'`) verhindert Inline-Skripte.
- Der LLM-Proxy erreicht nur Gemini, OpenAI und die in `OLLAMA_URL` eingetragene Adresse.
- Der Container läuft ohne root, mit schreibgeschütztem Dateisystem und ohne Capabilities.

---

## 🛠️ Technologie-Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Kein Framework-Overhead!)
- **Backend:** Node.js, Express
- **Datenbank:** SQLite (`bootcamp.db` – extrem portabel und leichtgewichtig)
- **Authentifizierung:** JWT (JSON Web Tokens) & Bcrypt
- **Architektur:** Client-Server, PWA (Manifest & Service Worker)

---

## 🤖 KI-Integration einrichten

Im Menü unter **"⚙️ Einstellungen"** kannst du deinen bevorzugten LLM-Anbieter auswählen:
1. **Google Gemini (Empfohlen):** Füge deinen Gemini API Key ein.
2. **OpenAI:** Nutze `gpt-4o-mini` oder ähnliche Modelle mit deinem OpenAI Key.
3. **Ollama:** Für den lokalen, komplett datenschutzkonformen Betrieb (z.B. Llama 3.1). Wähle `ollama` und gib die lokale URL deines Ollama-Servers an.

---

## 📜 Lizenz

Dieses Projekt ist Open-Source und für Bildungszwecke konzipiert.
