
let sessionAnswered = 0;
let sessionCorrect = 0;

function updateSessionStatsUI() {
    const elAnswered = document.getElementById('stat-session-answered');
    const elPercent = document.getElementById('stat-session-percent');
    if (elAnswered) elAnswered.textContent = sessionAnswered;
    const elRemaining = document.getElementById('stat-remaining');
    if (elRemaining) {
        elRemaining.textContent = Math.max(0, state.filteredQuestions.length - sessionAnswered);
    }
    if (elPercent) {
        elPercent.textContent = sessionAnswered > 0 ? Math.round((sessionCorrect / sessionAnswered) * 100) + '%' : '0%';
    }
}

// Linux Quiz - Client-Side App Logic
let QUESTIONS = [
    {
        "id": 1,
        "category": "1. Aufbau von Linux",
        "question": "Was bedeutet das Linux-Grundprinzip „Alles ist eine Datei“?\nNenne drei konkrete Beispiele für Systemkomponenten oder Ressourcen, die keine regulären Dateien sind, aber wie solche behandelt werden.",
        "answer": "In Linux werden nahezu alle Systemressourcen (Geräte, Prozesse, Verzeichnisse, Netzwerksockets) durch Dateideskriptoren abstrahiert. Das ermöglicht einen einheitlichen Zugriff über Standard-Systemaufrufe wie open(), read(), write() und close().\nBeispiele:\n1. Hardware-Geräte: /dev/sda (Festplatte)\n2. Prozessinformationen: /proc/cpuinfo (virtuelle Datei)\n3. Verzeichnisse: Spezielle Dateien, die Inodes referenziert.",
        "moreInfo": "### 1. tl;dr\nLinux stellt fast alle Systemressourcen als Dateien im Dateisystem dar, wodurch Programme über eine einheitliche Schnittstelle (System Calls) auf Festplatten, Prozesse oder Terminals zugreifen können.\n---\n> **Tux-Ansage:** Hör zu, Rekrut! Wenn du eine Festplatte mountest, einen Prozess killst oder in ein Terminal tippst – du schreibst immer nur in Dateien! Wer das nicht kapiert, verheddert sich in Abhängigkeiten. Verinnerliche das Prinzip, sonst bleibst du ewig ein Klick-Admin!\n---\n### 3. Deep Dive\nDas Prinzip \"Everything is a file\" (Alles ist eine Datei) stammt aus der Unix-Philosophie. Es reduziert die Komplexität der Softwareentwicklung enorm, da für unterschiedliche Ressourcen keine separaten APIs geschrieben werden müssen.\n\n**Beispiele im Detail:**\n- **Gerätedateien (`/dev`):** Hier liegen Block- und Zeichengeräte. Mit `cat /dev/urandom` liest du z. B. endlose Zufallszahlen. Mit `dd if=/dev/zero of=/dev/sda` überschreibst du eine komplette Festplatte mit Nullen.\n- **Virtuelle Dateisysteme (`/proc` und `/sys`):** Diese existieren nur im Arbeitsspeicher. `/proc` liefert Echtzeit-Infos über laufende Prozesse und Kernel-Parameter. `/proc/<PID>` enthält alles über den jeweiligen Prozess. \n- **Verzeichnisse:** Auch ein Verzeichnis ist unter der Haube nur eine Datei, die eine Tabelle von Dateinamen und deren zugehörigen Inodes enthält.\n- **Sockets & Pipes:** Interprozesskommunikation wird ebenfalls über Dateideskriptoren abgewickelt, was es extrem leicht macht, den Output eines Programms als Input eines anderen zu nutzen.",
        "topicId": 1,
        "difficulty": "mittel"
    },
    {
        "id": 101,
        "category": "1. Aufbau von Linux",
        "question": "Was meint der Spruch 'Alles ist eine Datei' in Linux?",
        "answer": "Dateien, Geräte und Prozesse werden alle über Dateisystempfade angesprochen (z.B. Festplatten unter /dev, Prozesse unter /proc).",
        "topicId": 1,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nAlles wird in Linux über Dateisystempfade angesprochen.\n---\n> **Tux-Ansage:** Wenn du einen Drucker suchst, schau nicht unter den Tisch, sondern in /dev, du Pinguin!\n---\n### 3. Deep Dive\nDas Prinzip \"Everything is a file\" bedeutet, dass Input/Output-Operationen einheitlich über das Virtual File System (VFS) abgewickelt werden. Das schließt Textdateien, Verzeichnisse, Festplatten (Blockgeräte), Tastaturen (Zeichengeräte) und Prozesse ein. Dadurch können Standardwerkzeuge wie `cat` oder `echo` genutzt werden, um mit Hardware und Systemzuständen zu interagieren."
    },
    {
        "id": 201,
        "category": "1. Aufbau von Linux",
        "question": "Wie interagiert der Linux Kernel mit /dev, /proc und /sys im Kontext des 'Alles ist eine Datei'-Prinzips?",
        "answer": "/dev abstrahiert Hardware als Gerätedateien (Block/Char). /proc ist ein virtuelles FS für Prozessinfos im RAM. /sys exportiert Kernel-Objekte in den Userspace. Alles lässt sich per Standard-I/O (read/write) steuern.",
        "topicId": 1,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n/dev, /proc und /sys sind virtuelle Dateisysteme, die Hardware und Kernel-Zustände im VFS repräsentieren.\n---\n> **Tux-Ansage:** Ein Sysadmin ohne VFS-Kenntnisse ist wie ein Pinguin in der Wüste – komplett lost!\n---\n### 3. Deep Dive\nDer Kernel mountet Pseudodateisysteme wie devtmpfs, procfs und sysfs. `/dev` stellt Gerätedateien bereit, über die Gerätetreiber direkt angesprochen werden. `/proc` exportiert Prozess- und Speicherinfos des Kernels im RAM. `/sys` strukturiert Kernel-Objekte und Hardware-Hierarchien. Alles nutzt Standard-Systemaufrufe wie `open()`, `read()`, `write()`."
    },
    {
        "id": 2,
        "category": "1. Aufbau von Linux",
        "question": "Erkläre den Unterschied zwischen dem Kernelmodus (Kernel Mode) und dem Benutzermodus (User Mode).\nWarum ist diese Trennung für die Stabilität und Sicherheit des Systems unerlässlich?",
        "answer": "* **Kernelmodus (Ring 0):** Höchste Privilegienstufe. Der Code (Kernel) hat uneingeschränkten, direkten Zugriff auf Hardware und den gesamten Arbeitsspeicher. Ein Fehler hier führt zum Systemabsturz (Kernel Panic).\n* **Benutzermodus (Ring 3):** Eingeschränkte Privilegien. Anwendungen laufen hier isoliert voneinander und können nicht direkt auf Hardware zugreifen. Sie müssen den Kernel über System Calls um Aktionen bitten.\n* **Warum unerlässlich:** Diese Trennung verhindert, dass eine fehlerhafte oder bösartige Anwendung das gesamte System kompromittiert oder zum Absturz bringt.",
        "moreInfo": "### 1. tl;dr\nDer Kernelmodus ist der VIP-Bereich mit vollem Hardwarezugriff. Der Benutzermodus ist die Sandbox für Programme. Ohne diese Trennung würde jeder Programmabsturz das ganze System mitreißen.\n---\n> **Tux-Ansage:** Willst du wirklich, dass dein schlampig programmierter Webbrowser direkt auf die CPU-Register zugreift? Nein! Deswegen sperren wir normale Programme in den Benutzermodus. Der Kernel ist der Boss, und wenn ein Programm was will, muss es höflich anklopfen!\n---\n### 3. Deep Dive\nModerne x86- und ARM-Prozessoren unterstützen verschiedene Privilegienstufen (Protection Rings). Linux nutzt im Wesentlichen Ring 0 (Kernelmodus) und Ring 3 (Benutzermodus).\n\n- **Isolation und Sicherheit:** Wenn ein Prozess im Benutzermodus versucht, auf geschützte Speicherbereiche zuzugreifen, fängt die CPU dies ab und meldet es dem Kernel. Dieser beendet den Prozess mit einem Segmentation Fault (Segfault). Das System läuft stabil weiter.\n- **System Calls (Syscalls):** Um eine Datei zu lesen oder Netzwerkpakete zu senden, muss ein Programm im Benutzermodus einen System Call (z. B. `read()`, `write()`) auslösen. Das zwingt die CPU zu einem sogenannten Context Switch in den Kernelmodus. Der Kernel prüft die Berechtigungen, führt die Aktion aus und gibt das Ergebnis an den Benutzermodus zurück.\n- **Kernel Panic:** Code im Kernelmodus ist ungeschützt. Ein Bug (z. B. Dereferenzierung eines Nullzeigers) in einem fehlerhaften Treiber bringt den Kernel und damit das gesamte System sofort zum Absturz, da es keinen höheren Aufpasser mehr gibt.",
        "topicId": 2,
        "difficulty": "mittel"
    },
    {
        "id": 102,
        "category": "1. Aufbau von Linux",
        "question": "Was ist der Unterschied zwischen Kernel Space und User Space?",
        "answer": "Der Kernel Space ist der privilegierte Bereich für das Betriebssystem. Der User Space ist der eingeschränkte Bereich, in dem normale Programme (wie dein Browser) laufen.",
        "topicId": 2,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nDer Kernel Space ist der Chef-Bereich mit vollem Systemzugriff, der User Space ist für normale Programme.\n---\n> **Tux-Ansage:** Lass den Browser im User Space, sonst sprengt dir ein kaputtes Katzenvideo den Kernel!\n---\n### 3. Deep Dive\nUm das System vor fehlerhaften Programmen zu schützen, unterteilt Linux den Speicher. Der Kernel Space läuft mit höchsten Privilegien und managt Hardware. Normale Anwendungen laufen im User Space; sie können Hardware nicht direkt steuern, sondern müssen den Kernel über System Calls (Syscalls) um Erlaubnis bitten."
    },
    {
        "id": 202,
        "category": "1. Aufbau von Linux",
        "question": "Welche Schutzringe (Rings) der CPU werden bei Linux für User- und Kernel Mode genutzt und wie erfolgt ein Context Switch?",
        "answer": "Linux nutzt Ring 0 für den Kernel Mode und Ring 3 für den User Mode. Ein Context Switch erfolgt durch System Calls (Syscalls), Hardware-Interrupts oder Exceptions, wobei der Zustand des User-Prozesses gesichert und Kernel-Code ausgeführt wird.",
        "topicId": 2,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nLinux nutzt CPU Ring 0 (Kernel) und Ring 3 (User). Ein Context Switch erfordert Syscalls oder Interrupts.\n---\n> **Tux-Ansage:** Ring 0 ist VIP-Lounge, da kommst du nur mit 'nem Syscall-Ticket rein!\n---\n### 3. Deep Dive\nModerne CPUs haben verschiedene Privilegienringe. Linux nutzt aus Portabilitätsgründen Ring 0 (Kernel Mode) und Ring 3 (User Mode). Möchte ein Programm im User Mode z.B. eine Datei lesen, löst es per Software-Interrupt oder `syscall`-Instruktion einen Context Switch aus. Die CPU wechselt in Ring 0, führt die Kernel-Funktion aus und springt zurück."
    },
    {
        "id": 3,
        "category": "1. Aufbau von Linux",
        "question": "Was versteht man unter der modularen Architektur des Linux-Kernels (LKMs)? Nenne Vor- und Nachteile.",
        "answer": "**LKMs (Loadable Kernel Modules)** sind Kernel-Erweiterungen (oft Treiber), die zur Laufzeit in den Kernel geladen oder entladen werden können, ohne das System neu zu starten.\n* **Vorteile:** Der Kernel bleibt schlank, da Module nur bei Bedarf (z. B. Einstecken eines USB-Geräts) geladen werden. Man muss den Kernel nicht für jede Hardware neu kompilieren.\n* **Nachteile:** Da Module im Kernelmodus laufen, kann ein fehlerhaftes Modul das System zum Absturz bringen. Bösartige Module (Rootkits) können sich tief im System verstecken.",
        "moreInfo": "### 1. tl;dr\nLKMs sind dynamisch ladbare Plugins für den Kernel (meist Treiber). Sie machen den Kernel flexibel und schlank, aber ein fehlerhaftes Modul kann das System crashen lassen.\n---\n> **Tux-Ansage:** Ein Kernel ist wie ein Schweizer Taschenmesser, und LKMs sind die ausklappbaren Klingen. Aber Vorsicht, Rekrut: Wenn du die falsche Klinge ausklappst, schneidest du dir ins eigene Fleisch! Nutze `lsmod`, um zu wissen, was in deinem System steckt!\n---\n### 3. Deep Dive\nUrsprünglich waren Kernel monolithisch: Alle Treiber mussten fest einkompiliert werden. Linux ist zwar immer noch monolithisch (im Gegensatz zu Mikrokerneln), aber LKMs erlauben es, zur Laufzeit Code in den laufenden Kernel einzufügen (`modprobe`, `insmod`) oder zu entfernen (`rmmod`).\n\n- **Funktionsweise:** Die Module (`.ko`-Dateien unter `/lib/modules/`) verknüpfen sich zur Laufzeit mit den Funktionen des Kernels. `udev` lädt oft automatisch das passende Modul, wenn neue Hardware erkannt wird.\n- **Vorteile:** Dies spart Arbeitsspeicher (RAM), da nicht benötigte Treiber nicht geladen sind. Es ermöglicht auch Herstellern, proprietäre Treiber anzubieten, ohne den gesamten Kernel auszuliefern (auch wenn das lizenzrechtlich umstritten ist).\n- **Risiken:** Module laufen mit Ring-0-Privilegien. Ein Speicherleck in einem Modul ist tödlich für das System. Zudem können Angreifer Kernel-Rootkits als LKM laden, weshalb moderne Systeme oft *Secure Boot* und Kernel-Modul-Signaturen verlangen, um nur kryptografisch signierte Module zu erlauben.",
        "topicId": 3,
        "difficulty": "mittel"
    },
    {
        "id": 103,
        "category": "1. Aufbau von Linux",
        "question": "Was macht ein Linux-Modul (LKM) und wofür braucht man es?",
        "answer": "Ein LKM ist ein Stück Code (meist ein Treiber), das zur Laufzeit in den Kernel geladen werden kann (z.B. wenn man einen USB-Stick einsteckt), ohne den Rechner neu zu starten.",
        "topicId": 3,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nKernel-Module sind Code-Erweiterungen (oft Treiber), die im laufenden Betrieb geladen werden können.\n---\n> **Tux-Ansage:** Wer den Kernel für einen USB-Treiber neu kompiliert, hat Linux nie verstanden!\n---\n### 3. Deep Dive\nEin Loadable Kernel Module (LKM) ermöglicht es dem Kernel, modular zu bleiben. Ohne LKMs müsste jeder mögliche Treiber fest in den Kernel kompiliert werden, was ihn riesig machen würde. Module werden z.B. automatisch geladen, wenn neue Hardware erkannt wird (Hotplugging)."
    },
    {
        "id": 203,
        "category": "1. Aufbau von Linux",
        "question": "Wie werden Abhängigkeiten bei LKMs aufgelöst und welche Mechanismen verhindern das Laden unsignierter Module?",
        "answer": "Abhängigkeiten werden über 'modules.dep' (generiert durch 'depmod') von 'modprobe' aufgelöst. Secure Boot und die Kernel-Option 'CONFIG_MODULE_SIG' erzwingen Signaturen und verhindern das Laden von Rootkits/unsignierten Modulen.",
        "topicId": 3,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`modprobe` lädt Module inklusive Abhängigkeiten. Signaturen verhindern kompromittierten Kernel-Code.\n---\n> **Tux-Ansage:** Ohne Signatur bleibt das Modul draußen – hier gibts keine Hintertüren für Rootkits!\n---\n### 3. Deep Dive\nTools wie `depmod` analysieren Modul-Abhängigkeiten und schreiben diese in `modules.dep`. `modprobe` nutzt diese Datei, um Module rekursiv zu laden. Um Sicherheit zu gewährleisten, kann der Kernel so konfiguriert werden, dass er nur kryptografisch signierte Module akzeptiert (Secure Boot, CONFIG_MODULE_SIG), um Rootkits zu blockieren."
    },
    {
        "id": 4,
        "category": "1. Aufbau von Linux",
        "question": "Nenne die vier Hauptaufgaben (Kernelfunktionen) des Linux-Kernels.",
        "answer": "Die vier Kernaufgaben des Linux-Kernels sind:\n1. **Prozessverwaltung:** Erzeugung, Beendigung und Scheduling (CPU-Zeitzuteilung) von Prozessen (Multitasking).\n2. **Speicherverwaltung:** Zuteilung von physischem und virtuellem Arbeitsspeicher (RAM) sowie Auslagerung (Swap).\n3. **Dateisystemverwaltung:** Bereitstellung des Virtual File Systems (VFS) für einheitlichen Zugriff auf verschiedene Dateisysteme.\n4. **Gerätesteuerung (Treiber):** Kommunikation mit der Hardware über Kernel-Module und Gerätetreiber.",
        "moreInfo": "### 1. tl;dr\nDer Kernel ist der Dirigent des Systems und kümmert sich um vier Dinge: CPU (Prozesse), RAM (Speicher), Festplatten (Dateisystem) und Hardware (Geräte).\n---\n> **Tux-Ansage:** Merk dir die vier Säulen der Macht! Prozesse, Speicher, Dateien, Hardware! Ohne den Kernel sind deine teuren CPUs und RAM-Riegel nur nutzlose Siliziumklötze. Verstehe, wie der Kernel sie steuert, oder geh nach Hause!\n---\n### 3. Deep Dive\n- **Prozessverwaltung (Scheduler):** Linux nutzt den Completely Fair Scheduler (CFS), der entscheidet, welcher Prozess wielange auf welchem CPU-Kern läuft. Er muss Kontextwechsel extrem schnell durchführen, damit das System flüssig (multitaskingfähig) wirkt.\n- **Speicherverwaltung (Memory Management Unit):** Der Kernel sorgt dafür, dass jeder Prozess glaubt, er hätte den ganzen Speicher für sich (virtueller Speicher). Er mappt virtuelle Adressen auf physischen RAM und lagert inaktive Speicherseiten auf die Festplatte aus (Swap).\n- **Dateisystemverwaltung (VFS):** Das Virtual File System abstrahiert die konkreten Dateisysteme (ext4, XFS, FAT32, NFS). Eine Anwendung macht einfach einen `open()`-Aufruf, und das VFS leitet dies transparent an den korrekten Dateisystemtreiber weiter.\n- **Gerätesteuerung:** Der Kernel beinhaltet Treiber, um mit allem von der GPU über Netzwerkkarten bis zum USB-Controller zu sprechen. Er abstrahiert diese Hardware und stellt sie den Anwendungen im Benutzermodus als Geräte-Dateien zur Verfügung.",
        "topicId": 4,
        "difficulty": "mittel"
    },
    {
        "id": 104,
        "category": "1. Aufbau von Linux",
        "question": "Was ist die Hauptaufgabe des Kernels?",
        "answer": "Der Kernel ist der Chef: Er verwaltet die Hardware (CPU, RAM, Geräte) und teilt sie den Programmen zu.",
        "topicId": 4,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nDer Kernel verwaltet Hardware, CPU, RAM und teilt Ressourcen den Programmen zu.\n---\n> **Tux-Ansage:** Der Kernel ist der Dirigent, und deine Programme sind das Chaos-Orchester!\n---\n### 3. Deep Dive\nHauptaufgaben des Kernels sind: Speichermanagement (RAM-Verwaltung), Prozess-Scheduling (CPU-Zeit aufteilen), Interprozesskommunikation (IPC) und die Bereitstellung von Gerätetreibern. Er fungiert als abstrakte Brücke zwischen Hardware und Software."
    },
    {
        "id": 204,
        "category": "1. Aufbau von Linux",
        "question": "Erkläre den Unterschied zwischen einem monolithischen Kernel wie Linux und einem Microkernel.",
        "answer": "Linux ist monolithisch: CPU-, RAM-, IPC- und Treiber-Management laufen alle im Kernel Space (schnell, aber fehleranfällig). Ein Microkernel lagert Treiber und Dateisysteme in den User Space aus (sicherer, aber langsamer durch IPC).",
        "topicId": 4,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nMonolithisch (Linux): Alles im Kernel. Microkernel: Nur das Nötigste im Kernel, Rest im User Space.\n---\n> **Tux-Ansage:** Wir bauen Monolithen, weil Geschwindigkeit zählt – wer bremst, verliert!\n---\n### 3. Deep Dive\nEin monolithischer Kernel wie Linux führt Treiber, Dateisysteme und Netzwerk-Stacks direkt im Kernel Space aus. Das ist hochperformant, da keine teuren IPC-Aufrufe (Inter-Process Communication) nötig sind. Ein Microkernel reduziert den Kernel Space drastisch, was sicherer, aber durch die vielen Context Switches langsamer ist."
    },
    {
        "id": 5,
        "category": "2. Verzeichnisstruktur",
        "question": "Welche Art von Daten liegt typischerweise in /var/log und /etc?\nNenne für jedes Verzeichnis zwei konkrete Dateibeispiele.",
        "answer": "* **`/var/log`**: Enthält dynamische Protokolldateien (Logs), die zur Fehlersuche und Überwachung dienen.\n  * Beispiele: `/var/log/syslog` oder `/var/log/messages` (allgemeine Systemmeldungen), `/var/log/auth.log` (Login- und Authentifizierungsversuche).\n* **`/etc`**: Enthält statische, systemweite Konfigurationsdateien für das System und installierte Dienste.\n  * Beispiele: `/etc/passwd` (Benutzerinformationen), `/etc/fstab` (Dateisystem-Mount-Tabelle).",
        "moreInfo": "### 1. tl;dr\nIn `/etc` stellst du ein, wie dein System funktionieren *soll*. In `/var/log` liest du nach, was *tatsächlich* passiert ist.\n---\n> **Tux-Ansage:** Wenn was kaputt ist, rate nicht wild herum! Schau in `/var/log` nach, da steht die Wahrheit schwarz auf weiß! Und wenn du Konfigurationen änderst, dann in `/etc`. Aber wehe, du machst kein Backup der Config vorher!\n---\n### 3. Deep Dive\nDie Filesystem Hierarchy Standard (FHS) definiert streng, wo welche Dateien liegen:\n\n- **`/etc` (Etcetera):** Dies ist das Nervenzentrum der Konfiguration. Hier dürfen **keine ausführbaren Binärdateien** liegen, sondern nur Textdateien, die festlegen, wie Daemons (Hintergrunddienste) starten und arbeiten. Historisch wuchs dieses Verzeichnis immer weiter an. Heutzutage teilen viele Dienste ihre Konfiguration in ein Hauptfile und ein `*.d`-Verzeichnis (z. B. `/etc/nginx/nginx.conf` und `/etc/nginx/conf.d/`), was Automatisierungswerkzeugen (wie Ansible) das Leben erleichtert.\n- **`/var/log` (Variable):** Da Logdateien ständig wachsen, liegen sie in `/var`, einer Partition, die historisch oft getrennt vom Hauptsystem gemountet wurde, damit ein volllaufendes Log nicht das Wurzeldateisystem (Root) blockiert. Mit `logrotate` werden alte Logs hier archiviert (`syslog.1.gz`) und gelöscht. Neuere systemd-Systeme speichern Logs oft binär im `systemd-journald`, greifen aber für Kompatibilität noch auf `/var/log` zurück.",
        "topicId": 5,
        "difficulty": "mittel"
    },
    {
        "id": 105,
        "category": "2. Verzeichnisstruktur",
        "question": "Wo liegen in Linux normalerweise die Log-Dateien und wo die Konfigurationsdateien?",
        "answer": "Log-Dateien liegen unter /var/log. Konfigurationsdateien liegen unter /etc.",
        "topicId": 5,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nLogs findest du unter `/var/log` und System-Konfigurationen unter `/etc`.\n---\n> **Tux-Ansage:** Wer in /home nach System-Configs sucht, darf gleich nochmal neu installieren!\n---\n### 3. Deep Dive\nLinux strukturiert Dateien nach ihrem Zweck (Filesystem Hierarchy Standard). `/etc` hält alle hostspezifischen Systemkonfigurationen im Klartext bereit. `/var` steht für \"variable data\" und beheimatet Dateien, die sich zur Laufzeit ändern, insbesondere das Log-Verzeichnis `/var/log`."
    },
    {
        "id": 205,
        "category": "2. Verzeichnisstruktur",
        "question": "Warum unterscheidet der Filesystem Hierarchy Standard (FHS) zwischen /usr, /var und /etc? Was passiert, wenn /var voll ist?",
        "answer": "/usr ist read-only/statisch (Programme). /var ist dynamisch (Logs, Caches). /etc enthält systemweite Konfigs. Ist /var voll, können Dienste (z.B. Datenbanken, Syslog) abstürzen oder keine Logs mehr schreiben.",
        "topicId": 5,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nFHS trennt nach Statik. Ist `/var` voll, können Dienste abstürzen, weil sie keine Logs schreiben können.\n---\n> **Tux-Ansage:** Räum dein /var auf, sonst erstickt dein Server an seinen eigenen Logs!\n---\n### 3. Deep Dive\nDer FHS definiert `/usr` für statische Programme, `/etc` für Konfigs und `/var` für dynamische Daten. Wenn `/var` vollläuft (z.B. durch Logging), hängen sich Prozesse auf, Datenbanken korrumpieren oder Logins schlagen fehl, da systemd-journald keine neuen Einträge mehr verarbeiten kann."
    },
    {
        "id": 6,
        "category": "2. Verzeichnisstruktur",
        "question": "Ein Systemdienst (z. B. Apache) startet nicht. In welchen Verzeichnissen und Dateien suchst du nach Fehlern und wie gehst du vor?",
        "answer": "1. **Status und Journal prüfen:** Mit `systemctl status <dienst>` den aktuellen Zustand ansehen und mit `journalctl -u <dienst> -e` die letzten Logs (stderr/stdout) des Dienstes prüfen.\n2. **Konfiguration testen:** Syntax-Check der Dienst-Konfiguration unter `/etc/<dienst>/` durchführen (z. B. `apache2ctl configtest` oder `nginx -t`).\n3. **Spezifische Logs:** Die dienstspezifischen Error-Logs unter `/var/log/<dienst>/` (z. B. `/var/log/apache2/error.log`) nach `ERROR` oder `FATAL` durchsuchen.",
        "moreInfo": "### 1. tl;dr\nDienst startet nicht? Prüfe zuerst den Status mit `systemctl`, teste die Config-Syntax in `/etc`, und wälze die Logs im `journalctl` oder unter `/var/log`.\n---\n> **Tux-Ansage:** Hör auf, den Neustart-Befehl zu spammen! Ein Fehler verschwindet nicht durch Magie. Sei systematisch: Status, Config-Test, Logs! Wer nicht liest, was der Fehler ist, hat an meinem Terminal nichts zu suchen!\n---\n### 3. Deep Dive\nEin systematischer Ansatz zur Fehlerbehebung (Troubleshooting) spart enorm viel Zeit:\n\n1. **Der systemd-Weg:** Moderne Linux-Distributionen nutzen systemd. Wenn Apache fehlschlägt, ist `systemctl status apache2.service` der erste Schritt. Er zeigt den Exit-Code an. Wenn der Output abgeschnitten ist, nutzt man `journalctl -xeu apache2.service`, um die exakte Start-Fehlermeldung zu sehen.\n2. **Der Config-Test:** Sehr oft starten Dienste nicht, weil bei einer Änderung in `/etc/` ein Tippfehler passiert ist. Fast jeder gute Daemon hat einen Dry-Run oder Config-Test (z. B. `sshd -t`, `nginx -t`, `apachectl -t`). Das verhindert, dass man überhaupt versucht, eine fehlerhafte Konfiguration live zu schalten.\n3. **Berechtigungen und Ports:** Ein häufiger Fehler ist, dass Ports blockiert sind. Mit `ss -tulpen | grep 80` kannst du prüfen, ob ein anderer Prozess den Apache-Port bereits blockiert. Ein weiteres Problem sind Dateirechte (z. B. wenn der Apache-User Zertifikate unter `/etc/ssl/` nicht lesen darf) oder blockierendes SELinux/AppArmor, was im `audit.log` sichtbar wäre.",
        "topicId": 6,
        "difficulty": "mittel"
    },
    {
        "id": 106,
        "category": "2. Verzeichnisstruktur",
        "question": "Wenn ein Dienst wie Apache abstürzt, in welchem Verzeichnis suchst du zuerst nach dem Fehler?",
        "answer": "Ich suche im Verzeichnis /var/log, speziell in /var/log/apache2/ oder /var/log/messages, nach Fehlermeldungen.",
        "topicId": 6,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nIm Verzeichnis `/var/log`, oft in `/var/log/apache2/` oder `/var/log/messages`.\n---\n> **Tux-Ansage:** Nicht heulen, Logs lesen! Da steht, was du kaputt gemacht hast.\n---\n### 3. Deep Dive\nWenn ein traditioneller Dienst abstürzt, schreibt er die Fehlerursache in seine Log-Dateien unter `/var/log/`. Bei Apache ist das typischerweise `error.log`. Allgemeine Fehler landen oft in `/var/log/syslog` oder `/var/log/messages`."
    },
    {
        "id": 206,
        "category": "2. Verzeichnisstruktur",
        "question": "Ein Dienst schlägt beim Booten fehl. Zeige die genauen Befehle, um mit systemd die Logs zu prüfen und die Konfiguration zu validieren.",
        "answer": "1. 'systemctl status <dienst>', 2. 'journalctl -xeu <dienst>' für detaillierte Logs. 3. Konfigurations-Test (z.B. 'apache2ctl configtest' oder 'nginx -t').",
        "topicId": 6,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nPrüfe mit `systemctl status`, lese Logs mit `journalctl -xeu` und validiere die Config.\n---\n> **Tux-Ansage:** Ein Blinder rät, ein Sysadmin nutzt journalctl -xeu!\n---\n### 3. Deep Dive\nSystemd-Dienste werden am besten direkt über die Systemd-Tools analysiert. `systemctl status <dienst>` zeigt den aktuellen Zustand. `journalctl -xeu <dienst>` ruft das systemd-Journal spezifisch für diese Unit auf, springt ans Ende und zeigt Erklärungen. Syntaxfehler in der Config prüft man mit Tools wie `nginx -t` oder `apache2ctl configtest`."
    },
    {
        "id": 7,
        "category": "3. Berechtigungsmodell",
        "question": "Übersetze die Berechtigungen in das jeweils andere Format (Oktal <-> Symbolisch) und erkläre sie:\n1. datei1.sh: rwxr-xr-x\n2. datei2.txt: 640",
        "answer": "1. **`datei1.sh: rwxr-xr-x` -> Oktal `755`**\n   * Besitzer hat `rwx` (Lesen, Schreiben, Ausführen) = 4+2+1 = 7\n   * Gruppe hat `r-x` (Lesen, Ausführen) = 4+0+1 = 5\n   * Andere haben `r-x` (Lesen, Ausführen) = 4+0+1 = 5\n2. **`datei2.txt: 640` -> Symbolisch `rw-r-----`**\n   * Besitzer hat `6` (4+2+0) = `rw-` (Lesen, Schreiben)\n   * Gruppe hat `4` (4+0+0) = `r--` (Nur Lesen)\n   * Andere haben `0` (0+0+0) = `---` (Kein Zugriff)",
        "moreInfo": "### 1. tl;dr\nOktale Rechte basieren auf dem Binärsystem: `r`=4, `w`=2, `x`=1. Addiere die Werte für Besitzer, Gruppe und Andere. `755` bedeutet Ausführrechte für alle, `640` bedeutet geschützte Daten für Besitzer und Gruppe.\n---\n> **Tux-Ansage:** Rechte-Mathematik ist Grundschulniveau, Rekrut! Lesen ist 4, Schreiben ist 2, Ausführen ist 1! Wenn du das verkackst, öffnest du unsere Systeme für jeden dahergelaufenen Skriptkiddie! Rechne gefälligst richtig!\n---\n### 3. Deep Dive\nDas Berechtigungsmodell von Unix ist simpel, aber extrem wirkungsvoll. Es basiert auf 9 Bits, die in 3 Blöcke zu je 3 Bits (User, Group, Others) unterteilt sind.\n\n- **Binäre Basis:** Ein `rwx` entspricht binär `111`, was dezimal (und oktal) `7` ist. Ein `rw-` ist `110` -> `6`.\n- **Anwendungsfälle für 755 (`rwxr-xr-x`):** Dies ist der Standard für ausführbare Skripte und Programme (wie `/bin/ls`) sowie für **Verzeichnisse**. Bei Verzeichnissen bedeutet das Ausführungsrecht `x`, dass man in das Verzeichnis wechseln (`cd`) darf. Ohne `x` auf einem Verzeichnis nützt dir auch ein `r` (Inhalt auflisten) nicht viel.\n- **Anwendungsfälle für 640 (`rw-r-----`):** Ideal für Konfigurationsdateien, die sensible Informationen (wie Datenbank-Passwörter) enthalten. Der Besitzer (z. B. `root`) darf ändern, die Gruppe (z. B. `www-data` für den Webserver) darf die Config lesen, um zu funktionieren, und alle anderen Benutzer auf dem System sind komplett ausgesperrt.",
        "topicId": 7,
        "difficulty": "mittel"
    },
    {
        "id": 107,
        "category": "3. Berechtigungsmodell",
        "question": "Wofür steht chmod und chown?",
        "answer": "chmod (change mode) ändert die Zugriffsrechte (Lesen, Schreiben, Ausführen). chown (change owner) ändert den Besitzer einer Datei.",
        "topicId": 7,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`chmod` ändert Dateirechte, `chown` ändert den Eigentümer.\n---\n> **Tux-Ansage:** Chmod 777 ist kein Bugfix, sondern eine Kriegserklärung an die Sicherheit!\n---\n### 3. Deep Dive\n`chmod` (Change Mode) modifiziert die Lese- (r), Schreib- (w) und Ausführungsrechte (x) für User, Group und Others. `chown` (Change Owner) passt die Besitzverhältnisse an. Nur root oder der Besitzer können `chmod` nutzen, für `chown` braucht man meist root-Rechte."
    },
    {
        "id": 207,
        "category": "3. Berechtigungsmodell",
        "question": "Erkläre die Auswirkungen von 'chmod 4755' auf ein Executable (SUID-Bit). Welche Sicherheitsrisiken entstehen?",
        "answer": "4755 setzt das SUID-Bit (4) und rwxr-xr-x. Das Programm wird beim Aufruf mit den Rechten des Dateibesitzers ausgeführt (oft root), nicht mit denen des Aufrufers. Risiko: Bei Schwachstellen im Programm (z.B. Buffer Overflow) kann der Angreifer Root-Rechte erlangen.",
        "topicId": 7,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nDas SUID-Bit lässt das Programm mit den Rechten des Dateibesitzers (oft root) ausführen.\n---\n> **Tux-Ansage:** Gib jedem Skript ein SUID-Bit, und morgen gehört dein Server einem Scriptkiddie!\n---\n### 3. Deep Dive\nBei `chmod 4755` steht die `4` für das SUID-Bit. Ein so markiertes Programm wird nicht mit den Rechten des Aufrufers ausgeführt, sondern mit denen des Datei-Eigentümers (z.B. root). Ist das Programm fehlerhaft (z.B. Buffer Overflow), stellt dies eine massive Privileged Escalation Lücke dar."
    },
    {
        "id": 8,
        "category": "3. Berechtigungsmodell",
        "question": "Erkläre SUID, SGID und Sticky Bit und nenne jeweils ein typisches Praxisbeispiel.",
        "answer": "* **SUID (Set User ID):** Datei läuft mit Rechten des Besitzers (z.B. /usr/bin/passwd).\n* **SGID (Set Group ID):** Neue Dateien erben die Gruppe des Verzeichnisses. ACHTUNG: Das garantiert noch keine Schreibrechte für die Gruppe (umask-Falle)!\n* **Sticky Bit:** In öffentlichen Ordnern (z.B. /tmp) darf jeder Dateien anlegen, aber nur der Besitzer (oder root) darf sie löschen.",
        "moreInfo": "### 1. tl;dr\nSUID führt Programme als Dateibesitzer aus. SGID vererbt die Gruppen-ID bei neuen Dateien. Sticky Bit verhindert, dass Fremde deine Dateien löschen.\n\n---\n> **Tux-Ansage:** \"SGID ohne ACLs ist wie ein Auto ohne Lenkrad! Alle können mitfahren, aber keiner kann steuern. Merkt euch die umask-Falle, sonst gibt's Liegestütze!\"\n---\n\n### 3. Deep Dive\n\n#### 1. SUID (Set User ID)\n**Funktion:** Wird eine ausführbare Datei mit SUID-Bit ausgeführt, erhält der Prozess die effektive Benutzer-ID (EUID) des Dateibesitzers.\n**Beispiel:** `/usr/bin/passwd`. Jeder User muss sein Passwort ändern können, aber `/etc/shadow` ist nur für `root` lesbar. Dank SUID läuft das `passwd`-Programm mit `root`-Rechten.\n\n#### 2. SGID (Set Group ID) & Die umask-Falle!\n**Funktion (auf Verzeichnisse):** Neue Dateien und Unterverzeichnisse, die in einem SGID-Verzeichnis erstellt werden, erben automatisch die Gruppe des Verzeichnisses.\n**Das Problem in der Praxis:** Wenn Alice eine Datei anlegt, gehört sie zwar der richtigen Gruppe, aber die Standard-`umask` (022) gibt der Gruppe nur **Lese-Rechte** (`-rw-r--r--`). Bob kann die Datei also nicht bearbeiten, obwohl er in der Gruppe ist!\n**Die Lösung (Best Practice):** SGID muss immer mit Default-ACLs kombiniert werden, um Gruppen-Schreibrechte zu erzwingen!\n```bash\n# 1. Basis-Rechte und SGID setzen\nmkdir /srv/team && chgrp devteam /srv/team\nchmod 2775 /srv/team\n\n# 2. Default-ACL (erzwingt Schreibrechte für die Gruppe bei neuen Dateien!)\nsetfacl -d -m g::rwX /srv/team\n```\n\n#### 3. Sticky Bit\n**Funktion (auf Verzeichnisse):** Verhindert, dass Benutzer Dateien löschen oder umbenennen, die ihnen nicht gehören.\n**Beispiel:** `/tmp`. Jeder darf Dateien anlegen (`rwxrwxrwt`), aber nur der Eigentümer der Datei darf sie wieder löschen.\n\n#### Spezialbits setzen (chmod)\nDie Bits werden als vierte Ziffer vorangestellt:\n- `4` = SUID (`chmod 4755`)\n- `2` = SGID (`chmod 2775`)\n- `1` = Sticky (`chmod 1777`)",
        "topicId": 8,
        "difficulty": "mittel"
    },
    {
        "id": 108,
        "category": "3. Berechtigungsmodell",
        "question": "Welche Rechte (r, w, x) brauchst du, um den Inhalt eines Verzeichnisses mit 'ls' aufzulisten?",
        "answer": "Du brauchst das Leserecht (r) für das Verzeichnis.",
        "topicId": 8,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nDu benötigst zwingend das Leserecht (r) auf das Verzeichnis.\n---\n> **Tux-Ansage:** Ohne 'r' bleibst du blind im Verzeichnis stehen!\n---\n### 3. Deep Dive\nVerzeichnisse sind unter Linux Dateien, die eine Liste von Inode-Nummern und Dateinamen enthalten. Um diese Liste auslesen zu können (z.B. mit dem Befehl `ls`), muss das Leserecht (Read, `r`) für das Verzeichnis gesetzt sein."
    },
    {
        "id": 208,
        "category": "3. Berechtigungsmodell",
        "question": "Ein Ordner hat die Rechte 'drwx--x--x'. Was können andere Benutzer (Others) in diesem Ordner tun?",
        "answer": "Sie können nicht mit 'ls' den Inhalt auflisten (kein 'r'), aber da das Execute-Recht ('x') gesetzt ist, können sie durch das Verzeichnis navigieren ('cd') und auf ihnen bekannte Dateien zugreifen, sofern sie deren genauen Pfad und Namen kennen.",
        "topicId": 8,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nAndere können den Inhalt nicht auflisten, aber in das Verzeichnis wechseln und Dateien aufrufen.\n---\n> **Tux-Ansage:** Das Verzeichnis ist ein Labyrinth – du kommst nur durch, wenn du den Weg kennst!\n---\n### 3. Deep Dive\nDie Rechte `drwx--x--x` bedeuten, dass 'Others' nur das Execute-Recht (`x`) haben. Bei Verzeichnissen erlaubt `x` das Traversieren (per `cd`) und den Zugriff auf bekannte Inodes. Da das Read-Recht (`r`) fehlt, schlägt `ls` fehl. Kennt man jedoch den genauen Dateinamen, kann man die Datei trotzdem öffnen."
    },
    {
        "id": 9,
        "category": "3. Berechtigungsmodell",
        "question": "Ein Ordner hat die Rechte 1777 (drwxrwxrwt). Benutzer A erstellt darin die Datei entwurf.txt mit 666 (rw-rw-rw-).\n1. Kann Benutzer B den Inhalt verändern?\n2. Kann Benutzer B die Datei löschen?",
        "answer": "1. **Kann B den Inhalt verändern?**\n   **Ja**. Die Datei hat das Recht `666` (`rw-rw-rw-`), was jedem Benutzer auf dem System erlaubt, den Inhalt der Datei zu lesen und zu modifizieren.\n2. **Kann B die Datei löschen?**\n   **Nein**. Das Verzeichnis hat das Rechte-Set `1777`. Die führende `1` aktiviert das **Sticky Bit** (sichtbar am `t` in `drwxrwxrwt`). Es besagt, dass Dateien in diesem Ordner nur vom Besitzer der Datei, dem Besitzer des Verzeichnisses oder root gelöscht/umbenannt werden dürfen.",
        "moreInfo": "### 1. tl;dr\nDas Sticky Bit auf einem Verzeichnis mit Schreibrechten (`1777`) verhindert, dass Benutzer die Dateien anderer Benutzer löschen können, auch wenn sie den Dateiinhalt (bei `666`) überschreiben dürfen.\n---\n> **Tux-Ansage:** Das Sticky Bit ist dein Bodyguard im `/tmp`-Ordner! Schreibrechte im Verzeichnis bedeuten normalerweise, du kannst alles löschen. Aber nicht mit dem Sticky Bit! Da darf nur der Erschaffer aufräumen. Merk dir den Unterschied zwischen Datei modifizieren und Datei löschen!\n---\n### 3. Deep Dive\n- **Schreibrechte vs. Löschrechte:** In Unix bestimmt nicht die Datei selbst, ob sie gelöscht werden darf, sondern das **Verzeichnis**, in dem sie liegt. Ein Verzeichnis ist eine Liste von Dateinamen. Wer Schreibrecht (`w`) auf ein Verzeichnis hat, darf Dateinamen aus dieser Liste entfernen (also Dateien löschen), egal wem die Datei gehört.\n- **Das Sticky Bit (Restricted Deletion Flag):** Um Verzeichnisse wie `/tmp` oder `/var/tmp` zu betreiben, in denen jeder temporäre Dateien anlegen darf (`777`), braucht man einen Schutz. Ohne Sticky Bit könnte Nutzer A die temporären Dateien von Nutzer B einfach löschen. Das Sticky Bit (`chmod +t` oder `1777`) modifiziert die Verzeichnis-Semantik: Du darfst nur Dateien aus der Verzeichnisliste entfernen, deren Eigentümer du bist.\n- **Inhalt ändern:** Da Benutzer A der Datei `entwurf.txt` beim Erstellen fatale Rechte (`666`) gegeben hat, kann Benutzer B den Dateiinhalt per Editor oder `echo \"gehackt\" > entwurf.txt` überschreiben. Benutzer B kann die Datei aber nicht mittels `rm` entfernen.",
        "topicId": 9,
        "difficulty": "mittel"
    },
    {
        "id": 109,
        "category": "3. Berechtigungsmodell",
        "question": "Was macht der Befehl 'mkdir -p /a/b/c'?",
        "answer": "Er erstellt den Ordner 'c' und automatisch auch alle übergeordneten Ordner ('a' und 'b'), falls diese noch nicht existieren.",
        "topicId": 9,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nEr erstellt das Verzeichnis 'c' inklusive aller eventuell noch fehlenden Elternverzeichnisse.\n---\n> **Tux-Ansage:** Warum 3 Befehle tippen, wenn -p dir die ganze Arbeit abnimmt?\n---\n### 3. Deep Dive\nDas Flag `-p` (parents) weist `mkdir` an, keine Fehlermeldung auszugeben, wenn das Zielverzeichnis existiert, und alle fehlenden übergeordneten Verzeichnisse automatisch mit anzulegen. Extrem nützlich für Shell-Skripte."
    },
    {
        "id": 209,
        "category": "3. Berechtigungsmodell",
        "question": "Du musst 100 nummerierte Verzeichnisse (dir_001 bis dir_100) erstellen. Wie lautet der effizienteste Bash-Befehl?",
        "answer": "Man nutzt Brace Expansion: 'mkdir dir_{001..100}' erstellt alle 100 Verzeichnisse sofort in einem einzigen Befehl ohne Loop.",
        "topicId": 9,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nDer effizienteste Weg ist `mkdir dir_{001..100}`.\n---\n> **Tux-Ansage:** Wer hier 'ne for-Schleife tippt, wird zur Strafe Windows-Admin!\n---\n### 3. Deep Dive\nDie Bash bietet die \"Brace Expansion\". Der Ausdruck `dir_{001..100}` wird vor Ausführung zu 100 Argumenten expandiert. Somit wird `mkdir` nur ein einziges Mal aufgerufen. Das ist ressourcenschonender als eine Schleife, die `mkdir` 100-mal als neuen Prozess startet."
    },
    {
        "id": 10,
        "category": "4. Shell- und Bash-Grundlagen",
        "question": "Was passiert bei folgendem Befehl im Hintergrund?\n`cat /var/log/syslog | grep \"ERROR\"`\nWarum ist dies ein „Useless Use of Cat“ (UUOC) und wie lautet der optimierte Befehl?",
        "answer": "**Was passiert:**\n`cat` liest `/var/log/syslog` ein und gibt den gesamten Text an die Standardausgabe (stdout) weiter. Die Pipe (`|`) fängt das ab und leitet es in die Standardeingabe (stdin) von `grep`, das dann nach \"ERROR\" sucht.\n\n**Warum UUOC:**\nEs startet einen unnötigen Subprozess (`cat`), verbraucht CPU-Zyklen und Speicher, obwohl `grep` als Parameter direkt aus Dateien lesen kann.\n\n**Optimierter Befehl:**\n`grep \"ERROR\" /var/log/syslog`",
        "moreInfo": "### 1. tl;dr\nEin \"Useless Use of Cat\" (UUOC) entsteht, wenn du `cat` nutzt, um Text in ein Programm zu pipen, das problemlos selbst Dateien einlesen kann. `grep \"ERROR\" file` ist effizienter als `cat file | grep \"ERROR\"`.\n---\n> **Tux-Ansage:** Wenn du `cat` als reines Transportmittel benutzt, beleidigst du die Effizienz! Unix-Tools können selbst Dateien lesen. Pipe nicht sinnlos herum, das kostet Prozesse und outet dich als Anfänger!\n---\n### 3. Deep Dive\n- **Die Kosten von Pipes:** In Bash-Skripten startet jede Pipe (`|`) Subshells und neue Prozesse. Ein `cat file | grep search` erzeugt einen `cat`-Prozess, einen `grep`-Prozess und einen Puffer im Kernel für die Interprozesskommunikation (IPC). Bei großen Logs ist das ein spürbarer Overhead.\n- **Die Fähigkeiten der Werkzeuge:** Werkzeuge wie `grep`, `awk`, `sed`, `sort` und `tail` sind alle dafür konzipiert, Dateiparameter entgegenzunehmen. Nur wenn du Tools nutzt, die strikt *nur* von stdin lesen (wie `tr`), ist eine Umleitung sinnvoll (z. B. `tr 'a-z' 'A-Z' < file.txt` – hier nutzt man aber auch besser die Redirection `<` statt `cat |`).\n- **Die Ausnahme:** `cat` (concatenate) ist eigentlich dafür gedacht, *mehrere* Dateien aneinanderzuhängen (z. B. `cat part1 part2 part3 > complete_file`). Nur in sehr speziellen Fällen, etwa beim Beobachten eines sehr langen Pipings bei komplexen Logs, beginnen manche Admins aus reiner Bequemlichkeit mit `cat`, um den Dateinamen am Anfang der Zeile stehen zu haben. Aus puristischer Sicht bleibt es aber ein Anti-Pattern.",
        "topicId": 10,
        "difficulty": "mittel"
    },
    {
        "id": 110,
        "category": "4. Shell- und Bash-Grundlagen",
        "question": "Wie löschst du einen Ordner, der noch Dateien enthält, über das Terminal?",
        "answer": "Mit dem Befehl 'rm -r ordnername'. Das '-r' steht für rekursiv und löscht den Inhalt mit.",
        "topicId": 10,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nMit dem Befehl `rm -r ordnername` löschst du den Ordner rekursiv.\n---\n> **Tux-Ansage:** Ein 'rm -r' am Morgen vertreibt Kummer und... Ups, Backup gemacht?\n---\n### 3. Deep Dive\nDer Befehl `rm` löscht standardmäßig nur Dateien. Das Flag `-r` (recursive) weist das Tool an, in das Verzeichnis hinabzusteigen und alle enthaltenen Dateien und Unterverzeichnisse zuerst zu löschen. Oft in Kombination mit `-f` (force), um Bestätigungen zu unterdrücken."
    },
    {
        "id": 210,
        "category": "4. Shell- und Bash-Grundlagen",
        "question": "Warum schlägt 'rm -rf *' fehl, wenn ein Verzeichnis zehntausende Dateien enthält, und wie löst du das Problem?",
        "answer": "Der Befehl schlägt mit 'Argument list too long' fehl, da die Bash den Stern in alle Dateinamen expandiert und das Limit für Argumente (ARG_MAX) überschreitet. Lösung: 'find . -type f -delete' oder 'ls -1 | xargs rm'.",
        "topicId": 10,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nDie Shell expandiert `*` zu zu vielen Argumenten (ARG_MAX Limit). Lösung: `find . -type f -delete`.\n---\n> **Tux-Ansage:** Dein Sternchen ist zu fett für die Bash, nutz 'find', du Amateur!\n---\n### 3. Deep Dive\nWenn man `rm -rf *` ausführt, expandiert die Shell das `*` in alle Dateinamen. Bei zehntausenden Dateien wird das Limit für Kommandozeilenargumente (`ARG_MAX`) überschritten, der Systemcall bricht mit \"Argument list too long\" ab. `find` löst das, da es Dateien iterativ verarbeitet."
    },
    {
        "id": 11,
        "category": "4. Shell- und Bash-Grundlagen",
        "question": "Erkläre die Unterschiede zwischen einem Hardlink und einem Symbolischen Link (Symlink) bezüglich:\n- Worauf sie verweisen\n- Verhalten beim Löschen des Originals\n- Verwendung über Partitionsgrenzen hinweg",
        "answer": "* **Worauf sie verweisen:** Ein Hardlink zeigt direkt auf die Inode (Datenblockstruktur) der Originaldatei (es ist ein gleichwertiger Name für dieselben Daten). Ein Symlink ist eine eigenständige kleine Datei, die als Text den Dateipfad zur Originaldatei speichert.\n* **Löschen des Originals:** Löscht man den ursprünglichen Namen, bleibt der Hardlink voll funktionstüchtig (die Daten bleiben erhalten, bis der letzte Hardlink gelöscht ist). Ein Symlink hingegen wird sofort unbrauchbar (Broken Link), da sein Zielpfad ins Leere führt.\n* **Partitionsgrenzen:** Hardlinks funktionieren nur auf derselben Partition/Dateisystem, da Inodes partitionsgebunden sind. Symlinks funktionieren über Partitionsgrenzen und Laufwerke hinweg.",
        "moreInfo": "### 1. tl;dr\nEin Hardlink ist ein Klon-Eintrag, der direkt auf dieselben Dateidaten (Inode) zeigt. Ein Symlink ist wie eine Windows-Verknüpfung, die lediglich auf den Speicherort einer anderen Datei verweist.\n---\n> **Tux-Ansage:** Hardlinks sind wie Zwillingsbrüder – wenn einer stirbt, lebt der andere weiter. Symlinks sind wie Wegweiser – wenn das Ziel abgerissen wird, zeigen sie nur noch ins Nichts! Und wage es nicht, Hardlinks für Verzeichnisse anzulegen!\n---\n### 3. Deep Dive\n- **Inodes und Hardlinks:** In Unix werden Metadaten von Dateien (Rechte, Besitzer, Blöcke auf der Festplatte) in einer Inode gespeichert. Der Dateiname ist lediglich ein Eintrag in einer Verzeichnis-Tabelle, der auf diese Inode verweist. Wenn man `ln datei hardlink` ausführt, wird ein *zweiter* Verzeichniseintrag erstellt, der auf exakt dieselbe Inode verweist. Die Inode hat einen Reference Counter. Erst wenn dieser auf 0 sinkt (alle Hardlinks gelöscht), gibt das Dateisystem den Platz frei.\n- **Symlinks (`ln -s`):** Ein Symbolischer Link (Softlink) bekommt seine ganz eigene Inode. In deren Datenblock steht nur der Text-Pfad (z. B. `../ziel/datei.txt`). Greift ein Programm auf den Symlink zu, liest der Kernel den Pfad aus und löst ihn transparent zum Ziel auf. Daher zerbricht der Link, wenn das Ziel verschoben wird.\n- **Einschränkungen:**\n  - **Partitionsgrenzen:** Jede Partition hat ihre eigene Inode-Tabelle (Inode 123 auf `/` ist etwas anderes als Inode 123 auf `/home`). Daher können Hardlinks keine Partitionsgrenzen überschreiten. Symlinks speichern jedoch nur Pfade und funktionieren netzwerkweit (z.B. bei NFS-Mounts).\n  - **Verzeichnisse:** Moderne Unix-Systeme verbieten Hardlinks auf Verzeichnisse, da sie Endlosschleifen im Dateisystem-Baum erzeugen könnten (ein Verzeichnis verweist auf sein übergeordnetes Verzeichnis usw.), was Tools wie `find` oder `fsck` zum Absturz bringen würde.",
        "topicId": 11,
        "difficulty": "mittel"
    },
    {
        "id": 111,
        "category": "4. Shell- und Bash-Grundlagen",
        "question": "Was macht der Befehl 'top'?",
        "answer": "Er zeigt einen Live-Überblick aller laufenden Prozesse an, sortiert nach CPU- oder RAM-Verbrauch.",
        "topicId": 11,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nZeigt laufende Prozesse und Systemressourcen in Echtzeit an.\n---\n> **Tux-Ansage:** Willst du nur blöd auf den Bildschirm starren oder auch verstehen, was dein System in die Knie zwingt? Lern `top` zu lesen, Rekrut!\n---\n### 3. Deep Dive\n`top` (Table of Processes) ist das klassische Kommandozeilenwerkzeug zur Systemüberwachung. Es zeigt dynamisch in Echtzeit eine Zusammenfassung des Systems (Uptime, Load Average, CPU- und RAM-Auslastung) sowie eine Liste der aktuell verwalteten Prozesse an. Standardmäßig wird die Liste nach CPU-Nutzung sortiert. In der Praxis nutzen Linux-Admins `top` (oder modernere Alternativen wie `htop`), um Performance-Engpässe zu identifizieren, hängende Prozesse zu finden oder einfach die Systemgesundheit zu überprüfen. Während `top` läuft, lassen sich interaktiv Befehle senden, z.B. `k` zum Beenden (Killen) von Prozessen oder `r` zum Ändern der Priorität (Renice)."
    },
    {
        "id": 211,
        "category": "4. Shell- und Bash-Grundlagen",
        "question": "Wie änderst du die Priorität eines laufenden Prozesses mit PID 1234, um ihn weniger CPU-Zeit geben zu lassen?",
        "answer": "Mit 'renice'. Ein höherer Nice-Wert bedeutet niedrigere Priorität. Befehl: 'renice +10 -p 1234'. Das erfordert root-Rechte, wenn man die Priorität erhöhen (negativer Wert) will.",
        "topicId": 11,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nMit `renice` den Nice-Wert erhöhen, z.B. `renice +10 -p 1234`.\n---\n> **Tux-Ansage:** Ach, dein Prozess frisst die CPU? Zeig ihm mit `renice`, wer hier der Boss ist. Aber wehe, du machst versehentlich alles noch schlimmer!\n---\n### 3. Deep Dive\nUnter Linux wird die CPU-Zuteilung über den sogenannten \"Nice\"-Wert gesteuert, der von -20 (höchste Priorität) bis +19 (niedrigste Priorität) reicht. Ein Prozess ist \"nice\" (nett) zu anderen, wenn er einen hohen Nice-Wert hat, also freiwillig CPU-Zeit abgibt. Mit dem Befehl `renice` kannst du die Priorität eines bereits laufenden Prozesses anpassen. `renice +10 -p 1234` setzt den Nice-Wert des Prozesses mit PID 1234 auf 10, was ihn langsamer macht. Um die Priorität zu erhöhen (z.B. einen negativen Nice-Wert setzen), werden root-Rechte benötigt, da sonst normale Benutzer das System durch das Hochstufen ihrer eigenen Prozesse blockieren könnten."
    },
    {
        "id": 12,
        "category": "4. Shell- und Bash-Grundlagen",
        "question": "Was ist der Unterschied zwischen einer Shell-Variable und einer Umgebungsvariable (Environment Variable)?\nWie deklarierst und exportierst du eine Variable namens PROJEKT mit dem Wert „Lernen“?",
        "answer": "* **Shell-Variable:** Gilt nur in der aktuellen Shell. Kindprozesse (z. B. gestartete Skripte) erben sie nicht.\n* **Umgebungsvariable:** Wird an alle Kindprozesse vererbt.\n* **Deklaration & Export:**\n  `PROJEKT=\"Lernen\"`  # Shell-Variable deklarieren\n  `export PROJEKT`    # Zur Umgebungsvariable machen\n  *(Alternativ in einem Schritt: `export PROJEKT=\"Lernen\"`)*",
        "moreInfo": "### 1. tl;dr\nShell-Variablen sind nur in der aktuellen Shell sichtbar, Umgebungsvariablen werden an alle Kindprozesse vererbt. Mit `export PROJEKT=\"Lernen\"` erzeugst du eine Umgebungsvariable – oder du deklarierst erst `PROJEKT=\"Lernen\"` und exportierst sie danach mit `export PROJEKT`.\n---\n> **Tux-Ansage:** Aufstehen, Rekrut! Wer nicht exportiert, bleibt in der Kommandozeilen-Kinderstube hängen! Willst du, dass deine Skripte die Variablen sehen? Dann **exportiere** sie – oder du kannst deine Daten gleich in die Tonne kloppen! Jetzt wird gelernt, und zwar mit Disziplin!\n---\n### 3. Deep Dive\n### Der Unterschied – mehr als nur eine Formalie\n\nJede Shell (bash, zsh, sh) hat zwei Arten von Variablen:\n\n- **Shell-Variable** – auch „lokale Variable“ genannt. Sie existiert nur im aktuellen Shell-Prozess. Wenn du ein Skript oder einen Befehl startest, erzeugt die Shell einen **Kindprozess** (fork/exec). Dieser Kindprozess bekommt **keine** Kopie der Shell-Variablen – nur die **Umgebungsvariablen** werden vererbt.\n- **Umgebungsvariable** – Teil der **Environment** des Prozesses. Jeder Prozess hat eine eigene Umgebung (eine Liste von `NAME=WERT`-Paaren). Beim Start eines Kindprozesses wird diese Umgebung kopiert und dem Kind übergeben. Das Kind kann sie lesen, aber Änderungen wirken nicht zurück auf den Elternteil.\n\n**Warum ist das wichtig?**  \nStell dir vor, du definierst in deinem Terminal `MEIN_PFAD=\"/tmp/test\"` und rufst dann ein Skript auf, das diese Variable nutzen soll. Ohne `export` bleibt das Skript blind – es sieht `MEIN_PFAD` nicht. Mit `export` wird sie Teil der Umgebung und das Skript kann sie über `$MEIN_PFAD` abrufen.\n\n### Deklaration und Export – Schritt für Schritt\n\n```bash\n# 1. Shell-Variable deklarieren (ohne Leerzeichen um das '=')\nPROJEKT=\"Lernen\"\n\n# 2. Prüfen: Ist sie in der Umgebung? (nein)\nenv | grep PROJEKT   # keine Ausgabe\n\n# 3. Exportieren\nexport PROJEKT\n\n# 4. Jetzt ist sie in der Umgebung\nenv | grep PROJEKT   # PROJEKT=Lernen\n\n# Alternativ in einem Schritt:\nexport PROJEKT=\"Lernen\"\n```\n\n**Wichtig:** `export` verändert den Wert nicht, es markiert die Variable nur als „exportierbar“. Du kannst auch `export -n PROJEKT` verwenden, um den Export wieder aufzuheben.\n\n### Praktische Anwendungsfälle\n\n- **Konfiguration für Skripte:** Du willst, dass ein Skript weiß, in welchem Modus es läuft (z.B. `DEBUG=true`). Exportiere die Variable, dann kann das Skript sie auslesen.\n- **Pfade und Umgebungssteuerung:** `PATH`, `HOME`, `LANG` sind klassische Umgebungsvariablen. Wenn du ein eigenes Tool-Verzeichnis hast, fügst du es zu `PATH` hinzu: `export PATH=\"$PATH:/mein/verzeichnis\"`.\n- **Temporäre Umgebung für einen Befehl:** Du kannst die Umgebung auch nur für einen einzelnen Befehl setzen, ohne sie dauerhaft zu exportieren:  \n  `PROJEKT=\"Lernen\" ./skript.sh` – hier wird `PROJEKT` nur für das Skript als Umgebungsvariable gesetzt, die aktuelle Shell behält nichts.\n\n### Nützliche Befehle im Zusammenhang\n\n| Befehl | Beschreibung |\n|--------|--------------|\n| `set` | Zeigt alle Shell-Variablen (inkl. Funktionen) |\n| `env` | Zeigt alle Umgebungsvariablen |\n| `printenv PROJEKT` | Gibt den Wert einer Umgebungsvariable aus |\n| `export -p` | Listet alle exportierten Variablen |\n| `unset PROJEKT` | Löscht eine Variable (egal ob exportiert oder nicht) |\n| `declare -x PROJEKT=\"Lernen\"` | Alternative zu `export` (bash-spezifisch) |\n\n### Ein typisches Beispiel aus der Praxis\n\n```bash\n# In der Shell\nexport DATENBANK_HOST=\"db.example.com\"\n\n# In einem Skript (z.B. backup.sh)\n#!/bin/bash\necho \"Verbinde zu $DATENBANK_HOST ...\"\n```\n\nWenn du das Skript ausführst, sieht es `DATENBANK_HOST`. Ohne `export` wäre die Variable leer.\n\n**Achtung:** Kindprozesse können die Umgebung des Elternprozesses nicht ändern. Wenn ein Skript eine Variable exportiert, wirkt das nicht zurück auf dein Terminal. Das ist ein häufiger Stolperstein.\n\n\n**4. Visualisierung/Merkhilfe:**\n\n```\nEltern-Shell (dein Terminal)\n│\n├── Shell-Variable: PROJEKT=\"Lernen\"  →  NICHT sichtbar für Kind\n│\n└── Umgebungsvariable: PROJEKT=\"Lernen\" (exportiert)\n    │\n    └── Kindprozess (z.B. ./skript.sh)\n        └── sieht $PROJEKT = \"Lernen\"\n```\n\n**Merkhilfe:**  \n„Export ist wie ein Stempel auf dem Umschlag: Ohne Stempel bleibt der Brief im Postamt (deine Shell), mit Stempel geht er raus an die Kinder.“\n\n**ASCII-Diagramm der Umgebungsübergabe:**\n\n```\n+-----------------------+\n|  Elternprozess        |\n|  Umgebung:            |\n|  PATH=...             |\n|  PROJEKT=Lernen       |  ← exportiert\n+-----------+-----------+\n            |\n            | fork/exec (Kopie der Umgebung)\n            v\n+-----------------------+\n|  Kindprozess          |\n|  Umgebung:            |\n|  PATH=...             |\n|  PROJEKT=Lernen       |  ← sichtbar\n+-----------------------+\n```\n\n**Tipp für die Praxis:**  \nNutze `env -i` um eine leere Umgebung zu simulieren, oder `env -u PROJEKT` um eine Variable gezielt zu entfernen – so testest du, ob dein Skript wirklich unabhängig ist.",
        "topicId": 12,
        "difficulty": "mittel"
    },
    {
        "id": 112,
        "category": "4. Shell- und Bash-Grundlagen",
        "question": "Was bedeutet die PID bei Prozessen?",
        "answer": "PID steht für Process ID. Das ist eine eindeutige Nummer, die jeder laufende Prozess vom System bekommt.",
        "topicId": 12,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nDie PID ist die eindeutige ID-Nummer eines Prozesses.\n---\n> **Tux-Ansage:** PID heißt Process ID. Ohne Nummer bist du unter Linux ein Niemand. Merk dir das!\n---\n### 3. Deep Dive\nJeder Prozess, der auf einem Linux-System gestartet wird, erhält vom Kernel eine eindeutige Prozess-ID (PID). Der Init-Prozess (oft `systemd`), der als erster beim Booten gestartet wird, hat immer die PID 1. PIDs werden hochgezählt, bis das System das Maximum erreicht hat (in der Regel 32768, anpassbar unter `/proc/sys/kernel/pid_max`), wonach ungenutzte Nummern wiederverwendet werden. Die PID ist essenziell für die Prozessverwaltung: Alle Befehle, die auf Prozesse einwirken (wie `kill`, `renice`, `strace`), benötigen die PID als Zieladresse, um genau diesen einen Prozess anzusprechen."
    },
    {
        "id": 212,
        "category": "4. Shell- und Bash-Grundlagen",
        "question": "Erkläre den Unterschied zwischen einem Zombie-Prozess und einem Orphan-Prozess.",
        "answer": "Ein Orphan-Prozess verliert seinen Elternprozess und wird von 'init' (PID 1) adoptiert. Ein Zombie-Prozess ist beendet, aber der Elternprozess hat dessen Exit-Status (via 'wait()') noch nicht abgeholt; er belegt keine Ressourcen mehr außer einem Eintrag in der Prozess-Tabelle.",
        "topicId": 12,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nOrphan = Eltern tot, Kind lebt (adoptiert von PID 1). Zombie = Kind tot, Eltern haben den Status noch nicht gelesen.\n---\n> **Tux-Ansage:** Zombies fressen Gehirne, Zombie-Prozesse fressen deine Prozess-Tabelle. Räum dein System auf oder PID 1 muss deine Waisen adoptieren!\n---\n### 3. Deep Dive\nWenn ein Kindprozess beendet wird, meldet er das dem Kernel, verbleibt aber als \"Zombie\" (Z-Status in `top` oder `ps`) in der Prozesstabelle, bis der Elternprozess seinen Rückgabewert (Exit-Code) mit dem Systemaufruf `wait()` abfragt. Das ist normalerweise eine Sache von Millisekunden. Ein defekter Elternprozess ruft `wait()` jedoch nie auf – der Zombie bleibt dauerhaft. Zombies verbrauchen außer dem Eintrag in der Tabelle keine Ressourcen (weder CPU noch RAM), können aber bei massenhaftem Auftreten die maximal verfügbaren PIDs ausschöpfen.\nEin \"Orphan\" (Waise) entsteht, wenn der Elternprozess beendet wird, bevor das Kind stirbt. Der Kernel weist das verwaiste Kind automatisch dem Init-Prozess (PID 1) als neuem Elternteil zu, welcher regelmäßige `wait()`-Aufrufe durchführt und den Prozess am Ende ordnungsgemäß wegräumt."
    },
    {
        "id": 13,
        "category": "5. I/O und File-Deskriptoren",
        "question": "Welche Standard-Datenströme besitzen die Nummern 0, 1 und 2?\nSchreibe einen Befehl, der die Dateiliste (ls -la) ausgibt, dabei Fehler verwirft und die normale Ausgabe in inventar.txt speichert.",
        "answer": "**Datenströme:**\n* `0`: `stdin` (Standardeingabe)\n* `1`: `stdout` (Standardausgabe)\n* `2`: `stderr` (Standardfehlerausgabe)\n\n**Befehl:**\n`ls -la > inventar.txt 2> /dev/null`",
        "moreInfo": "### 1. tl;dr\nDie Dateideskriptoren 0, 1 und 2 stehen für **stdin** (Eingabe), **stdout** (Ausgabe) und **stderr** (Fehlerausgabe). Mit `ls -la > inventar.txt 2> /dev/null` schickst du die normale Ausgabe in eine Datei und wirfst Fehlermeldungen in den Mülleimer.\n---\n> **Tux-Ansage:** Aufgepasst, Rekrut! Wer die Ströme nicht beherrscht, hat die Kontrolle über sein System verloren. Hier lernst du, wie man Daten lenkt wie ein Feldwebel seine Truppe – präzise, ohne Ausreden. Und jetzt: Augen auf, Ohren auf, Terminal an!\n---\n### 3. Deep Dive\n### Die drei heiligen Ströme  \nJeder Linux-Prozess hat standardmäßig drei offene Datei-Deskriptoren:  \n\n| Nummer | Name | Zweck | Standard-Ziel |\n|--------|------|-------|---------------|\n| 0 | **stdin** | Eingabe für Kommandos (z.B. Tastatur) | Terminal |\n| 1 | **stdout** | Normale Ausgabe (Ergebnisse) | Terminal |\n| 2 | **stderr** | Fehlermeldungen und Diagnose | Terminal |\n\n**Warum getrennt?**  \nDamit du Fehler von Ergebnissen unterscheiden kannst. Beispiel: `find / -name \"*.conf\"` liefert massenhaft Fehler (Permission denied) auf stderr, aber die eigentlichen Treffer auf stdout. Mit Umleitungen kannst du beide getrennt verarbeiten.\n\n### Der Befehl im Detail  \n`ls -la > inventar.txt 2> /dev/null`  \n\n- `>` leitet **stdout** in die Datei `inventar.txt` (überschreibt sie).  \n- `2>` leitet **stderr** nach `/dev/null` – das ist ein „schwarzes Loch“, das alles verwirft.  \n- Die Fehlermeldungen (z.B. „Permission denied“) verschwinden, die Liste der Dateien landet in der Datei.\n\n**Wichtig:** Ohne `2>` würden Fehler weiterhin auf dem Terminal erscheinen, selbst wenn stdout umgeleitet ist. Das kann bei Skripten zu unerwünschtem Output führen.\n\n### Weitere Umleitungs-Tricks  \n- **Anhängen statt überschreiben:** `>>` (z.B. `ls -la >> inventar.txt`)  \n- **Beide Ströme zusammenführen:** `2>&1` (z.B. `ls -la > inventar.txt 2>&1` – alles in eine Datei)  \n- **stdin umleiten:** `<` (z.B. `sort < eingabe.txt`)  \n- **Hier-Dokumente:** `<< EOF` für mehrzeilige Eingaben  \n- **Prozess-Substitution:** `<(command)` und `>(command)` – erlaubt, Ausgaben als Dateien zu behandeln.\n\n### Praktische Anwendungsfälle  \n1. **Logging:** `./server > server.log 2> error.log` – trennt normale Meldungen von Fehlern.  \n2. **Stille Skripte:** `command > /dev/null 2>&1` – komplett stumm, nützlich für Cron-Jobs.  \n3. **Pipelines mit Fehlerfilter:** `find / -name \"*.conf\" 2>/dev/null | grep \"system\"` – ignoriert Fehler und filtert nur die Treffer.  \n4. **Interaktive Eingaben:** `read -p \"Name: \" name` nutzt stdin, aber du kannst auch `echo \"Hans\" | read name` nutzen.\n\n### Fehlerbehandlung in Skripten  \nMit `$?` prüfst du den Exit-Code des letzten Befehls. Oft willst du stderr nicht verwerfen, sondern in eine Logdatei schreiben:  \n```bash\nif ! command 2>>error.log; then\n    echo \"Fehler aufgetreten\" >&2\n    exit 1\nfi\n```\nHier wird `>&2` genutzt, um selbst auf stderr zu schreiben.\n\n\n**4. Visualisierung/Merkhilfe:**  \n\n```\n        ┌─────────────┐\n        │   Prozess   │\n        │ (z.B. ls)   │\n        └─────────────┘\n              │\n   ┌──────────┼──────────┐\n   │          │          │\n stdin(0)   stdout(1)  stderr(2)\n   │          │          │\n   ▼          ▼          ▼\n Tastatur  Terminal   Terminal\n   │          │          │\n   │          │          │\n   │          ▼          ▼\n   │      > inventar.txt  2> /dev/null\n   │          │          │\n   │          ▼          ▼\n   │      Datei         Mülleimer\n   │      (gespeichert) (verworfen)\n```\n\n**Merkhilfe:**  \n- **0** = Eingabe (wie ein Mikrofon – du sprichst rein)  \n- **1** = Ausgabe (wie ein Lautsprecher – du hörst das Ergebnis)  \n- **2** = Fehler (wie ein Alarm – du hörst nur, wenn was schiefgeht)  \n\nDenk an die Reihenfolge: `> datei` ist immer stdout, `2>` ist stderr. Und `/dev/null` ist der Ort, wo Daten sterben – perfekt für alles, was du nicht sehen willst.\n\n\n**Tux’ Schlusswort:**  \nJetzt hast du die Werkzeuge – nutze sie! Wer Umleitungen beherrscht, kann aus einem chaotischen Terminal ein präzises Werkzeug formen. Übung macht den Meister, also ran an die Tastatur! Und denk dran: Fehler sind keine Schwäche, sondern nur Daten – leite sie richtig um, dann sind sie harmlos.",
        "topicId": 13,
        "difficulty": "mittel"
    },
    {
        "id": 113,
        "category": "5. I/O und File-Deskriptoren",
        "question": "Wie beendest du einen abgestürzten Prozess sicher?",
        "answer": "Mit dem Befehl 'kill <PID>'. Wenn er nicht reagiert, erzwingt man es mit 'kill -9 <PID>'.",
        "topicId": 13,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nMit `kill <PID>` (sanft) oder `kill -9 <PID>` (erzwungen).\n---\n> **Tux-Ansage:** Wenn ein Programm zickt, machst du den sanften `kill`. Wenn es weiter meckert, nimmst du den Vorschlaghammer: `-9`. Keine Diskussion!\n---\n### 3. Deep Dive\nDer Befehl `kill` sendet Signale an Prozesse. Ohne weitere Parameter sendet `kill` das Signal SIGTERM (15). Das ist eine freundliche Aufforderung an das Programm, sich zu beenden. Das Programm kann dieses Signal abfangen, Daten speichern, offene Dateien schließen und sich ordentlich beenden (Graceful Shutdown).\nReagiert das Programm jedoch nicht mehr, weil es abgestürzt ist (Deadlock) oder das Signal ignoriert, greift man zu `kill -9` (SIGKILL). SIGKILL wird nicht an das Programm geschickt, sondern direkt vom Kernel verarbeitet. Der Kernel reißt den Prozess sofort nieder. Das ist zwar effektiv, kann aber zu Datenverlust oder beschädigten Konfigurationen führen, wenn das Programm mitten in einem Schreibvorgang steckte."
    },
    {
        "id": 213,
        "category": "5. I/O und File-Deskriptoren",
        "question": "Erkläre den Unterschied zwischen SIGTERM (15) und SIGKILL (9). Wann sollte man was verwenden?",
        "answer": "SIGTERM (15) bittet den Prozess sich normal zu beenden (Clean-up, Sockets schließen). SIGKILL (9) wird vom Kernel hart ausgeführt – der Prozess hat keine Chance zu reagieren. SIGKILL kann zu Datenverlust oder kaputten Locks führen und sollte nur als letztes Mittel genutzt werden.",
        "topicId": 13,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nSIGTERM (15) erlaubt Clean-up (Graceful Shutdown), SIGKILL (9) tötet sofort durch den Kernel.\n---\n> **Tux-Ansage:** SIGTERM ist die Kündigungsfrist, SIGKILL der Tritt durch die geschlossene Tür. Überleg dir gut, wie gewalttätig du sein musst!\n---\n### 3. Deep Dive\nSignale sind eine grundlegende Form der Interprozesskommunikation unter Linux. SIGTERM (Signal 15) ist der Standard für das Beenden von Programmen. Es gibt dem Prozess die Möglichkeit, einen Signal-Handler auszuführen, wodurch noch schnelle Aufräumarbeiten (Speichern, Sockets freigeben, Kindprozesse beenden) möglich sind. Manche Programme (wie Daemons) fangen SIGTERM ab und brauchen eventuell Zeit zum Beenden.\nSIGKILL (Signal 9) hingegen ist ein unumstößlicher Befehl an den Kernel, den Prozess hart zu entfernen. Der Prozess erhält keine Möglichkeit zur Reaktion. Das ist riskant: Offene Datenbanktransaktionen werden abgerissen, temporäre Dateien oder PID-Lock-Files bleiben liegen. Daher gilt als Best Practice in der Linux-Administration: Zuerst SIGTERM senden, ein paar Sekunden warten, und nur wenn der Prozess bleibt, SIGKILL senden."
    },
    {
        "id": 14,
        "category": "5. I/O und File-Deskriptoren",
        "question": "Erkläre den Unterschied zwischen den beiden folgenden Umleitungen:\n1. `backup.sh > backup.log 2>&1`\n2. `backup.sh 2>&1 > backup.log`",
        "answer": "1. **`> backup.log 2>&1` (KORREKT):**\n   `stdout` (1) wird zuerst in die Datei umgeleitet. Danach wird `stderr` (2) dorthin umgeleitet, wohin `stdout` aktuell zeigt (also ebenfalls in `backup.log`). Beide Ausgaben landen in der Datei.\n2. **`2>&1 > backup.log` (FALSCH):**\n   `stderr` wird dorthin geleitet, wo `stdout` aktuell zeigt (Terminal). Erst danach wird `stdout` in die Datei umgeleitet. Fehlermeldungen landen weiterhin auf dem Bildschirm.",
        "moreInfo": "### 1. tl;dr\nDie Reihenfolge der Umleitungen entscheidet, wohin `stderr` zeigt. Bei `> backup.log 2>&1` landen beide Streams in der Datei, bei `2>&1 > backup.log` bleibt `stderr` auf dem Terminal – ein klassischer Fehler, der Fehlermeldungen unsichtbar macht.\n---\n> **Tux-Ansage:** **„Hör zu, Rekrut!** Du willst Fehler loggen? Dann denk wie ein Soldat: Erst das Ziel festlegen, dann die Verstärkung hinschicken. `2>&1` ist kein Zauberwort – es ist eine Kopie des aktuellen Ziels von `stdout`. Wer die Reihenfolge verwechselt, verliert Fehlermeldungen im Nebel des Terminals. Also: **Erst umleiten, dann kopieren!** Und jetzt mach dich nützlich und üb' das, bis es sitzt!“\n---\n### 3. Deep Dive\n#### Warum die Reihenfolge entscheidend ist  \nDie Shell verarbeitet Umleitungen **von links nach rechts**, und jede Umleitung verändert den Zustand des Dateideskriptors (FD) für den nachfolgenden Befehl. `2>&1` bedeutet: „Öffne FD 2 (stderr) und dupliziere das aktuelle Ziel von FD 1 (stdout)“. Der Zeitpunkt der Ausführung ist der Knackpunkt.\n\n##### Fall 1: `backup.sh > backup.log 2>&1`  \n1. `> backup.log` – Öffnet `backup.log` und setzt **FD 1** (stdout) auf diese Datei.  \n2. `2>&1` – Dupliziert das aktuelle Ziel von FD 1 (jetzt die Datei) auf **FD 2** (stderr).  \n→ Beide Streams schreiben in dieselbe Datei.  \n\n##### Fall 2: `backup.sh 2>&1 > backup.log`  \n1. `2>&1` – Dupliziert das aktuelle Ziel von FD 1 (noch das Terminal) auf **FD 2**.  \n2. `> backup.log` – Öffnet `backup.log` und setzt **FD 1** auf die Datei.  \n→ `stderr` zeigt weiterhin auf das Terminal, `stdout` auf die Datei. Fehlermeldungen erscheinen auf dem Bildschirm, nicht im Log.  \n\n#### Warum ist das gefährlich?  \nIn Skripten oder Cron-Jobs, wo du Fehler später analysieren willst, verlierst du kritische Meldungen. Beispiel:  \n```bash\n# Falsch – Fehler gehen verloren\nbackup.sh 2>&1 > backup.log  \n# Richtig – alles im Log\nbackup.sh > backup.log 2>&1  \n```\n\n#### Praktische Anwendungsfälle  \n- **Logging mit Zeitstempel:**  \n  ```bash\n  { date; backup.sh; } > backup.log 2>&1  \n  ```\n- **Trennen von stdout und stderr:**  \n  ```bash\n  backup.sh > stdout.log 2> stderr.log  \n  ```\n- **Umleitung in beide Richtungen (Kopie):**  \n  ```bash\n  backup.sh 2>&1 | tee backup.log   # zeigt auf Terminal UND schreibt in Datei\n  ```\n- **Kurzform `&>` (Bash-spezifisch):**  \n  ```bash\n  backup.sh &> backup.log   # entspricht `> backup.log 2>&1`\n  ```\n\n#### Verwandte Konzepte  \n- **Dateideskriptoren:** 0 = stdin, 1 = stdout, 2 = stderr.  \n- **`exec`-Umleitung:**  \n  ```bash\n  exec 3>&1  # Neuen FD 3 als Kopie von stdout anlegen\n  ```\n- **Reihenfolge bei mehreren Umleitungen:**  \n  ```bash\n  cmd > file 2>&1 1> other   # stderr geht in file, stdout in other (Achtung!)\n  ```\n\n\n### 4. **Visualisierung/Merkhilfe:**  \n\n```\nTerminal (Standard)\n   ├── FD 1 (stdout) ──> Bildschirm\n   └── FD 2 (stderr) ──> Bildschirm\n\nKORREKT:  backup.sh > backup.log 2>&1\n   Schritt 1: > backup.log\n   FD 1 ──> backup.log\n   Schritt 2: 2>&1\n   FD 2 ──> (Kopie von FD 1) ──> backup.log\n\n   Ergebnis: Beide Pfeile zeigen in die Datei.\n\nFALSCH:    backup.sh 2>&1 > backup.log\n   Schritt 1: 2>&1\n   FD 2 ──> (Kopie von FD 1, noch Terminal)\n   Schritt 2: > backup.log\n   FD 1 ──> backup.log\n\n   Ergebnis: FD 2 bleibt auf Terminal, FD 1 geht in Datei.\n```\n\n**Merkhilfe:**  \n> „Erst das Ziel, dann die Kopie – sonst läuft der Fehler in die Irre.“  \nOder als Eselsbrücke: **„Zuerst die Tür öffnen, dann den Raum betreten.“**  \n\n\n**Bonus-Tipp für Fortgeschrittene:**  \nTeste die Unterschiede direkt in der Konsole:  \n```bash\n# Falsch – Fehler erscheint auf dem Bildschirm\nls /nonexistent 2>&1 > /dev/null  \n\n# Richtig – Fehler wird unterdrückt\nls /nonexistent > /dev/null 2>&1  \n```  \nUnd wenn du ganz sicher gehen willst, nutze `&>` oder `2>&1` **immer nach** der stdout-Umleitung. Dann bist du auf der sicheren Seite, Rekrut!",
        "topicId": 14,
        "difficulty": "mittel"
    },
    {
        "id": 114,
        "category": "5. I/O und File-Deskriptoren",
        "question": "Was macht 'ps aux | grep firefox'?",
        "answer": "Es listet alle laufenden Prozesse auf ('ps aux') und filtert diese Liste nach dem Wort 'firefox', um dessen PID zu finden.",
        "topicId": 14,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nListet alle Prozesse auf und sucht gezielt nach \"firefox\".\n---\n> **Tux-Ansage:** Wenn du die PID nicht kennst, musst du filtern. Eine Pipe ist der Kleber, der das Linux-Universum zusammenhält!\n---\n### 3. Deep Dive\n`ps aux` ist der Standardbefehl, um alle aktuell auf dem System laufenden Prozesse anzuzeigen (a = alle Benutzer, u = detailliertes Format, x = auch Prozesse ohne Terminal). Da die Ausgabe oft hunderte oder tausende Zeilen lang ist, nutzt man das Pipe-Zeichen `|`, um die Ausgabe (stdout) von `ps` als Eingabe (stdin) an den Befehl `grep` weiterzuleiten.\n`grep firefox` durchsucht diese lange Liste und gibt nur die Zeilen aus, in denen das Wort \"firefox\" vorkommt. Das ist der klassische Weg, um schnell die PID eines laufenden Programms zu ermitteln. (Ein modernerer Shortcut dafür ist übrigens `pgrep firefox` oder `pidof firefox`)."
    },
    {
        "id": 214,
        "category": "5. I/O und File-Deskriptoren",
        "question": "Wie findest du heraus, welcher Prozess den TCP-Port 80 blockiert?",
        "answer": "Mit 'netstat -tulpen | grep :80', 'ss -tulpen | grep :80' oder 'lsof -i :80'. Das zeigt die PID des lauschenden Prozesses an.",
        "topicId": 14,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nTools wie `netstat -tulpen | grep :80` oder `ss -tulpen | grep :80` zeigen die lauschenden PIDs.\n---\n> **Tux-Ansage:** Ein Webserver startet nicht, weil Port 80 belegt ist? Zeit, in den Socket-Eingeweiden deines Systems zu wühlen!\n---\n### 3. Deep Dive\nDie Kombination aus Netzwerkdiagnose-Tools und `grep` ist essenziell für das Troubleshooting von Serverdiensten. Der Befehl `ss` (Socket Statistics) ist der moderne Ersatz für das veraltete `netstat`. Die Parameter `-tulpen` (eine bekannte Eselsbrücke für Admins) stehen für: **t**cp, **u**dp, **l**istening, **p**rocesses, **e**xtended infos, **n**umeric (keine DNS-Auflösung von IPs/Ports, was extrem schnell ist).\nFührt man dies mit root-Rechten aus, listet der Kernel alle offenen Ports zusammen mit der PID und dem Namen des zugehörigen Programms auf. Alternativ nutzt man `lsof -i :80` (List Open Files), was ebenfalls sehr elegant anzeigt, welcher Prozess den TCP-Port blockiert (unter Linux ist schließlich jeder Socket auch eine Datei)."
    },
    {
        "id": 15,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Schreibe einen find-Befehl, der in /var/log nach allen regulären Dateien sucht, die auf „.log“ enden, root gehören und in den letzten 7 Tagen geändert wurden.",
        "answer": "`find /var/log -type f -name \"*.log\" -user root -mtime -7`",
        "moreInfo": "### 1. tl;dr\nDer Befehl `find /var/log -type f -name \"*.log\" -user root -mtime -7` findet alle regulären Dateien unter `/var/log`, die mit `.log` enden, dem User `root` gehören und in den letzten 7 Tagen modifiziert wurden. Einfach, präzise, aber du musst die Optionen verstehen, nicht nur auswendig lernen!\n---\n> **Tux-Ansage:** Hör zu, Rekrut! Das ist kein Zaubertrick, sondern Handwerk. Du willst Logs aufspüren? Dann lern, wie `find` denkt. Wer nur Befehle kopiert, ist wie ein Maulwurf mit Sonnenbrille – blind im Tunnel. Ich will, dass du die Optionen im Schlaf beherrschst, sonst wirst du in der echten Admin-Welt zerlegt. Jetzt zeig mir, dass du mehr drauf hast als `ls` und `grep`!\n---\n### 3. Deep Dive\nDer Befehl ist ein Musterbeispiel für die Kombination von **Prädikaten** in `find`. Lass uns jedes Stück auseinandernehmen:\n\n- `find /var/log` – Startpunkt. Hier sucht `find` rekursiv durch alle Unterverzeichnisse.  \n- `-type f` – Nur **reguläre Dateien** (keine Verzeichnisse, Symlinks, Geräte).  \n- `-name \"*.log\"` – Dateiname muss mit `.log` enden. Die Anführungszeichen verhindern, dass die Shell das `*` expandiert.  \n- `-user root` – Besitzer ist `root`. Du kannst auch `-uid 0` nutzen, aber `-user` ist lesbarer.  \n- `-mtime -7` – **Modifikationszeit** in den letzten 7 Tagen. Das Minus bedeutet „weniger als 7 Tage“ (also 0–6 Tage alt). `+7` wäre älter als 7 Tage, `7` exakt 7 Tage.\n\n**Warum ist das nützlich?**  \n- **Log-Rotation prüfen:** Finde kürzlich geänderte Logs, die vielleicht noch nicht rotiert wurden.  \n- **Sicherheitsaudit:** Suche nach Dateien, die ein Angreifer als `root` angelegt haben könnte.  \n- **Backup-Planung:** Identifiziere aktive Logs, die du in ein zentrales Monitoring einspeisen willst.\n\n**Erweiterte Varianten & Kombinationen:**\n\n1. **Mit Ausgabe und Aktionen:**  \n   ```bash\n   find /var/log -type f -name \"*.log\" -user root -mtime -7 -exec ls -lh {} \\;\n   ```  \n   Zeigt Größe und Details direkt an.\n\n2. **Mit `-printf` für eigene Formatierung:**  \n   ```bash\n   find /var/log -type f -name \"*.log\" -user root -mtime -7 -printf \"%p %s bytes %TY-%Tm-%Td\\n\"\n   ```\n\n3. **Kombination mit `grep` (Inhalt durchsuchen):**  \n   ```bash\n   find /var/log -type f -name \"*.log\" -user root -mtime -7 -exec grep -l \"ERROR\" {} \\;\n   ```\n\n4. **Zeitfenster präziser steuern:**  \n   - `-mmin -60` – letzte 60 Minuten  \n   - `-newermt \"2025-03-01\"` – nach einem bestimmten Datum  \n   - `-daystart` – bezieht sich auf Tagesanfang statt 24h-Rückwärts.\n\n5. **Negation und Logik:**  \n   ```bash\n   # Alle .log-Dateien, die NICHT root gehören, aber in den letzten 7 Tagen geändert wurden\n   find /var/log -type f -name \"*.log\" ! -user root -mtime -7\n   ```\n\n6. **Mit `-delete` vorsichtig:**  \n   ```bash\n   find /var/log -type f -name \"*.log\" -user root -mtime -7 -delete\n   ```  \n   **Achtung:** Nur wenn du wirklich alte Logs entfernen willst – und selbst dann erst mit `-print` testen!\n\n**Praktischer Tipp:**  \nWenn du viele Logs hast, kann `find` langsam sein. Nutze `-xdev` (bleib auf einem Dateisystem) oder `-mount`, um Mountpoints nicht zu durchlaufen. Zusätzlich hilft `-maxdepth 2`, falls du nur die oberen Ebenen brauchst.\n\n\n**Visualisierung/Merkhilfe:**  \n\n```\nfind [Startpunkt] [Prädikate] [Aktionen]\n\nPrädikate:\n  -type f          → nur Dateien\n  -name \"*.log\"    → Namensmuster\n  -user root       → Besitzer\n  -mtime -7        → Änderung < 7 Tage\n\nZeitstrahl für -mtime:\n  -7  -6  -5  -4  -3  -2  -1  heute\n  <─────────────────────┘ (alles links davon)\n\nBaumstruktur von /var/log:\n/var/log\n├── syslog\n├── auth.log\n├── kern.log\n├── nginx/\n│   ├── access.log\n│   └── error.log\n└── mysql/\n    └── error.log\n\nDein Befehl filtert genau die Dateien, die im grünen Bereich liegen.\n```\n\n**Merkhilfe:**  \n„**F**inde **T**olle **N**amen, **U**nter **R**oot, **M**it **T**empo (7 Tage).“  \nOder: `-type f` → **F**ile, `-name` → **N**ame, `-user` → **U**ser, `-mtime` → **M**odified.\n\n\n**Schlussgedanke:**  \n`find` ist wie ein Schweizer Taschenmesser – du kannst es für fast alles nutzen. Aber nur wer die Optionen kennt, kann auch schneiden. Übe mit `-print` und `-printf`, bevor du löschst oder veränderst. Und denk dran: **Im Zweifel erst trockenlaufen lassen!** Jetzt ab in die Kommandozeile, Rekrut!",
        "topicId": 15,
        "difficulty": "mittel"
    },
    {
        "id": 115,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Was ist ein Bash-Skript?",
        "answer": "Eine Textdatei mit einer Reihe von Linux-Befehlen, die nacheinander ausgeführt werden, um Aufgaben zu automatisieren.",
        "topicId": 15,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nEin Skript zur Automatisierung von Befehlen auf der Kommandozeile.\n---\n> **Tux-Ansage:** Wer drei Befehle zweimal am Tag tippt und kein Skript dafür schreibt, hat das Prinzip Linux nicht verstanden!\n---\n### 3. Deep Dive\nEin Bash-Skript ist im Grunde eine ausführbare Textdatei (oft mit einem Shebang `#!/bin/bash` in der ersten Zeile), die eine Abfolge von Linux-Kommandos enthält, genau so, wie man sie manuell in die Konsole tippen würde. Es erweitert die einfache Kommandoabfolge jedoch um typische Programmierkonstrukte wie Variablen, Schleifen (`for`, `while`), Bedingungen (`if/else`) und Funktionen. Systemadministratoren nutzen Bash-Skripte für alles: vom simplen Backup-Job über das Erstellen von Benutzern bis hin zum Deployment von ganzen Serverlandschaften, da die Shell die native und direkteste Schnittstelle zum Betriebssystem ist."
    },
    {
        "id": 215,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Was ist der Unterschied zwischen '$@' und '$*' in einem Shell-Skript?",
        "answer": "Beide referenzieren alle übergebenen Argumente. Wenn in Quotes gesetzt ('$@' vs '$*'): '$@' bewahrt die individuellen Strings der Argumente (ideal für Schleifen). '$*' fügt alle Argumente zu einem einzigen String zusammen (getrennt durch das erste Zeichen der IFS-Variable).",
        "topicId": 15,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`\"$@\"` behält Argumente einzeln, `\"$*\"` verbindet sie zu einem String.\n---\n> **Tux-Ansage:** Ein falsch gequotetes Array in Bash ist wie eine tickende Bombe in deinem Skript. Lern den Unterschied, oder deine Argumente zerfallen zu Staub!\n---\n### 3. Deep Dive\nWenn einem Bash-Skript Parameter übergeben werden (z.B. `./script.sh arg1 \"arg 2\"`), greift man mit den Spezialvariablen `$@` und `$*` darauf zu. Der gravierende Unterschied zeigt sich erst, wenn man sie in doppelte Anführungszeichen (Quotes) setzt, was absolute Best Practice ist.\n`\"$@\"` expandiert zu getrennten Worten: `\"arg1\" \"arg 2\"`. Eine Schleife wie `for i in \"$@\"` läuft genau zweimal durch, und das Leerzeichen in \"arg 2\" bleibt geschützt.\n`\"$*\"` expandiert zu einem einzigen langen String, bei dem die Argumente mit dem ersten Zeichen der `IFS`-Umgebungsvariable (meist ein Leerzeichen) verknüpft werden: `\"arg1 arg 2\"`. Die gleiche `for`-Schleife würde hier nur ein einziges Mal durchlaufen. In 99% der Fälle (besonders beim Weiterreichen von Argumenten an andere Befehle) ist `\"$@\"` die korrekte und sicherere Wahl."
    },
    {
        "id": 16,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Wie filterst du eine Datei mit grep so, dass alle Leerzeilen und alle Kommentarzeilen (beginnend mit #) ignoriert werden?\nNutze reguläre Ausdrücke.",
        "answer": "`grep -E -v \"^(#|$)\" dateiname`\n\n**Erklärung:**\n* `-E`: Aktiviert erweiterte reguläre Ausdrücke (für das Oder-Symbol `|`).\n* `-v`: Invertiert die Suche (zeigt Zeilen an, die nicht passen).\n* `^(#|$)`: Trifft auf Zeilen zu, die mit `#` beginnen oder direkt leer sind (Zeilenende `$ direkt nach Zeilenanfang `^`).",
        "moreInfo": "### 1. tl;dr\n\n---\n> **Tux-Ansage:** Hör zu, Rekrut! Wer Konfigurationsdateien liest und dabei Kommentare und leere Zeilen mit durchwühlt, hat die Kontrolle verloren. Mit diesem Befehl trennst du Spreu von Weizen – und zwar sauber, schnell und ohne Ausreden. Jetzt zeig mir, dass du mehr draus machst als nur `cat`!\n---\n### 3. Deep Dive\nDer Befehl `grep -E -v \"^(#|$)\" dateiname` ist ein Klassiker für das Bereinigen von Konfigurationsdateien, Skripten oder Logs. Zerlegen wir ihn in seine Teile:\n\n- **`-E`** (Extended Regex): Aktiviert erweiterte reguläre Ausdrücke. Damit kannst du Gruppierungen `()` und Alternativen `|` direkt nutzen, ohne sie mit Backslashes zu maskieren.  \n- **`-v`** (invert): Kehrt die Logik um – grep zeigt alle Zeilen, die **nicht** auf das Muster passen.  \n- **`^(#|$)`**:  \n  - `^` verankert den Ausdruck am Zeilenanfang.  \n  - `(#|$)` ist eine Gruppe mit Oder: entweder ein `#` oder das Zeilenende `$.  \n  - Zusammen: Zeilen, die mit `#` beginnen oder direkt leer sind (also nichts zwischen Anfang und Ende haben).\n\n**Warum funktioniert das?**  \n- Eine Zeile, die mit `#` beginnt, matcht `^#`.  \n- Eine leere Zeile hat direkt nach dem Anfang das Ende: `^$.  \n- Alle anderen Zeilen (mit Inhalt) passen nicht und werden dank `-v` angezeigt.\n\n**Praktische Anwendungsfälle:**\n- **Konfigurationen anzeigen:** `grep -E -v \"^(#|$)\" /etc/ssh/sshd_config` zeigt nur aktive Einstellungen.  \n- **Skripte bereinigen:** Kommentare und Leerzeilen aus einem Bash-Skript entfernen, um nur die Befehle zu sehen.  \n- **Logs filtern:** Wenn Logs mit `#` kommentierte Zeilen enthalten (z.B. bei manchen Formaten), kannst du sie ausblenden.\n\n**Erweiterungen für die Praxis:**\n- **Whitespace-tolerant:** Viele Dateien haben Leerzeilen mit Leerzeichen/Tabs oder eingerückte Kommentare. Dann passe das Muster an:  \n  ```bash\n  grep -E -v \"^\\s*(#|$)\" datei\n  ```\n  `\\s*` matcht beliebig viele Leerzeichen (mit `-E` oder `-P`).  \n- **Nur Kommentare entfernen, Leerzeilen behalten:** `grep -v \"^#\"`  \n- **Nur Leerzeilen entfernen:** `grep -v \"^$\"`  \n- **Zeilennummern mit anzeigen:** `grep -n -E -v \"^(#|$)\" datei`  \n- **Anzahl der gefilterten Zeilen:** `grep -c -E -v \"^(#|$)\" datei`  \n- **Alternativen ohne `-E`:** `grep -v -e \"^#\" -e \"^$\" datei` (mehrere Muster) oder `grep -v '^\\(#\\|$\\)'` (Grundregex mit Maskierung).\n\n**Achtung:** Manche Dateien enthalten BOM (Byte Order Mark) oder andere unsichtbare Zeichen – dann hilft `grep -P \"^\\xEF\\xBB\\xBF\"` oder `sed`. Aber für den Standardfall reicht der Befehl.\n\n**Kombination mit anderen Tools:**  \n- `grep -E -v \"^(#|$)\" config | awk '{print }'` – erste Spalte extrahieren.  \n- `grep -E -v \"^(#|$)\" config | sort -u` – sortierte, eindeutige Werte.\n\n4. **Visualisierung/Merkhilfe:**  \n```\nDatei: config.txt\nZeile 1: # Kommentar\nZeile 2: Port 22\nZeile 3:\nZeile 4:   # eingerückter Kommentar\nZeile 5: Hostname server\n\ngrep -E -v \"^(#|$)\" config.txt\n→ Zeile 2: Port 22\n→ Zeile 5: Hostname server\n(Zeile 4 wird NICHT entfernt, weil sie mit Leerzeichen beginnt – dafür brauchst du \\s*)\n```\n\n**Merkhilfe für das Muster:**  \n```\n^   → Anfang der Zeile  \n(   → Gruppe öffnen  \n#   → Raute (Kommentar)  \n|   → oder  \n$   → Ende der Zeile (leer)  \n)   → Gruppe schließen  \n-v  → zeige alles, was NICHT diesem Muster entspricht\n```\n\n**ASCII-Diagramm des Filterprozesses:**  \n```\nEingabe:  # Komm   Port 22   (leer)   Hostname   # Ende\n          ↓        ↓         ↓        ↓          ↓\nMuster:   ^#       nein      ^$       nein       ^#\n-v:       nein     ja        nein     ja         nein\nAusgabe:           Port 22             Hostname\n```\n\nDamit hast du die mächtigste Art, Konfigurationsdateien zu lesen – ohne Ballast. Übung macht den Meister, also ran an die Tastatur!",
        "topicId": 16,
        "difficulty": "mittel"
    },
    {
        "id": 116,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Was macht der Befehl 'grep'?",
        "answer": "Er durchsucht Text oder Dateien nach einem bestimmten Wort oder Muster und gibt die passenden Zeilen aus.",
        "topicId": 16,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nDurchsucht Text nach Mustern und gibt die passenden Zeilen aus.\n---\n> **Tux-Ansage:** `grep` ist dein bestes Werkzeug in einem Logfile von 5 Gigabyte. Wer manuell scrollt, hat schon verloren.\n---\n### 3. Deep Dive\n`grep` (Global Regular Expression Print) ist eines der mächtigsten Textverarbeitungstools in Unix-Systemen. Es durchsucht Dateien oder Standardeingaben Zeile für Zeile nach einer Zeichenkette oder einem Muster (Regular Expression) und gibt (standardmäßig) jede Zeile aus, die einen Treffer enthält. Von der simplen Suche (`grep Fehler log.txt`) bis hin zu komplexen Pattern-Matches mit Regex wird es täglich zur Log-Analyse, Code-Suche oder in Pipelines zur Datenfilterung eingesetzt. Mit Flags wie `-i` (Ignoriert Groß-/Kleinschreibung) oder `-r` (rekursive Suche in Ordnern) wird es zu einem unersetzlichen Schweizer Taschenmesser auf der Kommandozeile."
    },
    {
        "id": 216,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Schreibe einen grep-Befehl, der alle Zeilen ausgibt, die NICHT mit einem Kommentar (#) oder einer Leerzeile beginnen.",
        "answer": "'grep -Ev \"^(#|$)\" datei'. '-E' für erweiterte Regex, '-v' invertiert den Match. '^(#|$)' matcht Zeilen, die mit # beginnen oder komplett leer sind.",
        "topicId": 16,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`grep -Ev \"^(#|$)\" datei` filtert Kommentare und Leerzeilen weg.\n---\n> **Tux-Ansage:** Eine 500-Zeilen Konfigurationsdatei und 490 davon sind sinnlose Kommentare? `grep -Ev` ist der Macheten-Hieb durch diesen Dschungel!\n---\n### 3. Deep Dive\nWenn man sich lange Konfigurationsdateien (wie z.B. von Apache, SSHD oder Samba) ansehen möchte, sind diese oft voll mit auskommentierten Beispielzeilen und Leerzeilen. Um nur die aktiven Einstellungen zu sehen, nutzt man `grep -Ev \"^(#|$)\"`. \nHierbei steht `-E` für Extended Regular Expressions (was die Syntax `()` und `|` ermöglicht). Das `-v` invertiert die Ausgabe (Invert Match) – es werden also alle Zeilen angezeigt, die **nicht** auf das Muster passen.\nDas Regex-Muster `^(#|$)` bedeutet: Der Anfang der Zeile `^`, gefolgt von entweder einer Raute `#` (Kommentar) ODER `|` direkt dem Ende der Zeile `$was eine Leerzeile darstellt). Das Resultat ist eine saubere, kompakte Ausgabe der tatsächlichen Konfiguration."
    },
    {
        "id": 17,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Warum ist ifconfig veraltet? Nenne die modernen ip-Befehle für:\n1. IP-Adressen anzeigen\n2. Interface eth0 aktivieren\n3. Routing-Tabelle anzeigen",
        "answer": "**Warum veraltet:**\n`ifconfig` nutzt veraltete Kernel-Schnittstellen (`ioctl`) und unterstützt moderne Netzwerk-Features nicht. Das Tool `ip` nutzt Netlink-Sockets und ist flexibler.\n\n**Moderne Befehle:**\n1. IP anzeigen: `ip address show` (oder kurz `ip a`)\n2. Link up: `sudo ip link set eth0 up`\n3. Routing anzeigen: `ip route show` (oder kurz `ip r`)",
        "moreInfo": "### 1. tl;dr\n`ifconfig` ist ein Fossil aus der Zeit vor Netlink – es spricht nur über veraltete `ioctl`-Schnittstellen und kennt keine modernen Features wie Policy-Routing oder VRF. Die `ip`-Befehle aus dem `iproute2`-Paket sind der aktuelle Standard und lösen alles mit einem einzigen Werkzeug.\n---\n> **Tux-Ansage:** Hör zu, Rekrut! `ifconfig` ist wie ein Faxgerät im Zeitalter von Glasfaser – es funktioniert noch, aber jeder würdige Admin benutzt es nur noch, um Neulingen Angst zu machen. Du willst ein Netzwerk meistern? Dann lern `ip`, und zwar so, dass du es nachts im Schlaf tippen kannst. Stillgestanden, Augen auf, jetzt wird gebohrt!\n---\n### 3. Deep Dive\n#### Warum ist `ifconfig` veraltet?  \n- **Kernel-Schnittstelle:** `ifconfig` verwendet `ioctl()`-Systemaufrufe, die nur einzelne, fest verdrahtete Funktionen bieten. Das Kernel-API dahinter wurde in den 1990ern eingefroren und unterstützt keine dynamischen, erweiterbaren Datenstrukturen.  \n- **Fehlende Features:** Moderne Netzwerkfunktionen wie VLANs, Bridges, Tunnels, Policy-Routing, Namespaces, oder die Verwaltung von mehreren IP-Adressen pro Interface sind mit `ifconfig` nicht oder nur umständlich abbildbar.  \n- **Netlink:** Das `ip`-Tool nutzt **Netlink-Sockets** – eine flexible, asynchrone Kommunikationsschnittstelle zwischen Kernel und Userspace. Netlink erlaubt es, komplexe Objekte (Adressen, Routen, Regeln, Links) atomar zu verändern und Ereignisse zu abonnieren.  \n- **Konsistenz:** `ip` ist Teil des `iproute2`-Pakets, das alle Netzwerkverwaltung vereinheitlicht. `ifconfig` stammt aus `net-tools`, das seit Jahren nicht mehr aktiv gepflegt wird.\n\n#### Die modernen `ip`-Befehle (mit Beispielen)\n\n**1. IP-Adressen anzeigen**  \n```bash\nip address show          # oder kurz: ip a\nip -4 addr show          # nur IPv4\nip -6 addr show          # nur IPv6\nip addr show dev eth0    # nur für ein bestimmtes Interface\n```\n*Praktisch:* Zeigt alle IPs, Broadcast-Adressen, Zustand (UP/DOWN), MTU, und mehr. Mit `-br` (brief) bekommst du eine kompakte Ausgabe:  \n```bash\nip -br addr\n# eth0              UP             192.168.1.10/24\n# lo                UNKNOWN        127.0.0.1/8\n```\n\n**2. Interface eth0 aktivieren**  \n```bash\nsudo ip link set eth0 up\n# Zum Deaktivieren: sudo ip link set eth0 down\n# Alternativ: sudo ip link set eth0 promisc on (für Promiscuous Mode)\n```\n*Hintergrund:* `ip link` verwaltet den Layer-2-Zustand. Du kannst auch MTU, MAC-Adresse oder TX-Queue-Länge setzen:  \n```bash\nsudo ip link set eth0 mtu 9000\nsudo ip link set eth0 address 00:11:22:33:44:55\n```\n\n**3. Routing-Tabelle anzeigen**  \n```bash\nip route show            # oder kurz: ip r\n# Oder für IPv6: ip -6 route show\n```\n*Beispielausgabe:*  \n```\ndefault via 192.168.1.1 dev eth0 proto static\n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.10\n```\n*Erweiterte Nutzung:*  \n```bash\nip route add 10.0.0.0/8 via 192.168.1.1 dev eth0\nip route del default\nip route get 8.8.8.8   # Zeigt, welche Route für eine Ziel-IP verwendet wird\n```\n\n#### Weitere wichtige `ip`-Befehle (für den Alltag)  \n- **Nachbarn (ARP/NDP):** `ip neigh show`  \n- **Policy-Routing:** `ip rule add from 192.168.1.0/24 lookup 100`  \n- **Netzwerk-Namespaces:** `ip netns add test`, `ip netns exec test ip addr`  \n- **Tunnel/VLAN:** `ip link add link eth0 name eth0.10 type vlan id 10`\n\n\n### 4. **Visualisierung/Merkhilfe**  \n\n**Gegenüberstellung: `ifconfig` vs. `ip`**  \n\n```\n| Aufgabe                | ifconfig (alt)          | ip (modern)                     |\n|------------------------|-------------------------|----------------------------------|\n| Alle Interfaces zeigen | ifconfig -a             | ip link show / ip addr show     |\n| IP setzen              | ifconfig eth0 192.168.1.2 | ip addr add 192.168.1.2/24 dev eth0 |\n| Interface aktivieren   | ifconfig eth0 up        | ip link set eth0 up             |\n| Route hinzufügen       | route add -net ...      | ip route add ...                |\n| ARP-Tabelle            | arp -a                  | ip neigh show                   |\n```\n\n**Strukturbaum der `ip`-Befehle:**  \n\n```\nip\n├── link    (Layer-2: Interfaces, Zustand, MTU)\n├── addr    (IP-Adressen auf Interfaces)\n├── route   (Routing-Tabellen)\n├── rule    (Policy-Routing-Regeln)\n├── neigh   (ARP/NDP-Cache)\n├── netns   (Netzwerk-Namespaces)\n├── tunnel  (IP-in-IP, GRE, etc.)\n└── vrf     (Virtual Routing and Forwarding)\n```\n\n**Merkhilfe:**  \n- **`ip a`** = Adressen, **`ip l`** = Link, **`ip r`** = Routen.  \n- Wenn du unsicher bist, tippe `ip help` – es zeigt alle Unterbefehle.  \n- `ifconfig` ist nur noch gut für Nostalgie-Trips oder um alte Skripte zu debuggen. Aber als Profi nutzt du `ip` – und zwar ohne nachzudenken.\n\n**Fazit:**  \n`ip` ist nicht nur ein Ersatz, sondern eine komplette Netzwerk-Swiss-Army-Knife. Lerne es, und du wirst nie wieder zu `ifconfig` zurückgreifen wollen – außer vielleicht, um einem Kollegen einen Streich zu spielen.",
        "topicId": 17,
        "difficulty": "mittel"
    },
    {
        "id": 117,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Wie leitet man die Ausgabe eines Befehls in eine Datei um?",
        "answer": "Mit dem Größer-als-Zeichen (z.B. 'echo Hallo > datei.txt').",
        "topicId": 17,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nMit dem Symbol `>` wird die Ausgabe (stdout) in eine Datei umgeleitet.\n---\n> **Tux-Ansage:** Vergiss niemals: `>` überschreibt, `>>` hängt an. Vertausche das, und du weinst um deine Logfiles!\n---\n### 3. Deep Dive\nUnter Linux gibt es drei Standard-Datenströme: Standardeingabe (stdin, 0), Standardausgabe (stdout, 1) und Standardfehler (stderr, 2). Normalerweise landet stdout auf dem Bildschirm. Mit der Shell-Redirection (Umleitung) `>` kann dieser Output jedoch in eine Datei geschrieben werden, z.B. `echo \"Neuer Eintrag\" > datei.txt`. Existiert die Datei nicht, wird sie erstellt. Existiert sie bereits, wird ihr gesamter bisheriger Inhalt gelöscht (überschrieben). Soll der Text stattdessen unten an die bestehende Datei angehängt werden, nutzt man den Operator `>>`."
    },
    {
        "id": 217,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Erkläre den Unterschied zwischen '>' und '>>' sowie '2>' und '&>'.",
        "answer": "'>' überschreibt eine Datei mit stdout. '>>' hängt an. '2>' leitet stderr (Fehler) um. '&>' leitet stdout UND stderr gleichzeitig in eine Datei um.",
        "topicId": 17,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`>` überschreibt, `>>` hängt an, `2>` leitet Fehler um, `&>` leitet beides um.\n---\n> **Tux-Ansage:** Wer Outputs und Errors nicht trennen kann, debuggt im Dunkeln. Beherrsche deine Deskriptoren, Rekrut!\n---\n### 3. Deep Dive\nDie Kontrolle über I/O-Deskriptoren ist essenziell für Hintergrundskripte. \n- `>` leitet den normalen Output (Dateideskriptor 1) in eine Datei um, wobei die Datei überschrieben wird.\n- `>>` macht dasselbe, aber im Append-Modus (anhängen).\n- `2>` leitet gezielt nur die Fehlermeldungen (Dateideskriptor 2, stderr) um. Das ist extrem nützlich, wenn man Fehler loggen, aber den normalen Output ignorieren will (oder umgekehrt: `2> /dev/null` versteckt alle Fehler).\n- `&>` ist eine Bash-spezifische Erweiterung (der alte POSIX-Standard wäre `> datei 2>&1`), die sowohl stdout als auch stderr gebündelt in dieselbe Datei leitet. Perfekt für Cronjobs, bei denen man alles – Erfolg und Fehler – in einem einzigen Log festhalten möchte."
    },
    {
        "id": 18,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Wie mountest du /dev/sdb1 schreibgeschützt nach /mnt/usb?\nWelche Option in /etc/fstab verhindert, dass das System beim Booten hängen bleibt, wenn die USB-Platte fehlt?",
        "answer": "**Mounten:**\n`sudo mount -o ro /dev/sdb1 /mnt/usb`\n*(Option `-o ro` steht für read-only)*\n\n**Fstab-Option:**\n`nofail`. Damit fährt das System auch dann ohne Fehler hoch, wenn das Laufwerk nicht verbunden ist.",
        "moreInfo": "### 1. tl;dr\nMounte `/dev/sdb1` schreibgeschützt mit `sudo mount -o ro /dev/sdb1 /mnt/usb`. In `/etc/fstab` verhindert die Option `nofail`, dass das System beim Booten hängen bleibt, wenn die Platte fehlt – kombiniert mit `x-systemd.device-timeout=1` für schnelles Überspringen.\n---\n> **Tux-Ansage:** Hör zu, Rekrut! `ro` ist nicht nur ein Kürzel – es ist dein Schutzschild gegen versehentliches Daten-Gemetzel. Und `nofail`? Das ist dein Rettungsanker, wenn die Hardware mal wieder streikt. Wer ohne diese Option bootet, darf sich später selbst die Schuld geben, wenn der Rechner wie ein trotziges Kind vor einem schwarzen Bildschirm hockt. Jetzt zeig mir, dass du mehr drauf hast als `man mount`!\n---\n### 3. Deep Dive\n### 1. Mounten mit `-o ro` – mehr als nur ein Flag\n\nDer Befehl `sudo mount -o ro /dev/sdb1 /mnt/usb` tut genau das: Er bindet das Dateisystem von `/dev/sdb1` in den Verzeichnisbaum unter `/mnt/usb` ein, **ohne Schreibrechte**. Das ist essenziell für:\n\n- **Datensicherung/Forensik:** Wenn du ein fremdes oder beschädigtes System untersuchst, willst du nicht versehentlich Änderungen schreiben.\n- **Prüfen von Dateisystemen:** `fsck` auf einem schreibgeschützten Mount verhindert weitere Korruption.\n- **Sicherheitsbewusstsein:** Ein `ro`-Mount schützt vor Malware, die sich selbst installieren möchte.\n\n**Wichtige Varianten:**\n- `mount -o ro,noexec /dev/sdb1 /mnt/usb` – zusätzlich das Ausführen von Programmen verbieten (z.B. bei Windows-Partitionen mit `.exe`-Dateien).\n- `mount -o ro,remount /dev/sdb1` – bereits gemountetes Laufwerk auf read-only umstellen, ohne zu unmounten.\n- `umount /mnt/usb` – nicht vergessen, vor dem Entfernen des USB-Sticks!\n\n**Fehlerquellen:**\n- Wenn das Zielverzeichnis `/mnt/usb` nicht existiert, erstellt `mount` es nicht automatisch. Vorher `sudo mkdir -p /mnt/usb` ausführen.\n- Bei Dateisystemen wie NTFS oder exFAT kann `ro` trotzdem Schreibzugriffe über den Kernel erlauben (z.B. für Journaling). Nutze dann `-o ro,uid=$(id -u),gid=$(id -g)` oder besser `-o ro,noload` (bei NTFS-3g).\n\n\n### 2. `/etc/fstab` und die Kunst, nicht zu hängen\n\nDie Datei `/etc/fstab` definiert, welche Dateisysteme beim Booten automatisch gemountet werden. Ein typischer Eintrag für eine USB-Platte:\n\n```\n/dev/sdb1  /mnt/usb  ext4  defaults,nofail,x-systemd.device-timeout=1  0  2\n```\n\n**Die Optionen im Detail:**\n\n| Option | Bedeutung |\n|--------|-----------|\n| `nofail` | **Kern der Antwort:** Wenn das Gerät nicht vorhanden ist, wird kein Fehler geworfen und der Bootvorgang läuft weiter. Ohne `nofail` würde das System nach einer Fehlermeldung (oder endlosem Warten) in den Notfallmodus wechseln. |\n| `x-systemd.device-timeout=1` | **Empfohlen:** Begrenzt die Wartezeit auf das Gerät auf 1 Sekunde. Ohne diese Option kann `systemd` standardmäßig 90 Sekunden auf ein fehlendes Laufwerk warten – das fühlt sich an wie eine Ewigkeit. |\n| `noauto` | Alternativ: Verhindert das automatische Mounten beim Booten. Du kannst dann manuell mit `sudo mount /mnt/usb` mounten. |\n| `users` / `user` | Erlaubt normalen Benutzern das Mounten/Unmounten (z.B. für Wechselmedien). |\n\n**Warum `nofail` allein nicht reicht:**  \nOhne `x-systemd.device-timeout` wartet `systemd` trotzdem auf das Gerät, wenn es in der `fstab` steht. `nofail` verhindert nur den **Fehler**, nicht das **Warten**. Die Kombination ist der Standard für USB-Sticks und externe Festplatten.\n\n**Beispiel für einen robusten fstab-Eintrag (UUID statt Gerätename):**\n\n```\nUUID=1234-ABCD  /mnt/usb  vfat  rw,nofail,x-systemd.device-timeout=1,uid=1000,gid=1000  0  0\n```\n\n- **UUID verwenden:** Gerätenamen wie `/dev/sdb1` können sich je nach Anschlussreihenfolge ändern. Mit `blkid` bekommst du die UUID: `sudo blkid /dev/sdb1`.\n\n\n### 3. Praktische Befehle und Fallstricke\n\n- **fstab testen ohne Neustart:**  \n  `sudo mount -a` – mountet alle Einträge, die noch nicht gemountet sind. Wenn ein Eintrag fehlschlägt, siehst du sofort die Fehlermeldung.\n- **Aktuell gemountete Dateisysteme anzeigen:**  \n  `findmnt /mnt/usb` oder `mount | grep sdb1`\n- **Schreibschutz nachträglich aufheben:**  \n  `sudo mount -o remount,rw /mnt/usb` – nur wenn du sicher bist, dass die Platte sauber ist.\n- **Problem: Dateisystem ist \"dirty\"** – Wenn die Platte nicht sauber ausgehängt wurde, verweigert `mount -o ro` manchmal. Dann hilft `sudo mount -o ro,noload /dev/sdb1 /mnt/usb` (bei ext4) oder `-o ro,force` (bei NTFS).\n\n\n### 4. Visualisierung / Merkhilfe\n\n```\nBootprozess mit fstab-Eintrag:\n\n[BIOS/UEFI] -> [GRUB] -> [systemd] -> fstab-Eintrag gefunden\n                                        |\n                                        +-- Gerät vorhanden? -- Ja --> Mounten (rw/ro)\n                                        |\n                                        +-- Nein + nofail? ---- Ja --> Überspringen, Boot läuft weiter\n                                        |\n                                        +-- Nein + kein nofail -> Warten (90s) -> Fehler -> Notfallmodus\n```\n\n**ASCII-Diagramm für Mount-Optionen:**\n\n```\nmount -o ro,noexec,nodev /dev/sdb1 /mnt/usb\n         |    |      |\n         |    |      +-- Keine Gerätedateien (z.B. /dev) auf diesem Dateisystem\n         |    +-- Keine Programmausführung\n         +-- Read-only (Schreibschutz)\n```\n\n**Merkhilfe für fstab-Spalten:**\n\n```\n[Device]  [Mountpoint]  [FSType]  [Optionen]  [dump]  [pass]\n  UUID=..   /mnt/usb      ext4     defaults,    0      2\n                                    nofail,\n                                    x-systemd.\n                                    device-timeout=1\n```\n\n- **dump** (0/1): Sicherungsprogramm `dump` – meist 0.\n- **pass** (0/1/2): Reihenfolge für `fsck` beim Booten. 0 = nicht prüfen, 1 = nur Root, 2 = andere.\n\n\n**Tux' letzter Drill:**  \n„Merke: `ro` schützt die Daten, `nofail` schützt deinen Blutdruck. Und wenn du das nächste Mal ein USB-Laufwerk mountest, dann tu es wie ein Profi – mit UUID, `nofail` und einem Timeout, das schneller ist als dein Kaffee kalt wird. Jetzt ab in die Praxis, Soldat!“",
        "topicId": 18,
        "difficulty": "mittel"
    },
    {
        "id": 118,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Was macht das Pipe-Zeichen '|' in der Befehlszeile?",
        "answer": "Es leitet die Ausgabe des linken Befehls als Eingabe an den rechten Befehl weiter (z.B. 'ls | grep txt').",
        "topicId": 18,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nDie Pipe `|` verbindet Kommandos, indem sie den Output an das nächste Kommando übergibt.\n---\n> **Tux-Ansage:** Das Pipe-Symbol ist das absolute Herzstück der Unix-Philosophie. Ein Tool macht eine Sache gut, und die Pipe verknüpft sie!\n---\n### 3. Deep Dive\nDas Pipe-Zeichen `|` ist der mächtigste Operator in der Linux-Shell. Es nimmt die Standardausgabe (stdout) des linksstehenden Kommandos und leitet sie direkt (im Arbeitsspeicher, ohne temporäre Dateien) als Standardeingabe (stdin) an das rechtsstehende Kommando weiter. So lassen sich kleine, spezialisierte Programme zu extrem komplexen Verarbeitungsketten kombinieren. Beispiel: `cat log.txt | grep ERROR | sort | uniq -c | sort -nr | head -n 10` liest eine Logdatei, sucht nach Fehlern, zählt die häufigsten und gibt die Top 10 aus. Das ist echte Linux-Magie."
    },
    {
        "id": 218,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Wie leitet man stderr und stdout durch eine Pipe, wenn man 'grep' auf Fehlermeldungen anwenden möchte?",
        "answer": "Mit '2>&1 |' oder in der Bash abgekürzt mit '|&'. Beispiel: 'ls -l /nichtexistent |& grep existiert'.",
        "topicId": 18,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nNutze `2>&1 |` oder `|&` in der Bash, um Fehlermeldungen durch eine Pipe zu leiten.\n---\n> **Tux-Ansage:** Normale Pipes ignorieren deine Fehler eiskalt. Wenn du Errors filtern willst, musst du sie in den Hauptstrom zwingen!\n---\n### 3. Deep Dive\nEine Standard-Pipe `|` verbindet ausnahmslos den Dateideskriptor 1 (stdout) des linken Befehls mit stdin des rechten. Fehlermeldungen (Dateideskriptor 2, stderr) werden von der Pipe ignoriert und landen stattdessen weiterhin unkontrolliert auf deinem Bildschirm. Will man stderr mit `grep` filtern, muss stderr zuerst nach stdout umgeleitet werden, bevor die Pipe greift. Das macht man traditionell mit `2>&1 |` (Leite Deskriptor 2 dorthin, wohin 1 zeigt, und dann pipe das Resultat). Da dies so oft gebraucht wird, hat die moderne Bash (ab Version 4) den Shortcut `|&` eingeführt, was semantisch exakt identisch ist. So lässt sich gezielt nach Fehlern in einem fehlerhaften Build-Skript greppen."
    },
    {
        "id": 19,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Über welche Datei wird sudo konfiguriert?\nWarum sollte man sie niemals direkt mit einem normalen Editor editieren und welches Tool nutzt man stattdessen?",
        "answer": "**Datei:** `/etc/sudoers`\n\n**Problem:** Syntaxfehler sperren unter Umständen alle Root-Zugriffe. Man kann den Fehler dann nicht mehr beheben.\n\n**Lösung:** `sudo visudo`. Dieses Tool sperrt die Datei gegen konkurrierende Zugriffe und prüft die Syntax vor dem Abspeichern.",
        "moreInfo": "### 1. tl;dr\n`sudo` wird über die Datei `/etc/sudoers` konfiguriert. Diese darfst du **niemals** direkt mit einem normalen Editor anfassen – nutze immer `sudo visudo`, das die Syntax prüft und die Datei sperrt.\n---\n> **Tux-Ansage:** Hör zu, Rekrut! Wer `sudoers` mit `vim` oder `nano` direkt aufmacht, ist selbst schuld, wenn er sich aus dem System aussperrt. Ein Syntaxfehler und *zack* – kein Root mehr, kein `sudo`, nur noch Heulen und Zähneklappern. `visudo` ist dein Rettungsanker, dein Schutzschild, dein bester Kumpel. Benutze es, oder du wirst die Lektion auf die harte Tour lernen – und dann bist du der Depp, der den Server neu aufsetzen darf. Jetzt aufgepasst, ich erkläre es dir einmal, und dann will ich es umgesetzt sehen!\n---\n### 3. Deep Dive\n### Warum `/etc/sudoers` so heikel ist\nDie Datei `/etc/sudoers` steuert, **wer** welche Befehle mit **welchen Rechten** ausführen darf. Sie wird beim Start von `sudo` jedes Mal gelesen und streng geparst. Ein einziger falscher Buchstabe – ein fehlendes Komma, eine falsche Zeile, ein unvollständiger Alias – führt dazu, dass `sudo` **komplett verweigert** wird. Und das Schlimmste: Wenn du die Datei kaputt machst, kannst du sie nicht mehr reparieren, denn du brauchst ja `sudo`, um sie zu ändern. Ein Teufelskreis.\n\n### Das Tool: `visudo`\n`visudo` ist ein spezieller Editor-Wrapper, der genau dieses Risiko entschärft:\n\n- **Syntaxprüfung:** Beim Speichern wird die Datei mit `visudo -c` validiert. Nur wenn die Syntax korrekt ist, wird sie übernommen. Bei Fehlern bekommst du eine Meldung und kannst korrigieren.\n- **Dateisperre:** `visudo` legt eine Lock-Datei an, damit nicht zwei Admins gleichzeitig Änderungen machen und sich gegenseitig überschreiben.\n- **Sichere Editor-Wahl:** Standardmäßig nutzt `visudo` den Editor, der in der Umgebungsvariable `EDITOR` gesetzt ist (z.B. `nano`, `vim`). Du kannst den Editor auch explizit wählen: `sudo EDITOR=nano visudo`.\n\n### Typische Konfigurationen in `/etc/sudoers`\nHier ein paar Beispiele, was du dort eintragen kannst:\n\n- **Einzelner Benutzer mit vollen Rechten:**  \n  `max ALL=(ALL:ALL) ALL`  \n  → Benutzer `max` darf alles auf allen Hosts ausführen.\n\n- **Gruppe mit spezifischen Befehlen:**  \n  `%admin ALL=(ALL) /usr/bin/systemctl restart apache2`  \n  → Die Gruppe `admin` darf nur den Apache-Dienst neu starten.\n\n- **Alias für Befehlsgruppen:**  \n  ```\n  Cmnd_Alias SERVICES = /usr/bin/systemctl restart apache2, /usr/bin/systemctl restart nginx\n  %webteam ALL=(ALL) SERVICES\n  ```\n\n- **Passwortlos für bestimmte Befehle:**  \n  `deploy ALL=(ALL) NOPASSWD: /usr/bin/rsync`  \n  → Kein Passwort für `rsync` – nützlich für Scripte.\n\n### Was tun, wenn die Datei doch kaputt ist?\nFalls du es geschafft hast, `sudoers` zu zerstören (weil du `visudo` ignoriert hast), gibt es noch Rettung:\n\n- **Im Single-User-Modus booten** (bei GRUB `e` drücken, `single` an die Kernel-Zeile anhängen).\n- **Von einer Live-CD booten** und die Datei von außen reparieren.\n- **`pkexec visudo`** – falls `polkit` verfügbar ist, kann das manchmal helfen.\n\nAber glaub mir: Das willst du nicht erleben. Nutze einfach `visudo`.\n\n### Wichtige Tipps für die Praxis\n- **Immer `visudo` verwenden**, auch für kleine Änderungen.\n- **Kommentare nutzen** (`#`), um die Datei übersichtlich zu halten.\n- **`sudo -l`** zeigt dir, welche Rechte der aktuelle Benutzer hat – gut zum Testen.\n- **`sudo visudo -c`** prüft die Syntax, ohne den Editor zu öffnen – perfekt für CI/CD oder Skripte.\n\n\n**Visualisierung/Merkhilfe:**\n\n```\n┌─────────────────────────────────────────────────────────────┐\n│                    /etc/sudoers                              │\n│  ┌───────────────────────────────────────────────────────┐  │\n│  │  # Wer?   Wo?        (Als wer?)  Befehle              │  │\n│  │  max     ALL=(ALL:ALL) ALL                            │  │\n│  │  %admin  ALL=(ALL) /usr/bin/systemctl restart apache2 │  │\n│  └───────────────────────────────────────────────────────┘  │\n│                                                             │\n│  Direkt editieren?  →   ❌ Syntaxfehler → sudo kaputt       │\n│  Mit visudo?        →   ✅ Prüfung + Sperre                 │\n└─────────────────────────────────────────────────────────────┘\n\n        ┌──────────────┐\n        │   visudo     │\n        │  (Editor)    │\n        └──────┬───────┘\n               │\n               ▼\n   ┌─────────────────────┐\n   │ Syntaxprüfung       │\n   │ (visudo -c)         │\n   └─────────┬───────────┘\n             │\n        ┌────┴────┐\n        │  OK?    │\n        └────┬────┘\n       ┌─────┴──────┐\n       ▼            ▼\n   Speichern    Fehler melden\n   (übernehmen) (erneut editieren)\n```\n\n**Merke:**  \n`visudo` ist der **einzige** sichere Weg, `sudoers` zu bearbeiten. Alles andere ist russisches Roulette mit deinem Root-Zugang. Also: **Immer `visudo`!** Und wenn du dich jemals dabei erwischst, `vim /etc/sudoers` einzutippen, dann schlag dich selbst mit einem USB-Kabel – oder besser: lass es einfach.",
        "topicId": 19,
        "difficulty": "mittel"
    },
    {
        "id": 119,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Was ist ein Alias in Linux?",
        "answer": "Ein Kürzel für einen längeren Befehl. Statt 'ls -la' kann man sich z.B. das Alias 'll' anlegen.",
        "topicId": 19,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nEin Alias ist eine benutzerdefinierte Abkürzung für einen Befehl.\n---\n> **Tux-Ansage:** Warum 20 Zeichen tippen, wenn es auch 2 tun? Leg dir Aliase an und spare dir Zeit für die wichtigen Dinge, wie Kaffee trinken.\n---\n### 3. Deep Dive\nEin Alias erlaubt es, lange oder häufig genutzte Kommando-Ketten unter einem kurzen Namen abzuspeichern. Oft sind sie bereits vom System vorkonfiguriert, etwa `alias ll='ls -alF'`, womit der einfache Aufruf von `ll` ein formatiertes und farbiges Verzeichnislisting erzeugt. Eigene Aliase werden üblicherweise in der Datei `~/.bashrc` (oder `~/.zshrc`) definiert, damit sie beim Starten jedes neuen Terminals automatisch geladen werden. Sie sind ein Komfort-Feature für den Nutzer, das Tipparbeit reduziert und Vertipper bei gefährlichen Befehlen (z.B. `alias rm='rm -i'`) verhindern kann."
    },
    {
        "id": 219,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Warum funktionieren Aliase nicht in Shell-Skripten, und was ist die Alternative?",
        "answer": "Aliase sind standardmäßig nur in interaktiven Shells aktiv (shopt -s expand_aliases ist in Skripten aus). Die saubere Alternative für Skripte sind Bash-Funktionen.",
        "topicId": 19,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nAliase sind nur für Interaktion gedacht. In Skripten nutzt man Funktionen (z.B. `mein_befehl() { ... }`).\n---\n> **Tux-Ansage:** Skripte, die sich auf deine privaten Aliase verlassen, brechen beim ersten Fremdkontakt. Nutze Funktionen, du Stümper!\n---\n### 3. Deep Dive\nDas Verhalten von Aliasen ist in Bash per Default in nicht-interaktiven Shells (wie sie beim Ausführen eines Skripts gestartet werden) deaktiviert. Das ist eine bewusste Designentscheidung, da Skripte portabel und deterministisch sein müssen. Würde ein Skript auf dem Server eines anderen Admins laufen, bei dem `rm` als Alias für etwas Verrücktes definiert ist, käme es zur Katastrophe.\nMan könnte Aliase im Skript per `shopt -s expand_aliases` erzwingen, aber das gilt als schlechter Stil. Die professionelle und weitaus mächtigere Alternative ist die Definition einer Bash-Funktion im Skript: `function backup() { cp \"\" \".bak\"; }`. Funktionen akzeptieren im Gegensatz zu Aliasen Parameter, können lokale Variablen haben und strukturieren den Code sauber."
    },
    {
        "id": 20,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Was zeigt `ps aux` an und was bedeuten die Spalten PID, PPID und %CPU?\n(Zeigt ps aux standardmäßig die PPID an?)",
        "answer": "`ps aux` listet alle laufenden Prozesse auf.\n* **PID:** Process ID (eindeutige Nummer zur Prozessidentifikation).\n* **PPID:** Parent Process ID. **Achtung:** `ps aux` zeigt PPID standardmäßig nicht an! Dafür benötigt man `ps -ef` oder `ps axo pid,ppid,comm`.\n* **%CPU:** Aktuelle Prozessor-Auslastung des Prozesses.",
        "moreInfo": "### 1. tl;dr\n`ps aux` zeigt dir alle laufenden Prozesse mit Details wie PID, CPU- und Speicherverbrauch – aber **nicht** die PPID. Für die Parent Process ID musst du `ps -ef` oder `ps axo pid,ppid,comm` nutzen.\n---\n> **Tux-Ansage:** **„Hör zu, Rekrut!** `ps aux` ist dein Fenster ins System – aber wenn du nur die halbe Wahrheit siehst, bist du blind. Die PPID ist der Schlüssel, um die Verwandtschaft der Prozesse zu verstehen. Also: Augen auf, Kommandos lernen, und dann zeig mir, dass du den Prozess-Dschungel durchschaust!“\n---\n### 3. Deep Dive\n#### Was `ps aux` anzeigt  \n`ps aux` (ohne Bindestrich) ist eine BSD-Variante, die eine **prozessorientierte** Sicht auf alle laufenden Prozesse liefert. Die Ausgabe enthält standardmäßig folgende Spalten:  \n\n| Spalte | Bedeutung |\n|--------|-----------|\n| **USER** | Besitzer des Prozesses |\n| **PID**  | Process ID – eindeutige Nummer des Prozesses |\n| **%CPU** | CPU-Auslastung (in Prozent, relativ zur Gesamtkapazität) |\n| **%MEM** | Speicherauslastung (in Prozent des physischen RAM) |\n| **VSZ**  | Virtuelle Speichergröße (in KB) |\n| **RSS**  | Resident Set Size – physischer Speicher (in KB) |\n| **TTY**  | Terminal, mit dem der Prozess verbunden ist (oder `?` für Daemons) |\n| **STAT** | Prozessstatus (z.B. `S` = sleeping, `R` = running, `Z` = zombie) |\n| **START**| Startzeit des Prozesses |\n| **TIME** | Kumulierte CPU-Zeit |\n| **COMMAND** | Der ausgeführte Befehl |\n\n**Wichtig:** Die **PPID** (Parent Process ID) ist **nicht** enthalten. Das ist eine häufige Falle – viele denken, `aux` zeigt alles, aber die Eltern-Kind-Beziehung fehlt.\n\n#### Warum ist die PPID wichtig?  \nJeder Prozess (außer dem allerersten, `init`/`systemd`) hat einen Elternprozess, der ihn gestartet hat. Die PPID hilft dir, den Prozessbaum zu verstehen:  \n- Welcher Prozess hat einen Zombie erzeugt?  \n- Welcher Daemon gehört zu welchem Dienst?  \n- Wie hängen zusammengehörige Prozesse (z.B. ein Webserver mit seinen Worker-Prozessen) zusammen?  \n\n#### So bekommst du die PPID  \n- **`ps -ef`** (POSIX-Stil): Zeigt `UID`, `PID`, `PPID`, `C` (CPU), `STIME`, `TTY`, `TIME`, `CMD`.  \n- **`ps axo pid,ppid,comm`** – flexibel, du wählst die Spalten selbst.  \n- **`pstree`** – visualisiert den Prozessbaum direkt.  \n\n#### Praktische Beispiele  \n\n```bash\n# Alle Prozesse mit PID und PPID anzeigen\nps -ef\n\n# Nur PID, PPID und den Befehl anzeigen\nps axo pid,ppid,comm\n\n# Prozessbaum anzeigen (oft mit -p für PID)\npstree -p\n\n# Finde alle Kinder eines bestimmten Prozesses (z.B. PID 1234)\nps --ppid 1234\n\n# Prozesse nach CPU-Auslastung sortieren (Top-5)\nps aux --sort=-%cpu | head -6\n\n# Prozess mit bestimmter PID killen (Vorsicht!)\nkill -9 1234\n```\n\n#### Unterschiede: `ps aux` vs. `ps -ef`  \n- **`aux`** (BSD): Zeigt mehr benutzerfreundliche Spalten wie `%CPU`, `%MEM`, `VSZ`, `RSS`.  \n- **`-ef`** (POSIX): Zeigt `PPID` und `C` (CPU-Nutzung in „Zeitscheiben“), aber nicht `%CPU` als Prozentwert.  \n- Beide zeigen alle Prozesse, aber die Ausgabeformate unterscheiden sich. Für Skripte ist `-ef` oft stabiler, für Menschen ist `aux` lesbarer.\n\n#### Tipp: Prozesse richtig interpretieren  \n- **%CPU** ist nicht die kumulierte Zeit, sondern ein **Momentaufnahme** (Durchschnitt über die Lebensdauer). Bei Multikern-Systemen kann ein Prozess >100% anzeigen (z.B. 150% = 1,5 Kerne).  \n- **Zombie-Prozesse** (STAT = `Z`) haben bereits beendet, aber der Elternprozess hat ihr `wait()` nicht aufgerufen. Sie haben keine CPU-Zeit mehr, aber belegen einen Eintrag in der Prozesstabelle.  \n- **Daemons** haben oft `?` unter TTY, weil sie ohne Terminal laufen.\n\n\n### 4. **Visualisierung/Merkhilfe**  \n\n**Prozessbaum – Eltern und Kinder:**\n\n```\nsystemd (PID 1)\n └─ sshd (PID 1024)\n     └─ sshd (PID 2048)   ← Kind von 1024, PPID=1024\n         └─ bash (PID 3000) ← Kind von 2048, PPID=2048\n             └─ ps aux (PID 3500) ← Kind von 3000, PPID=3000\n```\n\n**Merkhilfe für `ps aux`:**  \n> „**A**lle **U**ser, **X**tra Details – aber **P**arent fehlt!“  \n> → Nutze `-ef` oder `axo pid,ppid,comm` um die **P**arent zu sehen.\n\n**Kurzcheck:**  \n```bash\n$ ps aux | head -1   # Zeigt nur die Spaltenüberschriften\nUSER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND\n$ ps -ef | head -1   # Zeigt PPID\nUID PID PPID C STIME TTY TIME CMD\n```\n\nJetzt hast du das Rüstzeug – geh raus und erkunde den Prozess-Dschungel!",
        "topicId": 20,
        "difficulty": "mittel"
    },
    {
        "id": 120,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Was macht der Befehl 'sudo'?",
        "answer": "Er führt einen Befehl mit den Rechten eines anderen Benutzers aus, meistens als Administrator (root).",
        "topicId": 20,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nFührt Befehle mit Root- bzw. Administratorrechten aus.\n---\n> **Tux-Ansage:** Mit großer Macht kommt große Verantwortung. `sudo` gibt dir den Root-Hammer, pass auf deine Finger auf!\n---\n### 3. Deep Dive\n`sudo` (Superuser DO) ist der Standardmechanismus unter modernen Linux-Distributionen zur Privilegienerweiterung. Anstatt sich dauerhaft als allmächtiger root-User (mit `su`) anzumelden, was ein massives Sicherheitsrisiko darstellt, nutzt ein normaler Benutzer `sudo`, um nur für einen einzigen Befehl root-Rechte zu erhalten. Der Benutzer muss sich dabei (meistens) mit seinem eigenen Passwort authentifizieren, nicht mit dem Root-Passwort. Ein weiterer riesiger Vorteil: Alle Aktionen, die über `sudo` getätigt werden, protokolliert das System im Log (meist `/var/log/auth.log`), wodurch eine genaue Revision (Audit-Trail) möglich ist, wer wann was kaputtgemacht hat."
    },
    {
        "id": 220,
        "category": "6. Wichtige Kommandozeilenprogramme",
        "question": "Erkläre die visudo-Datei und die Bedeutung der Zeile '%wheel ALL=(ALL) NOPASSWD: ALL'.",
        "answer": "'visudo' editiert /etc/sudoers sicher mit Syntax-Check. Die Zeile bedeutet, dass alle Mitglieder der Gruppe 'wheel' jeden Befehl auf allen Hosts als jeder User ohne Passworteingabe ausführen dürfen.",
        "topicId": 20,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`visudo` bearbeitet die `/etc/sudoers`. Die Zeile gibt der Gruppe 'wheel' vollen Root-Zugriff ohne Passworteingabe.\n---\n> **Tux-Ansage:** Wer die `/etc/sudoers` mit `nano` statt `visudo` editiert, bettelt förmlich darum, sich selbst vom System auszusperren!\n---\n### 3. Deep Dive\nDie Konfiguration, wer was mit `sudo` machen darf, liegt in der Datei `/etc/sudoers`. Diese Datei sollte niemals direkt mit einem Editor bearbeitet werden! Der Befehl `visudo` sperrt die Datei temporär gegen parallele Zugriffe und, was noch wichtiger ist, führt beim Speichern einen Syntax-Check durch. Ein Tippfehler in der `sudoers` kann nämlich dazu führen, dass niemand mehr Root-Rechte erlangen kann.\nDie Deklaration `%wheel ALL=(ALL) NOPASSWD: ALL` ist klassisch für Admin-Umgebungen: `%wheel` adressiert alle User in der gleichnamigen Gruppe. Das erste `ALL` bedeutet auf jedem Host. `(ALL)` bedeutet, sie dürfen die Identität jedes Users annehmen (meistens root). `NOPASSWD:` sorgt dafür, dass sie beim Aufruf von sudo nicht nach ihrem Passwort gefragt werden. Das letzte `ALL` gestattet die Ausführung aller existierenden Befehle. Dies ist bequem für Automatisierung und Konfigurationsmanagement-Tools (wie Ansible), birgt aber bei kompromittierten Accounts ein Risiko."
    },
    {
        "id": 21,
        "category": "7. Texteditoren (nano, vim)",
        "question": "Welche drei grundlegenden Modi hat vi/vim und wie wechselst du zwischen ihnen?",
        "answer": "1. **Normalmodus (Command Mode):** Standardmodus nach Start. Tasten sind Befehle. Wechsel dorthin: `Esc`.\n2. **Einfügemodus (Insert Mode):** Zum Schreiben. Wechsel dorthin: `i`, `a` oder `o` im Normalmodus.\n3. **Befehlszeilenmodus (Command-Line Mode):** Für Befehle wie Speichern oder Suchen. Wechsel dorthin: `:` im Normalmodus.",
        "moreInfo": "### 1. tl;dr\nVi/Vim hat drei Hauptmodi: **Normal** (Befehle ausführen), **Insert** (Text eingeben) und **Command-Line** (z.B. speichern, suchen). Wechsel mit `Esc` (zurück zu Normal), `i/a/o` (in Insert) und `:` (in Command-Line). Beherrsche diese drei, dann beherrschst du den Editor.\n---\n> **Tux-Ansage:** **Hör zu, Rekrut!**  \nDu willst ein Linux-Hacker sein? Dann hör auf, mit der Maus zu spielen! Vi/Vim ist kein Spielzeug – es ist ein Panzer. Lerne die Modi, sonst wirst du in der Shell zerlegt. `Esc` ist dein Rückzugsort, `:` dein Befehlsstand, `i` deine Schreibmaschine. Jetzt zeig mir, dass du kein Greenhorn bist!\n---\n### 3. Deep Dive\n#### Die drei Modi im Detail\n\n**1. Normalmodus (Command Mode)**  \n- Standard nach dem Start (`vim datei.txt`).  \n- Jede Taste ist ein Befehl: `j`/`k` bewegen, `dd` löscht Zeile, `yy` kopiert, `p` fügt ein.  \n- **Wechsel dorthin:** `Esc` (immer, aus jedem Modus).  \n- **Praktischer Tipp:** Im Normalmodus kannst du mit `u` rückgängig machen, mit `Ctrl+r` wiederholen.  \n- **Beispiel:** `5dd` löscht 5 Zeilen, `G` springt ans Dateiende.\n\n**2. Einfügemodus (Insert Mode)**  \n- Zum Tippen von Text.  \n- **Wechsel dorthin:**  \n  - `i` – vor dem Cursor einfügen  \n  - `a` – nach dem Cursor einfügen  \n  - `o` – neue Zeile unterhalb öffnen  \n  - `O` – neue Zeile oberhalb öffnen  \n  - `A` – ans Zeilenende springen und einfügen  \n- **Praktischer Tipp:** Im Insert-Modus kannst du mit `Ctrl+w` ein Wort löschen, mit `Ctrl+u` die ganze Zeile.  \n- **Beispiel:** `i` dann Text tippen, dann `Esc` zurück.\n\n**3. Befehlszeilenmodus (Command-Line Mode)**  \n- Erreichbar mit `:` im Normalmodus.  \n- Befehle wie:  \n  - `:w` – speichern  \n  - `:q` – beenden  \n  - `:wq` – speichern und beenden  \n  - `:q!` – ohne Speichern beenden  \n  - `:s/alt/neu/g` – global ersetzen  \n  - `:set nu` – Zeilennummern anzeigen  \n  - `/suchbegriff` – suchen (dann `n` für nächster Treffer)  \n- **Praktischer Tipp:** Du kannst auch `:!` gefolgt von Shell-Befehlen ausführen, z.B. `:!ls` – zeigt dir die Dateien, ohne Vim zu verlassen.  \n- **Beispiel:** `:%s/foo/bar/g` ersetzt alle `foo` durch `bar`.\n\n#### Wechsel zwischen den Modi – das A und O\n- **Von Insert → Normal:** `Esc`  \n- **Von Command-Line → Normal:** `Esc` oder nach Ausführung automatisch  \n- **Von Normal → Insert:** `i`, `a`, `o`, etc.  \n- **Von Normal → Command-Line:** `:` (oder `/` für Suche)\n\n**Wichtig:** Es gibt keinen direkten Wechsel von Insert zu Command-Line – du musst immer erst `Esc` drücken. Das ist der häufigste Anfängerfehler!\n\n#### Nützliche Terminal-Befehle im Zusammenhang\n- `vimtutor` – interaktiver Kurs (30 Minuten)  \n- `vim -R datei` – nur lesen (read-only)  \n- `vim -O datei1 datei2` – mehrere Dateien nebeneinander (Split)  \n- `vim -c \"set nu\" datei` – startet mit aktivierten Zeilennummern  \n\n\n### 4. **Visualisierung/Merkhilfe**\n\n```\n┌─────────────────────────────────────────────────────────────┐\n│                    VI/VIM MODI – ÜBERBLICK                  │\n└─────────────────────────────────────────────────────────────┘\n\n        +----------------+          i, a, o, A, O          +----------------+\n        |                | ------------------------------> |                |\n        |   NORMALMODUS  |                                 |  EINFÜGEMODUS  |\n        |  (Befehle)     | <------------------------------ |  (Text tippen) |\n        |                |              Esc                |                |\n        +-------+--------+                                 +----------------+\n                |\n                |  :  (Doppelpunkt)\n                v\n        +----------------+\n        |  BEFEHLSZEILEN |\n        |  (Command-Line)|\n        |  :w, :q, :s/   |\n        +----------------+\n                |\n                |  Esc (oder nach Ausführung)\n                v\n        +----------------+\n        |  NORMALMODUS   |\n        +----------------+\n\nMerkhilfe:\n- **N** wie **N**ormal – hier bist du meistens.\n- **I** wie **I**nsert – zum Schreiben.\n- **C** wie **C**ommand – für Aktionen.\n\nSpruch: „Esc entkommt, i schreibt, : befiehlt – das ist alles, was du brauchst, um zu überleben.“\n```\n\n**Zusätzlicher Tipp:** Wenn du mal feststeckst, drücke `Esc` zweimal – du landest immer im Normalmodus. Und dann `:q!` wenn du raus willst, ohne zu speichern. Aber denk dran: Ein echter Hacker speichert regelmäßig mit `:w`!",
        "topicId": 21,
        "difficulty": "mittel"
    },
    {
        "id": 121,
        "category": "7. Texteditoren (nano, vim)",
        "question": "Welches Tool benutzt man in Ubuntu/Debian, um Software zu installieren?",
        "answer": "Das Tool heißt 'apt' (oder 'apt-get'). Zum Beispiel 'sudo apt install firefox'.",
        "topicId": 21,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nAPT (Advanced Package Tool) ist das Standardwerkzeug für die Softwareverwaltung unter Debian/Ubuntu.\n---\n> **Tux-Ansage:** \"Installieren kann jeder, aber wehe du fragst mich, wie man Abhängigkeiten auflöst, Rekrut!\"\n---\n### 3. Deep Dive\nAPT ist ein Frontend für das eigentlich zugrundeliegende `dpkg`. Es kümmert sich um das Herunterladen von Paketen (in der Regel `.deb`-Dateien) aus Repositories, löst Abhängigkeiten auf (wenn ein Programm ein anderes benötigt, um zu funktionieren) und installiert diese in der richtigen Reihenfolge. Früher nutzte man getrennte Befehle wie `apt-get` und `apt-cache`, moderne Systeme setzen aber bevorzugt auf das etwas benutzerfreundlichere `apt`, welches einen Fortschrittsbalken und übersichtlichere Ausgaben bietet."
    },
    {
        "id": 221,
        "category": "7. Texteditoren (nano, vim)",
        "question": "Was ist der Unterschied zwischen 'apt upgrade' und 'apt full-upgrade'?",
        "answer": "'upgrade' aktualisiert Pakete, löscht aber keine installierten. 'full-upgrade' (früher dist-upgrade) löscht auch existierende Pakete, wenn dies für das Update von Abhängigkeiten zwingend nötig ist.",
        "topicId": 21,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`upgrade` aktualisiert nur bestehende Pakete, `full-upgrade` darf auch Pakete entfernen, wenn das für Updates nötig ist.\n---\n> **Tux-Ansage:** \"Ein full-upgrade ist wie eine Herz-OP im laufenden Betrieb. Wenn du nicht liest, was er löschen will, bist du selbst schuld, wenn das System nicht mehr bootet!\"\n---\n### 3. Deep Dive\nBeim normalen `apt upgrade` werden neue Versionen bereits installierter Pakete eingespielt. Wenn ein neues Paket-Update jedoch zwingend erfordert, dass ein anderes, altes Paket gelöscht wird (z.B. bei Konflikten von Bibliotheken oder Kernel-Wechseln), wird `upgrade` dieses Paket zurückhalten. `apt full-upgrade` hingegen analysiert die Abhängigkeiten neu und führt auch Entfernungen durch, um das System konsistent auf den allerneuesten Stand zu bringen. Dies ist vor allem bei Distribution-Upgrades (z.B. von Debian 11 auf 12) essentiell."
    },
    {
        "id": 22,
        "category": "7. Texteditoren (nano, vim)",
        "question": "Wie führt man in vi/vim folgende Aktionen aus (ausgehend vom Normalmodus)?\n1. Speichern und schließen\n2. Beenden ohne Speichern erzwingen\n3. Aktuelle Zeile löschen\n4. Nach dem Wort \"Fehler\" suchen\n5. Letzten Schritt rückgängig machen (Undo)",
        "answer": "1. Speichern und schließen: `:wq` (oder `ZZ`)\n2. Beenden ohne Speichern: `:q!`\n3. Zeile löschen: `dd`\n4. Nach \"Fehler\" suchen: `/Fehler` (weiter mit `n`)\n5. Undo (Rückgängig): `u`",
        "moreInfo": "### 1. tl;dr\nIn vi/vim führt `:wq` zum Speichern und Beenden, `:q!` erzwingt das Beenden ohne Speichern. Mit `dd` löschst du die aktuelle Zeile, `/Fehler` sucht nach dem Wort (mit `n` für den nächsten Treffer) und `u` macht den letzten Schritt rückgängig.\n---\n> **Tux-Ansage:** Rekrut! Wenn du im vi feststeckst, reiß nicht den Stecker aus der Wand! Lern diese verdammten Befehle auswendig. Wer `:q!` nicht kennt, verliert seine Daten, wer `:wq` nicht kennt, bleibt für immer im Editor gefangen!\n---\n### 3. Deep Dive\n- **Speichern und Beenden:** `:wq` (write quit) ist der Standard. `ZZ` ist die schnellere Alternative im Normalmodus, die kein `:` benötigt.\n- **Beenden ohne Speichern:** `:q` beendet, weigert sich aber bei Änderungen. Das Ausrufezeichen in `:q!` erzwingt das Verwerfen aller ungespeicherten Änderungen.\n- **Löschen:** `dd` löscht die ganze Zeile und kopiert sie in den Puffer (wie Ausschneiden). Du kannst sie mit `p` an anderer Stelle wieder einfügen.\n- **Suchen:** Die Eingabe von `/` wechselt in den Kommandomodus für die Vorwärtssuche. `?` sucht rückwärts. Mit `n` (next) springst zum nächsten Treffer, mit `N` zum vorherigen.\n- **Undo:** `u` (undo) ist dein Rettungsanker. In vim kannst du durch mehrfaches Drücken von `u` beliebig viele Schritte rückgängig machen. Mit `Strg+r` (redo) stellst du sie wieder her.",
        "topicId": 22,
        "difficulty": "mittel"
    },
    {
        "id": 122,
        "category": "7. Texteditoren (nano, vim)",
        "question": "Wie aktualisiert man die Paketlisten bei 'apt'?",
        "answer": "Mit dem Befehl 'sudo apt update'. Dadurch weiß das System, welche neuen Updates verfügbar sind.",
        "topicId": 22,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`apt update` lädt nur die Listen der verfügbaren Software aus dem Internet herunter, ohne etwas zu installieren.\n---\n> **Tux-Ansage:** \"Update ist nicht Upgrade! Schreib dir das hinter die Ohren, sonst wunderst du dich, warum dein System auf dem Stand von 2018 bleibt!\"\n---\n### 3. Deep Dive\nDein Linux-System führt keine ständige Live-Abfrage bei den Servern durch, wenn du Pakete suchst oder installierst. Es verlässt sich auf eine lokale Datenbank (die Paketlisten), die im Verzeichnis `/var/lib/apt/lists/` gespeichert ist. Der Befehl `sudo apt update` verbindet sich mit den konfigurierten Repositories (Servern) und lädt die neuesten Metadaten herunter. Erst danach weiß dein System, dass es neue Versionen gibt, die dann mit `apt upgrade` installiert werden können."
    },
    {
        "id": 222,
        "category": "7. Texteditoren (nano, vim)",
        "question": "Welche Dateien und Verzeichnisse verwendet APT, um die Repositories zu verwalten?",
        "answer": "Die Hauptdatei ist '/etc/apt/sources.list'. Zusätzlich werden '/etc/apt/sources.list.d/*.list' sowie PGP-Schlüssel unter '/etc/apt/trusted.gpg.d/' für die Signaturprüfung genutzt.",
        "topicId": 22,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nAPT konfiguriert Paketquellen in `sources.list` und zugehörigen Drop-in-Verzeichnissen, abgesichert durch PGP-Schlüssel.\n---\n> **Tux-Ansage:** \"Fremde Repositories eintragen, ohne die Keys zu prüfen, ist wie Haustürschlüssel an Wildfremde verteilen. Viel Glück!\"\n---\n### 3. Deep Dive\nDie Hauptkonfiguration liegt in `/etc/apt/sources.list`. Für Fremdquellen nutzt man oft einzelne `.list`-Dateien im Ordner `/etc/apt/sources.list.d/`, was die Verwaltung durch Skripte oder Konfigurationsmanagement vereinfacht. Jedes Paket aus diesen Repositories ist kryptographisch signiert, um Manipulationen (z.B. durch Man-in-the-Middle-Angriffe) zu verhindern. Die zugehörigen öffentlichen Schlüssel (Public Keys) liegen heute idealerweise einzeln im Verzeichnis `/etc/apt/trusted.gpg.d/` oder werden direkt im `sources.list`-Eintrag mit der Option `signed-by` referenziert, was noch sicherer ist."
    },
    {
        "id": 23,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Beschreibe die Phasen des Linux-Boot-Prozesses (BIOS/UEFI -> Bootloader -> Kernel -> initramfs -> init).\nWelche Rolle spielt das initramfs?",
        "answer": "1. BIOS/UEFI (Hardware-Init)\n2. Bootloader (z.B. GRUB, lädt Kernel)\n3. Kernel (Init System, Treiber)\n4. initramfs (temporäres Dateisystem für Boot-Treiber)\n5. init / systemd (startet Dienste)\n\nDas **initramfs** stellt Treiber und Module (z.B. für LVM/LUKS) bereit, um das eigentliche Root-Dateisystem mounten zu können.",
        "moreInfo": "### 1. tl;dr\nDer Linux-Boot durchläuft BIOS/UEFI, Bootloader, Kernel, initramfs und init. Das initramfs ist essenziell, weil es als temporäres RAM-Dateisystem die nötigen Treiber mitbringt, um z.B. verschlüsselte oder komplexe Root-Partitionen zu mounten, bevor das echte System übernimmt.\n---\n> **Tux-Ansage:** Stillgestanden! Du glaubst, Linux zaubert sich von selbst auf deinen Bildschirm? Falsch! Jeder Schritt greift in den nächsten. Wenn GRUB den Kernel nicht findet, stirbst du. Wenn das initramfs fehlt, gibt's Kernel Panic! Lern die Kette, sonst bleibst du ein ahnungsloser Mausschubser!\n---\n### 3. Deep Dive\nDer Bootprozess ist eine präzise Staffelübergabe:\n1. **BIOS/UEFI:** Führt den Power-On Self-Test (POST) aus und sucht das Boot-Medium.\n2. **Bootloader:** GRUB oder systemd-boot übernimmt. Er liest seine Config und lädt den Kernel sowie das initramfs in den Arbeitsspeicher.\n3. **Kernel:** Entpackt sich und initialisiert grundlegende Hardware-Komponenten (CPU, Memory).\n4. **initramfs (Initial RAM File System):** Der Kernel allein kennt nicht jedes Dateisystem und jeden RAID-Controller. Das initramfs ist ein kleines CPIO-Archiv, das in den RAM gemountet wird. Es enthält Skripte und Treiber (z.B. für LUKS-Verschlüsselung, LVM oder RAID), um das echte Root-Dateisystem aufzuspüren, zu entsperren und zu mounten. Danach wechselt das System via `pivot_root` auf das echte Dateisystem.\n5. **init (heute meist systemd):** Der Kernel startet PID 1. systemd liest die Konfigurationen, mountet weitere Dateisysteme (`/etc/fstab`) und startet alle Hintergrunddienste (Netzwerk, Webserver, Login-Manager).",
        "topicId": 23,
        "difficulty": "mittel"
    },
    {
        "id": 123,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Was ist systemd?",
        "answer": "Das ist das Hintergrundprogramm (Init-System) bei modernen Linux-Systemen, das alle Dienste beim Start lädt.",
        "topicId": 23,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nsystemd ist der System- und Dienstemanager, der als allererster Prozess beim Booten (PID 1) startet.\n---\n> **Tux-Ansage:** \"Egal ob du es liebst oder hasst – systemd ist der Boss, und ohne ihn bewegt sich hier kein Byte!\"\n---\n### 3. Deep Dive\nNach dem Kernel ist systemd das erste Programm, das aufgerufen wird. Es ersetzt ältere Init-Systeme wie SysVinit. systemd bootet das System extrem schnell, da es Dienste parallel startet und Abhängigkeiten durch Sockets und D-Bus effektiv auflöst. Außerdem bietet es neben der reinen Diensteverwaltung auch Funktionen für das Logging (`journald`), die Netzwerkverwaltung (`systemd-networkd`), Zeit-Synchronisierung (`systemd-timesyncd`) und vieles mehr."
    },
    {
        "id": 223,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Was ist eine systemd-Unit und welche Unit-Typen kennst du (nenne mindestens 3)?",
        "answer": "Units sind Konfigurationsdateien für systemd. Typen: .service (Dienste), .timer (Cron-Ersatz), .mount (Dateisysteme), .target (Runlevel/Gruppen).",
        "topicId": 23,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nUnits sind die Bausteine von systemd, aufgeteilt in Typen für Dienste, Timer, Mount-Punkte und abstrakte Ziele.\n---\n> **Tux-Ansage:** \"Wer `.service` nicht von `.target` unterscheiden kann, darf bei mir nicht mal den Drucker administrieren!\"\n---\n### 3. Deep Dive\nEine Unit-Datei beschreibt genau, wie systemd mit einer Ressource umgehen soll. Sie bestehen aus Abschnitten wie `[Unit]`, `[Service]` und `[Install]`.\n- `.service`: Steuert Hintergrunddienste (z.B. Webserver, Datenbanken).\n- `.timer`: Ein moderner Ersatz für Cronjobs; führt Dienste zeitgesteuert aus (z.B. `apt-daily.timer`).\n- `.mount`: Definiert Dateisysteme, die beim Booten eingehängt werden sollen, anstelle der traditionellen `/etc/fstab`.\n- `.target`: Gruppiert Units zu einem logischen Zustand (z.B. `multi-user.target` für ein gebootetes System mit Netzwerk, aber ohne grafische Oberfläche)."
    },
    {
        "id": 24,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Was sind Linux-Namespaces? Wie unterscheiden sie sich von Hardware-Virtualisierung (z. B. VirtualBox) und warum sind sie wichtig für Docker?",
        "answer": "**Namespaces** isolieren Kernel-Ressourcen (Prozesse, Netzwerk, Mounts) für eine Gruppe von Prozessen. \nIm Gegensatz zu **Hardware-VMs** (wie VirtualBox), die einen kompletten PC und ein Gast-OS emulieren, teilen sich Namespaces denselben Kernel und sind dadurch extrem ressourcenschonend. Sie bilden die technologische Grundlage für **Docker-Container**.",
        "moreInfo": "### 1. tl;dr\nLinux-Namespaces kapseln globale Systemressourcen ein, sodass Prozesse glauben, sie wären allein auf dem System. Sie teilen sich denselben Kernel, anstatt wie VMs ein komplettes Gast-Betriebssystem samt Hardware-Emulation mitzuschleppen. Das macht Container wie Docker so rasant und leichtgewichtig.\n---\n> **Tux-Ansage:** VMs sind wie eigene Häuser mit eigenem Stromaggregat – Container sind WG-Zimmer, die sich den Strom aus der Wand teilen! Namespaces sorgen dafür, dass dein WG-Nachbar nicht in deinem Zimmer herumschnüffelt. Effizienz statt Verschwendung, Soldat!\n---\n### 3. Deep Dive\n**Namespaces** sind ein Linux-Kernel-Feature. Es gibt verschiedene Typen (z.B. PID, NET, MNT, UTS, IPC, USER).\n- **Isolierung:** Ein Prozess im eigenen PID-Namespace sieht sich selbst als PID 1 und hat keine Ahnung von den Prozessen des Host-Systems. Ein eigener NET-Namespace gibt dem Container eine eigene Loopback-Schnittstelle, IP und Routing-Tabelle.\n- **Unterschied zu VirtualBox:** Eine Hardware-Virtualisierung abstrahiert Hardware (CPU, RAM). Das erfordert einen Hypervisor und ein komplett bootendes Gast-OS mit eigenem Kernel. Das kostet RAM, CPU-Zyklen und Zeit (Boot-Vorgang). Container in Namespaces starten in Millisekunden, da sie normale Prozesse des Host-Kernels sind.\n- **Bedeutung für Docker:** Docker kombiniert Namespaces (für die Isolation der Sicht) mit Control Groups (Cgroups, für die Limitierung von RAM/CPU), um isolierte Umgebungen (Container) zu schaffen.",
        "topicId": 24,
        "difficulty": "mittel"
    },
    {
        "id": 124,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Wie überprüfst du, ob der Apache-Webserver läuft?",
        "answer": "Mit dem Befehl 'systemctl status apache2'.",
        "topicId": 24,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`systemctl status` zeigt den aktuellen Zustand, PID und letzte Log-Einträge eines Dienstes.\n---\n> **Tux-Ansage:** \"Grün heißt gut, rot heißt kaputt. Wenn du nicht lesen willst, was da steht, solltest du Gärtner werden!\"\n---\n### 3. Deep Dive\nDer Befehl gibt eine Fülle an Informationen: Ob der Dienst geladen (loaded), aktiviert (enabled, also ob er beim Booten startet) und aktiv (active/running) ist. Er zeigt die Haupt-Prozess-ID (Main PID) und speicherbezogene Metriken. Besonders nützlich sind die untersten Zeilen: Dort zeigt systemctl direkt die letzten Einträge aus dem System-Journal (via `journalctl`) für genau diesen Dienst an, was bei der Fehlersuche extrem hilft."
    },
    {
        "id": 224,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Was passiert genau, wenn du 'systemctl enable apache2' ausführst?",
        "answer": "Es wird ein symbolischer Link der Unit-Datei (z.B. aus /lib/systemd/system/) in ein entsprechendes Target-Verzeichnis (meist /etc/systemd/system/multi-user.target.wants/) erstellt, wodurch der Dienst beim Booten gestartet wird.",
        "topicId": 24,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`enable` sorgt dafür, dass ein Dienst automatisch beim nächsten Systemstart mitgestartet wird, indem Symlinks angelegt werden.\n---\n> **Tux-Ansage:** \"Dienste manuell starten ist was für Hobby-Admins. Wer 'enable' vergisst, bekommt nach dem nächsten Reboot Panik!\"\n---\n### 3. Deep Dive\nUnit-Dateien definieren im Abschnitt `[Install]` unter `WantedBy=` ein Ziel (Target). Wenn du `systemctl enable apache2` ausführst, liest systemd dieses `WantedBy` (oft `multi-user.target`) und legt einen symbolischen Link (Symlink) von der eigentlichen Unit-Datei (in `/lib/systemd/system/`) in das entsprechende Wants-Verzeichnis (z.B. `/etc/systemd/system/multi-user.target.wants/`). Beim Booten lädt systemd das Target und startet automatisch alle Units, die durch Symlinks in diesen `.wants`-Ordnern referenziert sind."
    },
    {
        "id": 25,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Was sind Linux Capabilities und welches Problem des klassischen Unix-Rechtekonzepts lösen sie?",
        "answer": "**Linux Capabilities** zerteilen die allmächtigen Rechte des `root`-Users in kleine, spezifische Einzelrechte (z.B. `CAP_NET_BIND_SERVICE`).\n**Problem:** Klassisch gibt es nur \"Root darf alles\" oder \"User darf nichts\". Dienste mussten oft komplett als Root laufen.\n**Lösung:** Mit Capabilities erhält ein Prozess nur exakt die Rechte, die er benötigt, was die Sicherheit (Least Privilege) massiv erhöht.",
        "moreInfo": "### 1. tl;dr\nLinux Capabilities spalten das Alles-oder-Nichts-Privileg des Root-Users in feingranulare Rechte auf. Anstatt einen Dienst komplett als Root laufen zu lassen (Sicherheitsrisiko!), bekommt er per Capability nur exakt das Einzelrecht, das er braucht (z.B. das Öffnen eines Ports unter 1024).\n---\n> **Tux-Ansage:** Wenn du jedem Hanswurst, der mal kurz einen Port binden will, gleich den Root-Schlüssel in die Hand drückst, kannst du deinen Server auch gleich unabgeschlossen an den Bahnhof stellen! Capabilities sind dein Werkzeugkasten für das Prinzip der minimalen Rechte. Nutz sie!\n---\n### 3. Deep Dive\n- **Das klassische Problem:** Früher (und teils noch heute) durften nur Prozesse mit UID 0 (root) privilegierte Aktionen ausführen, z.B. das Binden an TCP/UDP-Ports unter 1024 (HTTP Port 80, HTTPS Port 443) oder das Verändern der Systemzeit. Wenn ein Webserver als root lief und eine Sicherheitslücke hatte, hatte der Angreifer sofort volle Systemkontrolle.\n- **Die Capability-Lösung:** Der Kernel bietet rund 40 Capabilities an. Die bekannteste ist `CAP_NET_BIND_SERVICE`. Wenn du einem Binary (z.B. einer Go-App) diese Capability gibst (`setcap cap_net_bind_service=+ep /path/to/app`), kann diese App als normaler, unprivilegierter User (z.B. `www-data`) ausgeführt werden und *dennoch* Port 80 binden. Wird die App gehackt, hat der Angreifer nur die Rechte von `www-data` und nicht von root.\n- **Container:** Docker und Kubernetes machen extensiven Gebrauch von Capabilities. Standardmäßig droppt Docker viele kritische Capabilities und gewährt Containern nur ein sicheres Minimum.",
        "topicId": 25,
        "difficulty": "mittel"
    },
    {
        "id": 125,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Wie startest du einen Linux-Dienst neu?",
        "answer": "Mit 'systemctl restart dienstname' (z.B. systemctl restart nginx).",
        "topicId": 25,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nMit `systemctl restart` wird ein laufender Dienst beendet und direkt wieder hochgefahren.\n---\n> **Tux-Ansage:** \"Ein Reboot tut gut! Aber wenn du wegen einer kleinen Config-Änderung den ganzen Server neustartest, werfe ich dich raus!\"\n---\n### 3. Deep Dive\nDer `restart`-Befehl ist praktisch ein Shortcut für `systemctl stop` gefolgt von `systemctl start`. Er weist systemd an, dem Hauptprozess des Dienstes (und allen Tochterprozessen in der gleichen Control Group) ein Beendigungssignal (meist SIGTERM) zu senden. Sobald der Prozess beendet ist, wird er mit den konfigurierten Startparametern (`ExecStart=`) frisch aufgerufen."
    },
    {
        "id": 225,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Was ist der Unterschied zwischen 'systemctl restart' und 'systemctl reload'?",
        "answer": "'restart' beendet den Prozess komplett und startet ihn neu (Downtime). 'reload' sendet ein Signal (z.B. SIGHUP), damit der Dienst seine Konfiguration neu einliest, ohne aktive Verbindungen abzubrechen.",
        "topicId": 25,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`restart` ist ein harter Neustart mit Ausfallzeit. `reload` lässt den Dienst die Konfiguration im laufenden Betrieb neu einlesen.\n---\n> **Tux-Ansage:** \"Wer bei einem Webserver mit 10.000 Usern 'restart' statt 'reload' tippt, darf sich die Kündigung direkt abholen!\"\n---\n### 3. Deep Dive\nViele moderne Daemons (wie Nginx, Apache oder SSHd) unterstützen ein \"Graceful Reload\". Wenn systemd ein `reload` ausführt (definiert in der Unit durch `ExecReload=`), wird dem Prozess typischerweise das Signal `SIGHUP` (Signal Hang Up) gesendet. Der Hauptprozess liest dann die Konfigurationsdateien neu ein, startet neue Worker-Prozesse mit der neuen Config und lässt alte Worker-Prozesse ihre aktuellen Verbindungen noch ordnungsgemäß abarbeiten, bevor sie beendet werden. So entsteht für Clients keine spürbare Unterbrechung."
    },
    {
        "id": 26,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Was sind Access Control Lists (ACLs) und wie erweitern sie das Standard-UGO-Modell?\nNenne die Befehle zum:\n1. Anzeigen von ACLs einer Datei\n2. Zuweisen von Leserechten an Benutzer \"schmidt\"",
        "answer": "**ACLs (Access Control Lists)** erlauben feingranulare Berechtigungen für beliebig viele Benutzer und Gruppen, während das UGO-Modell nur jeweils einen Besitzer, eine Gruppe und \"Andere\" abbilden kann.\n\n1. Anzeigen: `getfacl <datei>`\n2. Setzen: `setfacl -m u:schmidt:r <datei>`",
        "moreInfo": "### 1. tl;dr\nAccess Control Lists (ACLs) brechen die Limitierung des klassischen UGO-Modells (User/Group/Other) auf und erlauben dir, beliebig vielen spezifischen Benutzern und Gruppen unterschiedliche Rechte an einer Datei zu geben. Mit `getfacl` zeigst du sie an, mit `setfacl -m u:schmidt:r` setzt du Leserechte für \"schmidt\".\n---\n> **Tux-Ansage:** UGO ist was für Kleinkinder im Sandkasten! Wenn fünf verschiedene Abteilungen unterschiedlichen Zugriff auf dieselbe Datei brauchen, kriegst du mit `chmod` graue Haare. ACLs sind die Präzisionswaffe für echte Admins. Wer `chmod 777` macht, fliegt sofort raus!\n---\n### 3. Deep Dive\n- **Die Grenzen von UGO:** Das alte UNIX-Rechtesystem ordnet jede Datei genau einem Besitzer und einer Gruppe zu. Wenn User A Schreibrechte und User B nur Leserechte braucht, User C aber gar nicht zugreifen darf, musstest du im UGO-Modell komplexe und unübersichtliche Hilfsgruppen basteln.\n- **ACL-Struktur:** ACLs fügen sich unsichtbar in moderne Dateisysteme (ext4, xfs) ein. Ein `ls -l` zeigt bei Dateien mit ACLs ein `+` am Ende der Rechtemaske (z.B. `-rw-rwxr--+`).\n- **Die ACL Maske (`mask`):** Ein wichtiges Detail ist die Maske. Sie definiert die maximal erlaubten Rechte für alle benannten User/Gruppen. Wenn du `setfacl` benutzt, wird oft automatisch eine Maske berechnet. Ein `chmod` auf die Gruppenrechte ändert bei ACL-Dateien in der Regel die Maske, was zu unerwarteten Effekten führen kann.\n- **Default ACLs:** Mit `setfacl -d -m u:user:rw /verzeichnis` kannst du Default-ACLs für Ordner definieren. Neue Dateien erben dann automatisch diese Rechte, was perfekt für gemeinsame Projektverzeichnisse ist.",
        "topicId": 26,
        "difficulty": "mittel"
    },
    {
        "id": 126,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Wofür nutzt man den Befehl 'tar'?",
        "answer": "Um viele Dateien zu einem Archiv ('Tarball') zusammenzufassen, ähnlich wie eine ZIP-Datei.",
        "topicId": 26,
        "difficulty": "leicht",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\n`tar` verpackt viele Dateien und Verzeichnisse zu einer einzigen Archiv-Datei.\n---\n> **Tux-Ansage:** \"Es heißt Tape Archive! Auch wenn du keine Magnetbänder mehr im Keller hast, respektiere die Geschichte!\"\n---\n### 3. Deep Dive\nUrsprünglich stand \"tar\" für \"Tape Archive\" und wurde genutzt, um Daten sequentiell auf Magnetbänder zu schreiben. Heute wird es hauptsächlich verwendet, um Ordnerstrukturen und Dateirechte sauber zu erhalten, bevor man sie komprimiert oder übers Netzwerk verschickt. Wichtig: `tar` selbst komprimiert standardmäßig nicht (die Dateigröße bleibt annähernd gleich), es fügt die Dateien nur zusammen."
    },
    {
        "id": 226,
        "category": "8. Netzwerk- und Systemkonzepte",
        "question": "Wie entpackst du eine .tar.gz Datei und was bedeuten die Schalter -x, -z, -v, -f?",
        "answer": "'tar -xzvf datei.tar.gz'. -x = extract (entpacken), -z = gzip-Kompression, -v = verbose (zeige Dateien an), -f = file (Ziel-Dateiname folgt).",
        "topicId": 26,
        "difficulty": "schwer",
        "validationType": "concept",
        "moreInfo": "### 1. tl;dr\nDie Parameter `-xzvf` stehen für E(x)tract, G(z)ip, (V)erbose und (F)ile, um ein komprimiertes Archiv zu entpacken.\n---\n> **Tux-Ansage:** \"Wenn du die Reihenfolge der Parameter vergisst, hast du entweder zu wenig getippt oder zu viel gegoogelt!\"\n---\n### 3. Deep Dive\nIn der Unix-Welt ist die Kombination von Schaltern mächtig.\n- `-x` (extract): Sagt `tar`, dass wir entpacken wollen (Gegenteil von `-c` für create).\n- `-z` (gzip): Jagt den Datenstrom durch `gzip` zur Dekompression (für `.bz2` nimmt man `-j`, für `.xz` nimmt man `-J`).\n- `-v` (verbose): Gibt jede entpackte Datei im Terminal aus – bei riesigen Archiven sollte man das zur Performancesteigerung weglassen.\n- `-f` (file): Muss zwingend als letzter Schalter stehen, da danach der Dateiname des Archivs erwartet wird. Sonst sucht `tar` das alte Magnetbandlaufwerk (z.B. `/dev/rmt0`)."
    },
    {
        "id": 27,
        "category": "9. Fortgeschrittene Administration",
        "question": "Du möchtest ein komprimiertes Archiv ('backup.tar.gz') des Verzeichnisses '/var/log' erstellen. Wie lautet der exakte tar-Befehl dazu?",
        "answer": "`tar -czvf backup.tar.gz /var/log`\n\n- `-c`: create (Archiv erstellen)\n- `-z`: gzip (komprimieren)\n- `-v`: verbose (Fortschritt/Dateien anzeigen)\n- `-f`: file (Name des Archivs, muss zwingend am Ende stehen!)",
        "validationType": "command",
        "solutions": [
            "tar\\s+-c.*z.*f\\s+backup\\.tar\\.gz\\s+/var/log",
            "tar\\s+-czvf\\s+backup\\.tar\\.gz\\s+/var/log",
            "tar\\s+-zcvf\\s+backup\\.tar\\.gz\\s+/var/log"
        ],
        "moreInfo": "### 1. tl;dr\nMit `tar -czvf backup.tar.gz /var/log` packst und komprimierst du das komplette Log-Verzeichnis in ein gzip-Archiv. Die Optionen stehen für Create, gZip, Verbose (Gesprächig) und File (Dateiname).\n---\n> **Tux-Ansage:** Wenn du das `-f` vergisst, ballert dir tar den gesamten binären Matsch direkt ins Terminal und du darfst zuschauen, wie dein Bildschirm explodiert. Die Reihenfolge der Parameter ist zweitrangig, aber `-f` muss IMMER direkt vor dem Dateinamen stehen. Merk dir das!\n---\n### 3. Deep Dive\n- **Das Tape Archive (tar):** `tar` komprimiert selbst nicht, es reiht Dateien nur aneinander (historisch für Magnetbänder). Die Kompression erfolgt durch separate Algorithmen. Das `-z` Flag nutzt `gzip`. Für bessere (aber langsamere) Kompression nutzt man `-j` (`bzip2`) oder `-J` (`xz`).\n- **Rechte und Attribute:** Einer der Hauptgründe, warum unter Linux immer `tar` genutzt wird und nicht etwa einfache `.zip`-Dateien: `tar` erhält die Linux-Dateiberechtigungen (UGO, Executable-Bits) und Ownership-Informationen. Beim Sichern von `/var/log` extrem wichtig!\n- **Absolute vs. Relative Pfade:** `tar` entfernt standardmäßig den führenden Slash `/` (z.B. `tar: Removing leading '/' from member names`). Das ist ein Sicherheitsfeature! Beim Entpacken (`tar -xzvf`) werden die Dateien so ins *aktuelle* Verzeichnis entpackt (`var/log/syslog`) und überschreiben nicht versehentlich das echte Live-System unter `/var/log`.",
        "topicId": 27,
        "difficulty": "mittel"
    },
    {
        "id": 127,
        "category": "9. Fortgeschrittene Administration",
        "question": "Wofür ist SSH gut?",
        "answer": "Mit SSH (Secure Shell) kann man sich sicher und verschlüsselt über das Netzwerk auf einem anderen Rechner einloggen.",
        "validationType": "concept",
        "topicId": 27,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\nSSH (Secure Shell) ist das Standardprotokoll für verschlüsselte Terminal-Verbindungen zu entfernten Rechnern.\n---\n> **Tux-Ansage:** \"Wer heute noch Telnet benutzt, dessen Passwörter stehen morgen schon auf Pastebin. Nutze SSH!\"\n---\n### 3. Deep Dive\nSSH lauscht standardmäßig auf TCP-Port 22. Es ersetzt komplett alte, unverschlüsselte Protokolle wie Telnet, Rlogin oder FTP. Es verschlüsselt nicht nur die Eingaben, sondern die gesamte Verbindung, wodurch Man-in-the-Middle-Angriffe und Paket-Sniffing (Abhören des Traffics) verhindert werden. Neben reinen Terminal-Sitzungen kann SSH auch für Port-Forwarding (Tunneling) oder Dateiübertragungen (SFTP, SCP) genutzt werden."
    },
    {
        "id": 227,
        "category": "9. Fortgeschrittene Administration",
        "question": "Erkläre den Ablauf einer asymmetrischen SSH-Schlüsselauthentifizierung.",
        "answer": "Der Client sendet eine Signatur, die mit seinem Private Key erzeugt wurde. Der Server prüft sie gegen den Public Key des Clients in der 'authorized_keys'. Passt es, wird der Zugang gewährt (ohne Passworteingabe).",
        "validationType": "concept",
        "topicId": 27,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nPrivate Key beim Client, Public Key auf dem Server. Kryptografische Magie erlaubt Login ohne Passwort.\n---\n> **Tux-Ansage:** \"Public Key kannst du auf Werbeplakate drucken. Deinen Private Key hütet du wie deinen Augapfel!\"\n---\n### 3. Deep Dive\nBei der asymmetrischen Kryptografie gibt es ein Schlüsselpaar. Der Public Key wird auf dem Zielserver in die Datei `~/.ssh/authorized_keys` eingetragen. Wenn du dich verbindest, sendet der Server eine zufällige Challenge (eine Art Rätsel). Dein SSH-Client lokal signiert diese Challenge mit deinem Private Key. Der Server prüft mit dem Public Key, ob die Signatur gültig ist. Da nur dein Private Key diese mathematisch korrekte Signatur erzeugen kann, weiß der Server sicher, dass du berechtigt bist, ganz ohne dass je ein Passwort über die Leitung ging."
    },
    {
        "id": 28,
        "category": "9. Fortgeschrittene Administration",
        "question": "Wie generierst du einen modernen ED25519 SSH-Schlüssel und kopierst diesen anschließend sicher auf den Server '192.168.1.10' für den User 'admin'?",
        "answer": "1. Generieren: `ssh-keygen -t ed25519` (oder mit Kommentar: `ssh-keygen -t ed25519 -C \"admin@server\"`)\n2. Kopieren: `ssh-copy-id admin@192.168.1.10`",
        "validationType": "concept",
        "keywords": [
            "ssh-keygen",
            "ed25519",
            "ssh-copy-id",
            "authorized_keys",
            "admin@192.168.1.10"
        ],
        "moreInfo": "### 1. tl;dr\nErzeuge den Schlüssel mit `ssh-keygen -t ed25519`, setze ein sicheres Passwort und transferiere den öffentlichen Teil (Public Key) mit `ssh-copy-id admin@192.168.1.10` auf den Zielserver. Das Skript trägt ihn automatisch sicher in die `authorized_keys` ein.\n---\n> **Tux-Ansage:** Hör auf, antike RSA-Schlüssel zu generieren, wir sind nicht mehr in den 2000ern! Ed25519 ist klein, schnell und bricht dir nicht die Finger. Und pass auf deinen Private Key auf – der bleibt auf deinem Rechner! Nur der Public Key geht auf Reisen.\n---\n### 3. Deep Dive\n- **Warum ED25519?** Es basiert auf elliptischen Kurven (Curve25519). Die Schlüssel sind winzig (im Vergleich zu RSA-4096), rasend schnell beim Verbindungsaufbau und gelten kryptographisch als extrem sicher gegen moderne Angriffe.\n- **Der Ablauf:** `ssh-keygen` erzeugt zwei Dateien: den privaten Schlüssel (`id_ed25519`) und den öffentlichen (`id_ed25519.pub`). Die Passphrase, die beim Generieren abgefragt wird, verschlüsselt den privaten Schlüssel lokal auf deiner Festplatte.\n- **ssh-copy-id:** Dieses Tool erspart dir manuelle Arbeit. Ohne `ssh-copy-id` müsstest du dich per Passwort anmelden, das Verzeichnis `~/.ssh` anlegen (Rechte `700`), die Datei `~/.ssh/authorized_keys` anlegen (Rechte `600`) und den Inhalt deines `.pub`-Keys dort anhängen. `ssh-copy-id` macht all das automatisch und fehlerfrei.\n- **Absicherung:** Nach erfolgreichem Test solltest du in der `/etc/ssh/sshd_config` auf dem Server den Parameter `PasswordAuthentication no` setzen. Damit ist der Server immun gegen Passwort-Bruteforcing.",
        "topicId": 28,
        "difficulty": "mittel"
    },
    {
        "id": 128,
        "category": "9. Fortgeschrittene Administration",
        "question": "Wie kopierst du eine Datei von deinem PC auf einen Server?",
        "answer": "Mit dem Befehl 'scp' (Secure Copy). Zum Beispiel: 'scp datei.txt user@server:/zielordner'.",
        "validationType": "concept",
        "topicId": 28,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`scp` kopiert Dateien sicher übers Netzwerk, es nutzt im Hintergrund das SSH-Protokoll.\n---\n> **Tux-Ansage:** \"SCP ist wie CP, nur dass es durch die Firewall deines ungeduldigen Admins kommt.\"\n---\n### 3. Deep Dive\n`scp` verhält sich bei der Syntax fast exakt wie der lokale Befehl `cp`, nur dass Quelle oder Ziel einen Benutzernamen und einen Hostnamen enthalten, getrennt durch einen Doppelpunkt (`user@host:/pfad`). Es baut unter der Haube eine ganz normale SSH-Verbindung auf und profitiert somit von denselben Authentifizierungsmethoden (wie SSH-Keys) und der gleichen Verschlüsselung."
    },
    {
        "id": 228,
        "category": "9. Fortgeschrittene Administration",
        "question": "Warum wird oft 'rsync' anstelle von 'scp' für große Backups verwendet?",
        "answer": "'rsync' berechnet Deltas (Unterschiede) und überträgt nur veränderte Dateiblöcke. Zudem kann es abgebrochene Transfers fortsetzen, Rechte beibehalten (-a) und alte Dateien am Ziel löschen (--delete).",
        "validationType": "concept",
        "topicId": 28,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\n`rsync` ist deutlich intelligenter als `scp`, da es nur Änderungen (Deltas) überträgt und abgebrochene Kopien fortsetzt.\n---\n> **Tux-Ansage:** \"SCP für eine Datei, Rsync für das Backup. Wenn du 50 Gigabyte mit SCP neu startest, weil das WLAN kurz weg war, bist du selber schuld!\"\n---\n### 3. Deep Dive\n`scp` kopiert stumpf Datei für Datei. Ist die Datei am Ziel schon vorhanden, wird sie komplett überschrieben. `rsync` hingegen nutzt einen komplexen Algorithmus, der Dateien in Blöcke unterteilt und Hash-Werte vergleicht. Wenn sich eine 1 GB große Log-Datei nur um 5 MB am Ende geändert hat, überträgt rsync nur diese 5 MB. Das spart massiv Bandbreite und Zeit. Der Parameter `-a` (archive mode) sorgt dafür, dass Symlinks, Rechte, Besitzer und Zeitstempel exakt erhalten bleiben, was es perfekt für Backups macht."
    },
    {
        "id": 29,
        "category": "9. Fortgeschrittene Administration",
        "question": "Ein Systemd-Dienst namens 'web-app.service' stürzt ständig ab. Wie zeigst du dir in Echtzeit (-f) die aktuellsten 50 Log-Einträge (-n) dieses Dienstes an?",
        "answer": "`journalctl -u web-app.service -n 50 -f`\n\n`-u`: Unit (Dienst filtern)\n`-n 50`: Zeige die letzten 50 Zeilen\n`-f`: Follow (Echtzeit-Aktualisierung wie bei `tail -f`)",
        "validationType": "command",
        "solutions": [
            "journalctl\\s+-u\\s+web-app\\.service\\s+-n\\s+50\\s+-f",
            "journalctl\\s+-f\\s+-n\\s+50\\s+-u\\s+web-app\\.service",
            "journalctl\\s+-u\\s+web-app\\.service\\s+-fn\\s+50"
        ],
        "moreInfo": "### 1. tl;dr\nMit `journalctl -u web-app.service -n 50 -f` greifst du präzise auf die systemd-Logs deines Dienstes zu, siehst die letzten 50 Meldungen und bleibst live im Stream. Ideal zur Fehlersuche bei abkratzenden Diensten.\n---\n> **Tux-Ansage:** Wenn ein systemd-Dienst stirbt, starr nicht auf `systemctl status`! Das Journal weiß, was passiert ist. Und wenn du nicht weißt, wie man das Log filtert, ertrinkst du in Meldungen. Nutze `-f` und schau dem Crash live bei der Arbeit zu!\n---\n### 3. Deep Dive\n- **systemd-journald:** Bei modernen Linux-Systemen werden Logs nicht mehr (nur) als Textdateien nach `/var/log` geschrieben, sondern landen binär in systemd-journald. Der Befehl `journalctl` ist dein Leser für diese Binärdaten.\n- **Vorteile der binären Logs:** Da journald Metadaten mitspeichert, kannst du extrem mächtig filtern. Neben der Unit (`-u`) kannst du nach Priorität filtern (`-p err` für Fehler), nach Zeit (`--since \"1 hour ago\"`) oder dir gezielt den Output des letzten Boots anschauen (`-b -1`).\n- **JSON Output:** Wenn du Automatisierung betreibst, kannst du dir die Logs strukturiert ausgeben lassen: `journalctl -u web-app.service -o json-pretty`.",
        "topicId": 29,
        "difficulty": "mittel"
    },
    {
        "id": 129,
        "category": "9. Fortgeschrittene Administration",
        "question": "Wie findest du die IP-Adresse deines Linux-Rechners heraus?",
        "answer": "Mit dem Befehl 'ip a' (oder veraltet 'ifconfig').",
        "validationType": "concept",
        "topicId": 29,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`ip a` (kurz für `ip address`) zeigt alle Netzwerkschnittstellen und deren IP-Adressen an.\n---\n> **Tux-Ansage:** \"Vergiss `ifconfig`! Wer das heute noch tippt, lebt geistig noch in den 90ern.\"\n---\n### 3. Deep Dive\nDer Befehl `ip` gehört zum Paket `iproute2`, welches das veraltete `net-tools` Paket (das `ifconfig` und `route` enthielt) in Linux schon vor Jahren abgelöst hat. `ip a` listet Schnittstellen wie `lo` (Loopback, 127.0.0.1), `eth0` / `enp3s0` (Ethernet) oder `wlan0` (WLAN) auf und zeigt neben der IPv4-Adresse (inet) auch IPv6-Adressen (inet6), MAC-Adressen (link/ether) und den Status (UP/DOWN) an."
    },
    {
        "id": 229,
        "category": "9. Fortgeschrittene Administration",
        "question": "Was ist die CIDR-Notation und was bedeutet ein '/24' bei einer IP wie 192.168.1.10/24?",
        "answer": "CIDR steht für Classless Inter-Domain Routing. Die Zahl nach dem Slash gibt die Anzahl der Netzwerk-Bits an. Ein /24 entspricht der Subnetzmaske 255.255.255.0 und erlaubt 254 Hosts im Subnetz.",
        "validationType": "concept",
        "topicId": 29,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nCIDR ist eine Kurzschreibweise für Subnetzmasken. `/24` bedeutet, dass die ersten 24 Bit das Netzwerk markieren.\n---\n> **Tux-Ansage:** \"Zähl mit mir: 8, 16, 24! Wer Subnetting nicht im Kopf kann, hat das Netzwerk nicht verstanden.\"\n---\n### 3. Deep Dive\nEine IPv4-Adresse besteht aus 32 Bits (4 Blöcke à 8 Bit, auch Oktette genannt). Die Schreibweise `/24` besagt, dass die ersten 24 Bits (also die ersten drei Zahlenblöcke wie 192.168.1) das Netzwerk definieren. Es verbleiben 8 Bits (32 - 24 = 8) für die Host-Adressen. 2^8 ergibt 256 mögliche Adressen. Abzüglich der Netzwerk-Adresse (die kleinste, meist .0) und der Broadcast-Adresse (die größte, meist .255) bleiben 254 nutzbare IP-Adressen für Geräte."
    },
    {
        "id": 30,
        "category": "9. Fortgeschrittene Administration",
        "question": "Du vermutest, dass ein Prozess deinen Port 8080 blockiert. Welchen Befehl (netstat oder ss) nutzt du, um den Prozess (inkl. PID) zu finden, der an diesen Port gebunden ist?",
        "answer": "**Modern (empfohlen):** `sudo ss -tulnp | grep 8080`\n**Klassisch (veraltet):** `sudo netstat -tulnp | grep 8080`\n\nWichtig ist `sudo` und das `-p` Flag, um die dazugehörige Prozess-ID (PID) anzeigen zu dürfen.",
        "validationType": "command",
        "solutions": [
            "ss\\s+-.*p.*\\s+\\|\\s+grep\\s+8080",
            "netstat\\s+-.*p.*\\s+\\|\\s+grep\\s+8080",
            "lsof\\s+-i\\s*:8080"
        ],
        "moreInfo": "### 1. tl;dr\nUm den Blockierer von Port 8080 zu entlarven, wirfst du `sudo ss -tulnp | grep 8080` ins Terminal. `ss` ist das moderne Tool der Wahl, und die Flags (TCP, UDP, Listening, Numeric, Process) liefern dir punktgenau die PID, die du dann mit `kill` beseitigen kannst.\n---\n> **Tux-Ansage:** `netstat` ist tot, lang lebe `ss`! Gewöhn dir die neuen Werkzeuge an. Und hör auf zu weinen, wenn dir das Tool keine Prozesse anzeigt – ohne `sudo` bist du ein Niemand und der Kernel erzählt dir gar nichts über fremde Prozesse!\n---\n### 3. Deep Dive\n- **ss vs netstat:** `netstat` gehört zu den alten `net-tools` (zusammen mit `ifconfig`), die auf Linux seit Jahren als deprecated (veraltet) markiert sind. Das `iproute2`-Paket bringt moderne Ersatzwerkzeuge mit: `ip` (statt ifconfig) und `ss` (Socket Statistics, statt netstat). `ss` redet direkt über Netlink-Sockets mit dem Kernel und ist signifikant schneller.\n- **Die Parameter-Kombination `-tulnp`:**\n  - `-t` und `-u`: Zeigt TCP- und UDP-Sockets an.\n  - `-l`: Filtert auf Sockets, die auf Verbindungen *lauschen* (Listen), statt alle aktiven Verbindungen (Established) auszuspucken.\n  - `-n`: Verhindert DNS-Lookups (Numerische Anzeige). Das beschleunigt den Befehl massiv, da nicht auf langsame DNS-Timeouts gewartet wird.\n  - `-p`: Gibt den Prozessnamen und die PID aus. Da Prozesse oft unter anderen User-Accounts laufen (z.B. Root oder einem Dienst-User), benötigt `-p` unbedingt `sudo`.\n- **Alternative:** Auch `sudo lsof -i :8080` (List Open Files) ist ein hervorragendes Werkzeug für diese Aufgabe.",
        "topicId": 30,
        "difficulty": "mittel"
    },
    {
        "id": 130,
        "category": "9. Fortgeschrittene Administration",
        "question": "Was macht 'ping 8.8.8.8'?",
        "answer": "Es schickt kleine Datenpakete an den Google-Server (8.8.8.8), um zu testen, ob die Internetverbindung funktioniert.",
        "validationType": "concept",
        "topicId": 30,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`ping` sendet Test-Pakete an eine IP, um zu prüfen, ob der Server erreichbar ist und wie lange die Antwort dauert.\n---\n> **Tux-Ansage:** \"Ping ist der Pulsfühler des Netzwerks. Wenn der Ping nicht durchkommt, spar dir den Versuch mit dem Webbrowser.\"\n---\n### 3. Deep Dive\n`ping` ist das absolute Basiswerkzeug zur Fehlerdiagnose (Troubleshooting). Es misst die \"Round-Trip Time\" (RTT), also die Zeit in Millisekunden, die ein Paket zum Ziel und wieder zurück benötigt. Zudem zeigt es Paketverluste (Packet Loss) an, was auf schlechte WLAN-Verbindungen oder überlastete Router hindeuten kann. Unter Linux läuft `ping` standardmäßig endlos, bis man es mit `Strg + C` abbricht."
    },
    {
        "id": 230,
        "category": "9. Fortgeschrittene Administration",
        "question": "Welches Protokoll nutzt 'ping' und wofür ist der TTL-Wert in der Antwort?",
        "answer": "'ping' nutzt das ICMP-Protokoll (Echo Request/Reply). Die TTL (Time To Live) verhindert, dass Pakete endlos kreisen. Sie wird von jedem Router um 1 dekrementiert; bei 0 wird das Paket verworfen.",
        "validationType": "concept",
        "topicId": 30,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\n`ping` nutzt ICMP. Die TTL (Time To Live) verhindert Endlosschleifen von Paketen im Internet.\n---\n> **Tux-Ansage:** \"Ohne TTL würden irregeleitete Pakete für immer durchs Netz kreisen und das Internet zumüllen. Gut, dass das nicht geht!\"\n---\n### 3. Deep Dive\nICMP (Internet Control Message Protocol) arbeitet auf der Netzwerkschicht und nutzt keine Ports wie TCP oder UDP. Die TTL (Time To Live) ist ein 8-Bit-Feld im IP-Header. Es ist keine echte Zeitangabe, sondern ein \"Hop-Zähler\". Jedes Mal, wenn ein Router das Paket weiterleitet, zieht er 1 von der TTL ab. Fällt der Wert auf 0, wirft der Router das Paket weg und sendet eine \"ICMP Time Exceeded\" Nachricht zurück. Das verhindert, dass Pakete bei fehlerhaftem Routing ewig im Kreis laufen (Routing Loops)."
    },
    {
        "id": 31,
        "category": "9. Fortgeschrittene Administration",
        "question": "Was bewirkt der folgende Cronjob und wann genau wird er ausgeführt?\n`30 2 * * 0 /opt/scripts/backup.sh`",
        "answer": "Der Befehl führt das Skript `/opt/scripts/backup.sh` aus.\n**Wann:** Jeden Sonntag (`0`) um exakt 02:30 Uhr nachts.\n\nReihenfolge der Cron-Felder: `Minute (30) | Stunde (2) | Tag (*) | Monat (*) | Wochentag (0)`",
        "validationType": "concept",
        "keywords": [
            "sonntag",
            "wochentag",
            "02:30",
            "2:30",
            "nachts",
            "backup.sh"
        ],
        "moreInfo": "### 1. tl;dr\nDieser Cronjob feuert gnadenlos jeden Sonntag um 02:30 Uhr nachts dein Backup-Skript ab. Die Sternchen (`*`) stehen für \"egal welcher Tag im Monat, egal welcher Monat\".\n---\n> **Tux-Ansage:** Cronjobs sind das Rückgrat der Automatisierung! Wenn du Minute und Stunde vertauschst, läuft dein Backup nicht nachts um zwei, sondern jeden Tag um halb eins. Lern die fünf Spalten auswendig, oder schreib sie dir auf die Stirn!\n---\n### 3. Deep Dive\n- **Die 5 Zeitfelder:** Die Syntax von Cron (`Minute Stunde Tag Monat Wochentag`) ist kryptisch, aber universell. Ein Stern `*` bedeutet „jeder mögliche Wert“. Der Wochentag `0` steht für Sonntag (oft funktioniert auch `7` für Sonntag). \n- **Logik bei Tag und Wochentag:** Eine Besonderheit von Cron: Wenn du sowohl ein bestimmtes Datum als auch einen bestimmten Wochentag angibst (z.B. `0 0 13 * 5`), werden diese mit ODER verknüpft! Das Skript würde an jedem Freitag UND an jedem 13. des Monats ausgeführt.\n- **Umgebung (Environment):** Cron führt Skripte in einer extrem rudimentären Umgebung aus (oft nur `/bin` und `/usr/bin` im `$PATH`). Viele Skripte crashen als Cronjob, obwohl sie im Terminal funktionieren, weil Pfade zu Befehlen fehlen. Nutze in Cron-Skripten absolute Pfade (z.B. `/usr/local/bin/docker`) oder definiere den `PATH` am Anfang der Crontab-Datei.\n- **Logging:** Cron wirft Ausgaben (STDOUT/STDERR) per Mail an local User ab. Wenn kein Mailserver konfiguriert ist, landen Fehler im Nirgendwo. Gute Praxis: Umleiten der Ausgabe ans Ende des Jobs anhängen, z.B. `>> /var/log/backup.log 2>&1`.",
        "topicId": 31,
        "difficulty": "mittel"
    },
    {
        "id": 131,
        "category": "9. Fortgeschrittene Administration",
        "question": "Welche Datei ist zuständig für die Umwandlung von Namen (wie 'google.de') in IP-Adressen?",
        "answer": "Die Datei '/etc/hosts' für manuelle Einträge und die '/etc/resolv.conf' für die DNS-Server.",
        "validationType": "concept",
        "topicId": 31,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`/etc/hosts` übersetzt Namen lokal und statisch. `/etc/resolv.conf` teilt dem System mit, welchen DNS-Server es befragen soll.\n---\n> **Tux-Ansage:** \"DNS-Probleme sind immer DNS-Probleme. Und wenn du denkst, es ist kein DNS-Problem, ist es trotzdem DNS!\"\n---\n### 3. Deep Dive\nDie Datei `/etc/hosts` ist das Relikt aus der Frühzeit des Internets, bevor es DNS gab. Hier kannst du IP-Adressen manuell Hostnamen zuordnen (z.B. `127.0.0.1 localhost`). Das ist nützlich für lokale Entwicklungen oder um Werbung zu blockieren. Die `/etc/resolv.conf` hingegen enthält Einträge wie `nameserver 1.1.1.1`. Wenn ein Name nicht in der `hosts` Datei steht, fragt das System diesen dort konfigurierten DNS-Server."
    },
    {
        "id": 231,
        "category": "9. Fortgeschrittene Administration",
        "question": "Welche Funktion hat '/etc/nsswitch.conf' im Kontext der Namensauflösung?",
        "answer": "Sie definiert die Reihenfolge der Namensauflösung (Name Service Switch). Ein Eintrag wie 'hosts: files dns' weist das System an, *zuerst* in der lokalen /etc/hosts (files) nachzusehen und *danach* den DNS-Server zu befragen.",
        "validationType": "concept",
        "topicId": 31,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\n`nsswitch.conf` steuert die Reihenfolge, in der Systembibliotheken nach Informationen wie Hostnamen oder Benutzern suchen.\n---\n> **Tux-Ansage:** \"Wer meint, alles sei fest im Code verdrahtet, hat noch nie in die nsswitch geschaut. Linux ist flexibel wie ein Gummiband!\"\n---\n### 3. Deep Dive\nNSS (Name Service Switch) ist eine zentrale C-Bibliothek (glibc) Funktionalität. Wenn ein Programm wie `ping` oder `curl` einen Hostnamen auflösen will, ruft es eine Funktion wie `gethostbyname()`. Die Datei `/etc/nsswitch.conf` sagt dieser Funktion, wo sie suchen soll. Ein Eintrag `hosts: files dns` bedeutet: 'Schau zuerst in lokalen Dateien (`/etc/hosts`) nach. Nur wenn du da nichts findest, frage den DNS-Dienst (`resolv.conf`).' Das gilt nicht nur für Hosts, sondern auch für Benutzer (`passwd: files ldap`), Passwörter und Gruppen."
    }
];

// Storage Helper to prevent crash on file:// protocol in some browsers
const safeStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("localStorage is not available (e.g. running from file://). Falling back to session memory.", e);
            return this._fallback[key] || null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("localStorage is not available (e.g. running from file://). Falling back to session memory.", e);
            this._fallback[key] = value;
        }
    },
    _fallback: {}
};

