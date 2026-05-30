# BoostDoc – Codebasis einfach erklärt

Diese Dokumentation erklärt die vorhandene Codebasis von **BoostDoc** in einfacher Sprache. Sie ist für Anfänger gedacht und bleibt bewusst kurz.

Analysierter Projektordner:

`bmw-turbo-log-analyzer-v1.4-work`

## 1. Was ist BoostDoc?

**BoostDoc** ist eine Web-App für BMW/MHD-CSV-Logs. Die App läuft direkt im Browser und braucht keinen Server.

Die Hauptfunktion ist:

- CSV-Logdateien hochladen oder per Drag & Drop ablegen
- wichtige Werte aus dem Log auslesen
- Pulls, Boost, Timing, Fueling, Temperaturen und Warnungen bewerten
- Ergebnisse in Dashboard, Detailansicht, Vergleich und Trendansicht anzeigen

Gedacht ist BoostDoc für Nutzer, die BMW-MHD-Logs grob einschätzen möchten, ohne jedes CSV von Hand zu prüfen. Die App ersetzt keine professionelle Diagnose.

## 2. Grober Aufbau der App

| Datei/Ordner | Aufgabe | Einfach erklärt |
|---|---|---|
| `index.html` | Grundgerüst der App | Legt fest, welche Bereiche es auf der Seite gibt: Header, Upload-Bereich, Tabellen, Detailansicht, Vergleich, Trends und Einstellungen. |
| `styles.css` | Aussehen der App | Steuert Farben, Abstände, mobile Ansicht, Panels, Tabellen, Statusfarben und Hell/Dunkel-Darstellung. |
| `app.js` | Bedienung und Anzeige | Verbindet Buttons, Upload, Navigation und Anzeige. Ruft die Analyse auf und schreibt die Ergebnisse in die Seite. |
| `analyzer.js` | Logik der Analyse | Liest CSV-Daten, erkennt Spalten, findet Pulls, berechnet Kennzahlen und erzeugt Warnungen/Bewertungen. |
| `README.md` | Projektbeschreibung | Beschreibt die App kurz und listet Änderungen der Versionen auf. |
| `manifest.json` | PWA-Info | Beschreibt BoostDoc für Installation/Homescreen: Name, Startseite, Farben und Icons. |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | App-Icons | Werden vom Browser oder Handy für Tab, Homescreen und PWA-Anzeige verwendet. |
| `public/` | Kopien für Deployment | Enthält ebenfalls Manifest und Icons, vermutlich für Hosting/Deployment. |
| `docs/` | Dokumentation | Wurde für diese Anfänger-Dokumentation neu erstellt. |

Nicht gefunden:

- Es gibt keine Datei `service-worker.js`.
- Es wurde keine Service-Worker-Registrierung im JavaScript gefunden.
- Es gibt keinen allgemeinen `assets/`-Ordner. Bilder/Icons liegen direkt im Projekt und im Ordner `public/`.

Wichtig: `index.html` verweist auf `/manifest.json`, `/icon-192.png` und `/apple-touch-icon.png`. Diese Dateien sind im Projekt vorhanden.

## 3. Wie läuft die App grundsätzlich ab?

Beim Öffnen der App passiert grob Folgendes:

1. Der Browser lädt `index.html`.
2. `index.html` lädt `styles.css`, danach `analyzer.js` und `app.js`.
3. `app.js` sucht wichtige HTML-Elemente wie Upload-Feld, Tabelle, Detailbereich und Buttons.
4. Gespeicherte Einstellungen aus dem Browser werden geladen, zum Beispiel Theme, Preset, Referenzen und Fahrzeugprofile.
5. Die Startansicht wird gerendert.

Beim Hochladen einer CSV/MHD-Logdatei:

1. Der Nutzer wählt eine CSV-Datei oder zieht sie in die Dropzone.
2. `app.js` nimmt die Datei entgegen.
3. Die Datei wird als Text gelesen.
4. `app.js` ruft `LogAnalyzer.analyzeText(...)` aus `analyzer.js` auf.
5. `analyzer.js` verarbeitet die CSV und gibt ein Ergebnisobjekt zurück.
6. `app.js` speichert dieses Ergebnis im App-Zustand.
7. `app.js` aktualisiert Dashboard, Tabelle, Detailansicht, Vergleich und Trends.

Das Ergebnis wird in der App vor allem hier angezeigt:

- oben in den Kennzahlen
- in der Tabelle `Fahrten`
- rechts/in der Ansicht `Detail`
- im Bereich `Log-Vergleich`
- im Bereich `Trendanalyse`

## 4. Die wichtigsten Codebereiche einfach erklärt

### UI / Oberfläche

Die Oberfläche steht in `index.html`. Dort gibt es feste Bereiche mit IDs, zum Beispiel:

