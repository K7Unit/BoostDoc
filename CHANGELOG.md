# BoostDoc v1.6.4

## Documentation Cleanup — analyzer.js comments only

- **`pressureToPsi` kPa branch**: Added comment explaining why absolute-pressure detection (`value > 120`, subtract 100 kPa ambient) is kept and why this intentionally differs from the hPa branch — no Datazap kPa fixture has been observed, so gauge-only treatment cannot be confirmed for kPa the way WG position data confirms it for hPa.
- **`pressureToPsi` hPa branch**: Expanded existing comment with WG position evidence: `WGpos = 0 %` at spool-up (wastegate closed, pressure building to target) is only consistent with gauge interpretation for both columns. Added reference to the v1.6.3 removal of the `value > 1200` heuristic.
- **`buildColumnMap` `boostMani`**: Documented as a legacy mapping not read by analysis, charts, or the channel checklist. Guard note added: do not remove without a dedicated column-map cleanup review.
- **`buildColumnMap` `boostDeviation`**: Documented as mapped specifically so `CHANNEL_CHECKLIST` in `app.js` can report column presence/absence; not used for metric calculation or issue generation.
- **S63 preset TODO**: Replaced vague one-liner with 8-line actionable calibration guidance: required channels/conditions, confirmed `b58_gen2` carry-overs (rail, LPFP), and high-priority unknowns (`boostEvaluationMinRpm`, WGDC thresholds, IAT thresholds, `timingWarn`) that need real S63 V8 bi-turbo logs before the preset can be trusted.

## Runtime Impact

None. Comment-only changes — no analysis logic, thresholds, expected results, tests, or public fields were modified.

---

# BoostDoc v1.6.3

## Bugfixes — Datazap-Exporte (Nachbesserung v1.6.2)

- **`Boost intake [hPa]` und `Boost target [hPa]` immer als Gauge**: Die v1.6.2-Annahme, `Boost target [hPa]` sei Absolutdruck, war falsch. WG-Positions-Daten aus dem Fixture belegen, dass beide Spalten Gauge sind (bei Spool-up WGpos=0 % — Wastegate geschlossen, Druck baut sich zur Target auf). Die `value > 1200`-Heuristik, die bei hohen Gauge-Werten fälschlich auf Absolutdruck wechselte, wurde entfernt. hPa-Spalten werden nun immer als Gauge behandelt (`× 0.0145038`). Auswirkung: Boost-Peak für das Stage2-Fixture korrigiert von 17.4 psi auf 21.4 psi (korrekt).
- **`isTimingCorrectionColumn` erkennt jetzt Cyl.N-Punkt-Notation**: Datazap-Exporte verwenden `Timing Correction Cyl.4 []` (mit Punkt). Die alte Regex traf nur `Cyl4` ohne Punkt. Fix: `[\s.]*` vor `\d+`. Auswirkung: Timing Correction Cyl.4 = −6° im WOT des Stage2-Fixture wird jetzt erkannt → Status korrekt `red` statt `yellow`.
- **S63 bekommt eigenes Preset**: `presetKeyForVehicle` routete S63 bisher auf `b58_gen2`. S63 hat nun ein eigenes `s63`-Preset in `RULE_PRESETS` (Placeholder-Schwellwerte identisch mit `b58_gen2`, TODO-Kommentar für spätere S63-Kalibrierung).

## Expected Results

- `sample_unknown_stage2_98oct_001.json`: Status `yellow → red` (echter Bugfix: Timing Correction Cyl.4 war nicht detektiert). `boostMaxPsi` 17.4 → 21.4 psi, `boostTargetMaxPsi` 6.5 → 21.0 psi (Gauge-Fix). `time`, `rail`, `stft1` jetzt gemappt. Alle Änderungen sind dokumentiert mit `_statusChange`-, `_boostMaxNote`-, `_boostTargetNote`-, `_timingNote`-Feldern.

## Post-Review-Fixes (Code-Review v1.6.3)

- **`app.js` `presetKeyForEngine` für S63 korrigiert**: Die Parallel-Funktion in `app.js` wurde beim v1.6.3-S63-Preset-Routing nicht mitgepflegt. S63 wurde weiterhin auf `"b58_gen2"` geroutet, womit das neue `s63`-Preset im UI-Pfad (Profil-Auswahl, Preset-Anzeige, Mismatch-Warnung) nie angewendet wurde. Fix: `presetKeyForEngine` in `app.js` auf dieselbe Aufteilung gebracht wie `presetKeyForVehicle` in `analyzer.js`.
- **`buildTraceSeries` `startTime` konnte `undefined` werden**: `Array.prototype.find()` gibt `undefined` zurück, wenn kein Element passt — nicht `NaN`. Bei einem Log ohne gültige Zeitwerte wurde `startTime = undefined` statt `NaN`, was `Number.isFinite(startTime)` auf `false` setzte und `relativeTime` dazu brachte, absolute statt relative Timestamps zu verwenden (falsche Chart-X-Achse). Fix: `?? NaN` nach dem `.find()`-Aufruf. Vorbestehender Fehler, nicht durch v1.6.3 eingeführt.

## Tests

- `analyzer-csv-robustness.test.cjs`: hPa-Gauge-Test ersetzt den fehlerhaften v1.6.2-Absolutdruck-Test. Beide hPa-Spalten müssen bei Werten > 1200 hPa als Gauge (> 15 psi) erkannt werden.
- `analyzer-fixtures.test.cjs`: Boost-Actual-/Target-Assertions für den Datazap-Fixture korrigiert (gauge psi ~ 21 psi).

---

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
