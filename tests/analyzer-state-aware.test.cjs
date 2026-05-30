const assert = require("node:assert/strict");
const LogAnalyzer = require("../analyzer.js");

const csv = [
  "Time,RPM,Accel Pedal,Throttle Position,Boost (PSI),Boost target (PSI),Gear,Cyl1 Timing Cor",
  "0,2500,95,80,10,10,3,0",
  "1,3300,95,80,12,12,3,0",
  "2,4200,95,15,12,12,3,8",
  "3,5000,5,10,0,0,3,9",
].join("\n");

const result = LogAnalyzer.analyzeText("state-aware-shift-timing.csv", csv, LogAnalyzer.DEFAULT_RULES);
const timingIssues = result.issues.filter((issue) => issue.category === "Timing");
const hardTimingIssues = timingIssues.filter((issue) => issue.severity === "red" || issue.severity === "yellow");
const stateCounts = result.metrics?.states?.counts || {};

assert.equal(typeof LogAnalyzer.analyzeText, "function", "analyzer.js should export analyzeText");
assert.ok((stateCounts.wot_pull || 0) > 0, "synthetic CSV should include WOT rows");
assert.ok((stateCounts.shift_transient || 0) > 0, "synthetic CSV should include a shift/transient row");
assert.deepEqual(hardTimingIssues, [], "shift/transient timing must not become a hard WOT timing issue");
assert.ok(
  result.notes.some((note) => /Timing Corrections nur ausserhalb WOT|Timing-Kontext ausserhalb WOT/i.test(note)),
  "shift/transient timing should still be visible as context"
);

console.log("analyzer state-aware timing regression ok");
