const assert = require("node:assert/strict");
const I18N = require("../i18n.js");

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => data.set(key, String(value)),
  };
}

const expectedLanguages = ["de", "en", "tr", "pl", "ru", "it", "es"];
const languageCodes = I18N.LANGUAGES.map((entry) => entry.code);

assert.equal(I18N.DEFAULT_LANGUAGE, "de", "default language should be German");
assert.deepEqual(languageCodes, expectedLanguages, "language options should stay complete and ordered");
assert.equal(I18N.normalizeLanguage("xx"), "de", "unknown language should normalize to German");
assert.equal(I18N.t("xx", "uploadCsv"), "CSV auswählen", "unknown language should fall back to German");
assert.equal(I18N.t("pl", "__missing_key__"), "__missing_key__", "missing key should fall back to key when German is missing too");

const analysisKeys = [
  "analysis.issue.lpfpCritical",
  "analysis.issue.railCritical",
  "analysis.issue.timingCorrection",
  "analysis.note.timingOnlyOutside",
  "analysis.event.afrDropoutContext",
  "analysis.platform.fuelChainDetail",
  "analysis.chart.actual",
  "analysis.preset.n54.detail",
  "analysis.vehicle.unknown",
  "analysis.diag.lpfp.title",
  "analysis.diag.timing.c4",
  "analysis.tuning.fuel",
];

for (const language of expectedLanguages) {
  for (const key of analysisKeys) {
    assert.notEqual(I18N.t(language, key), key, `${language} should resolve ${key}`);
  }
}

assert.equal(
  I18N.t("xx", "analysis.issue.lpfpCritical", { lpfp: "41", railDrop: "" }),
  "LPFP kritisch niedrig (41 psi).",
  "unknown analyzer language should fall back to German"
);

const polishUpload = I18N.I18N.pl.uploadCsv;
delete I18N.I18N.pl.uploadCsv;
assert.equal(I18N.t("pl", "uploadCsv"), "CSV auswählen", "missing translation should fall back to German");
I18N.I18N.pl.uploadCsv = polishUpload;

const storage = memoryStorage();
assert.equal(I18N.readLanguage(storage), "de", "empty storage should read German");
assert.equal(I18N.writeLanguage(storage, "tr"), "tr", "selected language should be normalized and returned");
assert.equal(storage.getItem(I18N.STORAGE_KEY), "tr", "selected language should be stored");
assert.equal(I18N.readLanguage(storage), "tr", "stored language should be read back");
assert.equal(I18N.writeLanguage(storage, "unknown"), "de", "invalid stored language should fall back to German");

console.log("i18n regression ok");
