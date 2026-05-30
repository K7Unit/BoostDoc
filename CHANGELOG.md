# BoostDoc v1.6.2

## Bugfixes — Datazap-Exporte

- **`Boost target [hPa]` Absolutdruck-Korrektur**: Spalten, deren Name `target`, `requested` oder `soll` enthält, werden jetzt immer als Absolutdruck (Atmosphäre subtrahiert) behandelt. Zuvor wurden Werte zwischen 1000–1199 hPa fälschlich als Gauge-Druck interpretiert (~17 psi statt ~2–3 psi). Die bestehende `value > 1200`-Heuristik bleibt als Fallback für unbekannte Spalten erhalten; `Boost intake [hPa]` ist davon nicht betroffen.
- **`Rail pressure actual [MPa]` jetzt erkannt**: Datazap-Spalte wird auf den `rail`-Slot gemappt. MPa-Konvertierung (×145.038) war bereits vorhanden und greift korrekt.
- **`Time [ms]` jetzt erkannt und normalisiert**: Datazap-Zeitspalte wird auf `time` gemappt. Neue Hilfsfunktion `normalizeTime()` teilt ms-Werte an allen 13 Lese-Stellen (duration, classifyRows, normalizeSignals, relativeTime, buildTraceSeries, analyzeText) durch 1000. Pull-Dauern, Spool-up-Fenster und Transient-Erkennung arbeiten damit korrekt in Sekunden.
- **`Short Fuel Trim []` jetzt erkannt**: Datazap-STFT-Spalte wird auf `stft1` gemappt.

## Tests

- 4 neue Unit-Tests in `analyzer-csv-robustness.test.cjs` (je einer pro Fix).
- 4 neue Assertions in `analyzer-fixtures.test.cjs` für den Datazap-hPa-Fixture.
- Keine Expected-Result-Snapshots geändert (die 5 asserted Felder — rows, platform, status, pullCount, fuel — bleiben stabil).

---

# BoostDoc v1.6.1

## Bugfix

- Diagnose-Routing für Fuel-Kategorie korrigiert: LPFP-Issues, deren Text „rail" enthält (wegen Rail-Drop-Anhang), wurden fälschlich zur Rail/HDP-Diagnose geroutet statt zur LPFP-Diagnose. i18nKey wird jetzt vor Text-Matching geprüft.
- Tote Funktion `makeIssue` entfernt; alle Issue-Erzeugungspfade nutzen `makeLocalizedIssue`.

## Tests

- Robustness-Test erweitert: LPFP+Rail-Drop muss zur `lpfpRail`-Diagnose routen; pure Rail-Issue muss zur `rail`-Diagnose routen.

---

# BoostDoc v1.6 learning update

## Referenzdaten

- 25 echte MHD-/CSV-Logs als anonymisierte Testfixtures ergänzt.
- Originaldateinamen, private IDs, VIN-Fragmente und lokale Pfade werden nicht in die Fixtures übernommen.
- Erwartete Analyseergebnisse liegen als JSON unter `tests/expected-results`.

## Analyse-Robustheit

- Spaltenerkennung für hPa-/kPa-/MPa-Exporte erweitert.
- Boost- und Raildruckwerte aus hPa, kPa, MPa und Bar werden vor der Bewertung in PSI normalisiert.
- Plattformhinweise für N13 und B48/B46 ergänzt.
- Fuel-Erkennung korrigiert, damit `Stage2` nicht als `E2` und `Pure850` nicht als `E85` interpretiert wird.
- Lambda-Exports mit `[lambda]` werden für AFR-basierte Auswertung sauber umgerechnet.
- Air-Mass-Exports in `kg/h` werden für MAF-Auswertung in `g/s` normalisiert.

## Tests

- Neuer Fixture-Regressionstest prüft alle anonymisierten Referenzlogs.
- Der Test prüft zusätzlich, dass keine privaten Kennungen in Fixtures oder erwarteten Ergebnissen landen.
