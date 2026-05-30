# BoostDoc v1.6

Offline-Browser-App für BMW/MHD-CSV-Logs. `index.html` direkt im Browser öffnen, CSV auswählen oder per Drag & Drop ablegen.

## Neu in v1.6

- State-aware Analyzer: Zeilen werden als WOT Pull, Burble/Schub, Shift/Transient, Idle/Cold, Datenfehler oder Unknown eingeordnet.
- Timing-, Boost- und Fueling-Kontext wird nur bei genügend eindeutigen WOT-State-Zeilen hart bewertet; Burble/Shift/Idle werden getrennt als Kontext gezeigt.
- CSV-Import erkennt neben Komma-Trennung auch Semikolon-Logs mit Komma-Dezimalwerten.
- Referenztests nutzen anonymisierte MHD-/Datazap-Fixtures für N13, N54, N55, B58, S55, S58, S63 und unbekannte Exportformate.
- hPa-/kPa-/MPa-Spalten für Boost und Rail werden robuster erkannt und vor der Bewertung normalisiert.
- Einstellungen enthalten eine gespeicherte Sprachauswahl für Deutsch, Englisch, Türkisch, Polnisch, Russisch, Italienisch und Spanisch.
- Fahrzeugprofile haben jetzt Burble-Modus inklusive Custom-Werten für Dauer, Aggressivität, RPM-Fenster und Min-Speed.
- Detailansicht zeigt eine kompakte Fahrzustands-Timeline vor der Priorität.

## Neu in v1.5

- Mobile Ansicht: Der Upload-Bereich zeigt einen grossen CSV-Auswahlbutton; Drag & Drop bleibt vor allem für Desktop vorgesehen.
- Light/Dark sitzt jetzt in den Einstellungen und ist ein echter Schiebregler statt eines Header-Buttons.
- Mobile Navigation ist als kompakter unterer Dock aufgebaut und überdeckt weniger vom Inhalt.

## Neu in v1.4

- Fahrzeugprofile können lokal gespeichert werden: Name, Motor, Stage, Kraftstoff, Map, Hardware und Notizen.
- Aktives Profil setzt bei passendem Motor automatisch den passenden N54/N55/B58-Preset, solange nicht `Benutzerdefiniert` aktiv ist.
- Detailansicht zeigt einen Profil-Kontext und warnt, wenn Log-Plattform und Profil-Motor nicht zusammenpassen.
- Neue Trendanalyse über geladene Logs: Referenzscore, Fuel Score, LPFP, Rail, Boost-Fehler, Timing, WGDC, IAT und Throttle Closure.
- Vergleichs-CSV enthält jetzt auch das aktive Profil.

## Neu in v1.3

- Log-Vergleich kann als Excel-freundliche CSV exportiert werden.
- Export enthält Status, Plattform, Pull-Daten, Referenzscore, Fuel Score, LPFP, Rail, Boost, Timing, WGDC, IAT, Throttle Closure und Befundzahlen.
- Detailansicht zeigt eine priorisierte `Nächster Schritt`-Karte.
- HTML-Berichte enthalten jetzt ebenfalls die nächsten Schritte.

## Neu in v1.2

- Detailansicht zeigt jetzt eine Logging-Kanal-Checkliste für Pflicht-, empfohlene und optionale MHD-Kanäle.
- Fehlende Pflichtkanäle werden direkt hervorgehoben, damit der nächste Log gezielter aufgenommen wird.
- N54/N55 bekommen zusätzliche Bank-2-Hinweise für Lambda/AFR, STFT und LTFT.
- Checkliste nutzt die erkannten Spalten und die vorhandene Missing-Channel-Auswertung, ohne CSV-Daten zu speichern.

## Neu in v1.1

- Referenzbibliothek kann als JSON-Datei exportiert werden.
- Referenzbibliothek kann auf einem anderen Rechner wieder importiert werden.
- Import führt neue Referenzen mit bestehenden zusammen, statt alles zu ersetzen.
- Einstellungen zeigen jetzt die Anzahl gespeicherter Referenzen und einen Import-/Export-Status.
- Aktuelle Detailanalyse kann als eigenständiger HTML-Bericht exportiert werden.

## Neu in v1.0

- Lokale Referenzbibliothek im Browser.
- Gute Pulls können direkt aus der Detailansicht als Referenz gespeichert werden.
- Neue Pulls werden gegen gespeicherte Referenzen derselben Plattform verglichen.
- Vergleichskarten zeigen Delta zu Referenz für Referenzscore, Boost-Fehler, Timing, Rail, LPFP, Lambda, WGDC, IAT-Anstieg und DME-Closure.
- Referenzen speichern nur kompakte Kennzahlen, nicht die komplette CSV.
- Gespeicherte Referenzen können aus der Detailansicht wieder gelöscht werden.

