const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const LogAnalyzer = require("../analyzer.js");

const root = path.join(__dirname, "..");
const fixtureDir = path.join(root, "test-data", "anonymized");
const expectedDir = path.join(__dirname, "expected-results");
const privacyPattern = /(WB[A-Z0-9]{14}|WBS[A-Z0-9]{14}|0000[0-9A-F]{8,}|public_user|C:\\Users|Desktop|test-logs|[A-HJ-NPR-Z0-9]{17})/i;

assert.ok(fs.existsSync(fixtureDir), "anonymized fixture directory should exist");
assert.ok(fs.existsSync(expectedDir), "expected result directory should exist");

const fixtureFiles = fs.readdirSync(fixtureDir)
  .filter((file) => file.endsWith(".csv"))
  .sort();

assert.equal(fixtureFiles.length, 25, "all uploaded reference CSVs should have anonymized fixtures");

for (const file of fixtureFiles) {
  const fixturePath = path.join(fixtureDir, file);
  const expectedPath = path.join(expectedDir, file.replace(/\.csv$/i, ".json"));
  const text = fs.readFileSync(fixturePath, "utf8");
  const expectedText = fs.readFileSync(expectedPath, "utf8");

  assert.doesNotMatch(file, privacyPattern, `${file} must use a neutral fixture name`);
  assert.doesNotMatch(text, privacyPattern, `${file} must not contain private identifiers`);
  assert.doesNotMatch(expectedText, privacyPattern, `${expectedPath} must not contain private identifiers`);

  const expected = JSON.parse(expectedText);
  const parsed = LogAnalyzer.parseCsv(text);
  const result = LogAnalyzer.analyzeText(file, text, { __profile: { burble: "unknown" } });

  assert.equal(parsed.rows.length, expected.rows, `${file} row count should stay stable`);
  assert.equal(result.vehicleInfo.engine, expected.platform, `${file} platform should stay stable`);
  assert.equal(result.status, expected.status, `${file} status should stay stable`);
  assert.equal(result.metrics.pullCount || 0, expected.pullCount, `${file} pull count should stay stable`);
  assert.equal(result.vehicleInfo.fuel || "", expected.fuel, `${file} fuel hint should stay stable`);
}

const hpaFixture = "sample_unknown_stage2_98oct_001.csv";
const hpaResult = LogAnalyzer.analyzeText(
  hpaFixture,
  fs.readFileSync(path.join(fixtureDir, hpaFixture), "utf8"),
  { __profile: { burble: "unknown" } }
);

assert.equal(hpaResult.columns.time, "Time [ms]", "Time [ms] should map to time column");
assert.equal(hpaResult.columns.boost, "Boost intake [hPa]", "hPa boost exports should map to boost");
assert.equal(hpaResult.columns.target, "Boost target [hPa]", "hPa boost target exports should map to target");
assert.equal(hpaResult.columns.rail, "Rail pressure actual [MPa]", "Rail pressure actual [MPa] should map to rail");
assert.equal(hpaResult.columns.railReq, "Rail pressure target [MPa]", "MPa rail target exports should map");
assert.equal(hpaResult.columns.stft1, "Short Fuel Trim []", "Short Fuel Trim [] should map to stft1");
assert.ok(hpaResult.metrics.boost.actual.max < 40, "hPa boost should be converted to gauge psi, not treated as raw psi");
assert.ok((hpaResult.metrics.boost?.target?.max ?? 100) < 10, "Boost target [hPa] absolute values must convert to gauge psi (max ~6.5 psi for this fixture)");
assert.ok((hpaResult.metrics.fuel?.rail?.max ?? 0) > 100, "Rail pressure actual [MPa] must convert to psi for the hPa fixture");

const b58FlexExpected = JSON.parse(fs.readFileSync(path.join(expectedDir, "sample_b58_gen1_e40_001.json"), "utf8"));
assert.equal(b58FlexExpected.fuel, "E40", "Pure850-style names must not be misread as E85 fuel");

const n13Fixtures = fixtureFiles.filter((file) => file.startsWith("sample_n13_"));
assert.equal(n13Fixtures.length, 4, "N13 reference logs should be detected as N13");

const s55StFixtures = fixtureFiles.filter((file) => file.startsWith("sample_s55_") && !file.includes("stage2") && !file.includes("e30"));
for (const file of s55StFixtures) {
  const expected = JSON.parse(fs.readFileSync(path.join(expectedDir, file.replace(/\.csv$/i, ".json")), "utf8"));
  assert.notEqual(expected.stage, "ST6", "ST6268G turbo names must not be misread as stage ST6");
}

console.log("analyzer anonymized fixture regression ok");
