const assert = require("node:assert/strict");
const LogAnalyzer = require("../analyzer.js");

assert.equal(typeof LogAnalyzer.analyzeText, "function", "analyzer.js should export analyzeText");

const semicolonCsv = [
  "Time;Engine speed;Accelerator Pedal;Throttle plate;Boost pressure (bar);Boost target (bar);Gear;Fuel low pressure (bar);Rail pressure mean 1 (bar);Lambda bank 1;WGDC Bank 1;Timing Correction Cyl 1",
  "0,0;2500;95;84;0,60;0,60;3;5,0;180;12,0;55;0,0",
  "0,2;3100;96;85;0,85;0,85;3;5,1;185;12,1;58;0,1",
  "0,4;3700;96;86;1,05;1,05;3;5,1;190;12,0;60;0,2",
  "0,6;4300;95;86;1,15;1,15;3;5,2;192;12,0;62;0,3",
  "0,8;5000;95;86;1,20;1,20;3;5,2;195;11,9;63;0,4",
].join("\n");

const semicolonResult = LogAnalyzer.analyzeText("S58-semicolon-comma-decimal.csv", semicolonCsv, LogAnalyzer.DEFAULT_RULES);

assert.equal(semicolonResult.vehicleInfo.engine, "S58", "S58 should be detected from filename");
assert.equal(semicolonResult.metrics.rows, 5, "semicolon CSV rows should parse");
assert.ok(semicolonResult.columns.rpm, "Engine speed should map to rpm");
assert.ok(semicolonResult.columns.boost, "Boost pressure should map to boost");
assert.ok(semicolonResult.columns.rail, "Rail pressure mean should map to rail");
assert.ok(semicolonResult.metrics.boost.actual.max > 17, "bar boost with comma decimals should convert to psi");
assert.ok(!semicolonResult.issues.some((issue) => issue.category === "Datei"), "valid semicolon CSV should not be treated as empty");

const incompleteCsv = [
  "Time,RPM",
  "0,800",
  "1,900",
].join("\n");

const incompleteResult = LogAnalyzer.analyzeText("incomplete-log.csv", incompleteCsv, LogAnalyzer.DEFAULT_RULES);

assert.equal(incompleteResult.status, "red", "incomplete log should get a clear non-crashing status");
assert.match(incompleteResult.headline, /Kein bewertbarer Pull|Keine Datenzeilen/, "incomplete log should explain why it cannot be evaluated");

const transientFallbackCsv = [
  "Time,RPM,Accel Pedal,Throttle Position,Boost (PSI),Boost target (PSI),Gear,Fuel low pressure (PSI),Rail pressure (PSI),Cyl1 Timing Cor,Torque Lim. active",
  "0,2500,95,80,5,15,3,40,1100,0,0",
  "1,3200,95,10,4,15,3,38,1050,8,1",
  "2,3800,95,80,4,15,4,38,1050,8,1",
  "3,4400,95,10,4,15,4,38,1050,8,1",
  "4,5000,95,80,4,15,5,38,1050,8,1",
].join("\n");

const transientResult = LogAnalyzer.analyzeText("transient-fallback-low-fuel.csv", transientFallbackCsv, LogAnalyzer.DEFAULT_RULES);
const hardTransientIssues = transientResult.issues.filter(
  (issue) =>
    issue.severity === "red" &&
    ["Boost", "Fuel", "Timing", "Limiter"].includes(issue.category)
);

assert.deepEqual(hardTransientIssues, [], "fallback/transient rows must not create hard WOT Boost/Fuel/Timing/Limiter issues");
assert.equal(transientResult.metrics.evaluation.hardWotReady, false, "transient fallback should not be hard-WOT-ready");
assert.ok(
  transientResult.notes.some((note) => /harte Boost-\/Fueling-\/Timing-Warnungen|nicht hart bewertet/i.test(note)),
  "transient fallback should be visible as context"
);

const burbleCsv = [
  "Time,RPM,Accel Pedal,Throttle Position,Boost (PSI),Boost target (PSI),Gear,Cyl1 Timing Cor",
  "0,2600,95,82,8,8,3,0",
  "1,3300,95,82,10,10,3,0",
  "2,3600,0,8,0,0,3,9",
  "3,3200,0,8,0,0,3,9",
].join("\n");

const burbleResult = LogAnalyzer.analyzeText("burble-overrun-timing.csv", burbleCsv, LogAnalyzer.DEFAULT_RULES);
const burbleStateCounts = burbleResult.metrics.states?.counts || {};
const hardBurbleTiming = burbleResult.issues.filter(
  (issue) => issue.category === "Timing" && (issue.severity === "red" || issue.severity === "yellow")
);

assert.ok((burbleStateCounts.overrun_burble || 0) > 0, "overrun/burble rows should be classified");
assert.deepEqual(hardBurbleTiming, [], "burble/overrun timing must not become a hard WOT timing issue");

// diagnosisForIssue: LPFP+rail-drop must route to lpfpRail, not rail
const lpfpRailCsv = [
  "Time,Boost (PSI),Boost target (PSI),RPM (rpm),Accel Ped. Pos. (%),Gear (-),Rail pressure (PSI),Fuel low pressure sensor (PSI),WGDC Bank 1 (%)",
  ...Array.from({ length: 30 }, (_, i) => `${i * 0.1},15,16,${3500 + i * 100},100,3,1100,40,70`),
].join("\n");
const lpfpRailResult = LogAnalyzer.analyzeText("lpfp-rail-drop.csv", lpfpRailCsv, LogAnalyzer.DEFAULT_RULES);
const lpfpRailIssue = lpfpRailResult.issues.find((issue) => /^analysis\.issue\.lpfp/.test(issue.i18nKey || ""));
assert.ok(lpfpRailIssue, "LPFP critical with rail drop should produce an LPFP issue");
const lpfpRailDiag = lpfpRailResult.diagnoses.find((diag) => /LPFP.*Rail|LPFP zieht/i.test(diag.title));
assert.ok(lpfpRailDiag, "LPFP+rail-drop issue must route to lpfpRail diagnosis, not plain rail diagnosis");

