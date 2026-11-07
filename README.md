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
- Ein Linux mit apt (Debian, Ubuntu, Raspberry Pi OS, Kali), `git` und `sudo`
- Docker wird vom Installationsskript bei Bedarf mitinstalliert

### ⚡ Quickstart

Klone das Repo **als normaler Nutzer**, nicht mit `sudo`, und starte das Installationsskript:

```bash
git clone https://github.com/deltaInfoSecTeam/linux_bootcamp.git && cd linux_bootcamp && ./scripts/install.sh --admin <dein-username>
```

Das Skript
1. prüft, ob Docker und Docker Compose vorhanden sind, und installiert sie nach Rückfrage über apt,
2. korrigiert die Dateirechte (`data/` muss UID 1000 gehören, dem Nutzer im Container),
3. legt `.env` aus `.env.example` an,
4. baut und startet den Container und wartet auf den Healthcheck,
5. legt mit `--admin` den ersten Admin an. Passwort und Recovery-Token erscheinen **einmalig**.

Mehrfaches Ausführen schadet nicht, dasselbe Skript dient auch für Updates (`git pull && ./scripts/install.sh`). Weitere Optionen zeigt `./scripts/install.sh --help`.

Danach läuft die App unter `http://localhost:8000`. Standardmäßig ist sie **nur lokal** erreichbar (`127.0.0.1`).

### Manuelle Installation

Wer Docker selbst verwaltet (Compose v2 nötig):

```bash
cp .env.example .env && sudo chown -R 1000:1000 data && docker compose up -d --build
```

### Weitere Admins

```bash
sudo docker compose exec bootcamp node scripts/create-admin.js <username>
```

Existiert der Nutzer schon, wird er zum Admin. Sonst wird er neu angelegt, und Passwort plus Recovery-Token werden **einmalig** ausgegeben.

### HTTPS im Heimnetz (nginx + eigene CA)

```bash
./scripts/install.sh --tls
```

Damit startet zusätzlich ein nginx-Container, der HTTPS übernimmt:

- **Port 443:** HTTPS mit HTTP/2, leitet an die App weiter.
- **Port 80:** leitet nur auf HTTPS um und bietet unter `/ca.crt` das CA-Zertifikat zum Download an.
- **Port 8000:** Die App selbst ist dann nur noch lokal (`127.0.0.1`) erreichbar.

Weil Let's Encrypt Server im Heimnetz nicht prüfen kann, erzeugt das Skript eine **eigene lokale Zertifizierungsstelle**. Die gilt 10 Jahre, das Server-Zertifikat 397 Tage, und das Skript erneuert es bei jedem Lauf automatisch, wenn es bald abläuft oder sich Namen oder IPs geändert haben.

Die CA hat **Name Constraints**: Sie darf nur Zertifikate für die Domains und das LAN ausstellen, die bei ihrer Erzeugung bekannt waren. Selbst mit gestohlenem CA-Schlüssel lassen sich damit keine fremden Webseiten fälschen.

Weitere Namen fürs Zertifikat, zum Beispiel der Name, den dein Router vergibt:

```bash
./scripts/install.sh --tls --hostname meinserver.lan
```

Die Option gibst du nur beim ersten Mal an, das Skript merkt sich die Namen in `.env`. `--no-tls` schaltet HTTPS wieder ab.

#### CA-Zertifikat auf den Geräten installieren

Einmal pro Gerät `http://<server>/ca.crt` öffnen und das Zertifikat installieren. **Vergleiche dabei den SHA-256-Fingerabdruck** mit dem, den das Skript am Ende ausgibt.

- **Android:** Einstellungen → Sicherheit → Weitere Einstellungen → Verschlüsselung & Anmeldedaten → Zertifikat installieren → CA-Zertifikat
- **iOS/iPadOS:** Datei öffnen → Einstellungen → Profil geladen → Installieren, danach unter Allgemein → Info → Zertifikatsvertrauenseinstellungen **voll vertrauen**
- **Windows:** Doppelklick → Zertifikat installieren → Lokaler Computer → „Vertrauenswürdige Stammzertifizierungsstellen“
- **Linux:** `sudo cp ca.crt /usr/local/share/ca-certificates/linux-bootcamp.crt && sudo update-ca-certificates`. Firefox nutzt einen eigenen Speicher: Einstellungen → Zertifikate → Zertifizierungsstellen → Importieren

