const data = {
  1: {
    l: { q: "Was meint der Spruch 'Alles ist eine Datei' in Linux?", a: "Dateien, Geräte und Prozesse werden alle über Dateisystempfade angesprochen (z.B. Festplatten unter /dev, Prozesse unter /proc)." },
    s: { q: "Wie interagiert der Linux Kernel mit /dev, /proc und /sys im Kontext des 'Alles ist eine Datei'-Prinzips?", a: "/dev abstrahiert Hardware als Gerätedateien (Block/Char). /proc ist ein virtuelles FS für Prozessinfos im RAM. /sys exportiert Kernel-Objekte in den Userspace. Alles lässt sich per Standard-I/O (read/write) steuern." }
  },
  2: {
    l: { q: "Was ist der Unterschied zwischen Kernel Space und User Space?", a: "Der Kernel Space ist der privilegierte Bereich für das Betriebssystem. Der User Space ist der eingeschränkte Bereich, in dem normale Programme (wie dein Browser) laufen." },
    s: { q: "Welche Schutzringe (Rings) der CPU werden bei Linux für User- und Kernel Mode genutzt und wie erfolgt ein Context Switch?", a: "Linux nutzt Ring 0 für den Kernel Mode und Ring 3 für den User Mode. Ein Context Switch erfolgt durch System Calls (Syscalls), Hardware-Interrupts oder Exceptions, wobei der Zustand des User-Prozesses gesichert und Kernel-Code ausgeführt wird." }
  },
  3: {
    l: { q: "Was macht ein Linux-Modul (LKM) und wofür braucht man es?", a: "Ein LKM ist ein Stück Code (meist ein Treiber), das zur Laufzeit in den Kernel geladen werden kann (z.B. wenn man einen USB-Stick einsteckt), ohne den Rechner neu zu starten." },
    s: { q: "Wie werden Abhängigkeiten bei LKMs aufgelöst und welche Mechanismen verhindern das Laden unsignierter Module?", a: "Abhängigkeiten werden über 'modules.dep' (generiert durch 'depmod') von 'modprobe' aufgelöst. Secure Boot und die Kernel-Option 'CONFIG_MODULE_SIG' erzwingen Signaturen und verhindern das Laden von Rootkits/unsignierten Modulen." }
  },
  4: {
    l: { q: "Was ist die Hauptaufgabe des Kernels?", a: "Der Kernel ist der Chef: Er verwaltet die Hardware (CPU, RAM, Geräte) und teilt sie den Programmen zu." },
    s: { q: "Erkläre den Unterschied zwischen einem monolithischen Kernel wie Linux und einem Microkernel.", a: "Linux ist monolithisch: CPU-, RAM-, IPC- und Treiber-Management laufen alle im Kernel Space (schnell, aber fehleranfällig). Ein Microkernel lagert Treiber und Dateisysteme in den User Space aus (sicherer, aber langsamer durch IPC)." }
  },
  5: {
    l: { q: "Wo liegen in Linux normalerweise die Log-Dateien und wo die Konfigurationsdateien?", a: "Log-Dateien liegen unter /var/log. Konfigurationsdateien liegen unter /etc." },
    s: { q: "Warum unterscheidet der Filesystem Hierarchy Standard (FHS) zwischen /usr, /var und /etc? Was passiert, wenn /var voll ist?", a: "/usr ist read-only/statisch (Programme). /var ist dynamisch (Logs, Caches). /etc enthält systemweite Konfigs. Ist /var voll, können Dienste (z.B. Datenbanken, Syslog) abstürzen oder keine Logs mehr schreiben." }
  },
  6: {
    l: { q: "Wenn ein Dienst wie Apache abstürzt, in welchem Verzeichnis suchst du zuerst nach dem Fehler?", a: "Ich suche im Verzeichnis /var/log, speziell in /var/log/apache2/ oder /var/log/messages, nach Fehlermeldungen." },
    s: { q: "Ein Dienst schlägt beim Booten fehl. Zeige die genauen Befehle, um mit systemd die Logs zu prüfen und die Konfiguration zu validieren.", a: "1. 'systemctl status <dienst>', 2. 'journalctl -xeu <dienst>' für detaillierte Logs. 3. Konfigurations-Test (z.B. 'apache2ctl configtest' oder 'nginx -t')." }
  },
  7: {
    l: { q: "Wofür steht chmod und chown?", a: "chmod (change mode) ändert die Zugriffsrechte (Lesen, Schreiben, Ausführen). chown (change owner) ändert den Besitzer einer Datei." },
    s: { q: "Erkläre die Auswirkungen von 'chmod 4755' auf ein Executable (SUID-Bit). Welche Sicherheitsrisiken entstehen?", a: "4755 setzt das SUID-Bit (4) und rwxr-xr-x. Das Programm wird beim Aufruf mit den Rechten des Dateibesitzers ausgeführt (oft root), nicht mit denen des Aufrufers. Risiko: Bei Schwachstellen im Programm (z.B. Buffer Overflow) kann der Angreifer Root-Rechte erlangen." }
  },
  8: {
    l: { q: "Welche Rechte (r, w, x) brauchst du, um den Inhalt eines Verzeichnisses mit 'ls' aufzulisten?", a: "Du brauchst das Leserecht (r) für das Verzeichnis." },
    s: { q: "Ein Ordner hat die Rechte 'drwx--x--x'. Was können andere Benutzer (Others) in diesem Ordner tun?", a: "Sie können nicht mit 'ls' den Inhalt auflisten (kein 'r'), aber da das Execute-Recht ('x') gesetzt ist, können sie durch das Verzeichnis navigieren ('cd') und auf ihnen bekannte Dateien zugreifen, sofern sie deren genauen Pfad und Namen kennen." }
  },
  9: {
    l: { q: "Was macht der Befehl 'mkdir -p /a/b/c'?", a: "Er erstellt den Ordner 'c' und automatisch auch alle übergeordneten Ordner ('a' und 'b'), falls diese noch nicht existieren." },
    s: { q: "Du musst 100 nummerierte Verzeichnisse (dir_001 bis dir_100) erstellen. Wie lautet der effizienteste Bash-Befehl?", a: "Man nutzt Brace Expansion: 'mkdir dir_{001..100}' erstellt alle 100 Verzeichnisse sofort in einem einzigen Befehl ohne Loop." }
  },
  10: {
    l: { q: "Wie löschst du einen Ordner, der noch Dateien enthält, über das Terminal?", a: "Mit dem Befehl 'rm -r ordnername'. Das '-r' steht für rekursiv und löscht den Inhalt mit." },
    s: { q: "Warum schlägt 'rm -rf *' fehl, wenn ein Verzeichnis zehntausende Dateien enthält, und wie löst du das Problem?", a: "Der Befehl schlägt mit 'Argument list too long' fehl, da die Bash den Stern in alle Dateinamen expandiert und das Limit für Argumente (ARG_MAX) überschreitet. Lösung: 'find . -type f -delete' oder 'ls -1 | xargs rm'." }
  },
  11: {
    l: { q: "Was macht der Befehl 'top'?", a: "Er zeigt einen Live-Überblick aller laufenden Prozesse an, sortiert nach CPU- oder RAM-Verbrauch." },
    s: { q: "Wie änderst du die Priorität eines laufenden Prozesses mit PID 1234, um ihn weniger CPU-Zeit geben zu lassen?", a: "Mit 'renice'. Ein höherer Nice-Wert bedeutet niedrigere Priorität. Befehl: 'renice +10 -p 1234'. Das erfordert root-Rechte, wenn man die Priorität erhöhen (negativer Wert) will." }
  },
  12: {
    l: { q: "Was bedeutet die PID bei Prozessen?", a: "PID steht für Process ID. Das ist eine eindeutige Nummer, die jeder laufende Prozess vom System bekommt." },
    s: { q: "Erkläre den Unterschied zwischen einem Zombie-Prozess und einem Orphan-Prozess.", a: "Ein Orphan-Prozess verliert seinen Elternprozess und wird von 'init' (PID 1) adoptiert. Ein Zombie-Prozess ist beendet, aber der Elternprozess hat dessen Exit-Status (via 'wait()') noch nicht abgeholt; er belegt keine Ressourcen mehr außer einem Eintrag in der Prozess-Tabelle." }
  },
  13: {
    l: { q: "Wie beendest du einen abgestürzten Prozess sicher?", a: "Mit dem Befehl 'kill <PID>'. Wenn er nicht reagiert, erzwingt man es mit 'kill -9 <PID>'." },
    s: { q: "Erkläre den Unterschied zwischen SIGTERM (15) und SIGKILL (9). Wann sollte man was verwenden?", a: "SIGTERM (15) bittet den Prozess sich normal zu beenden (Clean-up, Sockets schließen). SIGKILL (9) wird vom Kernel hart ausgeführt – der Prozess hat keine Chance zu reagieren. SIGKILL kann zu Datenverlust oder kaputten Locks führen und sollte nur als letztes Mittel genutzt werden." }
  },
  14: {
    l: { q: "Was macht 'ps aux | grep firefox'?", a: "Es listet alle laufenden Prozesse auf ('ps aux') und filtert diese Liste nach dem Wort 'firefox', um dessen PID zu finden." },
    s: { q: "Wie findest du heraus, welcher Prozess den TCP-Port 80 blockiert?", a: "Mit 'netstat -tulpen | grep :80', 'ss -tulpen | grep :80' oder 'lsof -i :80'. Das zeigt die PID des lauschenden Prozesses an." }
  },
  15: {
    l: { q: "Was ist ein Bash-Skript?", a: "Eine Textdatei mit einer Reihe von Linux-Befehlen, die nacheinander ausgeführt werden, um Aufgaben zu automatisieren." },
    s: { q: "Was ist der Unterschied zwischen '$@' und '$*' in einem Shell-Skript?", a: "Beide referenzieren alle übergebenen Argumente. Wenn in Quotes gesetzt ('$@' vs '$*'): '$@' bewahrt die individuellen Strings der Argumente (ideal für Schleifen). '$*' fügt alle Argumente zu einem einzigen String zusammen (getrennt durch das erste Zeichen der IFS-Variable)." }
  },
  16: {
    l: { q: "Was macht der Befehl 'grep'?", a: "Er durchsucht Text oder Dateien nach einem bestimmten Wort oder Muster und gibt die passenden Zeilen aus." },
    s: { q: "Schreibe einen grep-Befehl, der alle Zeilen ausgibt, die NICHT mit einem Kommentar (#) oder einer Leerzeile beginnen.", a: "'grep -Ev \"^(#|$)\" datei'. '-E' für erweiterte Regex, '-v' invertiert den Match. '^(#|$)' matcht Zeilen, die mit # beginnen oder komplett leer sind." }
  },
  17: {
    l: { q: "Wie leitet man die Ausgabe eines Befehls in eine Datei um?", a: "Mit dem Größer-als-Zeichen (z.B. 'echo Hallo > datei.txt')." },
    s: { q: "Erkläre den Unterschied zwischen '>' und '>>' sowie '2>' und '&>'.", a: "'>' überschreibt eine Datei mit stdout. '>>' hängt an. '2>' leitet stderr (Fehler) um. '&>' leitet stdout UND stderr gleichzeitig in eine Datei um." }
  },
  18: {
    l: { q: "Was macht das Pipe-Zeichen '|' in der Befehlszeile?", a: "Es leitet die Ausgabe des linken Befehls als Eingabe an den rechten Befehl weiter (z.B. 'ls | grep txt')." },
    s: { q: "Wie leitet man stderr und stdout durch eine Pipe, wenn man 'grep' auf Fehlermeldungen anwenden möchte?", a: "Mit '2>&1 |' oder in der Bash abgekürzt mit '|&'. Beispiel: 'ls -l /nichtexistent |& grep existiert'." }
  },
  19: {
    l: { q: "Was ist ein Alias in Linux?", a: "Ein Kürzel für einen längeren Befehl. Statt 'ls -la' kann man sich z.B. das Alias 'll' anlegen." },
    s: { q: "Warum funktionieren Aliase nicht in Shell-Skripten, und was ist die Alternative?", a: "Aliase sind standardmäßig nur in interaktiven Shells aktiv (shopt -s expand_aliases ist in Skripten aus). Die saubere Alternative für Skripte sind Bash-Funktionen." }
  },
  20: {
    l: { q: "Was macht der Befehl 'sudo'?", a: "Er führt einen Befehl mit den Rechten eines anderen Benutzers aus, meistens als Administrator (root)." },
    s: { q: "Erkläre die visudo-Datei und die Bedeutung der Zeile '%wheel ALL=(ALL) NOPASSWD: ALL'.", a: "'visudo' editiert /etc/sudoers sicher mit Syntax-Check. Die Zeile bedeutet, dass alle Mitglieder der Gruppe 'wheel' jeden Befehl auf allen Hosts als jeder User ohne Passworteingabe ausführen dürfen." }
  },
  21: {
    l: { q: "Welches Tool benutzt man in Ubuntu/Debian, um Software zu installieren?", a: "Das Tool heißt 'apt' (oder 'apt-get'). Zum Beispiel 'sudo apt install firefox'." },
    s: { q: "Was ist der Unterschied zwischen 'apt upgrade' und 'apt full-upgrade'?", a: "'upgrade' aktualisiert Pakete, löscht aber keine installierten. 'full-upgrade' (früher dist-upgrade) löscht auch existierende Pakete, wenn dies für das Update von Abhängigkeiten zwingend nötig ist." }
  },
  22: {
    l: { q: "Wie aktualisiert man die Paketlisten bei 'apt'?", a: "Mit dem Befehl 'sudo apt update'. Dadurch weiß das System, welche neuen Updates verfügbar sind." },
    s: { q: "Welche Dateien und Verzeichnisse verwendet APT, um die Repositories zu verwalten?", a: "Die Hauptdatei ist '/etc/apt/sources.list'. Zusätzlich werden '/etc/apt/sources.list.d/*.list' sowie PGP-Schlüssel unter '/etc/apt/trusted.gpg.d/' für die Signaturprüfung genutzt." }
  },
  23: {
    l: { q: "Was ist systemd?", a: "Das ist das Hintergrundprogramm (Init-System) bei modernen Linux-Systemen, das alle Dienste beim Start lädt." },
    s: { q: "Was ist eine systemd-Unit und welche Unit-Typen kennst du (nenne mindestens 3)?", a: "Units sind Konfigurationsdateien für systemd. Typen: .service (Dienste), .timer (Cron-Ersatz), .mount (Dateisysteme), .target (Runlevel/Gruppen)." }
  },
  24: {
    l: { q: "Wie überprüfst du, ob der Apache-Webserver läuft?", a: "Mit dem Befehl 'systemctl status apache2'." },
    s: { q: "Was passiert genau, wenn du 'systemctl enable apache2' ausführst?", a: "Es wird ein symbolischer Link der Unit-Datei (z.B. aus /lib/systemd/system/) in ein entsprechendes Target-Verzeichnis (meist /etc/systemd/system/multi-user.target.wants/) erstellt, wodurch der Dienst beim Booten gestartet wird." }
  },
  25: {
    l: { q: "Wie startest du einen Linux-Dienst neu?", a: "Mit 'systemctl restart dienstname' (z.B. systemctl restart nginx)." },
    s: { q: "Was ist der Unterschied zwischen 'systemctl restart' und 'systemctl reload'?", a: "'restart' beendet den Prozess komplett und startet ihn neu (Downtime). 'reload' sendet ein Signal (z.B. SIGHUP), damit der Dienst seine Konfiguration neu einliest, ohne aktive Verbindungen abzubrechen." }
  },
  26: {
    l: { q: "Wofür nutzt man den Befehl 'tar'?", a: "Um viele Dateien zu einem Archiv ('Tarball') zusammenzufassen, ähnlich wie eine ZIP-Datei." },
    s: { q: "Wie entpackst du eine .tar.gz Datei und was bedeuten die Schalter -x, -z, -v, -f?", a: "'tar -xzvf datei.tar.gz'. -x = extract (entpacken), -z = gzip-Kompression, -v = verbose (zeige Dateien an), -f = file (Ziel-Dateiname folgt)." }
  },
  27: {
    l: { q: "Wofür ist SSH gut?", a: "Mit SSH (Secure Shell) kann man sich sicher und verschlüsselt über das Netzwerk auf einem anderen Rechner einloggen." },
    s: { q: "Erkläre den Ablauf einer asymmetrischen SSH-Schlüsselauthentifizierung.", a: "Der Client sendet eine Signatur, die mit seinem Private Key erzeugt wurde. Der Server prüft sie gegen den Public Key des Clients in der 'authorized_keys'. Passt es, wird der Zugang gewährt (ohne Passworteingabe)." }
  },
  28: {
    l: { q: "Wie kopierst du eine Datei von deinem PC auf einen Server?", a: "Mit dem Befehl 'scp' (Secure Copy). Zum Beispiel: 'scp datei.txt user@server:/zielordner'." },
    s: { q: "Warum wird oft 'rsync' anstelle von 'scp' für große Backups verwendet?", a: "'rsync' berechnet Deltas (Unterschiede) und überträgt nur veränderte Dateiblöcke. Zudem kann es abgebrochene Transfers fortsetzen, Rechte beibehalten (-a) und alte Dateien am Ziel löschen (--delete)." }
  },
  29: {
    l: { q: "Wie findest du die IP-Adresse deines Linux-Rechners heraus?", a: "Mit dem Befehl 'ip a' (oder veraltet 'ifconfig')." },
    s: { q: "Was ist die CIDR-Notation und was bedeutet ein '/24' bei einer IP wie 192.168.1.10/24?", a: "CIDR steht für Classless Inter-Domain Routing. Die Zahl nach dem Slash gibt die Anzahl der Netzwerk-Bits an. Ein /24 entspricht der Subnetzmaske 255.255.255.0 und erlaubt 254 Hosts im Subnetz." }
  },
  30: {
    l: { q: "Was macht 'ping 8.8.8.8'?", a: "Es schickt kleine Datenpakete an den Google-Server (8.8.8.8), um zu testen, ob die Internetverbindung funktioniert." },
    s: { q: "Welches Protokoll nutzt 'ping' und wofür ist der TTL-Wert in der Antwort?", a: "'ping' nutzt das ICMP-Protokoll (Echo Request/Reply). Die TTL (Time To Live) verhindert, dass Pakete endlos kreisen. Sie wird von jedem Router um 1 dekrementiert; bei 0 wird das Paket verworfen." }
  },
  31: {
    l: { q: "Welche Datei ist zuständig für die Umwandlung von Namen (wie 'google.de') in IP-Adressen?", a: "Die Datei '/etc/hosts' für manuelle Einträge und die '/etc/resolv.conf' für die DNS-Server." },
    s: { q: "Welche Funktion hat '/etc/nsswitch.conf' im Kontext der Namensauflösung?", a: "Sie definiert die Reihenfolge der Namensauflösung (Name Service Switch). Ein Eintrag wie 'hosts: files dns' weist das System an, *zuerst* in der lokalen /etc/hosts (files) nachzusehen und *danach* den DNS-Server zu befragen." }
  }
};
module.exports = { data };