// Pure rail issue (no LPFP column) must still route to rail diagnosis
const purRailCsv = [
  "Time,Boost (PSI),Boost target (PSI),RPM (rpm),Accel Ped. Pos. (%),Gear (-),Rail pressure (PSI),WGDC Bank 1 (%)",
  ...Array.from({ length: 30 }, (_, i) => `${i * 0.1},15,16,${3500 + i * 100},100,3,900,70`),
].join("\n");
const pureRailResult = LogAnalyzer.analyzeText("pure-rail-drop.csv", purRailCsv, LogAnalyzer.DEFAULT_RULES);
const pureRailDiag = pureRailResult.diagnoses.find((diag) => /Raildruck\/HDP|Rail pressure\/HPFP/i.test(diag.title));
assert.ok(pureRailDiag, "Pure rail critical issue must route to rail/HPFP diagnosis");

// Fix 1: Boost intake [hPa] and Boost target [hPa] must always be treated as gauge pressure.
// WG position data from Datazap logs confirms both columns are gauge:
// at spool-up intake=302 hPa, target=1175 hPa, WGpos=0% (wastegate closed = building to target).
// If target were absolute (2.54 psi) and actual were already 4.38 psi, WGpos would be OPEN.
// At values > 1200 hPa the old value>1200 heuristic incorrectly flipped gauge to absolute.
const hpaGaugeCsv = [
  "Time,RPM (rpm),Accel Ped. Pos. (%),Boost intake [hPa],Boost target [hPa],WGDC Bank 1 (%)",
  ...Array.from({ length: 30 }, (_, i) => `${i * 0.1},${3000 + i * 100},100,${1300 + i * 5},1400,70`),
].join("\n");
// 1300-1445 hPa gauge = ~18.9-20.9 psi actual; 1400 hPa gauge target = ~20.3 psi
const hpaGaugeResult = LogAnalyzer.analyzeText("hpa-gauge-test.csv", hpaGaugeCsv, LogAnalyzer.DEFAULT_RULES);
const hpaActualMax = hpaGaugeResult.metrics.boost?.actual?.max;
assert.ok(Number.isFinite(hpaActualMax) && hpaActualMax > 15,
  `Boost intake [hPa] at >1200 hPa must be treated as gauge (~18.9+ psi), not absolute (~4.35 psi). Got: ${hpaActualMax}`);
const hpaTargetMax = hpaGaugeResult.metrics.boost?.target?.max;
assert.ok(Number.isFinite(hpaTargetMax) && hpaTargetMax > 15,
  `Boost target [hPa] at 1400 hPa must be treated as gauge (~20.3 psi), not absolute (~5.8 psi). Got: ${hpaTargetMax}`);

// Fix 2: Rail pressure actual [MPa] must map to rail column
const railMpaCsv = [
  "Time,RPM (rpm),Accel Ped. Pos. (%),Boost (PSI),Boost target (PSI),Rail pressure actual [MPa],WGDC Bank 1 (%)",
  ...Array.from({ length: 30 }, (_, i) => `${i * 0.1},${3000 + i * 100},100,15,14,10,70`),
].join("\n");
const railMpaResult = LogAnalyzer.analyzeText("rail-mpa-test.csv", railMpaCsv, LogAnalyzer.DEFAULT_RULES);
assert.equal(railMpaResult.columns.rail, "Rail pressure actual [MPa]", "Rail pressure actual [MPa] must map to rail");
assert.ok((railMpaResult.metrics.fuel?.rail?.max ?? 0) > 100,
  "Rail pressure actual [MPa] values must convert to psi (10 MPa = 1450 psi)");

// Fix 3: Time [ms] must map to time column and values must normalize to seconds
const msTimeCsv = [
  "Time [ms],RPM (rpm),Accel Ped. Pos. (%),Boost (PSI),Boost target (PSI)",
  ...Array.from({ length: 30 }, (_, i) => `${i * 100},${3000 + i * 100},100,15,14`),
].join("\n");
const msTimeResult = LogAnalyzer.analyzeText("ms-time-test.csv", msTimeCsv, LogAnalyzer.DEFAULT_RULES);
assert.equal(msTimeResult.columns.time, "Time [ms]", "Time [ms] must map to time column");
const msDur = msTimeResult.metrics.selectedSegment?.duration;
assert.ok(Number.isFinite(msDur) && msDur > 1 && msDur < 5,
  `Time [ms] should yield ~2.9 second pull duration, not ~2900. Got: ${msDur}`);

// Fix 4: Short Fuel Trim [] must map to stft1
const stftCsv = [
  "Time,RPM (rpm),Accel Ped. Pos. (%),Boost (PSI),Boost target (PSI),Short Fuel Trim []",
  ...Array.from({ length: 30 }, (_, i) => `${i * 0.1},${3000 + i * 100},100,15,14,1.02`),
].join("\n");
const stftResult = LogAnalyzer.analyzeText("short-fuel-trim-test.csv", stftCsv, LogAnalyzer.DEFAULT_RULES);
assert.equal(stftResult.columns.stft1, "Short Fuel Trim []", "Short Fuel Trim [] must map to stft1");

console.log("analyzer csv robustness regression ok");