// App State
let state = {
    mode: 'quiz',
    examScore: 0,
    examMistakes: [],
    examStartTime: null,
    examFinished: false, // 'quiz' or 'flashcard'
    difficulty: 'auto', // 'auto', 'leicht', 'mittel', 'schwer'
    currentDifficulty: 'mittel', // Die aktuell ausgewählte Schwierigkeit für die nächste Frage
    currentQuestionStartTime: 0,
    currentIndex: 0,
    filteredQuestions: [],
    selectedCategories: new Set(['all']),
    llmConfig: {
        url: '',
        model: '',
        key: ''
    },
    stats: {
        points: 0,
        possiblePoints: 0,
        answered: 0,
        streak: 0,
        lastPlayed: null,
        adaptiveHistory: []
    }
};

// UI Elements
const el = {
    btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
    btnQuiz: document.getElementById('mode-quiz'),
    btnFlashcard: document.getElementById('mode-flashcard'),
    btnDiffAuto: document.getElementById('diff-auto'),
    btnDiffLeicht: document.getElementById('diff-leicht'),
    btnDiffMittel: document.getElementById('diff-mittel'),
    btnDiffSchwer: document.getElementById('diff-schwer'),
    diffBubbleVal: document.getElementById('difficulty-val'),
    diffBubble: document.getElementById('diff-bubble'),
    catList: document.getElementById('dynamic-modules-container'),
    catAll: document.getElementById('cat-all'),
    questionText: document.getElementById('question-text'),
    answerContainer: document.getElementById('answer-container'),
    answerText: document.getElementById('answer-text'),
    btnReveal: document.getElementById('btn-reveal'),
    btnIdk: document.getElementById('btn-idk'),
    ratingControls: document.getElementById('rating-controls'),
    btnFcNext: document.getElementById('btn-fc-next'),
    btnPrev: document.getElementById('btn-prev'),
    btnSkip: document.getElementById('btn-skip'),
    btnMoreInfo: document.getElementById('btn-more-info'),
    moreInfoWrapper: document.getElementById('more-info-wrapper'),
    moreInfoContent: document.getElementById('more-info-content'),
    moreInfoText: document.getElementById('more-info-text'),
    progressText: document.getElementById('question-progress-text'),
    categoryBadge: document.getElementById('question-category-badge'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    streakVal: document.getElementById('streak-val'),
    progressPercent: document.getElementById('progress-percent'),
    statPoints: document.getElementById('stat-points'),
    statAccuracy: document.getElementById('stat-accuracy'),
    toastContainer: document.getElementById('toast-container'),
    card: document.getElementById('quiz-card'),
    userAnswer: document.getElementById('user-answer'),
    feedbackContainer: document.getElementById('feedback-container'),
    feedbackBadge: document.getElementById('feedback-badge'),
    feedbackDetails: document.getElementById('feedback-details'),
    userInputGroup: document.getElementById('user-input-group'),
    inputApiUrl: document.getElementById('llm-api-url'),
    inputProvider: document.getElementById('llm-provider'),
    inputModel: document.getElementById('llm-model'),
    inputApiKey: document.getElementById('llm-api-key'),
    btnSaveKey: document.getElementById('btn-save-key'),
    apiStatusLight: document.getElementById('api-status-light'),
    apiStatusText: document.getElementById('api-status-text'),
    btnTestApi: document.getElementById('btn-test-api')
};

function parseMarkdown(text) {
    if (!text) return '';
    
    // Escape HTML first
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Code blocks ```code```
    html = html.replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>');

    // Blockquotes (starts with &gt; because of HTML escaping above)
    // We group multiple consecutive blockquote lines into one blockquote tag
    html = html.replace(/(?:^|\n)&gt;[ \t]*(.*(?:\n&gt;[ \t]*.*)*)/g, (match, p1) => {
        const cleanContent = p1.replace(/\n&gt;[ \t]*/g, '<br>');
        return `\n<blockquote>${cleanContent}</blockquote>\n`;
    });

    // Bold text **text**
    html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text *text* or _text_
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

    // Headers
    html = html.replace(/^### (.*$)/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.*$)/gm, '<h2>$1</h2>');

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Lists (bullet points starting with "* " or "- ")
    const lines = html.split('\n');
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
        // Skip list processing inside pre/code or blockquotes
        if (lines[i].includes('<pre>') || lines[i].includes('<blockquote>')) continue;
        
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
            let itemContent = trimmed.replace(/^(\* |- |\d+\.\s)/, '');
            if (!inList) {
                lines[i] = '<ul><li>' + itemContent + '</li>';
                inList = true;
            } else {
                lines[i] = '<li>' + itemContent + '</li>';
            }
        } else {
            if (inList) {
                // If line is empty, close list. If not empty, maybe it's a new paragraph?
                lines[i] = '</ul>\n' + lines[i];
                inList = false;
            }
        }
    }
    
    if (inList) {
        lines.push('</ul>');
    }
    
    html = lines.join('\n');
    
    // Convert double newlines to paragraphs (very basic)
    html = html.split(/\n\s*\n/).map(p => {
        if (p.trim().startsWith('<') && !p.trim().startsWith('<strong>') && !p.trim().startsWith('<em>')) return p; // Don't wrap existing block elements
        return p.trim() ? `<p>${p.trim().replace(/\n/g, '<br>')}</p>` : '';
    }).join('\n');

    return html;
}

