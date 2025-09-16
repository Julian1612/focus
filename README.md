# 📖 FocusOS Dokumentation

Herzlich willkommen zur offiziellen Dokumentation von FocusOS, deinem modularen Dashboard für maximale Produktivität! 🚀

Dieses Dokument ist dein zentraler Anlaufpunkt – egal, ob du die App einfach nur nutzen oder selbst kreativ werden und eigene Apps entwickeln möchtest.

---

## 1. Übersicht & Philosophie 🎯

FocusOS ist eine Single-Page-Anwendung, die dir hilft, Klarheit in deinen Tag zu bringen, Aufgaben zu meistern und deine Konzentration durch gezielte Arbeitseinheiten zu bündeln.

Die Kernphilosophie von FocusOS ist eine **stabile und flexible, plugin-basierte Architektur**:

> **🧠 Der FocusOS Kern:** Das Herzstück der Anwendung. Er umfasst die unverzichtbaren, täglich genutzten Funktionen: den Tagesplaner, die To-Do-Liste und die Fokussitzung (Timer). Der Kern ist darauf ausgelegt, absolut stabil und performant zu sein.

> **🧩 Das App-Ökosystem:** Alle Zusatzfunktionen sind als eigenständige "Apps" gekapselt. Diese werden dynamisch in das System geladen und kommunizieren mit dem Kern über eine sichere Schnittstelle (`dashboardAPI`). Das macht FocusOS unendlich erweiterbar, ohne die Stabilität des Kerns zu gefährden.

---

## 2. Die Hauptfunktionen (FocusOS Kern)

Der Kern bietet dir drei perfekt aufeinander abgestimmte Werkzeuge für deinen Tag.

### 2.1. Der Tagesplaner 🗓️

Der Tagesplaner ist deine visuelle Kommandozentrale von 07:00 bis 21:00 Uhr. Hier organisierst du deinen Tag in übersichtlichen Zeitblöcken.

* **Ereignisse erstellen:** **Klicke und ziehe** einfach mit der Maus in einem freien Bereich der Zeitleiste. Sobald du loslässt, kannst du deinem neuen Block einen Namen und eine Kategorie geben.
* **Drag & Drop:** Ein Plan hat sich geändert? Kein Problem! **Verschiebe** bestehende Blöcke einfach an eine neue Uhrzeit.
* **Größe anpassen:** Eine Aufgabe dauert länger? **Ziehe** den unteren Rand eines Ereignisses, um die Dauer anzupassen. Die Zeit rastet dabei immer im 15-Minuten-Takt ein.
* **Löschen:** Fahre mit der Maus über ein Ereignis und klicke auf das `×`, um es zu entfernen.
* **Magische Synchronisation:** **Jeder Block im Planer ist direkt mit einer Aufgabe in der To-Do-Liste verknüpft.** Erstellst, änderst oder löschst du hier etwas, passiert es automatisch auch dort – und umgekehrt!

### 2.2. Die To-Do-Liste ✅

Hier werden aus Plänen konkrete, abhakbare Aufgaben.

* **Aufgaben hinzufügen:** Gib einen Namen und eine geschätzte Dauer in Minuten ein, wähle eine Kategorie und klicke auf `+`. Deine Aufgabe erscheint sofort in der Liste und bekommt automatisch den nächsten freien Platz im Tagesplaner.
* **Aufgaben bearbeiten:** **Doppelklicke** auf den Text einer Aufgabe, um ihn schnell und einfach zu ändern.
* **Mehr Details:** Füge **Unteraufgaben** oder **Notizen** hinzu, indem du mit der Maus über eine Aufgabe fährst und die entsprechenden Symbole anklickst.
* **Aufgaben abschließen:** Der beste Klick des Tages! Hake die Checkbox ab, um eine Aufgabe als erledigt zu markieren und deinen Tagesfortschritt zu steigern.
* **Direkt loslegen:** Klicke auf das ►-Symbol bei einer Aufgabe, um sofort eine Fokussitzung dafür zu starten.

### 2.3. Die Fokussitzung ⏱️

Dies ist dein Werkzeug, um konzentriert zu arbeiten und deine Pläne in die Tat umzusetzen.

* **Nächste Aufgabe starten:** Klicke auf "Nächste Aufgabe starten", um automatisch einen Timer für die oberste, unerledigte Aufgabe zu beginnen.
* **Manueller Start:** Wähle gezielt eine Aufgabe aus deiner To-Do-Liste und starte den Timer über das ►-Symbol.
* **Globaler Timer:** Während eine Sitzung läuft, siehst du oben rechts eine kleine Anzeige des Timers. So hast du die Zeit immer im Blick, egal was du gerade tust.
* **Volle Kontrolle:** Pausiere oder brich einen laufenden Timer jederzeit ab.
* **Tagesfortschritt:** Der Fortschrittsbalken zeigt dir auf einen Blick, wie viel Prozent deiner geplanten Arbeitszeit du heute schon geschafft hast. Ein super Motivator!

---

## 3. Das App-Ökosystem 🚀

Apps sind das, was FocusOS wirklich besonders macht. Sie erweitern die Funktionalität, ohne den Kern zu belasten.

**Aktuell installierte Apps:**

* **🎶 Fokus FM:** Ein eingebetteter YouTube-Stream mit entspannter Lo-Fi-Musik für maximale Konzentration.
* **📋 Meine Routine:** Eine einfache Checkliste für deine Morgen-, Arbeits- und Feierabendroutinen.
* **📝 Notizen:** Ein digitales Notizbuch, das deine Gedanken automatisch speichert.
* **🎯 Today's Focus:** Zeigt dir deine nächste anstehende Aufgabe und lässt dich mit einem Klick eine Fokussitzung starten.

---

## 4. Entwicklerhandbuch: Baue deine eigene App 👨‍💻

Du hast eine Idee für eine Funktion? Großartig! Eine eigene App zu bauen ist kinderleicht. Folge einfach diesen sechs Schritten.

### 4.1. Schritt 1: Ordnerstruktur anlegen

Erstelle einen neuen Ordner für deine App im `/apps/`-Verzeichnis. Der Name sollte kurz, aussagekräftig und kleingeschrieben sein (z.B. `mein-rechner`).

```plaintext
/apps/
└── /mein-rechner/
