// Fragenkatalog (Teil von app.js, ausgelagert)
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
    },
    {
        "id": 132,
        "category": "Git::1. Klon und Spiegel",
        "question": "Ihr wollt die Repos eures Teams auf einen anderen Server umziehen. Ein Kollege fragt, ob dafür ein normales 'git clone' reicht oder ob es 'git clone --mirror' sein muss. Erkläre den Unterschied und was du für den Umzug nimmst.",
        "answer": "**`git clone`** ist zum **Arbeiten** gedacht. Es legt ein Arbeitsverzeichnis mit ausgecheckten Dateien an. Lokal gibt es nur **einen Branch**, meist `main`. Alle anderen Branches kennt der Klon nur als Verweise auf den Server (`origin/dev`, `origin/test` …), nicht als eigene Branches.\n\n**`git clone --mirror`** ist eine **vollständige Kopie**. Es legt ein Repository ohne Arbeitsverzeichnis an (*bare*, Ordner `app.git`) und übernimmt **alle Referenzen** unverändert: alle Branches, alle Tags und weitere Refs des Servers.\n\nFür einen Umzug oder eine Sicherung nimmst du den **Spiegel**. Nur so kommt alles mit, was auf dem Server liegt. Mit einem normalen Klon fehlen am Ziel später Branches, ohne dass eine Fehlermeldung erscheint.",
        "keywords": ["arbeitsverzeichnis|arbeiten|ausgecheckt", "ein branch|einen branch|nur main|lokaler branch", "mirror|spiegel", "alle branches|alle refs|alle referenzen|vollständig|komplett", "tags", "bare|ohne arbeitsverzeichnis"],
        "validationType": "concept",
        "topicId": 32,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\nNormaler Klon = zum Arbeiten, ein lokaler Branch. Spiegel = vollständige Kopie aller Refs, ohne Arbeitsverzeichnis.\n---\n> **Tux-Ansage:** Ein normaler Klon ist dein Feldrucksack, Rekrut. Ein Spiegel ist das ganze Depot. Wer umzieht, nimmt das Depot mit!\n---\n### 2. Deep Dive\nEin normaler Klon schreibt die Branches des Servers unter `refs/remotes/origin/*` ab und legt nur einen lokalen Branch unter `refs/heads/` an. Ein Spiegel schreibt dagegen alle Refs des Servers unverändert unter denselben Namen ab, also `refs/heads/*`, `refs/tags/*` und weitere wie `refs/pull/*` bei GitHub.\n\n```bash\ngit clone --mirror https://git.example.org/team/app.git\ncd app.git\ngit branch | wc -l      # alle Branches des Servers\ngit tag | wc -l\n```\n\nEin Spiegel hat keine ausgecheckten Dateien (Bare-Repository). Mit `git remote update` lässt er sich später auf den neuesten Stand bringen.\n---\n### 3. Schaubild\n```\nServer-Refs        git clone           git clone --mirror\nrefs/heads/main -> refs/heads/main     refs/heads/main\nrefs/heads/dev  -> refs/remotes/       refs/heads/dev\n                   origin/dev\nrefs/tags/v1    -> refs/tags/v1        refs/tags/v1\nrefs/pull/7     -> (fehlt)             refs/pull/7\n                   mit Arbeitsverz.    ohne Arbeitsverz.\n```"
    },
    {
        "id": 32,
        "category": "Git::1. Klon und Spiegel",
        "question": "Ein Repo hat 23 Branches. Du klonst es ganz normal, kopierst den Ordner auf einen anderen Rechner und schiebst von dort mit 'git push --all' in ein neues, leeres Repo. Wie viele Branches kommen dort an, und warum?",
        "answer": "Es kommt **nur ein Branch** an, meist `main`.\n\nDer Grund: `git push --all` schiebt nur **lokale Branches** (`refs/heads/*`). Nach einem normalen Klon gibt es davon nur einen. Die anderen 22 Branches liegen im Klon nur als **Remote-Tracking-Branches** (`origin/dev`, `origin/test` …), also als Notiz, wo die Branches auf dem Server stehen. Die schiebt `--all` nicht mit.\n\nDas Tückische: Keine Meldung warnt davor. Am Ziel sieht alles normal aus, es fehlen nur 22 Branches.\n\nRichtig wäre:\n- gleich einen **Spiegel** nehmen (`git clone --mirror`), oder\n- die Remote-Tracking-Branches ausdrücklich als Branches schieben: `git push neu 'refs/remotes/origin/*:refs/heads/*'` und danach `git push neu --tags`.",
        "keywords": ["ein branch|einer|nur main|1 branch", "lokal|refs/heads", "remote-tracking|origin/|remote tracking", "push --all|--all", "mirror|spiegel|refs/remotes"],
        "validationType": "concept",
        "topicId": 32,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\n`git push --all` schiebt nur `refs/heads/*`. Nach einem normalen Klon liegt dort nur ein Branch, der Rest wird stillschweigend vergessen.\n---\n> **Tux-Ansage:** 22 Branches einfach liegen gelassen, und keiner merkt es! So verliert man im Ernstfall die halbe Truppe. Zählen, Rekrut, immer zählen!\n---\n### 2. Deep Dive\nDer Fehler ist tückisch, weil kein Befehl eine Warnung ausgibt. Am Ziel sieht alles normal aus, nur fehlen Branches.\n\nGegenprobe vor und nach dem Umzug:\n```bash\ngit ls-remote --heads https://git.example.org/team/app.git | wc -l\ngit ls-remote --tags  https://git.example.org/team/app.git | grep -vc '\\^{}'\n```\n\nWer den normalen Klon trotzdem nutzen will, mappt die Remote-Tracking-Branches beim Push wieder auf echte Branches:\n```bash\ngit push neu 'refs/remotes/origin/*:refs/heads/*'\ngit push neu --tags\n```\nDabei landet allerdings auch `origin/HEAD` als Branch `HEAD` am Ziel; den löscht man danach wieder.\n---\n### 3. Schaubild\n```\nnormaler Klon                       neues Repo\nrefs/heads/main ---push --all--->   main\nrefs/remotes/origin/dev    -X-      fehlt\nrefs/remotes/origin/feat   -X-      fehlt\n(21 weitere)               -X-      fehlen\nErgebnis: 1 von 23 Branches kommt an\n```"
    },
    {
        "id": 232,
        "category": "Git::1. Klon und Spiegel",
        "question": "Ein Kollege schlägt vor, ein Repo umzuziehen, indem er die Dateien über die Weboberfläche des neuen Servers hochlädt oder den Projektordner einfach auf einen USB-Stick kopiert. Was geht bei beiden Wegen verloren, und welchen Weg empfiehlst du stattdessen?",
        "answer": "**Dateien hochladen:** Am Ziel kommt nur der **aktuelle Stand** an. Es fehlen die gesamte **Historie** (Commits, Autoren, Zeitpunkte, Signaturen), alle anderen **Branches** und alle **Tags**. Für Git ist das ein neues Projekt, das bei null beginnt.\n\n**Ordner kopieren:** Die Historie wäre im versteckten Ordner `.git` zwar dabei, aber beim Kopieren gehen leicht Dinge verloren: versteckte Dateien, **Dateirechte** wie das Ausführbar-Bit oder Dateinamen mit Umlauten. Außerdem besteht ein Repo aus tausenden Einzeldateien. Ob alles vollständig angekommen ist, lässt sich kaum prüfen.\n\n**Besser:**\n- mit Netzverbindung: Spiegel (`git clone --mirror`) und `git push --all` plus `git push --tags` ins neue Repo,\n- ohne Netzverbindung: ein **Bundle**, also das ganze Repo in einer Datei, dazu eine **Prüfsumme**. Eine Datei lässt sich sicher transportieren und prüfen, und Git kontrolliert beim Einlesen jedes Objekt.",
        "keywords": ["historie|commits|verlauf", "branches", "tags", "rechte|versteckt|\\.git|umlaute|vollständig", "bundle|mirror|spiegel", "prüfsumme|prüfen|sha256"],
        "validationType": "concept",
        "topicId": 32,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nDateien hochladen = Historie weg. Ordner kopieren = viele Einzeldateien, schwer zu prüfen. Besser: Spiegel oder Bundle.\n---\n> **Tux-Ansage:** Wer nur die Dateien rüberträgt, schmeißt die ganze Kriegsgeschichte weg. Ohne Historie weißt du nie wieder, wer wann welchen Bock geschossen hat!\n---\n### 2. Deep Dive\nGit speichert nicht Dateien, sondern Objekte (Commits, Trees, Blobs, Tags) in `.git/objects`. Die Historie ist eine Kette von Commits, die über Prüfsummen verbunden sind. Ein Upload über die Weboberfläche erzeugt einen **neuen** ersten Commit, mit der alten Kette hat er nichts zu tun.\n\nBeim Kopieren über USB und Windows-Rechner kommen weitere Fallen dazu:\n- Windows kennt kein Ausführbar-Bit, Skripte verlieren es.\n- Versteckte Ordner werden je nach Werkzeug nicht mitkopiert.\n- Zeilenenden können umgewandelt werden (`core.autocrlf`).\n\nEin Bundle oder ein gepackter Spiegel ist dagegen **eine** Datei, deren Prüfsumme man vergleichen kann, und Git prüft beim Einlesen jedes Objekt selbst."
    },
    {
        "id": 133,
        "category": "Git::2. Remotes und Zugang",
        "question": "Euer Repo ist umgezogen. In deinem lokalen Klon zeigt das Remote 'origin' noch auf die alte Adresse. Stelle es auf die neue Adresse 'https://git.example.org/team/app.git' um.",
        "answer": "`git remote set-url origin https://git.example.org/team/app.git`\n\nDer Befehl ändert nur, **wohin** `git fetch`, `git pull` und `git push` künftig gehen. Deine Commits, Branches und Dateien bleiben unverändert, du musst also nicht neu klonen.\n\nKontrolle mit `git remote -v`: Beide Zeilen (fetch und push) müssen die neue Adresse zeigen. Danach testet `git fetch`, ob die neue Adresse erreichbar ist und die Anmeldung funktioniert.",
        "validationType": "command",
        "solutions": ["git\\s+remote\\s+set-url\\s+origin\\s+https://git\\.example\\.org/team/app\\.git"],
        "topicId": 33,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`git remote set-url <name> <adresse>` ändert, wohin `fetch` und `push` gehen. Historie und Branches bleiben unverändert.\n---\n> **Tux-Ansage:** Neuer Standort, neue Funkfrequenz! Wer nach dem Umzug die Remote nicht umstellt, funkt weiter ins Leere, äh, ins alte Lager.\n---\n### 2. Deep Dive\nNach einem Umzug muss jeder vorhandene Klon auf die neue Adresse zeigen:\n```bash\ngit remote -v                       # aktuelle Adresse\ngit remote set-url origin https://git.example.org/team/app.git\ngit fetch origin                    # Verbindung testen\n```\nVergisst man das, laufen Pushes weiter ins alte System, oder Automationen (Sync-Skripte, nächtliche Builds) holen nie wieder neue Stände."
    },
    {
        "id": 33,
        "category": "Git::2. Remotes und Zugang",
        "question": "Du willst ein privates Repo über 'git@github.com:org/app.git' klonen und erhältst 'Permission denied (publickey)'. 'gh auth status' zeigt aber, dass du bei GitHub angemeldet bist. Woran liegt das, und wie löst du es?",
        "answer": "Git kennt zwei Wege zum Server, jeder mit **eigener Anmeldung**:\n- **HTTPS** (`https://github.com/org/app.git`): Anmeldung mit einem **Token**.\n- **SSH** (`git@github.com:org/app.git`): Anmeldung mit einem **SSH-Schlüssel**.\n\n`gh auth login` hat dich über **HTTPS** angemeldet und sich als Credential-Helper eingetragen. Das gilt aber nur für HTTPS-Adressen. Deine Adresse `git@github.com:…` nutzt **SSH**, und dafür ist bei deinem Konto kein Schlüssel hinterlegt. Daher „publickey“.\n\nLösung, eine von beiden:\n- die **HTTPS-Adresse** verwenden: `git clone https://github.com/org/app.git`, oder\n- einen **SSH-Schlüssel** erzeugen (`ssh-keygen -t ed25519`) und beim Konto hinterlegen; testen mit `ssh -T git@github.com`.",
        "keywords": ["ssh", "https", "token|gh|angemeldet", "schlüssel|key|publickey", "zwei wege|getrennt|unterschiedlich|anderer weg|eigene anmeldung"],
        "validationType": "concept",
        "topicId": 33,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\nSSH und HTTPS sind zwei getrennte Wege mit eigener Anmeldung. `gh auth status` zeigt unter „Git operations protocol“, welcher eingerichtet ist.\n---\n> **Tux-Ansage:** Du hast den Hausausweis für den Haupteingang und rennst gegen die Hintertür! Erst schauen, welcher Eingang freigeschaltet ist, Rekrut.\n---\n### 2. Deep Dive\nSo prüfst du die Lage:\n```bash\ngh auth status                       # Protokoll und Konto\ngit config --get-regexp credential   # Credential-Helper für https\nssh -T git@github.com                # testet nur den SSH-Weg\n```\n\nDie Adresse entscheidet über den Weg:\n- `https://github.com/org/app.git`: HTTPS, Anmeldung über Token bzw. Credential-Helper\n- `git@github.com:org/app.git` oder `ssh://…`: SSH, Anmeldung über Schlüssel\n\nIn Schleifen über viele Repos (Umzug) muss die Adressform zur eingerichteten Anmeldung passen, sonst schlägt jeder einzelne Klon fehl."
    },
    {
        "id": 233,
        "category": "Git::2. Remotes und Zugang",
        "question": "Ein Server soll jede Nacht automatisch den neuesten Stand eines privaten Repos holen und daraus die Anwendung bauen. Welche Art von Zugang richtest du dafür ein, und warum nimmst du nicht einfach dein persönliches Token?",
        "answer": "Einen **Deploy-Key**: einen SSH-Schlüssel, der nur für **dieses eine Repo** gilt, nur **Lesezugriff** hat und eigens für **diesen Server** erzeugt wird. Weil der Abruf ohne Menschen läuft, hat der Schlüssel keine Passphrase. Umso wichtiger ist, dass er wenig darf.\n\n**Warum kein persönliches Token oder persönlicher Schlüssel?** Die gelten für **alle Repos**, auf die du Zugriff hast, und meist auch zum **Schreiben**. Wird der Server kompromittiert, hätte ein Angreifer damit Zugriff auf alles, was du darfst. Mit dem Deploy-Key kann er nur dieses eine Repo lesen. Außerdem hängt der Zugang dann nicht an deiner Person: Verlässt du das Team, läuft der Abruf weiter.\n\nZusätzlich holt der Server nur mit `git pull --ff-only`. So erzeugt er nie eigene Commits und bricht ab, falls die Historie auf dem Server unerwartet umgeschrieben wurde.",
        "keywords": ["deploy-key|deploy key|deploykey", "lese|read|nur lesen|read-only", "ein repo|einzelnes repo|dieses repo|nur dieses", "persönlich|alle repos|schreib", "kompromittiert|angreifer|risiko|minimal|wenig rechte"],
        "validationType": "concept",
        "topicId": 33,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nAutomaten bekommen eigene, eng begrenzte Schlüssel: ein Repo, nur lesen.\n---\n> **Tux-Ansage:** Du gibst dem Nachtwächter doch auch nicht den Generalschlüssel für die ganze Kaserne! Einen Schlüssel für eine Tür, und die nur zum Reinschauen.\n---\n### 2. Deep Dive\nEinrichtung in groben Zügen:\n```bash\nssh-keygen -t ed25519 -f ~/.ssh/deploy_app -N '' -C 'nightly build (read-only)'\n```\nDen öffentlichen Teil im Repo als Deploy-Key **ohne** Schreibrecht eintragen. In `~/.ssh/config` einen eigenen Host-Alias anlegen, damit genau dieser Schlüssel benutzt wird:\n```\nHost git-app\n    HostName git.example.org\n    User git\n    IdentityFile ~/.ssh/deploy_app\n    IdentitiesOnly yes\n```\nund klonen mit `git clone git-app:team/app.git`.\n\nWichtig: Wer auf den Hauptbranch pushen darf, bestimmt trotzdem, was der Server baut. Schutz davor bieten Reviews, geschützte Branches oder signierte Tags, die der Server vor dem Bauen prüft (`git verify-tag`)."
    },
    {
        "id": 134,
        "category": "Git::3. Alle Repos spiegeln",
        "question": "Du sollst alle Repos einer GitHub-Organisation spiegeln und versuchst 'git clone --mirror https://github.com/org/*.git'. Warum funktioniert das nicht, und wie gehst du stattdessen vor?",
        "answer": "Git kennt **keine Platzhalter** für entfernte Repos. Ein Klon braucht genau **eine Adresse**. Das `*` wird weder von Git noch vom Server aufgelöst, sondern als Teil der Adresse gesendet, und ein Repo mit diesem Namen gibt es nicht.\n\nStattdessen in zwei Schritten:\n1. **Liste der Repos holen**, über die API des Anbieters, z. B. mit dem GitHub-Werkzeug `gh`:\n```bash\ngh repo list org --limit 500 --json name -q '.[].name' > repos.txt\n```\n2. **In einer Schleife** jedes Repo einzeln spiegeln:\n```bash\nwhile read -r r; do\n  git clone --mirror \"https://github.com/org/$r.git\"\ndone < repos.txt\n```\nDie Liste `repos.txt` dient später auch als Checkliste für die Gegenprobe.",
        "keywords": ["platzhalter|wildcard|stern|\\*", "eine adresse|einzeln|jedes repo", "liste|api|gh repo list", "schleife|loop|while|for"],
        "validationType": "concept",
        "topicId": 34,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\nErst die Liste holen, dann in einer Schleife einzeln spiegeln.\n---\n> **Tux-Ansage:** Der Server hat kein Inventarbuch zum Durchblättern per Sternchen. Du musst die Stärkemeldung schon anfordern, Rekrut!\n---\n### 2. Deep Dive\n```bash\nmkdir -p ~/umzug/mirror && cd ~/umzug\ngh repo list org --limit 500 --json name -q '.[].name' > repos.txt\ncd mirror\nwhile read -r r; do\n  git clone --mirror \"https://github.com/org/$r.git\" \"$r.git\" \\\n    || echo \"FEHLER: $r\" >> ../fehler.txt\ndone < ../repos.txt\n```\n\nTipps:\n- `repos.txt` vorher ansehen und Repos streichen, die nicht mit sollen.\n- Fehler in eine Datei schreiben statt abzubrechen, dann sieht man am Ende alles auf einen Blick.\n- Wikis sind eigene Repos (`<repo>.wiki.git`) und müssen bei Bedarf extra gespiegelt werden."
    },
    {
        "id": 34,
        "category": "Git::3. Alle Repos spiegeln",
        "question": "Du stehst im Spiegel 'app.git' und hast das neue Ziel als Remote 'neu' eingetragen. Schiebe alle Branches dorthin. Die Tags folgen in einem zweiten Schritt.",
        "answer": "`git push --all neu`\n\n`--all` schiebt **alle Branches** (`refs/heads/*`) zum Remote `neu`. Weil du in einem Spiegel stehst, sind das wirklich alle Branches des alten Servers, nicht nur einer wie nach einem normalen Klon.\n\nTags gehören nicht dazu. Die schiebst du danach mit `git push --tags neu`. Zusammen ergibt das den vollständigen Code-Stand, ohne fremde Refs wie GitHubs `refs/pull/*`.",
        "validationType": "command",
        "solutions": ["git\\s+push\\s+--all\\s+neu", "git\\s+push\\s+neu\\s+--all"],
        "topicId": 34,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\n`--all` schiebt alle Branches (`refs/heads/*`), `--tags` alle Tags. Zusammen ergibt das den vollständigen Code-Stand.\n---\n> **Tux-Ansage:** Erst die Truppe, dann die Orden! Wer die Tags vergisst, steht beim nächsten Release ohne Versionsnummern da.\n---\n### 2. Deep Dive\nStatt eines eingetragenen Remotes geht auch direkt die Adresse:\n```bash\ngit -C app.git push --all  https://git.example.org/team/app.git\ngit -C app.git push --tags https://git.example.org/team/app.git\n```\nDas Ziel-Repo muss leer sein (ohne README oder Lizenz-Commit). Sonst lehnt der Server den Push ab, weil die Historien nicht zusammenpassen."
    },
    {
        "id": 234,
        "category": "Git::3. Alle Repos spiegeln",
        "question": "Für den Umzug von GitHub auf einen eigenen Server wird 'git push --all' plus 'git push --tags' empfohlen und nicht 'git push --mirror'. Erkläre, welche zwei Probleme '--mirror' dabei verursachen kann.",
        "answer": "**1. Fremde Refs:** `--mirror` schiebt **alle** Refs des Spiegels. Bei GitHub gehören dazu auch die internen `refs/pull/*`, die Stände aller Pull Requests, oft tausende. Viele Server lehnen solche Refs ab, der Push scheitert ganz oder teilweise. Und selbst wenn er klappt, liegt am Ziel Ballast, mit dem dort niemand etwas anfangen kann.\n\n**2. Löschen am Ziel:** `--mirror` macht das Ziel zu einer exakten Kopie und **löscht** dort alle Refs, die es im Spiegel nicht gibt. Ist das Ziel nicht leer, etwa weil dort schon jemand einen Branch angelegt hat, ist dieser danach weg.\n\n`--all` und `--tags` schieben dagegen nur **Branches und Tags** und **löschen nichts**. Das ist genau der Code-Stand, den man umziehen will.",
        "keywords": ["refs/pull|pull request|fremde refs|interne refs|alle refs", "abgelehnt|lehnt|scheitert|fehler", "lösch", "nur branches|branches und tags", "ziel"],
        "validationType": "concept",
        "topicId": 34,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\n`--mirror` = alles inklusive Fremdrefs und mit Löschen am Ziel. `--all` + `--tags` = nur Branches und Tags, nichts wird gelöscht.\n---\n> **Tux-Ansage:** Mit `--mirror` rückst du mit der kompletten Altlast ein und reißt nebenbei alles ab, was am Ziel schon steht. Gezielt vorgehen, Rekrut!\n---\n### 2. Deep Dive\nWelche Refs ein Spiegel enthält, zeigt:\n```bash\ngit -C app.git for-each-ref --format='%(refname)' | cut -d/ -f1-2 | sort | uniq -c\n```\nTypisch bei GitHub-Spiegeln: `refs/heads`, `refs/tags` und sehr viele `refs/pull`.\n\nBeim Bundle lässt man die Pull-Refs gleich weg:\n```bash\ngit bundle create app.bundle --branches --tags\n```\n---\n### 3. Schaubild\n```\nRef-Art          --mirror           --all + --tags\nrefs/heads/*     ja                 ja\nrefs/tags/*      ja                 ja\nrefs/pull/*      ja (Fremdrefs)     nein\nam Ziel löschen  ja, was fehlt      nie\n```"
    },
    {
        "id": 135,
        "category": "Git::4. Bundles",
        "question": "Der Zielserver steht in einem abgeschotteten Netz ohne Verbindung zur Quelle. Was ist ein Git-Bundle, und warum eignet es sich für diesen Fall besser als ein kopierter Projektordner?",
        "answer": "Ein **Bundle** ist ein ganzes Git-Repository in **einer einzigen Datei**: alle Commits sowie die Branches und Tags, die man beim Erstellen auswählt. Git kann die Datei wie einen Server benutzen, also daraus **klonen** oder **fetchen**.\n\nSo läuft der Transport:\n```bash\n# Quelle\ngit -C app.git bundle create /pfad/app.bundle --branches --tags\n# Ziel, nach dem Transport per USB\ngit clone --mirror app.bundle app.git\n```\n\nVorteile gegenüber einem kopierten Ordner:\n- **eine Datei** statt tausender: einfach zu transportieren,\n- **eine Prüfsumme** genügt, um die Unversehrtheit zu belegen,\n- Git **prüft beim Einlesen** jedes Objekt und meldet Beschädigungen.",
        "keywords": ["eine datei|einzelne datei|einer datei", "ohne netz|offline|usb|datenträger|schleuse", "klonen|clone|fetch", "commits|branches|tags|historie", "prüfsumme|prüft|vollständig"],
        "validationType": "concept",
        "topicId": 35,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\nBundle = ein Repo in einer Datei, transportierbar ohne Netz.\n---\n> **Tux-Ansage:** Kein Funkkontakt zum Zielgebiet? Dann geht das Paket eben per Kurier. Das Bundle ist dein versiegelter Meldebeutel.\n---\n### 2. Deep Dive\n```bash\n# erstellen\ngit -C app.git bundle create /pfad/app.bundle --branches --tags\n\n# am Ziel wie ein Remote benutzen\ngit clone --mirror app.bundle app.git\ngit -C app.git push --all  https://git.example.org/team/app.git\ngit -C app.git push --tags https://git.example.org/team/app.git\n```\n\nVorteile gegenüber kopierten Ordnern: eine Datei, eine Prüfsumme, und Git prüft beim Einlesen jedes Objekt.\n---\n### 3. Schaubild\n```\nQuelle                Datenträger            Ziel\napp.git --bundle-->  app.bundle  --clone-->  app.git\n          create     (eine Datei)\n```"
    },
    {
        "id": 35,
        "category": "Git::4. Bundles",
        "question": "Erstelle aus dem Repo im aktuellen Verzeichnis ein Bundle 'app.bundle', das alle Branches und alle Tags enthält.",
        "answer": "`git bundle create app.bundle --branches --tags`\n\n`git bundle create` erwartet zuerst den Dateinamen, danach die Refs, die hinein sollen. `--branches` nimmt alle Branches, `--tags` alle Tags.\n\n`--all` würde zusätzlich alle weiteren Refs mitnehmen, bei GitHub-Spiegeln z. B. die vielen `refs/pull/*`, die man am Ziel nicht braucht. Danach prüfst du das Bundle mit `git bundle verify app.bundle`, und zwar innerhalb eines Repos.",
        "validationType": "command",
        "solutions": ["git\\s+bundle\\s+create\\s+app\\.bundle\\s+--branches\\s+--tags", "git\\s+bundle\\s+create\\s+app\\.bundle\\s+--tags\\s+--branches", "git\\s+bundle\\s+create\\s+app\\.bundle\\s+--all"],
        "topicId": 35,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\n`git bundle create <datei> <refs>`: Welche Refs hinein sollen, bestimmen Optionen wie `--branches`, `--tags` oder `--all`.\n---\n> **Tux-Ansage:** Pack, was gebraucht wird, nicht den ganzen Müll aus der Stube! `--branches --tags` ist das saubere Marschgepäck.\n---\n### 2. Deep Dive\nDie Ref-Angaben funktionieren wie bei `git rev-list`. Es gehen also auch einzelne Branches oder Bereiche:\n```bash\ngit bundle create nur-main.bundle main\ngit bundle create neu-seit-v1.bundle v1.0..main   # inkrementell\n```\nEin inkrementelles Bundle setzt voraus, dass das Ziel `v1.0` schon hat. Das prüft `git bundle verify` im Ziel-Repo.\n\nHinweis: Ein Repo ganz ohne Commits lässt sich nicht bündeln. Leere Repos legt man am Ziel einfach neu an."
    },
    {
        "id": 235,
        "category": "Git::4. Bundles",
        "question": "Du stehst im Ordner 'mirror/' und rufst 'git -C app.git bundle create ../usb/app.bundle --all' auf. Git meldet, dass es '…/app.git/../usb/app.bundle.lock' nicht erstellen kann, obwohl der Ordner 'usb/' direkt neben 'mirror/' liegt. Später meldet 'git bundle verify app.bundle' außerhalb eines Repos ebenfalls einen Fehler. Erkläre beide Fehler.",
        "answer": "**1. Der Pfad:** `git -C app.git` wechselt **vor** der Ausführung in den Ordner `app.git`. Alle relativen Pfade gelten dann **ab dort**:\n- `../usb` von `mirror/app.git` aus ergibt `mirror/usb`, und den gibt es nicht.\n- Gemeint war `usb/` neben `mirror/`, von `app.git` aus also `../../usb`.\n\nLösung: bei `-C` immer **absolute Pfade** verwenden, z. B. `~/umzug/usb/app.bundle`.\n\n**2. Die Prüfung:** `git bundle verify` braucht ein **Repository**. Es prüft nämlich, ob die Voraussetzungen des Bundles (Commits, auf denen es aufbaut) in der Objektdatenbank vorhanden sind. Außerhalb eines Repos gibt es keine Objektdatenbank, also schlägt der Aufruf fehl, obwohl das Bundle in Ordnung ist.\n\nLösung: `verify` im Spiegel selbst aufrufen (`git -C app.git bundle verify …`) oder das Bundle testweise klonen und Branches und Tags zählen.",
        "keywords": ["-c|wechselt|verzeichnis|ordner", "relativ", "absolut", "repository|repo|objektdatenbank", "verify|voraussetzung|prerequisite", "klonen|clone|testklon"],
        "validationType": "concept",
        "topicId": 35,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\n`-C` verschiebt den Bezugspunkt aller relativen Pfade. `bundle verify` gehört in ein Repo, sonst einen Testklon machen.\n---\n> **Tux-Ansage:** Du meldest „Bundle defekt“, dabei hast du nur im falschen Raum nachgeschaut! Erst Koordinaten prüfen, dann Alarm schlagen.\n---\n### 2. Deep Dive\nSicher mit absolutem Pfad:\n```bash\nU=~/umzug/usb\nwhile read -r r; do\n  git -C \"$r.git\" bundle create \"$U/$r.bundle\" --branches --tags &&\n  git -C \"$r.git\" bundle verify \"$U/$r.bundle\" >/dev/null ||\n  echo \"FEHLER: $r\" >> ../fehler.txt\ndone < ../repos.txt\n```\nHier läuft `verify` **innerhalb** des Spiegels, dort funktioniert es.\n\nGegenprobe ohne Repo:\n```bash\ngit clone -q --mirror app.bundle /tmp/test.git\ngit -C /tmp/test.git branch | wc -l\ngit -C /tmp/test.git tag | wc -l\nrm -rf /tmp/test.git\n```\n---\n### 3. Schaubild\n```\nmirror/            <- hier gestartet\n  app.git/         <- -C: Pfade gelten ab hier\nusb/               <- gemeint\n\n../usb ab app.git = mirror/usb   (gibt es nicht)\n../usb ab mirror/ = usb          (gemeint)\n```"
    },
    {
        "id": 136,
        "category": "Git::5. Transport über eine Datenschleuse",
        "question": "Bevor die Bundles per USB-Stick transportiert werden, sollen sie überprüfbar sein. Erzeuge im aktuellen Ordner für alle '.bundle'-Dateien eine Prüfsummendatei 'SHA256SUMS'.",
        "answer": "`sha256sum *.bundle > SHA256SUMS`\n\nFür jede Datei berechnet `sha256sum` einen Fingerabdruck und schreibt ihn mit dem Dateinamen in `SHA256SUMS`. Ändert sich unterwegs auch nur ein Bit, ergibt sich ein völlig anderer Wert.\n\nAm Ziel prüfst du mit `sha256sum -c SHA256SUMS`. Jede Zeile muss `OK` melden. Ein `FAILED` heißt: Diese Datei ist beschädigt oder verändert und darf nicht verwendet werden.",
        "validationType": "command",
        "solutions": ["sha256sum\\s+\\*\\.bundle\\s*>\\s*SHA256SUMS"],
        "topicId": 36,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`sha256sum` erzeugt Prüfsummen, `sha256sum -c` vergleicht sie. Eine geänderte Datei fällt sofort auf.\n---\n> **Tux-Ansage:** Was du nicht nachgezählt hast, hast du nicht übergeben! Prüfsumme drauf, sonst ist der Transport Glückssache.\n---\n### 2. Deep Dive\n```bash\ncd ~/umzug/usb\nsha256sum *.bundle repos.txt > SHA256SUMS\nsha256sum SHA256SUMS          # diese eine Zeile separat notieren\n```\nAm Ziel:\n```bash\nsha256sum SHA256SUMS          # muss zur Notiz passen\nsha256sum -c SHA256SUMS       # alle Dateien OK?\n```\nUnter Windows ohne Zusatzsoftware:\n```powershell\nGet-FileHash .\\app.bundle -Algorithm SHA256\n```"
    },
    {
        "id": 36,
        "category": "Git::5. Transport über eine Datenschleuse",
        "question": "Die Datei 'SHA256SUMS' liegt zusammen mit den Bundles auf dem USB-Stick. Trotzdem soll ihre eigene Prüfsumme zusätzlich auf einem zweiten Weg zum Ziel, z. B. als Foto oder per Telefon. Warum reicht der Stick allein nicht?",
        "answer": "Eine Prüfsumme auf dem Stick schützt nur vor **zufälligen Fehlern**, also vor defekten Sticks oder abgebrochenen Kopien.\n\nGegen **absichtliche Manipulation** hilft sie nicht: Wer unterwegs eine Datei auf dem Stick verändern kann, kann auch `SHA256SUMS` passend neu berechnen. Dann meldet `sha256sum -c` am Ziel trotzdem überall `OK`.\n\nDas deckt nur ein Vergleichswert auf, der **über einen anderen Kanal** kommt. Der Angreifer müsste dann beide Wege gleichzeitig fälschen. Deshalb:\n- auf der Quellseite `sha256sum SHA256SUMS` notieren und getrennt übermitteln (Foto, Telefon, Zettel),\n- am Ziel denselben Wert berechnen und vergleichen.\n\nNoch besser ist eine **Signatur** (`gpg --detach-sign SHA256SUMS`). Dann braucht es keinen zweiten Kanal mehr, sobald der öffentliche Schlüssel einmal sicher übergeben wurde.",
        "keywords": ["manipul|verändert|fälsch|angreifer", "neu berechnen|anpassen|mitändern|ebenfalls ändern", "zweiter kanal|anderer kanal|getrennt|unabhängig|zweiten weg", "übertragungsfehler|defekt|zufällig|beschädigt", "signatur|gpg|signieren"],
        "validationType": "concept",
        "topicId": 36,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\nPrüfsumme und Daten auf demselben Stick = keine Sicherheit gegen Manipulation. Vergleichswert immer getrennt transportieren.\n---\n> **Tux-Ansage:** Wenn der Feind den Meldebeutel in die Finger kriegt, fälscht er auch den Zettel mit der Stückzahl. Die Kontrollnummer trägst du am Mann, Rekrut!\n---\n### 2. Deep Dive\nDrei Stufen der Absicherung:\n1. **Prüfsumme auf dem Stick:** erkennt defekte Sticks und Übertragungsfehler.\n2. **Prüfsumme der Prüfsummendatei über zweiten Kanal** (Foto, Telefon, Zettel): erkennt zusätzlich Manipulation auf dem Stick.\n3. **Signatur** (z. B. `gpg --detach-sign SHA256SUMS`): Der Empfänger prüft mit dem öffentlichen Schlüssel des Absenders, kein zweiter Kanal nötig, sobald der Schlüssel einmal sicher übergeben wurde.\n\nVerschlüsselung (z. B. AES-256) schützt die **Vertraulichkeit**, Prüfsumme und Signatur schützen die **Unversehrtheit**. Für einen sicheren Transport braucht man beides.\n---\n### 3. Schaubild\n```\nKanal 1 (USB-Stick):   Bundles + SHA256SUMS\nKanal 2 (Foto, Tel.):  Prüfsumme von SHA256SUMS\n\nAngreifer ändert Stick und passt SHA256SUMS an\n  -> Vergleich mit Kanal 2 schlägt fehl\n```"
    },
    {
        "id": 236,
        "category": "Git::5. Transport über eine Datenschleuse",
        "question": "Die Bundles müssen per USB-Stick über einen Windows-11-Schleusenrechner, auf dem du keine Admin-Rechte hast, auf ein Linux-System im internen Netz. Wie verschlüsselst du den Transport, und welche Verfahren scheiden aus?",
        "answer": "**Grundidee:** Der Windows-Rechner ist nur eine **Durchreiche**. Er muss die Datei weder öffnen noch entschlüsseln. Verschlüsselt wird auf der **Quellseite**, entschlüsselt erst auf dem **Linux-Ziel**, also dort, wo die Werkzeuge vorhanden sind.\n\nGeeignet:\n- `gpg --symmetric --cipher-algo AES256`: ein Passwort, AES-256, auf Linux überall vorhanden.\n- ein **7z-Archiv** mit AES-256 und verschlüsselten Dateinamen: `7z a -p -mhe=on`.\n\nScheiden aus:\n- **VeraCrypt**: Zum Einbinden eines Containers braucht es einen Treiber und damit **Admin-Rechte**.\n- **ZIP-Verschlüsselung des Explorers**: Das alte ZipCrypto-Verfahren ist **zu schwach**.\n- **BitLocker To Go**: Entsperren geht ohne Admin, aber eingerichtet werden muss es auf einem Windows mit Pro- oder Enterprise-Lizenz, und auf Linux braucht man Zusatzwerkzeuge.\n\nVorher mit dem Betrieb der Schleuse klären: Viele Schleusen lassen **verschlüsselte Archive nicht durch**, weil der Virenscanner nicht hineinsehen kann.",
        "keywords": ["durchreiche|nur durch|weiterreichen|nicht entschlüssel", "quelle|vorher verschlüssel|linux", "gpg|7z|7-zip|aes", "veracrypt", "admin|treiber", "zip|zu schwach|schwach"],
        "validationType": "concept",
        "topicId": 36,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nVerschlüsseln und Entschlüsseln dort, wo man die Werkzeuge hat. Die Schleuse reicht nur durch.\n---\n> **Tux-Ansage:** Der Schleusenrechner ist der Postbote, nicht der Empfänger. Der kriegt den Umschlag, aber nicht den Schlüssel!\n---\n### 2. Deep Dive\nQuellseite (Linux):\n```bash\ntar -cf - usb | gpg --symmetric --cipher-algo AES256 -o umzug.tar.gpg\nsha256sum umzug.tar.gpg       # separat notieren\n```\nSchleuse (Windows 11, ohne Admin):\n```powershell\nGet-FileHash E:\\umzug.tar.gpg -Algorithm SHA256\nscp E:\\umzug.tar.gpg benutzer@linux-ziel:~/\n```\n`scp` ist als OpenSSH-Client in Windows 11 eingebaut.\n\nZielseite (Linux):\n```bash\nsha256sum umzug.tar.gpg\ngpg -d umzug.tar.gpg | tar -xf -\n```\n\nZur Passphrase: lang (Satz aus mehreren Wörtern), nie auf demselben Datenträger und nur auf vertrauenswürdigen Rechnern eintippen. Nach dem Import alle Zwischenkopien löschen: Stick, Schleuse, entpackte Dateien.\n---\n### 3. Schaubild\n```\nLinux Quelle       Windows-Schleuse      Linux Ziel\ntar | gpg -c  -->  nur durchreichen -->  gpg -d | tar\nsha256sum          Get-FileHash          sha256sum\n\nPassphrase: nie auf dem Stick, nie auf der Schleuse\n```"
    },
    {
        "id": 137,
        "category": "Git::6. Gegenprobe und Umstellung",
        "question": "Ihr zieht eure Repos per Spiegel oder Bundle auf einen neuen Server um. Ein Kollege geht davon aus, dass damit alles umgezogen ist. Was kommt dabei nicht mit, und warum?",
        "answer": "Spiegel und Bundle transportieren nur, was **im Git-Repository selbst** steckt: Commits, Branches und Tags. Vieles andere gehört nicht zu Git, sondern zur **Plattform** (GitHub, GitLab …). Das kommt nicht mit:\n- **Issues** sowie **Pull bzw. Merge Requests** mit allen Kommentaren,\n- **Releases** mit ihren angehängten Dateien,\n- das **Wiki**: Es ist ein eigenes Repo (`<repo>.wiki.git`) und muss extra gespiegelt werden,\n- **Git-LFS-Dateien**: große Dateien liegen in einem eigenen Speicher; im Repo stehen nur Verweise,\n- **Deploy-Keys, Secrets, Webhooks**,\n- **Einstellungen** wie geschützte Branches und Berechtigungen.\n\nDeshalb vor dem Umzug eine Liste machen, was davon gebraucht wird, und es eigens übertragen oder am Ziel neu anlegen.",
        "keywords": ["issues|tickets", "pull request|merge request|kommentare", "wiki", "lfs", "secrets|deploy-key|webhook|einstellungen|berechtigungen", "plattform|nicht im repo|nicht in git"],
        "validationType": "concept",
        "topicId": 37,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\nGit transportiert Code und Historie. Alles Drumherum gehört der Plattform und muss eigens umgezogen oder neu angelegt werden.\n---\n> **Tux-Ansage:** Du ziehst die Waffenkammer um, aber das Dienstbuch bleibt im alten Büro liegen? Liste machen, was sonst noch mit muss!\n---\n### 2. Deep Dive\nWege für das Drumherum:\n- **Import-Funktion** des neuen Servers (GitLab, Gitea, Forgejo können von GitHub importieren, inkl. Issues und PRs), wenn eine Netzverbindung besteht.\n- **Export als JSON** über die API, z. B. `gh issue list --state all --json number,title,body,comments`, und später manuell oder per Skript einspielen.\n- **LFS:** im Spiegel `git lfs fetch --all`, am Ziel `git lfs push --all <remote>`.\n- **Wiki:** wie ein normales Repo spiegeln (`<repo>.wiki.git`).\n- **Keys, Secrets, Webhooks:** am Ziel neu anlegen, nicht kopieren."
    },
    {
        "id": 37,
        "category": "Git::6. Gegenprobe und Umstellung",
        "question": "Nach dem Umzug willst du prüfen, ob alle Branches am neuen Server angekommen sind. Liste die Branches des Repos 'https://git.example.org/team/app.git' auf, ohne es zu klonen.",
        "answer": "`git ls-remote --heads https://git.example.org/team/app.git`\n\n`git ls-remote` fragt beim Server nur die **Liste der Refs** ab, mit Commit-Hash und Namen. Es lädt keine Dateien und legt kein Repo an, deshalb geht es auch bei großen Repos schnell. `--heads` beschränkt die Liste auf Branches.\n\nFür die Gegenprobe zählst du mit `| wc -l` und vergleichst mit der Quelle. Stimmen Anzahl und Hashes überein, ist der Stand identisch. Tags listet `--tags` auf.",
        "validationType": "command",
        "solutions": ["git\\s+ls-remote\\s+(--heads|-h|--branches)\\s+https://git\\.example\\.org/team/app\\.git"],
        "topicId": 37,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\n`git ls-remote` fragt die Refs eines Servers ab, ohne etwas herunterzuladen. Ideal für die Gegenprobe nach dem Umzug.\n---\n> **Tux-Ansage:** Nach der Verlegung wird durchgezählt! Wer nicht nachzählt, merkt erst beim Appell, dass die Hälfte fehlt.\n---\n### 2. Deep Dive\nGegenprobe Quelle gegen Ziel:\n```bash\nfor r in app web api; do\n  printf '%-6s Branches %3s Tags %3s\\n' \"$r\" \\\n    \"$(git ls-remote --heads https://git.example.org/team/$r.git | wc -l)\" \\\n    \"$(git ls-remote --tags  https://git.example.org/team/$r.git | grep -vc '\\^{}')\"\ndone\n```\n`grep -vc '\\^{}'` blendet die zusätzlichen Zeilen aus, die annotierte Tags in der Ausgabe erzeugen. Die Zahlen werden mit dem Spiegel verglichen (`git -C app.git branch | wc -l`)."
    },
    {
        "id": 237,
        "category": "Git::6. Gegenprobe und Umstellung",
        "question": "Alle Repos liegen jetzt im internen Git. Beschreibe die Schritte einer sauberen Umstellung, bevor die alten Repos gelöscht werden dürfen, und begründe, warum nicht sofort gelöscht wird.",
        "answer": "1. **Gegenprobe:** Für jedes Repo Branches und Tags an Quelle und Ziel zählen und vergleichen (`git ls-remote`), den Standard-Branch prüfen.\n2. **Klone umstellen:** auf allen Rechnern `git remote set-url origin <neue-adresse>`.\n3. **Automationen umstellen:** Sync-Skripte, CI und nächtliche Builds auf die neue Adresse, mit neuen Deploy-Keys (nur Lesen).\n4. **Plattform-Inhalte** übernehmen, soweit nötig: Issues, Wiki, Releases, Schutzregeln für Branches.\n5. **Alte Repos archivieren**, also schreibgeschützt stellen, statt sie zu löschen.\n6. **Aufräumen:** Stick, Kopien auf der Schleuse und entpackte Dateien löschen, alte Tokens und Deploy-Keys widerrufen.\n\n**Warum nicht sofort löschen?** Solange nicht nachgewiesen ist, dass am neuen Ort alles vollständig ist und alle Abläufe laufen, ist das alte Repo der **Rückweg**. Durch die Archivierung arbeitet niemand mehr versehentlich auf dem alten Stand, aber nichts ist verloren. Gelöscht wird erst nach einer vereinbarten Frist.",
        "keywords": ["gegenprobe|zählen|vergleich|prüfen", "set-url|umstellen|klone", "automation|ci|skript|build|deploy", "archiv|schreibgeschützt", "aufräumen|widerruf|tokens|löschen", "rückweg|zurück|sicherheit|nachweis"],
        "validationType": "concept",
        "topicId": 37,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nZählen, umstellen, archivieren, aufräumen. Gelöscht wird erst, wenn alles am neuen Ort nachweislich läuft.\n---\n> **Tux-Ansage:** Die alte Stellung wird erst geräumt, wenn die neue besetzt und gesichert ist. Und die Schlüssel der alten Stellung werden eingezogen!\n---\n### 2. Deep Dive\nTypische Fallen nach einem Umzug:\n- Ein vergessener Klon pusht weiter ins alte System, die Änderung fehlt im neuen.\n- Ein nächtlicher Job zieht still weiter vom alten Server und baut veraltete Stände. Hilfreich ist eine Anzeige, wie alt der Datenstand ist, oder eine Meldung bei Fehlschlag.\n- Alte Zugangsdaten bleiben gültig und werden vergessen. Jedes Token und jeder Deploy-Key des alten Systems gehört auf die Liste zum Widerrufen.\n\nArchivieren statt Löschen: Archivierte Repos sind schreibgeschützt, bleiben aber lesbar. Fehlt nach Wochen doch ein Branch oder ein Issue, ist er noch da. Gelöscht wird erst nach einer vereinbarten Frist."
    },
    {
        "id": 138,
        "category": "Git::7. Aktualisieren",
        "question": "Auf einem Server soll ein Repo aktualisiert werden. Hole den neuesten Stand vom Remote, aber nur, wenn dein Branch einfach vorgespult werden kann, ohne dass ein Merge-Commit entsteht.",
        "answer": "`git pull --ff-only`\n\n*ff* steht für **Fast-Forward**, also Vorspulen. Der Befehl übernimmt die neuen Commits nur, wenn dein lokaler Stand ein **direkter Vorgänger** des Remote-Stands ist. Dann rückt dein Branch einfach nach vorn.\n\nIst das nicht möglich, weil lokal eigene Commits liegen oder die Historie auf dem Remote umgeschrieben wurde, **bricht der Befehl ab**, statt einen Merge-Commit zu erzeugen. Auf einem Server ist das genau richtig: Dort sollte niemand entwickeln, ein Abbruch ist also ein Warnsignal, dem man erst nachgeht.",
        "validationType": "command",
        "solutions": ["git\\s+pull\\s+--ff-only"],
        "topicId": 38,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`--ff-only` übernimmt neue Commits nur, wenn dein Stand ein direkter Vorgänger ist. Auf Servern ist das der sichere Standard.\n---\n> **Tux-Ansage:** Auf dem Server wird nicht improvisiert, Rekrut! Entweder der neue Stand passt glatt drauf, oder es wird abgebrochen und nachgesehen.\n---\n### 2. Deep Dive\nEin normales `git pull` erzeugt einen Merge-Commit, wenn lokal und auf dem Remote unterschiedliche Commits liegen. Auf einem Server, an dem niemand entwickeln sollte, ist das ein Warnsignal: Jemand hat dort etwas geändert, oder die Historie auf dem Remote wurde umgeschrieben.\n\n```bash\ngit pull --ff-only\n# oder dauerhaft für dieses Repo:\ngit config pull.ff only\n```\n\nBricht `--ff-only` ab, erst nachsehen (`git status`, `git log --oneline --graph --all -n 20`), bevor irgendetwas überschrieben wird.\n---\n### 3. Schaubild\n```\nFast-Forward möglich:       nicht möglich:\nlokal:  A--B                lokal:  A--B--L\nremote: A--B--C--D          remote: A--B--C\n=> main rückt auf D         => --ff-only bricht ab\n```"
    },
    {
        "id": 38,
        "category": "Git::7. Aktualisieren",
        "question": "Bevor du eine Installation auf einem Server aktualisierst, willst du sehen, ob und was sich auf dem Remote geändert hat, ohne schon etwas zu übernehmen. Beschreibe dein Vorgehen mit den passenden Befehlen.",
        "answer": "1. **`git fetch`** holt die neuen Commits vom Remote, ändert aber **nichts** an deinen Dateien. Nur `origin/main` rückt nach.\n2. **`git status`** zeigt, ob dein Stand hinterherhängt („behind by 3 commits“) und ob es lokale Änderungen gibt, die bei einem Update stören würden.\n3. **Ansehen, was kommt:**\n```bash\ngit log --oneline HEAD..origin/main     # die neuen Commits\ngit diff --stat HEAD origin/main        # welche Dateien sich ändern\n```\n4. **Erst dann übernehmen:** `git pull --ff-only` und den Dienst neu bauen bzw. neu starten.\n\nSo weißt du **vorher**, was das Update mitbringt, etwa eine geänderte Konfiguration oder ein Datenbank-Update, und kannst dich darauf einstellen.",
        "keywords": ["fetch", "status", "log|diff", "nichts|ohne zu übernehmen|unverändert|keine änderung", "pull|übernehmen|danach"],
        "validationType": "concept",
        "topicId": 38,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\nErst `fetch` und ansehen, dann `pull --ff-only`. So weißt du vorher, was das Update mitbringt.\n---\n> **Tux-Ansage:** Du marschierst doch auch nicht blind ins Gelände! Erst aufklären, was kommt, dann vorrücken.\n---\n### 2. Deep Dive\n```bash\ngit fetch\ngit status -sb                         # z. B. ## main...origin/main [behind 3]\ngit log --oneline HEAD..origin/main     # was neu ist\ngit diff --stat HEAD origin/main        # welche Dateien\ngit pull --ff-only\n```\n\nLiegen lokale Änderungen vor (`git status` zeigt geänderte Dateien), gehören die geklärt, bevor aktualisiert wird: Entweder sind es Konfigurationsdateien, die gar nicht im Repo stehen sollten (`.env`, Daten), oder jemand hat direkt auf dem Server gearbeitet.\n\nNach dem `pull` bei Anwendungen mit Container meist noch neu bauen und starten, z. B. über das Installations- oder Update-Skript des Projekts."
    },
    {
        "id": 238,
        "category": "Git::7. Aktualisieren",
        "question": "Nach einem Update auf dem Server sehen manche Nutzer einer installierten Web-App (PWA) noch den alten Stand, z. B. ohne die neuen Fragen. Andere sehen schon den neuen. Woran liegt das, und was hilft dauerhaft?",
        "answer": "Eine PWA hat einen **Service Worker**. Er speichert die Dateien der App im **Cache** des Geräts, damit sie schnell und auch offline lädt. Bei jedem Aufruf liefert er die Dateien aus diesem Cache, nicht frisch vom Server.\n\nEin neuer Service Worker wird nur installiert, wenn sich die Datei `sw.js` selbst geändert hat. Bleiben ihr Inhalt und damit der **Cache-Name** gleich, liefert der alte Service Worker weiter die **alten Dateien**, auch wenn der Server längst neue hat. Wer die App frisch installiert hat oder deren Cache gelöscht wurde, sieht dagegen schon den neuen Stand.\n\n**Dauerhafte Abhilfe:** bei jedem Update die **Cache-Version** in `sw.js` erhöhen, z. B. von `app-v188` auf `app-v189`. Dann erkennt der Browser einen neuen Service Worker, installiert ihn, löscht den alten Cache und lädt die aktuellen Dateien.\n\nEinzelnen Nutzern hilft kurzfristig, die App einmal ganz zu schließen und neu zu öffnen.",
        "keywords": ["service worker|serviceworker|sw\\.js", "cache", "alte|alter stand|veraltet", "version|cache-name|cache name", "erhöhen|ändern|hochzählen|neue version"],
        "validationType": "concept",
        "topicId": 38,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nNeue Dateien auf dem Server reichen nicht: Ohne neue Cache-Version liefert der Service Worker weiter den alten Stand aus.\n---\n> **Tux-Ansage:** Der Service Worker ist dein übereifriger Fourier: Er gibt die alte Ausrüstung aus, bis jemand ihm offiziell eine neue Liste in die Hand drückt!\n---\n### 2. Deep Dive\nAblauf beim Update einer PWA:\n1. Der Browser lädt `sw.js` neu und vergleicht sie byteweise mit der installierten Version.\n2. Nur wenn sich `sw.js` geändert hat, wird der neue Service Worker installiert. Eine geänderte Cache-Version ist genau so eine Änderung.\n3. Beim Aktivieren löscht er Caches mit altem Namen:\n```js\nconst CACHE_NAME = 'app-v189';\nself.addEventListener('activate', e => e.waitUntil(\n  caches.keys().then(keys => Promise.all(\n    keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))));\n```\n\nZum Testen: in den Entwicklerwerkzeugen unter „Anwendung“ → „Service Worker“ den alten abmelden oder ein frisches Browser-Profil nutzen. Ein einfaches Neuladen mit Strg+F5 umgeht den Service Worker oft nicht.\n---\n### 3. Schaubild\n```\nohne neue Cache-Version in sw.js:\nServer: neu    SW-Cache v188: alt  --> Nutzer sieht alt\n\nmit neuer Cache-Version in sw.js:\nServer: neu -> SW v189 lädt neu, löscht v188\n                                   --> Nutzer sieht neu\n```"
    },
    {
        "id": 139,
        "category": "Git Grundlagen::1. Was ist Git?",
        "question": "Ein neuer Kollege fragt dich, wozu euer Team Git benutzt. Erkläre ihm, was Git ist und welche drei Aufgaben es in einem Projekt übernimmt.",
        "answer": "**Git ist ein Versionsverwaltungssystem.** Es merkt sich jeden Stand eines Projekts, den du bewusst festhältst. So ein festgehaltener Stand heißt **Commit**.\n\nDamit übernimmt Git drei Aufgaben:\n- **Nachvollziehen:** Zu jeder Änderung steht fest, wer sie wann und warum gemacht hat (`git log`).\n- **Zurückgehen:** Jeder frühere Stand lässt sich wiederherstellen, wenn etwas kaputtgeht.\n- **Zusammenarbeiten:** Mehrere Personen arbeiten gleichzeitig am selben Projekt, Git führt ihre Änderungen zusammen.\n\nGit ist nicht auf Programmcode beschränkt. Konfigurationsdateien, Skripte und Dokumentation lassen sich genauso versionieren.",
        "keywords": ["versionsverwaltung|versionskontrolle", "commit|stand|version|schnappschuss", "nachvollziehen|historie|verlauf|änderungen", "zurück|wiederherstellen|rückgängig", "zusammenarbeit|team|mehrere|gemeinsam|zusammenführen"],
        "validationType": "concept",
        "topicId": 39,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\nGit merkt sich die Geschichte eines Projekts als Folge von Ständen (Commits) und macht Zusammenarbeit ohne Datenverlust möglich.\n---\n> **Tux-Ansage:** Ohne Versionsverwaltung arbeitest du ohne Sicherungsseil, Rekrut. Einmal falsch gespeichert, und die gute Version ist weg!\n---\n### 2. Deep Dive\nTypische Einsätze: Programmcode, Konfigurationsdateien von Servern (`/etc` per Git verwalten), Dokumentation, Infrastruktur als Code.\n\nWas Git dir gibt:\n- **Historie:** wer hat wann was geändert und warum (Commit-Nachricht)\n- **Rückweg:** jeder alte Stand lässt sich wiederherstellen\n- **Parallele Arbeit:** Branches für Experimente, ohne den Hauptstand zu gefährden\n- **Zusammenarbeit:** Änderungen mehrerer Personen zusammenführen"
    },
    {
        "id": 39,
        "category": "Git Grundlagen::1. Was ist Git?",
        "question": "Mit Subversion, einer zentralen Versionsverwaltung, kannst du ohne Verbindung zum Server nicht committen, mit Git schon. Erkläre den Unterschied zwischen zentraler und verteilter Versionsverwaltung und warum Git deshalb auch offline funktioniert.",
        "answer": "**Zentral (z. B. Subversion):** Die Historie liegt nur auf einem Server. Auf deinem Rechner hast du nur den aktuellen Stand der Dateien. Für Commit, Log oder den Vergleich mit alten Ständen brauchst du eine Verbindung zum Server. Fällt er aus, kann niemand weiterarbeiten.\n\n**Verteilt (Git):** Jeder Klon enthält die **vollständige Historie** im Ordner `.git`. Commit, Log, Diff und Branches laufen **lokal**. Deshalb funktioniert Git offline und ist schnell. Mit anderen tauschst du Änderungen erst aus, wenn du willst: `git push` schickt deine Commits, `git pull` holt die der anderen.\n\nDer Server, z. B. bei GitHub oder GitLab, ist bei Git nur ein **gemeinsamer Treffpunkt**. Nebeneffekt: Jeder Klon ist zugleich eine komplette Sicherung.",
        "keywords": ["zentral", "verteilt|dezentral", "vollständig|komplett|ganze historie|gesamte historie", "lokal|offline", "server", "push|pull|austausch"],
        "validationType": "concept",
        "topicId": 39,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\nGit ist verteilt: Jeder Klon ist ein vollständiges Repository mit kompletter Historie, der Server ist nur ein vereinbarter Treffpunkt.\n---\n> **Tux-Ansage:** Fällt der Server aus, ist bei Git nicht alles verloren. Jeder Kamerad trägt eine komplette Kopie im Gepäck!\n---\n### 2. Deep Dive\nFolgen der verteilten Arbeitsweise:\n- Fast alle Befehle laufen lokal und damit schnell, auch offline.\n- Jeder Klon ist zugleich eine Sicherung.\n- Ein „Server“ (GitHub, GitLab, Gitea, ein internes Git) ist technisch nur ein weiteres Repository, auf das man sich einigt.\n\nDer Austausch passiert ausdrücklich mit `git fetch`, `git pull` und `git push`.\n---\n### 3. Schaubild\n```\nzentral:\n Client --+\n Client --+--> Server (einzige Historie)\n Client --+\n\nverteilt (Git):\n Klon A <---> Server <---> Klon B\n (komplett)  (Treffpunkt) (komplett)\n```"
    },
    {
        "id": 239,
        "category": "Git Grundlagen::1. Was ist Git?",
        "question": "Ein bereits gepushter Commit wird nachträglich verändert und erneut gepusht. Erkläre, was ein Commit technisch ist und warum alle, die den alten Stand haben, diese Änderung bemerken.",
        "answer": "Ein Commit ist ein gespeichertes Objekt mit:\n- einem **Schnappschuss** aller Dateien (Verweis auf einen *Tree*),\n- Autor, Zeitpunkt und Commit-Nachricht,\n- dem Verweis auf seinen **Vorgänger** (Parent).\n\nSeine ID ist eine **Prüfsumme (Hash)**, die Git aus genau diesen Inhalten berechnet, z. B. `9a8b7c…`. Ändert man auch nur ein Zeichen, ergibt sich ein anderer Hash, also ein **neuer Commit**. Weil jeder Nachfolger den Hash seines Vorgängers enthält, bekommen auch **alle späteren Commits neue IDs**.\n\nWer den alten Stand hat, sieht deshalb sofort, dass die Historie nicht mehr zusammenpasst: `git pull` meldet auseinanderlaufende Branches, und `git push` wird ohne `--force` abgelehnt. Nachträglich ändern geht also nur sichtbar, nie heimlich.",
        "keywords": ["hash|prüfsumme|sha|checksumme", "vorgänger|parent|eltern", "schnappschuss|snapshot|tree|inhalt", "neuer commit|neue id|anderer hash|andere id", "nachfolger|kette|alle späteren|folgende"],
        "validationType": "concept",
        "topicId": 39,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nCommits sind über Prüfsummen verkettet. Jede Änderung an der Vergangenheit erzeugt neue IDs und fällt dadurch auf.\n---\n> **Tux-Ansage:** Die Kette der Commits ist wie ein versiegeltes Dienstbuch. Wer eine Seite herausreißt, zerreißt das Siegel!\n---\n### 2. Deep Dive\nGit speichert Objekte in `.git/objects`:\n- **Blob:** Inhalt einer Datei\n- **Tree:** Verzeichnis mit Verweisen auf Blobs und Trees\n- **Commit:** Verweis auf einen Tree, auf den/die Vorgänger, Autor, Zeit, Nachricht\n\n```bash\ngit cat-file -p HEAD      # Commit-Objekt ansehen\ngit cat-file -p HEAD^{tree}\n```\nDeshalb gilt: Geteilte Historie nicht umschreiben (`rebase`, `commit --amend`, `reset` auf bereits gepushte Commits), sonst müssen alle anderen ihre Kopien reparieren.\n---\n### 3. Schaubild\n```\n+--------+     +--------+     +--------+\n| a1b2c3 |<----| d4e5f6 |<----| 9a8b7c |  <- HEAD\n| Tree   |     | Tree   |     | Tree   |\n+--------+     +--------+     +--------+\n Jeder Commit kennt seinen Vorgänger (Hash).\n```"
    },
    {
        "id": 140,
        "category": "Git Grundlagen::2. Erste Schritte",
        "question": "Du stehst im Terminal im Ordner 'projekt', der ein paar Skripte enthält. Mit welchem Befehl machst du daraus ein Git-Repository?",
        "answer": "`git init`\n\nDer Befehl legt im aktuellen Ordner den versteckten Unterordner `.git` an. Darin speichert Git alles: Commits, Branches und Einstellungen. Deine vorhandenen Dateien bleiben unverändert und sind zunächst **untracked**, also noch nicht versioniert. Erst mit `git add` und `git commit` kommt der erste Stand in die Historie.\n\nEin bestehendes Repository von einem Server holst du dagegen mit `git clone <adresse>`. Dafür brauchst du kein `git init`.",
        "validationType": "command",
        "solutions": ["git\\s+init"],
        "topicId": 40,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`git init` macht aus einem normalen Verzeichnis ein Git-Repository.\n---\n> **Tux-Ansage:** Erst wird das Lager eingerichtet, dann wird eingelagert. Ohne `git init` kein Git, Rekrut!\n---\n### 2. Deep Dive\n```bash\nmkdir projekt && cd projekt\ngit init\ngit status\n```\nDer Ordner `.git` enthält Historie, Branches und Einstellungen dieses Repos. Löschst du ihn, ist die Versionsverwaltung weg, die Dateien bleiben.\n\nMit `git init -b main` legst du den ersten Branch gleich mit dem Namen `main` an."
    },
    {
        "id": 40,
        "category": "Git Grundlagen::2. Erste Schritte",
        "question": "Bevor du deinen ersten Commit machst, muss Git wissen, wer du bist. Trage den Namen 'Max Muster' so ein, dass er für alle Repositories deines Benutzerkontos gilt.",
        "answer": "```bash\ngit config --global user.name \"Max Muster\"\ngit config --global user.email \"max@example.com\"\n```\nGit schreibt Name und E-Mail in **jeden Commit** als Autor. Fehlen sie, bricht `git commit` mit einer Aufforderung ab. Die E-Mail-Adresse trägst du auf dieselbe Weise ein.\n\n`--global` speichert die Werte in `~/.gitconfig`, sie gelten damit für alle Repositories deines Benutzers. Ohne `--global` gilt die Einstellung nur im aktuellen Repository (`.git/config`), z. B. für eine dienstliche Adresse in einem einzelnen Projekt. Was gerade gilt, zeigt `git config --list --show-origin`.",
        "validationType": "command",
        "solutions": ["git\\s+config\\s+--global\\s+user\\.name\\s+[\"']?max\\s+muster[\"']?$"],
        "topicId": 40,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\n`git config --global` speichert Einstellungen für alle Repos des Benutzers in `~/.gitconfig`.\n---\n> **Tux-Ansage:** Ein Commit ohne Namen ist wie ein Funkspruch ohne Rufzeichen. Keiner weiß, wer da gesprochen hat!\n---\n### 2. Deep Dive\nGit kennt drei Ebenen, die spätere überschreibt die frühere:\n- `--system`: für alle Benutzer (`/etc/gitconfig`)\n- `--global`: für deinen Benutzer (`~/.gitconfig`)\n- `--local`: nur dieses Repo (`.git/config`), Standard ohne Option\n\n```bash\ngit config --list --show-origin   # was gilt woher?\n```\nFür ein dienstliches Repo kannst du lokal eine andere E-Mail setzen als global.\n---\n### 3. Schaubild\n```\n--system  (/etc/gitconfig)\n   |  wird überschrieben von\n--global  (~/.gitconfig)\n   |  wird überschrieben von\n--local   (.git/config)\n```"
    },
    {
        "id": 240,
        "category": "Git Grundlagen::2. Erste Schritte",
        "question": "'git status' zeigt eine neue Datei unter 'Untracked files'. Erkläre, was das bedeutet, und beschreibe die vier Zustände, die eine Datei in Git haben kann, jeweils mit dem Befehl, der sie in den nächsten Zustand bringt.",
        "answer": "**Untracked** heißt: Git kennt die Datei noch nicht. Sie steht in keinem Commit, und Git verfolgt ihre Änderungen nicht.\n\nDie vier Zustände:\n1. **untracked**: neu, noch nicht versioniert. `git add` merkt sie vor.\n2. **staged**: für den nächsten Commit vorgemerkt. `git commit` hält sie fest.\n3. **unmodified**: genau wie im letzten Commit, es gibt nichts zu tun.\n4. **modified**: seit dem letzten Commit geändert, aber noch nicht vorgemerkt. `git add` macht sie wieder zu staged.\n\nDer Kreislauf lautet also: ändern, `git add`, `git commit`. Wichtig: `git add` merkt den Stand **zum Zeitpunkt des Befehls** vor. Änderst du die Datei danach noch einmal, ist sie gleichzeitig staged (alte Änderung) und modified (neue Änderung).",
        "keywords": ["untracked|unbekannt|nicht versioniert", "staged|vorgemerkt|staging|index", "unmodified|unverändert", "modified|geändert", "git add", "git commit"],
        "validationType": "concept",
        "topicId": 40,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nEine Datei wandert von untracked über staged in den Commit. Danach ist sie unmodified, bis du sie wieder änderst.\n---\n> **Tux-Ansage:** `git status` ist dein Lagebericht. Wer ihn nicht liest, marschiert blind ins Gelände!\n---\n### 2. Deep Dive\n```bash\ngit status -s      # Kurzform\n?? neu.txt         # untracked\n M geaendert.txt   # modified, nicht vorgemerkt\nM  vorgemerkt.txt  # staged\n```\nDateien, die nie versioniert werden sollen (Logs, Passwörter, Build-Ergebnisse), gehören in `.gitignore`, dann erscheinen sie nicht mehr als untracked.\n---\n### 3. Schaubild\n```\nuntracked --git add--> staged --git commit--> unmodified\n                        ^                        |\n                        |      Datei ändern      v\n                        +---git add--- modified <+\n```"
    },
    {
        "id": 141,
        "category": "Git Grundlagen::3. Änderungen festhalten",
        "question": "Du hast die Datei 'readme.md' geändert und willst die Änderung im nächsten Commit haben. Mit welchem Befehl merkst du sie dafür vor?",
        "answer": "`git add readme.md`\n\nGit übernimmt Änderungen nicht automatisch in einen Commit. Mit `git add` legst du die Datei in den **Staging-Bereich**, also auf die Liste für den nächsten Commit. Erst `git commit -m \"Readme ergänzt\"` hält sie dann in der Historie fest.\n\n`git status` zeigt die Datei danach unter „Changes to be committed“. `git add .` merkt alle geänderten Dateien auf einmal vor; meist ist es aber besser, gezielt auszuwählen.",
        "validationType": "command",
        "solutions": ["git\\s+add\\s+(\\./)?readme\\.md"],
        "topicId": 41,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`git add` legt den aktuellen Inhalt einer Datei in den Staging-Bereich.\n---\n> **Tux-Ansage:** Vormerken heißt nicht festhalten. Erst `git commit` schreibt es ins Dienstbuch!\n---\n### 2. Deep Dive\n```bash\ngit add readme.md     # eine Datei\ngit add .             # alle Änderungen im aktuellen Verzeichnis\ngit add -p            # Änderungen stückweise auswählen\n```\nÄnderst du die Datei nach `git add` noch einmal, ist nur der Stand von vorher vorgemerkt. Dann erneut `git add`."
    },
    {
        "id": 41,
        "category": "Git Grundlagen::3. Änderungen festhalten",
        "question": "Du hast in 'login.js' einen Fehler behoben und nebenbei an der Dokumentation im Ordner 'docs/' gearbeitet. Wie hilft dir der Staging-Bereich, daraus saubere Commits zu machen, und wie gehst du vor?",
        "answer": "Der Staging-Bereich (auch **Index**) liegt zwischen deinen Dateien und der Historie. In ihm legst du fest, **was genau in den nächsten Commit kommt**. So teilst du zwei unabhängige Änderungen in **zwei getrennte Commits** auf:\n\n```bash\ngit add login.js\ngit commit -m \"Login: Fehler bei leerem Passwort behoben\"\ngit add docs/\ngit commit -m \"Doku: Anmeldung beschrieben\"\n```\n\nVorteil: Jeder Commit hat genau ein Thema. Die Historie bleibt lesbar, und muss der Fix später zurückgenommen werden (`git revert`), bleibt die Dokumentation unberührt. Mit `git add -p` kannst du sogar einzelne Abschnitte einer Datei vormerken.",
        "keywords": ["staging|index|vormerken", "auswählen|auswahl|gezielt|festlegen|bestimmen", "getrennt|zwei commits|aufteilen|einzeln", "thema|sauber|übersicht|nachvollziehbar|lesbar", "git add"],
        "validationType": "concept",
        "topicId": 41,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\nStaging trennt „was ich geändert habe“ von „was in diesen Commit gehört“.\n---\n> **Tux-Ansage:** Ein guter Commit ist wie ein guter Marschbefehl: ein Ziel, klar beschrieben. Nicht alles auf einmal!\n---\n### 2. Deep Dive\n```bash\ngit add src/login.js        # nur die Login-Korrektur\ngit commit -m \"fix: login timeout\"\ngit add docs/               # danach die Doku\ngit commit -m \"docs: login\"\n```\nNützlich:\n- `git diff` zeigt, was geändert, aber noch nicht vorgemerkt ist.\n- `git diff --staged` zeigt, was im nächsten Commit landet.\n- `git restore --staged datei` nimmt eine Datei wieder aus dem Staging.\n---\n### 3. Schaubild\n```\n Arbeitsverzeichnis       Staging           Repository\n +----------------+     +---------+       +-----------+\n | login.js  (M)  |---->| login.js|------>| Commit    |\n | docs/     (M)  |     +---------+       | \"fix...\"  |\n +----------------+  git add        commit+-----------+\n  git diff          git diff --staged\n```"
    },
    {
        "id": 241,
        "category": "Git Grundlagen::3. Änderungen festhalten",
        "question": "Du sollst dir einen Überblick über ein Repository mit mehreren Branches verschaffen und nutzt 'git log --oneline --graph --all'. Was zeigt dir der Befehl, und was bedeutet die Markierung HEAD in der Ausgabe?",
        "answer": "Der Befehl zeigt die Historie als kompakten Baum:\n- `--oneline`: eine Zeile pro Commit, mit kurzem Hash und Nachricht,\n- `--graph`: Verzweigungen und Zusammenführungen als Linien,\n- `--all`: **alle Branches** und Tags, nicht nur den aktuellen.\n\n**HEAD** zeigt, **wo du gerade stehst**. Normalerweise zeigt HEAD auf einen Branch, z. B. `HEAD -> main`, und dieser Branch zeigt auf seinen neuesten Commit. Ein neuer Commit landet dort, wo HEAD steht, und der Branch rückt mit.\n\nZeigt HEAD direkt auf einen Commit statt auf einen Branch (*detached HEAD*, z. B. nach `git checkout a1b2c3`), gehören neue Commits zu keinem Branch und gehen beim Wechseln leicht verloren.",
        "keywords": ["alle branches|--all|sämtliche", "graph|baum|verzweigung|grafik|linien", "eine zeile|oneline|kompakt", "head", "aktuell|gerade|wo du stehst|position|zeiger"],
        "validationType": "concept",
        "topicId": 41,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\n`git log --oneline --graph --all` ist die Lagekarte des Repos, HEAD markiert den eigenen Standort.\n---\n> **Tux-Ansage:** Wer die Lagekarte nicht lesen kann, verläuft sich zwischen den Branches. Übe das, Rekrut!\n---\n### 2. Deep Dive\n```bash\ngit log --oneline --graph --all --decorate\n* 9a8b7c (HEAD -> main) Merge branch 'feature'\n|\\\n| * 3c4d5e (feature) Neue Funktion\n* | 1f2e3d Doku\n|/\n* a1b2c3 Start\n```\n- `HEAD -> main`: du bist auf Branch `main`.\n- Zeigt HEAD direkt auf einen Commit ohne Branch („detached HEAD“), gehen neue Commits leicht verloren, wenn du den Branch wechselst. Dann vorher einen Branch anlegen: `git switch -c rettung`.\n---\n### 3. Schaubild\n```\nHEAD --> main --> 9a8b7c\n                  |     \\\n             1f2e3d    3c4d5e <-- feature\n                  \\     /\n                  a1b2c3\n```"
    },
    {
        "id": 142,
        "category": "Git Grundlagen::4. Branches",
        "question": "Du willst eine neue Funktion entwickeln, ohne 'main' zu verändern. Lege einen Branch 'feature' an und wechsle mit einem einzigen Befehl direkt dorthin.",
        "answer": "`git switch -c feature`\n\n`-c` steht für *create*: Git legt den Branch an, und du stehst sofort darauf. Er beginnt bei dem Commit, auf dem du gerade warst. Neue Commits landen ab jetzt auf `feature`, `main` bleibt unverändert.\n\nÄltere Schreibweise mit gleicher Wirkung: `git checkout -b feature`. Zurück geht es mit `git switch main`.",
        "validationType": "command",
        "solutions": ["git\\s+switch\\s+-c\\s+feature", "git\\s+checkout\\s+-b\\s+feature"],
        "topicId": 42,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`git switch -c name` legt einen Branch an und wechselt hinein.\n---\n> **Tux-Ansage:** Neue Mission, eigener Abschnitt! Experimente gehören in einen eigenen Branch, nicht an die Front von main.\n---\n### 2. Deep Dive\n```bash\ngit branch            # Branches anzeigen, * = aktuell\ngit switch -c feature # anlegen und wechseln\ngit switch main       # zurück\ngit branch -d feature # löschen (nach dem Zusammenführen)\n```\nEin Branch ist nur ein beweglicher Zeiger auf einen Commit. Ihn anzulegen kostet praktisch nichts.\n---\n### 3. Schaubild\n```\n          main\n           |\na1b2c3 <- d4e5f6\n           |\n          feature  (neu, zeigt auf denselben Commit)\n```"
    },
    {
        "id": 42,
        "category": "Git Grundlagen::4. Branches",
        "question": "Du stehst auf 'main' und führst 'git merge feature' aus. Manchmal entsteht dabei ein zusätzlicher Merge-Commit, manchmal nicht. Erkläre, wann es einen Fast-Forward gibt und wann einen Merge-Commit.",
        "answer": "Das hängt davon ab, ob sich `main` seit dem Abzweigen von `feature` verändert hat.\n\n**Fast-Forward:** `main` hat **keine eigenen neuen Commits**. Dann liegt `feature` einfach „vor“ `main`, und Git schiebt den Zeiger `main` nur nach vorn auf den letzten Commit von `feature`. Es entsteht kein neuer Commit, die Historie bleibt eine gerade Linie.\n\n**Merge-Commit:** **Beide** Branches haben neue Commits, die Historie hat sich also verzweigt. Git führt beide Stände zusammen und legt dafür einen neuen Commit mit **zwei Vorgängern** an.\n\nWer immer einen Merge-Commit möchte, damit später sichtbar bleibt, dass ein Feature zusammengeführt wurde, nutzt `git merge --no-ff feature`.",
        "keywords": ["fast-forward|fast forward|vorspulen", "keine eigenen|keine neuen|unverändert", "beide|verzweigt|auseinander", "zeiger|verschieben|schiebt|nach vorn", "merge-commit|merge commit|neuer commit", "zwei vorgänger|zwei eltern"],
        "validationType": "concept",
        "topicId": 42,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\nFast-Forward = Zeiger vorschieben, Merge-Commit = zwei Linien zusammenführen.\n---\n> **Tux-Ansage:** Ist der Weg frei, marschierst du einfach weiter. Kommen zwei Trupps aus verschiedenen Richtungen, wird ein Treffpunkt vereinbart!\n---\n### 2. Deep Dive\n```bash\ngit switch main\ngit merge feature            # Fast-Forward, wenn möglich\ngit merge --no-ff feature    # immer einen Merge-Commit anlegen\ngit merge --ff-only feature  # nur Fast-Forward, sonst abbrechen\n```\nViele Teams erzwingen `--no-ff`, damit in der Historie sichtbar bleibt, dass eine Funktion als Ganzes hinzugekommen ist.\n---\n### 3. Schaubild\n```\nFast-Forward:            Merge-Commit:\nA--B--C  (feature)       A--B--C------M  (main)\n   ^                         \\       /\n  main --> wird auf C         D--E--+    (feature)\n           geschoben\n```"
    },
    {
        "id": 242,
        "category": "Git Grundlagen::4. Branches",
        "question": "Ein Kollege arbeitet seit sechs Wochen auf seinem Branch, ohne Änderungen aus 'main' zu übernehmen. Welche Probleme drohen beim Zusammenführen, und wie hätte er sie vermeiden können?",
        "answer": "Während er getrennt arbeitet, entwickeln andere `main` weiter. Beide Stände laufen immer weiter auseinander. Beim späten Zusammenführen drohen:\n- **viele und große Konflikte**, oft in Code, den er gar nicht mehr im Kopf hat,\n- **Fehler, die erst spät auffallen**, weil sein Code nie zusammen mit den neuen Änderungen getestet wurde,\n- **doppelte Arbeit**, weil er Dinge baut, die in `main` inzwischen anders gelöst sind.\n\nVermeiden lässt sich das mit **kurzen Branches**, die nach Tagen statt Wochen zurückfließen, und indem er **regelmäßig `main` einbindet**:\n```bash\ngit switch feature\ngit merge main      # oder: git rebase main\n```\nViele kleine Konflikte sind schnell gelöst, ein riesiger am Ende kostet Tage.",
        "keywords": ["konflikt", "auseinander|abweichen|veraltet", "spät|am ende", "regelmäßig|häufig|oft|täglich", "kurz|klein", "merge main|rebase|einbinden|aktualisieren"],
        "validationType": "concept",
        "topicId": 42,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nKleine, kurzlebige Branches = kleine Konflikte. Lange Trennung = großes Integrationschaos.\n---\n> **Tux-Ansage:** Wer wochenlang allein im Wald übt, findet den Weg zur Truppe nicht mehr. Regelmäßig Verbindung halten!\n---\n### 2. Deep Dive\nGute Praxis:\n- Ein Branch pro Aufgabe, nach Tagen statt Wochen zurück nach `main`.\n- Zwischendurch `main` in den Branch holen:\n```bash\ngit switch feature\ngit fetch\ngit merge origin/main      # oder: git rebase origin/main (nur bei nicht geteilten Branches)\n```\n- Größere Vorhaben in mehrere kleine Schritte teilen, unfertige Teile hinter einem Schalter verstecken.\n---\n### 3. Schaubild\n```\nmain:    A--B--C--D--E--F--G--H\n              \\              \\\nfeature:       x--y--z ...... ?  <- spät: viele\n\nmain:    A--B--C--D--E--F\n              \\  \\     \\\nfeature:       x--M1--y--M2  <- regelmäßig: klein\n```"
    },
    {
        "id": 143,
        "category": "Git Grundlagen::5. Arbeiten mit Remotes",
        "question": "Nach 'git clone' taucht in vielen Befehlen der Name 'origin' auf, z. B. in 'git push origin main'. Was ist 'origin', und wo kommt der Name her?",
        "answer": "`origin` ist der **Kurzname für das Remote-Repository**, von dem du geklont hast, also für dessen Adresse auf dem Server. Git legt ihn beim **Klonen** automatisch an, damit du nicht jedes Mal die volle Adresse tippen musst.\n\n`git push origin main` heißt also: Schicke den Branch `main` zum Remote mit dem Namen `origin`.\n\nDer Name ist nur eine Konvention und lässt sich ändern. `git remote -v` zeigt Namen und Adressen an. Ein Repository kann auch mehrere Remotes haben, z. B. `origin` und `backup`.",
        "keywords": ["remote|entfernt", "kurzname|name|alias|bezeichnung", "adresse|url|server", "klon|clone|geklont"],
        "validationType": "concept",
        "topicId": 43,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`origin` = Spitzname für die Server-Adresse des Repos.\n---\n> **Tux-Ansage:** Origin ist kein Zauberwort, nur der Name der Heimatbasis. Merk dir, wohin er zeigt!\n---\n### 2. Deep Dive\n```bash\ngit remote -v                     # Remotes und Adressen anzeigen\ngit remote add backup https://git.example.org/team/app.git\ngit remote rename origin github\n```\nDie Branches des Remotes erscheinen lokal als `origin/main`, `origin/feature` usw. (Remote-Tracking-Branches).\n---\n### 3. Schaubild\n```\nlokales Repo                     Server\n+-------------+   origin     +-------------------------+\n| main        |------------->| git.example.org/team/app|\n| origin/main |  (Kurzname)  +-------------------------+\n+-------------+\n```"
    },
    {
        "id": 43,
        "category": "Git Grundlagen::5. Arbeiten mit Remotes",
        "question": "Du willst wissen, ob es auf dem Server neue Commits gibt, ohne dass sich an deinen Dateien etwas ändert. Nimmst du 'git fetch' oder 'git pull'? Begründe und erkläre den Unterschied.",
        "answer": "**`git fetch`** ist hier richtig. Es **lädt** neue Commits und Branches vom Server und aktualisiert nur die Remote-Branches wie `origin/main`. Deine eigenen Branches und Dateien bleiben **unverändert**. Danach kannst du in Ruhe ansehen, was neu ist:\n```bash\ngit fetch\ngit log --oneline main..origin/main\n```\n\n**`git pull`** ist `fetch` **plus Zusammenführen**: Es übernimmt die neuen Commits sofort in deinen aktuellen Branch (Merge oder Rebase) und ändert damit deine Dateien. Dabei können Konflikte entstehen.\n\nMerke: `fetch` heißt nachsehen, `pull` heißt übernehmen.",
        "keywords": ["fetch", "lädt|herunterladen|holt|laden", "unverändert|ändert nichts|nicht verändert", "pull", "zusammenführen|merge|rebase|übernimmt"],
        "validationType": "concept",
        "topicId": 43,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\nfetch = nachsehen und holen, pull = holen und einbauen.\n---\n> **Tux-Ansage:** Erst aufklären, dann vorrücken. Wer nur pullt, weiß nicht, was er sich gerade einbaut!\n---\n### 2. Deep Dive\n```bash\ngit fetch\ngit log --oneline main..origin/main   # was ist neu?\ngit merge origin/main                 # dann bewusst einbauen\n# oder kurz:\ngit pull --ff-only                    # nur, wenn ohne Merge-Commit möglich\n```\nAuf Servern (Konfiguration, Deployments) ist `git pull --ff-only` die sichere Wahl.\n---\n### 3. Schaubild\n```\n          git fetch               git merge\nServer ------------> origin/main ----------> main\n   |                                          ^\n   +--------------- git pull ------------------+\n                 (fetch + merge)\n```"
    },
    {
        "id": 243,
        "category": "Git Grundlagen::5. Arbeiten mit Remotes",
        "question": "Dein 'git push' wird mit der Meldung 'rejected ... (fetch first)' abgelehnt. Was ist passiert, wie behebst du es richtig, und warum ist 'git push --force' hier die falsche Lösung?",
        "answer": "Auf dem Server liegen **Commits, die du lokal noch nicht hast**, meist von Kollegen. Dein Branch und der auf dem Server haben sich auseinanderentwickelt. Würde der Server deinen Push annehmen, wären ihre Commits weg. Darum lehnt er ab.\n\nRichtig ist:\n```bash\ngit pull --rebase   # fremde Commits holen, deine obendrauf setzen\n# Konflikte lösen, falls nötig, dann testen\ngit push\n```\nStatt `--rebase` geht auch ein normales `git pull` mit Merge-Commit.\n\n`git push --force` überschreibt den Branch auf dem Server mit deinem Stand. Die **Commits der anderen gehen verloren**, und wer sie schon geholt hat, bekommt Probleme. Auf gemeinsamen Branches wie `main` ist das tabu.",
        "keywords": ["neue commits|nicht lokal|kollegen|andere", "pull|fetch", "rebase|merge|zusammenführen", "force", "überschreibt|verloren|löscht|weg"],
        "validationType": "concept",
        "topicId": 43,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\n„rejected“ heißt: Der Server ist weiter als du. Erst holen und zusammenführen, dann pushen.\n---\n> **Tux-Ansage:** Mit `--force` walzt du die Arbeit deiner Kameraden platt. Das ist keine Lösung, das ist Sabotage!\n---\n### 2. Deep Dive\n```bash\ngit pull --rebase      # eigene Commits oben auf den Serverstand setzen\n# Konflikte lösen, dann:\ngit rebase --continue\ngit push\n```\nWenn Erzwingen doch nötig ist (z. B. eigener, nicht geteilter Branch nach einem Rebase), dann mit Sicherung: `git push --force-with-lease`. Das bricht ab, wenn jemand anders in der Zwischenzeit gepusht hat.\n---\n### 3. Schaubild\n```\nServer:  A--B--C--X        (X von einem Kollegen)\nLokal:   A--B--C--Y        (Y von dir)\npush Y  -> abgelehnt\npull --rebase:  A--B--C--X--Y'  -> push klappt\n```"
    },
    {
        "id": 144,
        "category": "Git Grundlagen::6. Merge-Konflikte",
        "question": "Zwei Kollegen haben in 'config.txt' dieselbe Zeile 'port 80' geändert, einer auf 'port 8080', der andere auf 'port 8443'. Beim Zusammenführen meldet Git einen Konflikt. Warum kann Git das nicht selbst lösen?",
        "answer": "Ein **Merge-Konflikt** entsteht, wenn **beide Seiten dieselbe Stelle** einer Datei **unterschiedlich** geändert haben. Git sieht zwei gleichberechtigte Änderungen an derselben Zeile und kann nicht wissen, welche fachlich richtig ist. Diese **Entscheidung** muss ein Mensch treffen.\n\nÄndern beide Seiten dagegen **verschiedene Stellen**, zum Beispiel der eine Zeile 3 und der andere Zeile 20, führt Git das automatisch zusammen.\n\nWeitere Konfliktfälle: Eine Seite löscht eine Datei, die die andere geändert hat, oder beide legen eine Datei mit gleichem Namen und unterschiedlichem Inhalt an.",
        "keywords": ["dieselbe|gleiche|selbe", "stelle|zeile", "unterschiedlich|verschieden|beide", "entscheiden|entscheidung|welche|richtig|mensch"],
        "validationType": "concept",
        "topicId": 44,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\nKonflikt = gleiche Stelle, zwei verschiedene Änderungen. Git fragt dich, statt zu raten.\n---\n> **Tux-Ansage:** Ein Konflikt ist kein Fehler, sondern eine Rückfrage. Git will wissen, welcher Befehl gilt!\n---\n### 2. Deep Dive\nÄnderungen an **verschiedenen** Stellen derselben Datei führt Git selbstständig zusammen. Nur echte Überschneidungen werden zum Konflikt.\n\n```bash\ngit merge feature\n# CONFLICT (content): Merge conflict in config.txt\ngit status        # zeigt die betroffenen Dateien\n```\n---\n### 3. Schaubild\n```\n          main:    \"port 8080\"\nBasis ---<\n\"port 80\" feature: \"port 8443\"\n                  |\n                  v\n          KONFLIKT: dieselbe Zeile\n```"
    },
    {
        "id": 44,
        "category": "Git Grundlagen::6. Merge-Konflikte",
        "question": "Nach einem Merge stehen in einer Datei plötzlich die Zeichen '<<<<<<<', '=======' und '>>>>>>>'. Was bedeuten diese Markierungen, und mit welchen Schritten löst du den Konflikt?",
        "answer": "Das sind **Konfliktmarker**. Git schreibt beide Versionen der umstrittenen Stelle in die Datei:\n- zwischen `<<<<<<< HEAD` und `=======`: **deine Version** (aktueller Branch),\n- zwischen `=======` und `>>>>>>> feature`: die **Version des anderen Branches**.\n\nLösen in drei Schritten:\n1. Datei bearbeiten: entscheiden, was bleibt (eine Version, beide oder eine Mischung), und **alle Markerzeilen löschen**.\n2. `git add datei` meldet Git, dass der Konflikt gelöst ist.\n3. `git commit` schließt den Merge ab.\n\nWer abbrechen will, kommt mit `git merge --abort` zum Stand vor dem Merge zurück.",
        "keywords": ["konfliktmarker|markierung|marker", "deine|eigene|head|aktuell", "andere|feature|fremde", "bearbeiten|entfernen|löschen", "git add", "commit"],
        "validationType": "concept",
        "topicId": 44,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\nMarker zeigen beide Versionen, du entscheidest, entfernst die Marker, `git add` und `git commit` schließen ab.\n---\n> **Tux-Ansage:** Ein vergessener Marker im Code ist wie eine Sprengfalle im eigenen Lager. Alle entfernen, Rekrut!\n---\n### 2. Deep Dive\n```text\n<<<<<<< HEAD\nport 80\n=======\nport 8080\n>>>>>>> feature\n```\nNach dem Bearbeiten:\n```bash\ngit add config.txt\ngit commit            # schließt den Merge ab\n# Abbrechen und zurück zum Stand vor dem Merge:\ngit merge --abort\n```\nVor dem Commit prüfen: `grep -rn '<<<<<<<' .` darf nichts mehr finden."
    },
    {
        "id": 244,
        "category": "Git Grundlagen::6. Merge-Konflikte",
        "question": "Euer Team verliert regelmäßig Zeit mit Merge-Konflikten. Nenne mindestens vier Maßnahmen, mit denen ihr Konflikte von vornherein klein haltet, und begründe jede kurz.",
        "answer": "- **Kurze Branches:** Sie fließen schnell zurück nach `main`, es kann also wenig auseinanderlaufen.\n- **Regelmäßig `main` einbinden** (`git merge main` oder `git rebase main`): Konflikte tauchen früh und klein auf statt spät und groß.\n- **Kleine, thematische Commits:** Ein Konflikt lässt sich leichter verstehen und gezielt lösen.\n- **Einheitliche Formatierung** durch einen Formatter und gleiche Zeilenenden: Sonst erzeugen reine Umformatierungen Konflikte in Zeilen, an denen sich inhaltlich nichts geändert hat.\n- **Arbeit absprechen:** nicht zu mehreren gleichzeitig an denselben Dateien arbeiten, große Umbauten vorher ankündigen.\n- **Nach dem Lösen testen**, bevor man pusht: Ein sauber aufgelöster Konflikt kann trotzdem fachlich falsch sein.",
        "keywords": ["kurz|klein", "regelmäßig|häufig|oft|früh", "main einbinden|merge main|rebase|aktualisieren", "format|zeilenende|einheitlich", "absprechen|absprache|kommunikation|aufteilen|verteilen", "test"],
        "validationType": "concept",
        "topicId": 44,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nKonflikte vermeidet man durch kleine, häufige Integration und gemeinsame Regeln, nicht durch Glück.\n---\n> **Tux-Ansage:** Gute Abstimmung vor dem Einsatz verhindert das Chaos im Einsatz. Redet miteinander!\n---\n### 2. Deep Dive\nTypische Ursachen großer Konflikte:\n- wochenlange Branches\n- „Aufräum-Commits“, die ganze Dateien umformatieren\n- unterschiedliche Zeilenenden (Windows/Linux, `core.autocrlf`)\n- mehrere Personen am selben Abschnitt ohne Absprache\n\nHilfreich:\n```bash\ngit config --global merge.conflictstyle zdiff3  # zeigt zusätzlich die gemeinsame Basis\ngit mergetool                                   # grafisches Werkzeug\n```"
    },
    {
        "id": 145,
        "category": "Git Grundlagen::7. Rückgängig machen und ignorieren",
        "question": "Du hast in 'config.txt' herumprobiert und willst alles verwerfen, was du seit dem letzten Commit an der Datei geändert hast. Die Änderung ist noch nicht vorgemerkt. Wie lautet der Befehl?",
        "answer": "`git restore config.txt`\n\nGit ersetzt die Datei durch den Stand aus dem letzten Commit. **Achtung:** Die verworfene Änderung ist danach endgültig weg, weil sie nie in einem Commit stand.\n\nÄltere Schreibweise: `git checkout -- config.txt`. Hast du die Datei schon mit `git add` vorgemerkt, nimmst du sie zuerst mit `git restore --staged config.txt` aus dem Staging-Bereich heraus.",
        "validationType": "command",
        "solutions": ["git\\s+restore\\s+(\\./)?config\\.txt$", "git\\s+checkout\\s+--\\s+(\\./)?config\\.txt"],
        "topicId": 45,
        "difficulty": "leicht",
        "moreInfo": "### 1. tl;dr\n`git restore datei` setzt eine Datei auf den letzten festgehaltenen Stand zurück.\n---\n> **Tux-Ansage:** Zurück auf Ausgangsstellung! Aber was nicht festgehalten war, ist danach unwiederbringlich weg.\n---\n### 2. Deep Dive\n```bash\ngit restore config.txt             # Änderung im Arbeitsverzeichnis verwerfen\ngit restore --staged config.txt    # nur aus dem Staging nehmen, Änderung bleibt\ngit restore --source=HEAD~2 config.txt   # Stand von vor zwei Commits holen\n```"
    },
    {
        "id": 45,
        "category": "Git Grundlagen::7. Rückgängig machen und ignorieren",
        "question": "In deinem Projekt entstehen Logdateien, ein Ordner 'node_modules/' und eine Datei '.env' mit Zugangsdaten. Wie verhinderst du, dass diese Dateien versehentlich committet werden, und was gilt für Dateien, die schon versioniert sind?",
        "answer": "Du trägst passende Muster in die Datei **`.gitignore`** im Projektordner ein:\n```gitignore\n*.log\nnode_modules/\n.env\n```\nPassende Dateien zeigt `git status` nicht mehr als untracked, und `git add .` nimmt sie nicht auf. Die `.gitignore` selbst wird committet, damit sie für alle im Team gilt.\n\nTypisch gehören hinein: Logs, temporäre Dateien, Build-Ergebnisse, Abhängigkeiten, lokale Einstellungen und vor allem **Geheimnisse** wie Passwörter und Schlüssel.\n\n**Wichtig:** `.gitignore` wirkt nur auf Dateien, die **noch nicht versioniert** sind. Eine schon committete Datei nimmst du mit `git rm --cached .env` aus der Versionierung, auf der Platte bleibt sie erhalten. War ein Geheimnis schon gepusht, steht es in der Historie: Zugangsdaten sofort austauschen.",
        "keywords": ["gitignore", "muster|eintrag|eintragen", "noch nicht versioniert|nicht versioniert|ignoriert", "rm --cached|cached|entfernen", "geheim|passwort|passwörter|zugangsdaten|schlüssel|env"],
        "validationType": "concept",
        "topicId": 45,
        "difficulty": "mittel",
        "moreInfo": "### 1. tl;dr\n`.gitignore` schützt das Repo vor Müll und vor versehentlich eingecheckten Passwörtern.\n---\n> **Tux-Ansage:** Ein Passwort im Repo ist wie ein Generalschlüssel am schwarzen Brett. `.env` gehört in `.gitignore`!\n---\n### 2. Deep Dive\n```gitignore\n*.log\n/build/\nnode_modules/\n.env\n*.key\n```\nWichtig: `.gitignore` wirkt nur auf **noch nicht versionierte** Dateien. Ist eine Datei schon im Repo, erst aus der Versionierung nehmen:\n```bash\ngit rm --cached .env\n```\nWar ein Geheimnis schon gepusht, steckt es in der Historie: Schlüssel sofort austauschen, nicht nur löschen.\n---\n### 3. Schaubild\n```\nProjektordner          .gitignore          Repository\n app.js     ---------- (nicht gelistet) --> versioniert\n .env       ---------- .env -------------X  ignoriert\n debug.log  ---------- *.log ------------X  ignoriert\n```"
    },
    {
        "id": 245,
        "category": "Git Grundlagen::7. Rückgängig machen und ignorieren",
        "question": "Ein fehlerhafter Commit ist schon auf 'main' gepusht und wurde von Kollegen geholt. Erkläre den Unterschied zwischen 'git revert' und 'git reset --hard' und begründe, welchen Befehl du hier nimmst.",
        "answer": "**`git revert <commit>`** legt einen **neuen Commit** an, der die Änderungen des fehlerhaften Commits genau umkehrt. Der alte Commit bleibt in der Historie, alles bleibt nachvollziehbar. Für alle anderen ist das ein ganz normaler neuer Commit.\n\n**`git reset --hard <commit>`** setzt den Branch auf einen älteren Commit zurück und **verwirft alle späteren Commits** samt nicht gesicherter Änderungen im Arbeitsverzeichnis. Die Historie wird **umgeschrieben**. Um das zu pushen, bräuchte man `git push --force`, und bei den Kollegen passt die Historie danach nicht mehr.\n\nHier also: **`git revert`**. `reset --hard` kommt nur für lokale Commits infrage, die noch niemand hat.",
        "keywords": ["revert", "neuer commit|umkehrt|rückgängig|gegencommit", "reset", "verwirft|löscht|verloren|weg", "umschreiben|umgeschrieben|historie", "force|gepusht|kollegen|andere|geteilt"],
        "validationType": "concept",
        "topicId": 45,
        "difficulty": "schwer",
        "moreInfo": "### 1. tl;dr\nrevert = Fehler mit einem Gegen-Commit korrigieren (sicher für geteilte Branches), reset --hard = Vergangenheit löschen (nur lokal).\n---\n> **Tux-Ansage:** Einen Fehler im Dienstbuch korrigiert man mit einem Nachtrag, nicht durch Herausreißen der Seite!\n---\n### 2. Deep Dive\n```bash\ngit revert a1b2c3      # Gegen-Commit, danach normal pushen\ngit push\n\ngit reset --hard HEAD~1   # nur für lokale, noch nicht geteilte Commits\n```\n`reset` auf gepushten Commits zwingt alle anderen, ihre Kopien zu reparieren, und erfordert `push --force`.\nNotanker, wenn doch etwas verloren schien: `git reflog` zeigt, wo HEAD vorher stand.\n---\n### 3. Schaubild\n```\nrevert:  A--B--C(fehler)--D--C'\n         C' hebt C auf, alles bleibt sichtbar\n\nreset --hard B:\nvorher:  A--B--C--D\nnachher: A--B                     (C und D verworfen)\n```"
    }
];