// Show Toast message
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'danger' || type === 'error') icon = '❌';
    
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;
    el.toastContainer.appendChild(toast);
    
    // Fehler sollen 10 Sekunden sichtbar bleiben, alles andere 3 Sekunden.
    const duration = (type === 'danger' || type === 'error') ? 10000 : 3000;
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

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
        summary.style.background = 'rgba(0,0,0,0.2)';
        summary.style.borderRadius = '4px';
        summary.style.marginBottom = '4px';
        summary.style.fontWeight = 'bold';
        summary.style.fontFamily = 'monospace';
        summary.style.color = '#4ade80';

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
        childrenContainer.style.borderLeft = '2px solid #1f3a1f';
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
            tagsHtml += `<span class="keyword-tag matched">✓ ${kw}</span>`;
        });
        unmatched.forEach(kw => {
            tagsHtml += `<span class="keyword-tag unmatched">✗ ${kw}</span>`;
        });
        tagsHtml += '</div>';
        
        return {
            rating: rating,
            text: `${ratingText}<br><br>Erkannte Kernbegriffe (${matchedCount} von ${totalCount}):${tagsHtml}`
        };
    }
}

// Generic fetch with CORS proxy fallback
async function fetchWithProxyFallback(url, options) {
    try {
        const response = await fetch(url, options);
        return response;
    } catch (e) {
        if (e.name === 'TypeError' || (e.message && e.message.toLowerCase().includes('fetch'))) {
            console.warn("Direct fetch failed (CORS/Network Error), using local proxy...", e);
            const proxyResponse = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                    text: apiResponse.feedback
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
        el.moreInfoText.innerHTML = `<span style="color: #ef4444;">Fehler beim Abrufen der Zusatzinformationen: ${error.message}</span>`;
        el.btnMoreInfo.textContent = "Fehler - Erneut versuchen";
        el.btnMoreInfo.disabled = false;
    }
}

// Stats and LocalStorage management
function loadStats() {
    const saved = safeStorage.getItem('linux_quiz_stats_v2');
    if (saved) {
        state.stats = JSON.parse(saved);
        if (!state.stats.adaptiveHistory) state.stats.adaptiveHistory = [];
        checkStreak();
    } else {
        state.stats = {
            pointsSelf: 0,
            pointsAI: 0,
            possiblePoints: 0,
            answered: 0,
            streak: 0,
            lastPlayed: null,
            adaptiveHistory: []
        };
    }
    // Load LLM Config
    
    window.reloadLlmConfig = () => {
        const cfg = safeStorage.getItem('llm_config');
        if (cfg) {
            try {
                state.llmConfig = JSON.parse(cfg);
                el.inputApiUrl.value = state.llmConfig.url || '';
                el.inputModel.value = state.llmConfig.model || '';
                el.inputApiKey.value = state.llmConfig.key || '';
                if (state.llmConfig.provider) {
                    el.inputProvider.value = state.llmConfig.provider;
                    if (state.llmConfig.provider === 'custom') {
                        el.inputApiUrl.style.display = 'block';
                    }
                }
                resetApiUI();
            } catch(e){}
        }
    };

    const llmCfg = safeStorage.getItem('llm_config');
    if (llmCfg) {
        try {
            state.llmConfig = JSON.parse(llmCfg);
            el.inputApiUrl.value = state.llmConfig.url || '';
            el.inputModel.value = state.llmConfig.model || '';
            el.inputApiKey.value = state.llmConfig.key || '';
            if (state.llmConfig.provider) {
                el.inputProvider.value = state.llmConfig.provider;
                if (state.llmConfig.provider === 'custom') {
                    el.inputApiUrl.style.display = 'block';
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
    
    updateStatsUI();
}

function saveStats() {
    safeStorage.setItem('linux_quiz_stats_v2', JSON.stringify(state.stats));
    updateStatsUI();
}

window.syncStateWithUser = function(user) {
    if (!user) {
        // Reset to local or zero
        state.stats.answered = 0;
        state.stats.streak = 0;
        state.stats.pointsSelf = 0;
        state.stats.lastPlayed = null;
    } else {
        state.stats.answered = user.answered_total || 0;
        state.stats.streak = user.streak || 0;
        state.stats.lastPlayed = user.last_played ? parseInt(user.last_played, 10) : null;
        // Keep pointsSelf local for now or derive from XP if needed
    }
    updateStatsUI();
};

function checkStreak() {
    if (!state.stats.lastPlayed) return;
    
    let lastTs = state.stats.lastPlayed;
    if (typeof lastTs === 'string') lastTs = parseInt(lastTs, 10);
    
    const today = new Date().toDateString();
    const last = new Date(lastTs).toDateString();
    
    if (today === last) return; // Already played today
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (last === yesterdayStr) {
        // Continuous play
        // Streak is incremented on first answer of the day, handled separately or kept here
    } else {
        // Streak broken
        state.stats.streak = 0;
    }
}

function updateStatsUI() {
    el.streakVal.textContent = `${state.stats.streak} Tage`;
    
    // Daily Stats
    const today = new Date().toDateString();
    let dailyAnswered = 0;
    let dailyPoints = 0;
    
    if (state.stats.dailyStats && state.stats.dailyStats.date === today) {
        dailyAnswered = state.stats.dailyStats.answered || 0;
        dailyPoints = state.stats.dailyStats.points || 0;
    }
    
    const dailyAccuracy = dailyAnswered > 0 ? Math.round((dailyPoints / dailyAnswered) * 100) : 0;
    
    const elDailyQ = document.getElementById('daily-q');
    const elDailyR = document.getElementById('daily-r');
    const elDailyP = document.getElementById('daily-p');
    
    if (elDailyQ && elDailyR && elDailyP) {
        elDailyQ.textContent = dailyAnswered;
        elDailyR.textContent = Number.isInteger(dailyPoints) ? dailyPoints : dailyPoints.toFixed(1);
        elDailyP.textContent = `${dailyAccuracy}%`;
        
        // Traffic light color coding for the percentage only
        if (dailyAnswered === 0) {
            elDailyP.style.color = 'var(--text-color)';
        } else if (dailyAccuracy === 100) {
            elDailyP.style.color = '#4ade80'; // Green
        } else if (dailyAccuracy >= 70) {
            elDailyP.style.color = '#eab308'; // Yellow
        } else {
            elDailyP.style.color = '#ef4444'; // Red
        }
    }
    
    // Separate Point displays
    const pSelf = state.stats.pointsSelf || 0;
    const pAI = state.stats.pointsAI || 0;
    const pPossible = state.stats.possiblePoints || 0;
    
    const statSelf = document.getElementById('stat-points-self');
    if(statSelf) statSelf.textContent = `${pSelf.toFixed(1)} / ${pPossible}`;
    
    const statAi = document.getElementById('stat-points-ai');
    if(statAi) statAi.textContent = `${pAI.toFixed(1)} / ${pPossible}`;
    
    const accuracy = pPossible > 0 
        ? Math.round((pSelf / pPossible) * 100)
        : 0;
    const statAcc = document.getElementById('stat-accuracy');
    if(statAcc) statAcc.textContent = `${accuracy}%`;
    
    const statAns = document.getElementById('stat-answered');
    if(statAns) statAns.textContent = state.stats.answered;

    const elTotalQ = document.getElementById('total-q');
    if (elTotalQ) elTotalQ.textContent = state.stats.answered;
}

function updateDifficultyUI() {
    if (el.btnDiffAuto) {
        el.btnDiffAuto.classList.toggle('active', state.difficulty === 'auto');
        el.btnDiffLeicht.classList.toggle('active', state.difficulty === 'leicht');
        el.btnDiffMittel.classList.toggle('active', state.difficulty === 'mittel');
        el.btnDiffSchwer.classList.toggle('active', state.difficulty === 'schwer');
    }
    if (el.diffBubbleVal) {
        let text = state.currentDifficulty.charAt(0).toUpperCase() + state.currentDifficulty.slice(1);
        if (state.difficulty === 'auto') text += ' (Auto)';
        el.diffBubbleVal.textContent = text;
        
        el.diffBubble.style.borderColor = 
            state.currentDifficulty === 'leicht' ? '#4ade80' : 
            state.currentDifficulty === 'mittel' ? '#eab308' : '#ef4444';
        el.diffBubbleVal.style.color = el.diffBubble.style.borderColor;
    }
}

function handleRating(pointsSelf, pointsAI, isFlagged = false) {
    const q = state.filteredQuestions[state.currentIndex];
    let difficultyWeight = 1;
    if (q && q.difficulty === 'medium') difficultyWeight = 2;
    if (q && q.difficulty === 'hard') difficultyWeight = 3;
    
    const scaledPointsSelf = pointsSelf * difficultyWeight;
    const scaledPointsAI = pointsAI * difficultyWeight;

    const today = new Date().toDateString();
    let lastTs = state.stats.lastPlayed;
    if (typeof lastTs === 'string') lastTs = parseInt(lastTs, 10);
    const last = lastTs ? new Date(lastTs).toDateString() : null;
    
    // Initialize or reset daily stats if it's a new day
    if (!state.stats.dailyStats || state.stats.dailyStats.date !== today) {
        state.stats.dailyStats = {
            date: today,
            answered: 0,
            points: 0
        };
    }
    
    if (last !== today) {
        state.stats.streak += 1;
        showToast(`Tägliche Serie aktiv! ${state.stats.streak} Tage 🔥`, 'success');
    }
    
    state.stats.lastPlayed = new Date().getTime();
    state.stats.pointsSelf += scaledPointsSelf;
    state.stats.pointsAI += scaledPointsAI;
    state.stats.possiblePoints += difficultyWeight;
    state.stats.answered += 1;
    sessionAnswered += 1;
    if (scaledPointsSelf > 0) sessionCorrect += 1;
    if (typeof updateSessionStatsUI === 'function') updateSessionStatsUI();
    
    // Update daily stats
    state.stats.dailyStats.answered += 1;
    state.stats.dailyStats.points += scaledPointsSelf;
    
    // Adaptive Logik
    if (state.difficulty === 'auto') {
        const timeTaken = (Date.now() - state.currentQuestionStartTime) / 1000;
        let score = 0;
        if (pointsSelf === 1.0 && timeTaken < 25) score = 1;
        else if (pointsSelf <= 0.5) score = -1;
        
        state.stats.adaptiveHistory.push(score);
        if (state.stats.adaptiveHistory.length > 5) {
            state.stats.adaptiveHistory.shift();
        }
        
        let diffChanged = false;
        if (state.stats.adaptiveHistory.length === 5) {
            const sum = state.stats.adaptiveHistory.reduce((a, b) => a + b, 0);
            if (sum === 5) {
                if (state.currentDifficulty === 'leicht') { state.currentDifficulty = 'mittel'; diffChanged = true; }
                else if (state.currentDifficulty === 'mittel') { state.currentDifficulty = 'schwer'; diffChanged = true; }
                if (diffChanged) state.stats.adaptiveHistory = [];
            } else if (sum === -5) {
                if (state.currentDifficulty === 'schwer') { state.currentDifficulty = 'mittel'; diffChanged = true; }
                else if (state.currentDifficulty === 'mittel') { state.currentDifficulty = 'leicht'; diffChanged = true; }
                if (diffChanged) state.stats.adaptiveHistory = [];
            }
        }
        if (diffChanged) {
            showToast("Schwierigkeit automatisch angepasst auf: " + state.currentDifficulty.toUpperCase(), "warning");
            updateDifficultyUI();
            updateFilteredQuestions();
            saveStats();
            if (typeof syncBackendXp === 'function') {
                syncBackendXp(scaledPointsSelf, state.stats.streak, 1, pointsSelf === 1 ? 1 : 0, 0, state.stats.lastPlayed);
            }
            setTimeout(() => {
                renderCurrentQuestion();
            }, 1000);
            return;
        }
    }

    saveStats();
    
    // Auth-Sync
    if (typeof syncBackendXp === 'function') {
        syncBackendXp(scaledPointsSelf, state.stats.streak, 1, pointsSelf === 1 ? 1 : 0, 0, state.stats.lastPlayed);
    }
    
    if (isFlagged) {
        showToast("🚩 Frage zum Nachlernen markiert. (Gewertet mit " + pointsSelf + " Pt)", "warning");
    } else {
        showToast("Gewertet: Du " + pointsSelf + " | KI " + pointsAI, 'info');
    }
    
    // Auto advance
    setTimeout(() => {
        if (state.currentIndex < state.filteredQuestions.length - 1) {
            state.currentIndex++;
            renderCurrentQuestion();
        } else {
            showToast("Quiz beendet! Du hast alle Fragen dieser Runde beantwortet.", "success");
            // Reshuffle and start over
            updateFilteredQuestions();
        }
    }, 800);
}

// Reset stats
function resetStats() {
    if (confirm("Möchtest du deine Lernstatistiken wirklich zurücksetzen?")) {
        state.stats = {
            pointsSelf: 0,
            pointsAI: 0,
            possiblePoints: 0,
            answered: 0,
            streak: 0,
            lastPlayed: null
        };
        saveStats();
        showToast("Statistik zurückgesetzt.", 'info');
    }
}

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
        renderCurrentQuestion();
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
        
        showToast("IHK-Klausur gestartet: " + state.filteredQuestions.length + " Fragen.", 'success');
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
    document.getElementById('rate-wrong').addEventListener('click', () => handleRating(0, state.lastAIRatingValue || 0));
    document.getElementById('rate-partial').addEventListener('click', () => handleRating(0.5, state.lastAIRatingValue || 0));
    document.getElementById('rate-correct').addEventListener('click', () => handleRating(1.0, state.lastAIRatingValue || 0));
    
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
        
        switch (val) {
            case 'gemini':
                el.inputApiUrl.value = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
                el.inputModel.value = 'gemini-3.7-flash';
                // HIER: Trage deinen API-Schlüssel ein, damit er immer vorbefüllt ist
                el.inputApiKey.value = '';
                break;
            case 'openai':
                el.inputApiUrl.value = 'https://api.openai.com/v1/chat/completions';
                el.inputModel.value = 'gpt-4o-mini';
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
                el.inputModel.value = 'llama-3.3-70b-versatile';
                break;
            case 'grok':
                el.inputApiUrl.value = 'https://api.x.ai/v1/chat/completions';
                el.inputModel.value = 'grok-2-latest';
                break;
            case 'together':
                el.inputApiUrl.value = 'https://api.together.xyz/v1/chat/completions';
                el.inputModel.value = 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';
                break;
            case 'llama_api':
                el.inputApiUrl.value = 'https://api.llama-api.com/chat/completions';
                el.inputModel.value = 'llama3.1-8b';
                break;
            case 'custom':
                el.inputApiUrl.value = '';
                el.inputModel.value = '';
                break;
        }
    });

    // Save API Key -> Save LLM Config
    el.btnSaveKey.addEventListener('click', () => {
        state.llmConfig = {
            provider: el.inputProvider.value,
            url: el.inputApiUrl.value.trim(),
            model: el.inputModel.value.trim(),
            key: el.inputApiKey.value.trim()
        };
        safeStorage.setItem('llm_config', JSON.stringify(state.llmConfig));
        // Sync to backend if logged in
        const token = safeStorage.getItem('bootcamp_token') || localStorage.getItem('bootcamp_token');
        if (token) {
            fetch(`${API_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ llmConfig: state.llmConfig })
            }).catch(e => console.error("Failed to sync config:", e));
        }
        showToast("LLM-Konfiguration gespeichert!", "success");
        testApiConnection();
    });

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

// API Test Function
async function testApiConnection() {
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
            el.apiStatusLight.style.backgroundColor = '#4ade80'; // Grün
            el.apiStatusText.textContent = "Verbunden";
            el.apiStatusText.style.color = '#4ade80';
            
            // Button ausblenden, da nicht mehr benötigt
            el.btnTestApi.style.display = 'none';
        } else {
            throw new Error("Unerwartete Antwort vom Modell: " + text);
        }
    } catch (e) {
        console.error("API Test fehlgeschlagen:", e.message);
        el.apiStatusLight.style.backgroundColor = '#ef4444'; // Rot
        el.apiStatusText.textContent = "Fehler";
        el.apiStatusText.style.color = '#ef4444';
        
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
    } finally {
        el.btnTestApi.disabled = false;
    }
}

// Load Custom Questions from localStorage
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
            btnDictate.style.color = '#ef4444'; // Red
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
            btnDictate.style.color = '#6b7280'; // Gray
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
            btnDictate.style.color = '#6b7280';
            btnDictate.classList.remove('recording-pulse');
        }
    };
}

// Init App
function init() {
    loadCustomQuestions();
    
    const deletedModules = JSON.parse(safeStorage.getItem('deleted_modules') || '[]');
    const deletedChapters = JSON.parse(safeStorage.getItem('deleted_chapters') || '[]');
    
    if (deletedModules.length > 0 || deletedChapters.length > 0) {
        QUESTIONS = QUESTIONS.filter(q => {
            if (deletedChapters.includes(q.category)) return false;
            let groupName = '';
            if (/^\d/.test(q.category)) groupName = 'linux.basic()';
            else if (q.category.includes('::')) groupName = q.category.split('::')[0].trim().toLowerCase().replace(/\s+/g, '.') + '()';
            else groupName = q.category.trim().toLowerCase().replace(/\s+/g, '.') + '()';
            
            if (deletedModules.includes(groupName)) return false;
            return true;
        });
    }

    initCategories();
    updateDifficultyUI();
    updateFilteredQuestions();
    loadStats();
    
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
                elTime.style.color = '#ef4444';
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
            elTime.style.color = remaining < 300 ? '#ef4444' : '#fbbf24'; // Red if < 5 mins, else Yellow
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

window.deleteModule = function(targetGroupName) {
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

window.deleteChapter = function(targetCatStr, targetGroupName) {
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
        summary.style.background = 'rgba(0,0,0,0.2)';
        summary.style.borderRadius = '4px';
        summary.style.marginBottom = '4px';
        summary.style.fontWeight = 'bold';
        summary.style.fontFamily = 'monospace';
        summary.style.color = '#4ade80';

        const groupLabelSpan = document.createElement('span');
        groupLabelSpan.textContent = gName;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'admin-only-btn';
        deleteBtn.innerHTML = '&#128465;';
        deleteBtn.style.float = 'right';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.color = '#ef4444';
        deleteBtn.style.fontSize = '1.1rem';
        deleteBtn.title = 'Modul und alle Fragen löschen';
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm(`Willst du das Modul "${gName}" inkl. aller Fragen unwiderruflich löschen?`)) {
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
        childrenContainer.style.borderLeft = '2px solid #1f3a1f';
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
            delChapBtn.innerHTML = '&#128465;';
            delChapBtn.style.background = 'none';
            delChapBtn.style.border = 'none';
            delChapBtn.style.cursor = 'pointer';
            delChapBtn.style.color = '#ef4444';
            delChapBtn.title = 'Kapitel löschen';
            delChapBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm(`Willst du das Kapitel "${child.name}" WIRKLICH löschen?`)) {
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
    let color = '#ef4444'; // red
    
    if (percent >= 92) { grade = '1'; gradeText = 'Sehr gut'; color = '#4ade80'; }
    else if (percent >= 81) { grade = '2'; gradeText = 'Gut'; color = '#86efac'; }
    else if (percent >= 67) { grade = '3'; gradeText = 'Befriedigend'; color = '#fcd34d'; }
    else if (percent >= 50) { grade = '4'; gradeText = 'Ausreichend'; color = '#fbbf24'; }
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
            div.style.background = 'rgba(0,0,0,0.2)';
            div.style.padding = '15px';
            div.style.borderRadius = '8px';
            div.style.borderLeft = m.pts === 1.0 ? '4px solid #4ade80' : (m.pts === 0.5 ? '4px solid #fcd34d' : '4px solid #ef4444');
            
            div.innerHTML = `
                <div style="font-size: 0.9em; color: #9ca3af; margin-bottom: 5px;">Frage ${m.qIndex} (${m.pts} Pkt)</div>
                <div style="font-weight: bold; margin-bottom: 10px;">${m.question}</div>
                <div style="margin-bottom: 5px; color: #f87171;"><span style="color:#9ca3af">Deine Antwort:</span> ${m.userAnswer || '<i>Keine Eingabe</i>'}</div>
                <div style="margin-bottom: 10px; color: #4ade80;"><span style="color:#9ca3af">Musterlösung:</span> ${m.correctAnswer}</div>
                <div style="font-size: 0.9em; color: #cbd5e1; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 4px;">${m.feedback}</div>
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
            
            let text = "--- IHK-Klausur Auswertung ---\n\n";
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