- `fileInput` für den Datei-Upload
- `dropZone` für Drag & Drop
- `logTable` für die Fahrten-Tabelle
- `detailView` für die Detailanzeige
- `compareView` für den Vergleich
- `trendView` für die Trendanalyse

`styles.css` macht daraus das sichtbare Design.

### Datei-Upload

Der Datei-Upload wird in `app.js` gesteuert. Die wichtige Funktion heisst:

`handleFiles(fileList)`

Sie filtert CSV-Dateien, liest sie ein und startet danach die Analyse.

### CSV-Verarbeitung

Die CSV-Verarbeitung sitzt in `analyzer.js`. Die wichtige Funktion heisst:

`parseCsv(text)`

Sie macht aus dem Text der CSV eine Struktur mit:

- `headers`: die Spaltennamen
- `rows`: die Datenzeilen

### Log-Analyse

Die Hauptanalyse startet über:

`LogAnalyzer.analyzeText(filename, text, rules)`

Intern ruft das `analyzeRows(...)` auf. Dort werden zum Beispiel:

- Fahrzeug/Motor aus Datei oder Spalten erkannt
- wichtige Spalten gesucht
- Pull-Bereiche erkannt
- Werte wie Boost, Raildruck, LPFP, Timing, WGDC und IAT berechnet
- Probleme und Hinweise erzeugt

### Warnungen / Bewertungen

In `analyzer.js` gibt es Grenzwerte und Presets:

- `DEFAULT_RULES`
- `RULE_PRESETS`

Aus Problemen werden Statuswerte erzeugt:

- `green` / Grün: wirkt unauffällig
- `yellow` / Gelb: beobachten oder prüfen
- `red` / Rot: deutlich prüfen

Die Einstellungsfelder in `index.html` und `app.js` können diese Grenzwerte verändern.

### Ergebnisanzeige

Die Anzeige passiert in `app.js`. Wichtige Funktionen sind:

- `render()`: aktualisiert alles
- `renderSummary()`: obere Kennzahlen
- `renderTable()`: Tabelle der geladenen Logs
- `renderDetail()`: Detailansicht
- `renderComparison()`: Log-Vergleich
- `renderTrendAnalysis()`: Trendanalyse

### PWA / Homescreen-Icon / Manifest

BoostDoc hat ein `manifest.json`. Dadurch kann der Browser die App eher wie eine installierbare Web-App behandeln.

Vorhanden sind:

- App-Name `BoostDoc`
- `short_name` `BoostDoc`
- Start-URL `/`
- Darstellung `standalone`
- Theme-Farbe
- Icons für 192x192 und 512x512

Nicht vorhanden ist ein Service Worker. Deshalb gibt es aktuell keinen eigenen Service-Worker-Cache und keine echte Offline-Cache-Logik über `service-worker.js`. Die App kann trotzdem lokal als statische Datei laufen, wenn alle benötigten Dateien vorhanden sind.

## 5. Wichtige Begriffe für Anfänger

| Begriff | Kurz erklärt für BoostDoc |
|---|---|
| HTML | Beschreibt den Aufbau der Seite. In BoostDoc ist das vor allem `index.html`. |
| CSS | Macht die Seite schön und bedienbar. In BoostDoc ist das `styles.css`. |
| JavaScript | Macht die App interaktiv. In BoostDoc sind das `app.js` und `analyzer.js`. |
| Funktion | Ein benannter Codeblock, der eine Aufgabe erledigt. Beispiel: `handleFiles(...)` liest hochgeladene Dateien. |
| Variable | Ein Speicherplatz für einen Wert. Beispiel: `state.results` speichert Analyse-Ergebnisse. |
| Array | Eine Liste von Werten. Beispiel: mehrere geladene Logs. |
| Objekt | Ein Paket aus benannten Werten. Beispiel: ein Analyse-Ergebnis mit `status`, `headline`, `metrics` und `issues`. |
| Event Listener | Code, der auf eine Aktion wartet. Beispiel: Klick auf `Leeren` oder Datei-Auswahl. |
| DOM | Die HTML-Seite als bearbeitbare Struktur im Browser. `app.js` schreibt Ergebnisse in diese Struktur. |
| JSON | Textformat für strukturierte Daten. BoostDoc nutzt es für Manifest, Referenz-Export und lokale Daten. |
| CSV | Tabellen-Datei als Text. BoostDoc liest daraus MHD-Logdaten. |
| PWA | Web-App, die sich teilweise wie eine App installieren lässt. BoostDoc hat ein Manifest und Icons, aber keinen Service Worker. |

## 6. Welche Datei sollte ich anfassen, wenn ich etwas ändern will?

