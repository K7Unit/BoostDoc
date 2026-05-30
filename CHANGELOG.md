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
