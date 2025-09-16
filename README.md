📖 FocusOS Dokumentation
Herzlich willkommen zur offiziellen Dokumentation von FocusOS, deinem modularen Dashboard für maximale Produktivität! 🚀

Dieses Dokument ist dein zentraler Anlaufpunkt – egal, ob du die App einfach nur nutzen oder selbst kreativ werden und eigene Apps entwickeln möchtest.

1. Übersicht & Philosophie 🎯
FocusOS ist eine Single-Page-Anwendung, die dir hilft, Klarheit in deinen Tag zu bringen, Aufgaben zu meistern und deine Konzentration durch gezielte Arbeitseinheiten zu bündeln.

Die Kernphilosophie von FocusOS ist eine stabile und flexible, plugin-basierte Architektur:

🧠 Der FocusOS Kern: Das Herzstück der Anwendung. Er umfasst die unverzichtbaren, täglich genutzten Funktionen: den Tagesplaner, die To-Do-Liste und die Fokussitzung (Timer). Der Kern ist darauf ausgelegt, absolut stabil und performant zu sein.

🧩 Das App-Ökosystem: Alle Zusatzfunktionen sind als eigenständige "Apps" gekapselt. Diese werden dynamisch in das System geladen und kommunizieren mit dem Kern über eine sichere Schnittstelle (dashboardAPI). Das macht FocusOS unendlich erweiterbar, ohne die Stabilität des Kerns zu gefährden.

2. Die Hauptfunktionen (FocusOS Kern)
Der Kern bietet dir drei perfekt aufeinander abgestimmte Werkzeuge für deinen Tag.

2.1. Der Tagesplaner 🗓️
Der Tagesplaner ist deine visuelle Kommandozentrale von 07:00 bis 21:00 Uhr. Hier organisierst du deinen Tag in übersichtlichen Zeitblöcken.

Ereignisse erstellen: Klicke und ziehe einfach mit der Maus in einem freien Bereich der Zeitleiste. Sobald du loslässt, kannst du deinem neuen Block einen Namen und eine Kategorie geben.

Drag & Drop: Ein Plan hat sich geändert? Kein Problem! Verschiebe bestehende Blöcke einfach an eine neue Uhrzeit.

Größe anpassen: Eine Aufgabe dauert länger? Ziehe den unteren Rand eines Ereignisses, um die Dauer anzupassen. Die Zeit rastet dabei immer im 15-Minuten-Takt ein.

Löschen: Fahre mit der Maus über ein Ereignis und klicke auf das ×, um es zu entfernen.

Magische Synchronisation: Jeder Block im Planer ist direkt mit einer Aufgabe in der To-Do-Liste verknüpft. Erstellst, änderst oder löschst du hier etwas, passiert es automatisch auch dort – und umgekehrt!

2.2. Die To-Do-Liste ✅
Hier werden aus Plänen konkrete, abhakbare Aufgaben.

Aufgaben hinzufügen: Gib einen Namen und eine geschätzte Dauer in Minuten ein, wähle eine Kategorie und klicke auf +. Deine Aufgabe erscheint sofort in der Liste und bekommt automatisch den nächsten freien Platz im Tagesplaner.

Aufgaben bearbeiten: Doppelklicke auf den Text einer Aufgabe, um ihn schnell und einfach zu ändern.

Mehr Details: Füge Unteraufgaben oder Notizen hinzu, indem du mit der Maus über eine Aufgabe fährst und die entsprechenden Symbole anklickst.

Aufgaben abschließen: Der beste Klick des Tages! Hake die Checkbox ab, um eine Aufgabe als erledigt zu markieren und deinen Tagesfortschritt zu steigern.

Direkt loslegen: Klicke auf das ►-Symbol bei einer Aufgabe, um sofort eine Fokussitzung dafür zu starten.

2.3. Die Fokussitzung ⏱️
Dies ist dein Werkzeug, um konzentriert zu arbeiten und deine Pläne in die Tat umzusetzen.

Nächste Aufgabe starten: Klicke auf "Nächste Aufgabe starten", um automatisch einen Timer für die oberste, unerledigte Aufgabe zu beginnen.

Manueller Start: Wähle gezielt eine Aufgabe aus deiner To-Do-Liste und starte den Timer über das ►-Symbol.

Globaler Timer: Während eine Sitzung läuft, siehst du oben rechts eine kleine Anzeige des Timers. So hast du die Zeit immer im Blick, egal was du gerade tust.

Volle Kontrolle: Pausiere oder brich einen laufenden Timer jederzeit ab.

Tagesfortschritt: Der Fortschrittsbalken zeigt dir auf einen Blick, wie viel Prozent deiner geplanten Arbeitszeit du heute schon geschafft hast. Ein super Motivator!

3. Das App-Ökosystem 🚀
Apps sind das, was FocusOS wirklich besonders macht. Sie erweitern die Funktionalität, ohne den Kern zu belasten.

Aktuell installierte Apps:

🎶 Fokus FM: Ein eingebetteter YouTube-Stream mit entspannter Lo-Fi-Musik für maximale Konzentration.

📋 Meine Routine: Eine einfache Checkliste für deine Morgen-, Arbeits- und Feierabendroutinen.

📝 Notizen: Ein digitales Notizbuch, das deine Gedanken automatisch speichert.

🎯 Today's Focus: Zeigt dir deine nächste anstehende Aufgabe und lässt dich mit einem Klick eine Fokussitzung starten.