| Änderung | Datei/Ort | Hinweis |
|---|---|---|
| Text ändern | `index.html` oder `app.js` | Statische Texte stehen meist in `index.html`, dynamisch erzeugte Texte oft in `app.js`. |
| Design ändern | `styles.css` | Dort sind Layout, Panels, Tabellen, mobile Ansicht und Statusfarben. |
| Farben ändern | `styles.css` | Starte oben bei `:root` und `body[data-theme="dark"]`. |
| Upload-Bereich ändern | `index.html`, `styles.css`, `app.js` | Aufbau in `index.html`, Aussehen in `styles.css`, Verhalten in `handleFiles(...)`. |
| Analyse-Regeln ändern | `analyzer.js` und teilweise `index.html` | Grenzwerte stehen in `DEFAULT_RULES`; Eingabefelder für Regeln stehen in `index.html`. |
| Warnungen/Bewertungen ändern | `analyzer.js` | Suche nach `makeIssue(...)`, `statusFromIssues(...)`, `buildDiagnoses(...)` und den Bewertungsfunktionen. |
| Ergebnisanzeige ändern | `app.js` | Suche nach Funktionen, die mit `render...` beginnen. |
| Icons/Logo ändern | Root-Dateien und `public/` | Es gibt `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` und `public/boostdoc-logo.png`. |
| PWA/Installierbarkeit ändern | `manifest.json`, Icons, `index.html` | Das Manifest wird in `index.html` verlinkt. Für echten Offline-Cache bräuchte es zusätzlich einen Service Worker. |
| Versionstext ändern | `README.md` und eventuell `index.html` | In `index.html` steht aktuell ein sichtbarer Hinweis `v1.6 portable`. |

## 7. Typische Anfänger-Fehler

### Änderungen sind nicht sichtbar

Oft liegt es am Browser-Cache. Der Browser zeigt dann noch eine alte Version. Teste:

- Seite neu laden
- Hard Reload im Browser
- Cache leeren
- anderen Browser testen

### Netlify-Deploy nicht aktualisiert

Wenn die lokale Datei stimmt, aber online noch alt aussieht, wurde vielleicht nicht neu deployed. Prüfe:

- Wurde die richtige Datei hochgeladen?
- Ist das Deployment fertig?
- Zeigt Netlify wirklich den richtigen Ordner?

### Falsche Dateipfade

BoostDoc nutzt zum Beispiel:

- `styles.css`
- `analyzer.js`
- `app.js`
- `/manifest.json`
- `/icon-192.png`

Gross-/Kleinschreibung und Speicherort müssen stimmen, besonders beim Hosting.

### Tippfehler bei Dateinamen

Der App-Name sollte überall exakt `BoostDoc` heissen. Auch kleine Tippfehler bei `manifest.json`, `app.js` oder `styles.css` können reichen, damit etwas nicht geladen wird.

### JavaScript-Fehler in der Browser-Konsole

Wenn JavaScript stoppt, funktioniert oft vieles danach nicht mehr. Öffne die Browser-Entwicklertools und schaue in die Konsole. Typische Hinweise sind rote Fehlermeldungen mit Dateiname und Zeilennummer.

### Service Worker Cache

In dieser Codebasis wurde kein Service Worker gefunden. Deshalb gibt es aktuell keinen eigenen Service-Worker-Cache, der alte App-Dateien festhalten würde. Falls später ein `service-worker.js` dazukommt, kann genau dieser Cache aber ein Grund sein, warum Änderungen erst später sichtbar werden.

## 8. Mini-Lernplan für mich

1. Zuerst `index.html` anschauen.
   Verstehe, welche sichtbaren Bereiche BoostDoc hat.

2. Danach `styles.css` anschauen.
   Suche nach Klassen wie `.drop-zone`, `.panel`, `.bottom-nav` und `.status-pill`.

3. Danach `app.js` anschauen.
   Starte bei `handleFiles(...)` und `render()`. Das zeigt den Ablauf von Upload bis Anzeige.

4. Danach `analyzer.js` nur grob lesen.
   Suche nach `DEFAULT_RULES`, `parseCsv(...)`, `analyzeText(...)` und `analyzeRows(...)`.

Kleine Übungen:

- Einen Text in `index.html` ändern.
- Eine Farbe in `styles.css` ändern.
- Einen Grenzwert in den Einstellungen verändern und denselben Log neu prüfen.
- In `app.js` einen angezeigten Satz suchen und leicht umformulieren.
- In `manifest.json` die Beschreibung anpassen.

## Kurzes Fazit

BoostDoc besteht aus einer überschaubaren statischen Web-App:

- `index.html` baut die Seite.
- `styles.css` macht das Design.
- `app.js` steuert Bedienung und Anzeige.
- `analyzer.js` macht die eigentliche Log-Auswertung.
- `manifest.json` und Icons helfen bei PWA/Homescreen-Anzeige.

Der wichtigste Merksatz:

**Wenn du das Aussehen ändern willst, gehe zu `styles.css`. Wenn du die Bedienung oder Anzeige ändern willst, gehe zu `app.js`. Wenn du die Analyse selbst ändern willst, gehe zu `analyzer.js`.**
