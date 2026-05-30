const assert = require("node:assert/strict");
const I18N = require("../i18n.js");
const LogAnalyzer = require("../analyzer.js");

const lpfpCsv = [
  "Time,RPM,Accel Pedal,Throttle Position,Boost (PSI),Boost target (PSI),Gear,Fuel low pressure (PSI),Rail pressure (PSI),AFR Bank 1,WGDC (%),Cyl1 Timing Cor",
  "0,2500,96,86,11,11,3,39,1100,12.1,58,0",
  "1,3200,96,86,13,13,3,38,1040,12.0,60,0",
  "2,3900,96,86,15,15,3,37,980,12.0,62,0",
  "3,4600,96,86,15,15,3,37,960,12.0,64,0",
  "4,5300,96,86,15,15,3,38,980,12.0,64,0",
].join("\n");

const englishResult = LogAnalyzer.analyzeText("i18n-lpfp.csv", lpfpCsv, {
  ...LogAnalyzer.DEFAULT_RULES,
  __language: "en",
});

assert.ok(
  englishResult.issues.some((issue) => /LPFP critically low|Rail pressure critically low/i.test(issue.text)),
  "LPFP/Rail issues should use English analyzer text"
);
assert.ok(
  englishResult.diagnoses.some((diagnosis) => /LPFP|Rail pressure/i.test(diagnosis.title)),
  "diagnosis cards should use i18n text"
);
assert.ok(
  /Check Fueling|Fueling/i.test(englishResult.tuning),
  "tuning hint should use English analyzer text"
);
assert.ok(
  !englishResult.issues.some((issue) => /kritisch|Raildruck|niedrig/i.test(issue.text)),
  "English analyzer result should not leak German issue text"
);

const timingCsv = [
  "Time,RPM,Accel Pedal,Throttle Position,Boost (PSI),Boost target (PSI),Gear,Cyl1 Timing Cor",
  "0,2500,96,86,11,11,3,0",
  "1,3200,96,86,13,13,3,0",
  "2,3900,96,86,15,15,3,8",
  "3,4600,96,86,15,15,3,8",
  "4,5300,96,86,15,15,3,8",
].join("\n");

const timingResult = LogAnalyzer.analyzeText("i18n-timing.csv", timingCsv, {
  ...LogAnalyzer.DEFAULT_RULES,
  __language: "en",
});

assert.ok(
  timingResult.issues.some((issue) => issue.i18nKey === "analysis.issue.timingCorrection" && /Timing corrections up to 8\.0 deg/i.test(issue.text)),
  "Timing issue should be generated through the i18n key"
);

const fallbackResult = LogAnalyzer.analyzeText("i18n-fallback.csv", lpfpCsv, {
  ...LogAnalyzer.DEFAULT_RULES,
  __language: "xx",
});

assert.ok(
  fallbackResult.issues.some((issue) => /LPFP kritisch niedrig|Raildruck kritisch niedrig/i.test(issue.text)),
  "unknown analyzer language should fall back to German"
);

console.log("analyzer i18n regression ok");
