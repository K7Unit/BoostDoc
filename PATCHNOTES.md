# Patch Notes

## Version

`v1.6.4`

## Summary

Comment-only documentation cleanup for BoostDoc v1.6.4. No runtime logic, analysis
behavior, thresholds, tests, or expected results were changed. The goal was to clarify
five areas of `analyzer.js` that were identified as under-documented during the v1.6.3
audit.

## Changes

- **kPa branch (`pressureToPsi`)**: Added comment explaining that the absolute-pressure
  heuristic (`value > 120`, subtract ambient 100 kPa) is intentionally kept, and why
  it differs from the hPa branch — no Datazap kPa fixture has been observed, so the
  WG-position evidence that confirms gauge-only behavior for hPa cannot be applied to kPa.

- **hPa branch (`pressureToPsi`)**: Expanded existing comment to cite the empirical WG
  position evidence: `WGpos = 0%` during spool-up (wastegate fully closed, pressure
  building toward target) is only consistent with gauge interpretation for both columns.
  Added reference to the v1.6.3 removal of the `value > 1200` absolute-detection heuristic.

- **`boostMani` (`buildColumnMap`)**: Documented as a legacy mapping not read by analysis
  logic, charts, or the channel checklist. Added guard note: do not remove without a
  dedicated column-map cleanup review (regex overlap with `boost` column).

- **`boostDeviation` (`buildColumnMap`)**: Documented as intentionally mapped so that
  `CHANNEL_CHECKLIST` in `app.js` can report column presence/absence. Not used for metric
  calculation or issue generation.

- **S63 preset TODO**: Replaced vague one-liner with 8-line actionable calibration
  guidance: required channels and minimum pull spec, confirmed `b58_gen2` carry-overs
  (rail, LPFP — GDI architecture match), and high-priority unknowns that require real
  S63 V8 bi-turbo logs before the preset can be trusted
  (`boostEvaluationMinRpm`, WGDC thresholds, IAT thresholds, `timingWarn`).

## Technical Notes

- **Runtime behavior**: Unchanged
- **Analysis output**: Unchanged
- **Expected result JSON**: Unchanged
- **Public fields / exports**: Unchanged
- **Files changed**: `analyzer.js` (+22 / −3 lines), `CHANGELOG.md` (+21 lines), `PATCHNOTES.md` (new)
- **Tests**: 5/5 green (`analyzer-csv-robustness.test.cjs`, `analyzer-fixtures.test.cjs`)
- **Syntax/build**: OK (`node --check analyzer.js`, `node --check app.js`)
- **Compatibility**: Fully backward-compatible — comment-only changes

## Known Limitations / Notes

- S63 preset thresholds remain placeholders copied from `b58_gen2`. The new comment
  details exactly what data is needed before those values can be calibrated; the
  thresholds themselves were not changed in this patch.
- `boostMani` remains in the column map. Removal is deferred to a dedicated cleanup.
- No new CSV column patterns, no new features, no threshold changes.

## Status

Ready to merge into `main`.