4. Entwicklerhandbuch: Baue deine eigene App 👨‍💻
Du hast eine Idee für eine Funktion? Großartig! Eine eigene App zu bauen ist kinderleicht. Folge einfach diesen sechs Schritten.

4.1. Schritt 1: Ordnerstruktur anlegen
Erstelle einen neuen Ordner für deine App im /apps/-Verzeichnis. Der Name sollte kurz, aussagekräftig und kleingeschrieben sein (z.B. mein-rechner).

/apps/
└── /mein-rechner/

4.2. Schritt 2: Das Manifest (app.json) erstellen
Jede App braucht eine app.json. Sie ist wie der "Personalausweis" deiner App und sagt FocusOS, wer sie ist und wo ihre Dateien liegen.

/apps/mein-rechner/app.json:

{
  "id": "mein-rechner",
  "name": "Mein Rechner",
  "icon": "<svg>...</svg>",
  "entrypoints": {
    "html": "index.html",
    "js": "main.js"
  }
}

Felder im Detail:

Feld

Typ

Beschreibung

id

string

Ein einzigartiger Name ohne Leerzeichen (entspricht dem Ordnernamen).

name

string

Der Anzeigename für den Tooltip des Sidebar-Buttons.

icon

string

Der vollständige SVG-Code für das Icon (24x24px). Tolle Icons findest du z.B. auf heroicons.com.

entrypoints

object

Ein Objekt, das die Pfade zu den Hauptdateien der App enthält.

  .html

string

Der Dateiname der HTML-Datei, die in das Modal geladen wird.

  .js

string

Der Dateiname der JavaScript-Datei, die die Logik der App enthält.

4.3. Schritt 3: Die Benutzeroberfläche (index.html) erstellen
Erstelle das HTML für deine App. Es ist ein einfaches HTML-Fragment, das in das Modal-Fenster geladen wird. Du kannst dein CSS direkt mit <style>-Tags einbetten.

/apps/mein-rechner/index.html:

<style>
  /* Dein App-spezifisches CSS hier */
</style>
<h2>Mein super Rechner</h2>
<div id="rechner-ui">
  <!-- Deine UI-Elemente wie Buttons, Inputs etc. -->
</div>

4.4. Schritt 4: Die App-Logik (main.js) schreiben
Die main.js ist das Gehirn deiner App. Sie muss eine export function init() enthalten, die beim Öffnen der App aufgerufen wird.

/apps/mein-rechner/main.js:

/**
 * Haupt-Skript für die Rechner-App.
 */
export function init(api, appRootElement) {
    console.log("Rechner-App wurde geladen!");

    // api: Deine Verbindung zum FocusOS-Kern.
    // appRootElement: Das DOM-Element, in dem dein HTML liegt.

    const ui = appRootElement.querySelector('#rechner-ui');
    // ... hier erwacht deine App zum Leben ...
}

4.5. Schritt 5: Die dashboardAPI verwenden
Die dashboardAPI ist deine sichere Brücke zum FocusOS-Kern. Nutze sie, um Daten zu lesen und Aktionen auszulösen.

Verfügbare API-Funktionen:

Funktion

Parameter

Rückgabewert

Beschreibung

getActiveTodos()

-

Array<object>

Holt eine Liste aller unerledigten To-Do-Aufgaben.

getRoutine()

-

Array<object>

Holt die aktuelle Routine-Checkliste.

updateRoutineItem()

itemId (string), completed (boolean)

void

Hakt einen Punkt auf der Routine-Liste ab (oder macht es rückgängig).

saveData()

appId (string), key (string), value (any)

void

Speichert Daten speziell für deine App (z.B. api.saveData('mein-rechner', 'letzteZahl', 42)).

loadData()

appId (string), key (string)

any

Lädt die von deiner App gespeicherten Daten.

startTimerForTask()

taskId (string)

void

Startet den globalen Fokustimer für eine bestimmte taskId aus der To-Do-Liste.

4.6. Schritt 6: Die App registrieren
Damit der App-Loader deine neue App finden kann, musst du den Namen deines App-Ordners zur Liste in js/services/appLoader.js hinzufügen.

/js/services/appLoader.js:

// ...
const APP_DIRECTORIES = ['focus-fm', 'routine', 'notes', 'todays-focus', 'mein-rechner']; // <-- Hier hinzufügen
// ...

Nachdem du diese Schritte ausgeführt und die Seite neu geladen hast, erscheint deine neue App in der Seitenleiste und ist voll funktionsfähig. Viel Spaß beim Entwickeln!

5. Abschließende Dateistruktur 📁
/focus-dashboard/
├── index.html
├── style.css
├── README.md
├── js/
│   ├── main.js
│   ├── /core/
│   │   ├── planner.js
│   │   ├── todo.js
│   │   ├── timer.js
│   │   └── ui.js
│   └── /services/
│       ├── appLoader.js
│       ├── dashboardAPI.js
│       └── stateManager.js
└── apps/
    ├── /focus-fm/
    │   ├── app.json
    │   ├── index.html
    │   └── main.js
    ├── /routine/
    │   ├── app.json
    │   ├── index.html
    │   └── main.js
    ├── /notes/
    │   ├── app.json
    │   ├── notes.html
    │   ├── notes.css
    │   └── main.js
    └── /todays-focus/
        ├── app.json
        ├── index.html
        └── main.js