## Neu in v0.9

- Referenzvergleich pro Pull mit Score von 0-100.
- Einzelkarten für Log-Form, Boost Tracking, Timing, Fueling, Lambda/AFR, Turbo-Reserve, Temperatur und DME-Eingriff.
- Referenzprofil orientiert sich automatisch an der erkannten Plattform: N54, N55, B58 Gen1 oder B58 Gen2.
- Stage/Fuel-Hinweise aus Datei-/Mapnamen werden im Referenzbereich angezeigt, wenn erkennbar.
- Pull-Auswahl zeigt jetzt pro Pull auch dessen eigene Referenzbewertung.

## Neu in v0.8

- Mehrere Pulls pro CSV werden erkannt und einzeln bewertet.
- Detailansicht bekommt eine Pull-Auswahl mit Status, Gang, Dauer, RPM-Band, Boost- und Timing-Kurzinfo.
- Die Datei-Bewertung fasst mehrere Pulls zusammen und zeigt den auffälligsten Pull im Gesamtfazit.
- Gangwechsel-Logs werden in einzelne Pull-Abschnitte getrennt, damit der saubere Teil nicht vom Schaltbereich überlagert wird.
- Temperaturspalten mit `(F)` werden jetzt ebenfalls nach Celsius umgerechnet.

## Neu in v0.7

- Plattform-Presets für N54, N55, B58 Gen1 und B58 Gen2.
- Auto-Preset setzt die Grenzwerte anhand der erkannten Plattform, solange alle geladenen Logs zur gleichen Plattform passen.
- Grenzwerte bleiben editierbar; bei manueller Änderung wechselt die App auf `Benutzerdefiniert`.
- B58-Presets nutzen höheren Raildruck-Kontext, mehr WGDC-Spielraum und weniger strenge Kanalpflicht für häufig fehlende LPFP-Daten.
- Zusätzliche Anomalie-Grenzwerte für pull-relevante Treffer und stabilen Throttle-Kontext.

## Neu in v0.6

- v0.5-Stand aus der portablen ZIP als neue Arbeitsbasis übernommen.
- Anomalien werden jetzt nach Fahrzustand eingeordnet: stabiler Pull, Spool/Anrollen, Schub, Leerlauf und Transient.
- AFR-Spikes, Pedal/Throttle-Mismatch und Hesitation-Zone werden weiterhin angezeigt, aber nur pull-relevante Treffer werden als echte Warnung hochgezogen.
- Kontext-Scanner zeigt jetzt getrennt, ob Treffer im Pull oder nur ausserhalb stabiler Last lagen.
- B58-Testlogs neu gegengeprüft: Timing/WGDC bleiben sichtbar, transiente AFR/Throttle/Hesitation-Treffer werden sauberer einsortiert.

## Neu in v0.5

- Anomalie-Scanner für AFR-Spikes, MHD-Placeholder `235.19`, Sensor-Flatlines, Pedal/Throttle-Mismatch, Hesitation-Zone und Idle-AFR-Schwankungen.
- Pull-Validierung mit Dauer, Pedal, Einzelgang, RPM-Band und DME-Eingriffen.
- Ereignis-Timeline in der Detailansicht, damit auffällige Zeitpunkte schneller sichtbar werden.
- Automatische Umrechnung von MHD-Druckspalten in `Bar` nach `psi` für Boost, Rail und LPFP.
- LPFP-Bewertung erkennt jetzt auch grenzwertigen Niederdruck zusammen mit DME-Leistungseingriffen.
- N54-Kontextkarten für Fuel-Kette, DME/Throttle-Eingriff, AFR-Datenqualität und Log-Form.
- AFR-Werte ab `50` werden als Dropout/Datenfehler getrennt von echten Lean-Spikes behandelt.
- LPFP unter `50 psi` wird nur bei längerem Anteil im Pull eskaliert; kurze Dips bleiben Kontext.
- Fuel-Trim-Prüfung für STFT-Anschlag, STFT/LTFT-Bankdifferenzen und LTFT ausserhalb +/-10%.
- N54-Log-Form folgt dem üblichen 3.-Gang-WOT um ca. 2500 rpm bis ca. 6000 rpm.
- Zeitkurven für Boost/Target, LPFP, Rail, Pedal/Throttle und Fuel-Trims im Log-Detail.
- Log-Vergleich mit Fuel-Score, LPFP/Rail/DME-Kennzahlen und Gesamtfazit über alle geladenen CSVs.
- Zusätzliche Grenzwerte im Bereich `Einstellungen`.

## Hinweis

Die App ersetzt keine professionelle Diagnose. Sie hilft beim Vorsortieren von Logs und zeigt typische Muster, die mit weiteren Logs, Fahrzeugzustand und Hardware-Setup gegengeprüft werden sollten.