Der CA-Schlüssel liegt in `deploy/tls/ca/` (nur root, nie im Git, nie im Container). Wer ihn hat, kann für dein Heimnetz gültige Zertifikate ausstellen. Bewahre ihn also wie ein Passwort auf.

### Eigener Name im Heimnetz (z.B. `https://bootcamp.internal`)

```bash
./scripts/install.sh --tls --dns bootcamp.internal
```

Startet zusätzlich einen kleinen DNS-Server (dnsmasq) im Host-Netzwerk. Der beantwortet `bootcamp.internal` immer mit der **aktuellen** LAN-Adresse des Servers und leitet alle anderen Anfragen an deinen Router weiter. IP-Wechsel oder Neustarts brauchen also keinen neuen Skriptlauf. Der Name kommt automatisch ins Zertifikat.

- **Warum `.internal`?** Diese Endung ist für private Netze reserviert und wird nie öffentlich vergeben. Erfundene Endungen können später im Internet auftauchen und kollidieren.
- **Router einstellen:** Damit die Geräte den Server als DNS benutzen, trägst du dessen IPv4 (und, falls vorhanden, seine IPv6-ULA) im Router als lokalen DNS-Server ein. Das Skript zeigt beide Adressen an. Gib dem Server im Router außerdem eine **feste IPv4-Adresse**.
- **IPv6:** Verteilt der Router eigene IPv6-DNS-Server, fragen viele Geräte bevorzugt dort und finden den Namen nicht. Aktiviere dann im Router ULA-Adressen (`fd00::/8`) und trage die ULA des Servers als lokalen DNSv6-Server ein. Der DNS lauscht automatisch auf jeder Adresse des LAN-Interfaces, `./scripts/install.sh` zeigt die ULA an.
- **Achtung:** Läuft der Server nicht, funktioniert im ganzen Heimnetz keine Namensauflösung mehr.
- Bei einer **neuen Domain-Endung** passt das Zertifikat nicht mehr zu den Name Constraints der CA. Dann einmal `--renew-ca` angeben und das neue CA-Zertifikat auf den Geräten installieren.
- Abschalten mit `--no-dns`. Danach den Router wieder auf sich selbst als DNS stellen.

### Zugriff aus dem Internet

Für einen öffentlich erreichbaren Server ist ein Zertifikat von Let's Encrypt (oder Caddy mit automatischem ACME) der richtige Weg statt der lokalen CA. Setze in `.env` den Wert `TRUST_PROXY=1`, wenn ein eigener Reverse Proxy vor der App steht.

### Daten & Secrets

- Alles Persistente liegt in `./data/`: `bootcamp.db`, `.jwt_secret`, `.encryption_secret`.
- Die Secrets werden beim ersten Start zufällig erzeugt. Alternativ trägst du sie in `.env` ein.
- **Backup:** den Ordner `./data` sichern. Ohne `.encryption_secret` sind die gespeicherten API-Keys nicht mehr lesbar.
- Der Container läuft als Nutzer `node` (UID 1000). Gehört `./data` einem anderen Nutzer: `sudo chown -R 1000:1000 data`

### Update von v1.0.0

```bash
docker compose down && git pull && ./scripts/install.sh
```

Das Skript verschiebt eine vorhandene `bootcamp.db` automatisch nach `data/`. Beim ersten Start werden die alten Recovery-Codes gehasht und die API-Keys verschlüsselt. Alle Nutzer müssen sich einmal neu anmelden.

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
├── deploy/nginx/      nginx-Konfiguration für HTTPS (Profil "tls")
├── deploy/dns/        dnsmasq-Image für den Heimnetz-DNS (Profil "dns")
├── scripts/           install.sh, create-admin.js
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
- Optional HTTPS über nginx (TLS 1.2/1.3) mit einer per Name Constraints auf das Heimnetz beschränkten lokalen CA.

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
