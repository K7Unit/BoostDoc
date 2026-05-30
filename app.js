const state = {
  documents: [],
  results: [],
  selectedIndex: null,
  pullSelection: {},
  referenceLibrary: [],
  vehicleProfiles: [],
  selectedProfileId: "",
  language: window.BoostDocI18n?.DEFAULT_LANGUAGE || "de",
};

let applyingPreset = false;

const elements = {
  fileInput: document.getElementById("fileInput"),
  mobileCsvButton: document.getElementById("mobileCsvButton"),
  mobileUploadStatus: document.getElementById("mobileUploadStatus"),
  mobileClearButton: document.getElementById("mobileClearButton"),
  clearButton: document.getElementById("clearButton"),
  dropZone: document.getElementById("dropZone"),
  uploadStatus: document.getElementById("uploadStatus"),
  logTable: document.getElementById("logTable"),
  detailView: document.getElementById("detailView"),
  detailBadge: document.getElementById("detailBadge"),
  compareView: document.getElementById("compareView"),
  compareSummary: document.getElementById("compareSummary"),
  trendView: document.getElementById("trendView"),
  trendSummary: document.getElementById("trendSummary"),
  listCount: document.getElementById("listCount"),
  metricTotal: document.getElementById("metricTotal"),
  metricGreen: document.getElementById("metricGreen"),
  metricYellow: document.getElementById("metricYellow"),
  metricRed: document.getElementById("metricRed"),
  metricLast: document.getElementById("metricLast"),
  themeToggle: document.getElementById("themeToggle"),
  themeModeText: document.getElementById("themeModeText"),
  languageSelect: document.getElementById("languageSelect"),
  navButtons: [...document.querySelectorAll(".nav-button")],
  rulePreset: document.getElementById("rulePreset"),
  presetHint: document.getElementById("presetHint"),
  referenceToolsCount: document.getElementById("referenceToolsCount"),
  referenceImportStatus: document.getElementById("referenceImportStatus"),
  referenceExportButton: document.getElementById("referenceExportButton"),
  referenceImportButton: document.getElementById("referenceImportButton"),
  referenceImportInput: document.getElementById("referenceImportInput"),
  vehicleProfileSelect: document.getElementById("vehicleProfileSelect"),
  vehicleProfileStatus: document.getElementById("vehicleProfileStatus"),
  vehicleProfileNewButton: document.getElementById("vehicleProfileNewButton"),
  vehicleProfileSaveButton: document.getElementById("vehicleProfileSaveButton"),
  vehicleProfileDeleteButton: document.getElementById("vehicleProfileDeleteButton"),
  vehicleProfileName: document.getElementById("vehicleProfileName"),
  vehicleProfileEngine: document.getElementById("vehicleProfileEngine"),
  vehicleProfileStage: document.getElementById("vehicleProfileStage"),
  vehicleProfileFuel: document.getElementById("vehicleProfileFuel"),
  vehicleProfileMap: document.getElementById("vehicleProfileMap"),
  vehicleProfileHardware: document.getElementById("vehicleProfileHardware"),
  vehicleProfileNotes: document.getElementById("vehicleProfileNotes"),
  vehicleProfileBurbleMode: document.getElementById("vehicleProfileBurbleMode"),
  vehicleProfileBurbleDuration: document.getElementById("vehicleProfileBurbleDuration"),
  vehicleProfileBurbleAggression: document.getElementById("vehicleProfileBurbleAggression"),
  vehicleProfileBurbleMinRpm: document.getElementById("vehicleProfileBurbleMinRpm"),
  vehicleProfileBurbleMaxRpm: document.getElementById("vehicleProfileBurbleMaxRpm"),
  vehicleProfileBurbleMinSpeed: document.getElementById("vehicleProfileBurbleMinSpeed"),
  ruleInputs: [...document.querySelectorAll(".rule-section input")],
};

const STORAGE_KEYS = {
  theme: "boostdoc-theme",
  view: "boostdoc-view",
  preset: "boostdoc-rule-preset",
  referenceLibrary: "boostdoc-reference-library",
  vehicleProfiles: "boostdoc-vehicle-profiles",
  selectedProfileId: "boostdoc-selected-profile",
  language: window.BoostDocI18n?.STORAGE_KEY || "boostdoc_language",
};

const LEGACY_STORAGE_KEYS = {
  theme: "bmw-log-analyzer-theme",
  view: "bmw-log-analyzer-view",
  preset: "bmw-log-analyzer-preset",
  referenceLibrary: "bmw-log-analyzer-reference-library",
  vehicleProfiles: "bmw-log-analyzer-vehicle-profiles",
  selectedProfileId: "bmw-log-analyzer-selected-profile",
};

const RULE_FIELD_MAP = {
  rulePullDurationWarn: { key: "pullMinDurationWarn" },
  rulePedalWarn: { key: "pedalAvgWarn" },
  ruleBoostEvalMinRpm: { key: "boostEvaluationMinRpm" },
  ruleBoostWarn: { key: "boostWarnAvgAbs" },
  ruleBoostSevere: { key: "boostSevereAvgAbs" },
  ruleBoostUnderWarn: { key: "boostUnderWarn", toInput: (value) => Math.abs(value) },
  ruleBoostUnderSevere: { key: "boostUnderSevere", toInput: (value) => Math.abs(value) },
  ruleBoostOverWarn: { key: "boostOverWarn" },
  ruleBoostOverSevere: { key: "boostOverSevere" },
  ruleTimingWarn: { key: "timingWarn" },
  ruleTimingSevere: { key: "timingSevere" },
  ruleLpfpWarn: { key: "lpfpWarn" },
  ruleLpfpSevere: { key: "lpfpSevere" },
  ruleLpfpSustainedWarn: { key: "lpfpSustainedWarn" },
  ruleLpfpSustainedPctWarn: { key: "lpfpSustainedPctWarn", toInput: (value) => value * 100 },
  ruleRailWarn: { key: "railWarn" },
  ruleRailSevere: { key: "railSevere" },
  ruleLambdaDiffWarn: { key: "lambdaBankDiffWarn" },
  ruleAfrLeanWarn: { key: "afrLeanWarn" },
  ruleStftPeggedWarn: { key: "stftPeggedWarn" },
  ruleFuelTrimBankDiffWarn: { key: "fuelTrimBankDiffWarn" },
  ruleLtftWarn: { key: "ltftWarn" },
  ruleWgdcWarnAvg: { key: "wgdcWarnAvg" },
  ruleWgdcSevereAvg: { key: "wgdcSevereAvg" },
  ruleWgdcSevereMax: { key: "wgdcSevereMax" },
  ruleThrottleClosureWarn: { key: "throttleClosurePctWarn", toInput: (value) => value * 100 },
  ruleThrottleClosureSevere: { key: "throttleClosurePctSevere", toInput: (value) => value * 100 },
  ruleIatWarnMax: { key: "iatWarnMaxC" },
  ruleIatSevereMax: { key: "iatSevereMaxC" },
  ruleIatWarnRise: { key: "iatWarnRiseC" },
  ruleIatSevereRise: { key: "iatSevereRiseC" },
  ruleMissingChannelsWarn: { key: "missingChannelsWarnCount" },
  ruleAfrSpikeWarn: { key: "afrSpikeWarn" },
  ruleAfrSpikeSevere: { key: "afrSpikeSevere" },
  ruleAfrDropoutWarn: { key: "afrDropoutWarn" },
  ruleMhdPlaceholderCount: { key: "mhdAfrPlaceholderWarnCount" },
  ruleThrottleMismatchDelta: { key: "throttleMismatchDeltaWarn" },
  ruleThrottleMismatchPullCount: { key: "throttleMismatchPullCountWarn" },
  ruleHesitationRpmMin: { key: "hesitationRpmMin" },
  ruleHesitationRpmMax: { key: "hesitationRpmMax" },
  ruleHesitationPullCount: { key: "hesitationPullCountWarn" },
  ruleAnomalySteadyThrottleMin: { key: "anomalySteadyThrottleMin" },
  ruleIdleRpmMax: { key: "idleRpmMax" },
  ruleIdleAfrSwingWarn: { key: "idleAfrSwingWarn" },
  ruleStaticValueWarnRows: { key: "staticValueWarnRows" },
  ruleN54RecommendedGear: { key: "n54RecommendedGear" },
  ruleN54RecommendedMinRpm: { key: "n54RecommendedMinRpm" },
  ruleN54RecommendedEndRpm: { key: "n54RecommendedEndRpm" },
};

const CHANNEL_CHECKLIST = [
  { key: "time", label: "Zeit", group: "Basis", priority: "required", why: "Nötig für Pull-Dauer und Ereignis-Zeitpunkt." },
  { key: "rpm", label: "RPM", group: "Basis", priority: "required", why: "Grundlage für Spool, Lastbereich und Timing-Bewertung." },
  { key: "gear", label: "Gang", group: "Basis", priority: "required", why: "Trennt Pulls sauber und erkennt Gangwechsel." },
  { key: "pedal", label: "Pedal", group: "Basis", priority: "required", why: "Zeigt, ob der Pull wirklich Vollgas war." },
  { key: "boost", label: "Boost Ist", group: "Boost", priority: "required", why: "Hauptsignal für Unter-/Überboost." },
  { key: "target", label: "Boost Target", group: "Boost", priority: "required", why: "Ohne Target ist Boost-Abweichung nur grob bewertbar." },
  { key: "iat", label: "IAT", group: "Thermik", priority: "required", why: "Wichtig für Heatsoak, Timing und Wiederholbarkeit." },
  { key: "throttle", label: "Throttle", group: "Regelung", priority: "required", why: "Erkennt DME-Eingriffe und Throttle Closure." },
  { key: "timingCorrections", label: "Timing Corrections", group: "Zündung", priority: "required", why: "Kernwert für Klopf-/Qualitätsbewertung." },
  { key: "rail", label: "Raildruck", group: "Fuel", priority: "required", why: "Direkter Health-Wert für Hochdruckseite." },
  { key: "lpfp", label: "LPFP", group: "Fuel", priority: "required", why: "Erkennt Niederdruckmangel und Pumpenreserve." },
  { key: "lambda1", label: "Lambda/AFR", group: "Fuel", priority: "required", why: "Lean/Rich-Bewertung unter Last." },
  { key: "wgdc", label: "WGDC", group: "Turbo", priority: "required", why: "Zeigt Turbo-Reserve und Regelaufwand." },
  { key: "lambdaTarget", label: "Lambda Target", group: "Fuel", priority: "recommended", why: "Macht AFR/Lambda unter Last deutlich sicherer." },
  { key: "boostDeviation", label: "Boost Deviation", group: "Boost", priority: "recommended", why: "Hilft bei MHD+/DME-Boostfehlern." },
  { key: "speed", label: "Speed", group: "Basis", priority: "recommended", why: "Plausibilität für Gang und Pull-Form." },
  { key: "coolant", label: "Coolant", group: "Thermik", priority: "recommended", why: "Zeigt warmen Motor und thermische Bedingungen." },
  { key: "oilTemp", label: "Oil Temp", group: "Thermik", priority: "recommended", why: "Besserer Hinweis auf echte Betriebswärme." },
  { key: "loadActual", label: "Load Actual", group: "Regelung", priority: "recommended", why: "Hilft bei Load-/Torque-Modell und Eingriffen." },
  { key: "loadReq", label: "Load Request", group: "Regelung", priority: "recommended", why: "Macht DME-Lastanforderung sichtbar." },
  { key: "torqueLimit", label: "Torque Limiter", group: "Regelung", priority: "recommended", why: "Erklärt Throttle Closure und Lastreduktion." },
  { key: "stft1", label: "STFT Bank 1", group: "Fuel", priority: "recommended", why: "Kurzzeit-Adaption für Gemischdiagnose." },
  { key: "ltft1", label: "LTFT Bank 1", group: "Fuel", priority: "recommended", why: "Langzeit-Adaption für Undichtigkeiten/Fueling." },
  { key: "ethanol", label: "Ethanol", group: "Fuel", priority: "recommended", why: "Wichtig für E-Mix-Maps und Vergleichbarkeit." },
  { key: "wgdcBase", label: "WGDC Base", group: "Turbo", priority: "optional", why: "Hilft beim Feintuning der Wastegate-Basis." },
  { key: "maf", label: "MAF", group: "Luftmasse", priority: "optional", why: "Zusätzlicher Plausibilitätswert für Luftmasse." },
  { key: "mafReq", label: "MAF Request", group: "Luftmasse", priority: "optional", why: "Nützlich für Soll/Ist-Luftmassenvergleich." },
];

const BANKED_ENGINE_CHANNELS = [
  { key: "lambda2", label: "Lambda/AFR Bank 2", group: "Fuel", priority: "recommended", why: "Wichtig für bankweise N54/N55-Diagnose." },
  { key: "stft2", label: "STFT Bank 2", group: "Fuel", priority: "recommended", why: "Zeigt bankweise Kurzzeit-Adaption." },
  { key: "ltft2", label: "LTFT Bank 2", group: "Fuel", priority: "recommended", why: "Zeigt bankweise Langzeit-Adaption." },
];

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Local files can be opened in locked-down browsers; the app still works without persistence.
  }
}

function readJsonStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  writeStorage(key, JSON.stringify(value));
}

function migrateStorageKey(key, legacyKey) {
  if (!legacyKey || key === legacyKey) return;
  try {
    if (localStorage.getItem(key) !== null) return;
    const legacyValue = localStorage.getItem(legacyKey);
    if (legacyValue !== null) localStorage.setItem(key, legacyValue);
  } catch {
    // Persistence is optional; skip migration when storage is not available.
  }
}

function migrateStorageKeys() {
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    migrateStorageKey(key, LEGACY_STORAGE_KEYS[name]);
  });
}

function safeText(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function t(key, vars = {}) {
  const translated = window.BoostDocI18n?.t
    ? window.BoostDocI18n.t(state.language, key, vars)
    : key;
  return safeText(translated, key);
}

function tOr(key, fallback, vars = {}) {
  const text = t(key, vars);
  return text === key ? fallback : text;
}

function presetText(key, field, fallback) {
  return tOr(`analysis.preset.${key}.${field}`, fallback || "");
}

function statusLabel(status) {
  if (status === "green") return t("statusGreen");
  if (status === "yellow") return t("statusYellow");
  if (status === "red") return t("statusRed");
  return t("statusNeutral");
}

function applyI18n() {
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  if (elements.languageSelect) elements.languageSelect.value = state.language;
  if (elements.themeModeText) {
    elements.themeModeText.textContent = document.body.dataset.theme === "dark" ? t("dark") : t("light");
  }
  if (!state.documents.length) {
    setUploadStatus(t("uploadHint"));
  }
}

function setLanguage(language, options = {}) {
  const { rerender = true } = options;
  state.language = window.BoostDocI18n?.normalizeLanguage
    ? window.BoostDocI18n.normalizeLanguage(language)
    : language || "de";
  writeStorage(STORAGE_KEYS.language, state.language);
  applyI18n();
  if (rerender) render();
}

function saveReferenceLibrary() {
  writeJsonStorage(STORAGE_KEYS.referenceLibrary, state.referenceLibrary);
}

function saveVehicleProfiles() {
  writeJsonStorage(STORAGE_KEYS.vehicleProfiles, state.vehicleProfiles);
  writeStorage(STORAGE_KEYS.selectedProfileId, state.selectedProfileId || "");
}

function profileNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && String(value).trim() !== "" ? parsed : null;
}

function normalizeVehicleProfile(profile) {
  if (!profile || typeof profile !== "object") return null;
  const id = String(profile.id || "").trim();
  const name = String(profile.name || "").trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    engine: String(profile.engine || "").trim(),
    stage: String(profile.stage || "").trim(),
    fuel: String(profile.fuel || "").trim(),
    map: String(profile.map || "").trim(),
    hardware: String(profile.hardware || "").trim(),
    notes: String(profile.notes || "").trim(),
    burbleMode: String(profile.burbleMode || profile.burble?.mode || "unknown").trim() || "unknown",
    burbleDuration: profileNumber(profile.burbleDuration ?? profile.burble?.durationWindow),
    burbleAggression: profileNumber(profile.burbleAggression ?? profile.burble?.aggression),
    burbleMinRpm: profileNumber(profile.burbleMinRpm ?? profile.burble?.minRpm),
    burbleMaxRpm: profileNumber(profile.burbleMaxRpm ?? profile.burble?.maxRpm),
    burbleMinSpeed: profileNumber(profile.burbleMinSpeed ?? profile.burble?.minSpeed),
    updatedAt: profile.updatedAt || new Date().toISOString(),
  };
}

function activeProfile() {
  return state.vehicleProfiles.find((profile) => profile.id === state.selectedProfileId) || null;
}

function profilePresetKey(profile) {
  if (!profile?.engine) return null;
  return presetKeyForEngine(profile.engine);
}

function profileLabel(profile) {
  if (!profile) return t("noProfile");
  return [profile.name, profile.engine, profile.stage, profile.fuel].filter(Boolean).join(" | ");
}

function profileFromForm(existing = null) {
  const name = elements.vehicleProfileName?.value.trim() || t("unnamedVehicle");
  return {
    id: existing?.id || `profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    engine: elements.vehicleProfileEngine?.value || "",
    stage: elements.vehicleProfileStage?.value.trim() || "",
    fuel: elements.vehicleProfileFuel?.value.trim() || "",
    map: elements.vehicleProfileMap?.value.trim() || "",
    hardware: elements.vehicleProfileHardware?.value.trim() || "",
    notes: elements.vehicleProfileNotes?.value.trim() || "",
    burbleMode: elements.vehicleProfileBurbleMode?.value || "unknown",
    burbleDuration: profileNumber(elements.vehicleProfileBurbleDuration?.value),
    burbleAggression: profileNumber(elements.vehicleProfileBurbleAggression?.value),
    burbleMinRpm: profileNumber(elements.vehicleProfileBurbleMinRpm?.value),
    burbleMaxRpm: profileNumber(elements.vehicleProfileBurbleMaxRpm?.value),
    burbleMinSpeed: profileNumber(elements.vehicleProfileBurbleMinSpeed?.value),
    updatedAt: new Date().toISOString(),
  };
}

function fillProfileForm(profile) {
  if (!elements.vehicleProfileName) return;
  elements.vehicleProfileName.value = profile?.name || "";
  elements.vehicleProfileEngine.value = profile?.engine || "";
  elements.vehicleProfileStage.value = profile?.stage || "";
  elements.vehicleProfileFuel.value = profile?.fuel || "";
  elements.vehicleProfileMap.value = profile?.map || "";
  elements.vehicleProfileHardware.value = profile?.hardware || "";
  elements.vehicleProfileNotes.value = profile?.notes || "";
  if (elements.vehicleProfileBurbleMode) elements.vehicleProfileBurbleMode.value = profile?.burbleMode || "unknown";
  if (elements.vehicleProfileBurbleDuration) elements.vehicleProfileBurbleDuration.value = profile?.burbleDuration ?? "";
  if (elements.vehicleProfileBurbleAggression) elements.vehicleProfileBurbleAggression.value = profile?.burbleAggression ?? "";
  if (elements.vehicleProfileBurbleMinRpm) elements.vehicleProfileBurbleMinRpm.value = profile?.burbleMinRpm ?? "";
  if (elements.vehicleProfileBurbleMaxRpm) elements.vehicleProfileBurbleMaxRpm.value = profile?.burbleMaxRpm ?? "";
  if (elements.vehicleProfileBurbleMinSpeed) elements.vehicleProfileBurbleMinSpeed.value = profile?.burbleMinSpeed ?? "";
}

function renderVehicleProfiles() {
  if (!elements.vehicleProfileSelect) return;
  const current = activeProfile();
  elements.vehicleProfileSelect.innerHTML = `
    <option value="">${escapeHtml(t("noProfile"))}</option>
    ${state.vehicleProfiles
      .map((profile) => `<option value="${escapeAttr(profile.id)}">${escapeHtml(profileLabel(profile))}</option>`)
      .join("")}
  `;
  elements.vehicleProfileSelect.value = current?.id || "";
  fillProfileForm(current);
  if (elements.vehicleProfileStatus) {
    elements.vehicleProfileStatus.textContent = current
      ? `${profileLabel(current)} ${t("active")}`
      : t("noProfileActive");
  }
}

function selectVehicleProfile(profileId, options = {}) {
  state.selectedProfileId = profileId || "";
  saveVehicleProfiles();
  const profile = activeProfile();
  const presetKey = profilePresetKey(profile);
  if (presetKey && elements.rulePreset?.value !== "custom") {
    applyRulePreset(presetKey, { reanalyze: options.reanalyze !== false });
  } else if (options.reanalyze && state.results.length) {
    reanalyzeLoaded();
  }
  renderVehicleProfiles();
  render();
}

function saveCurrentVehicleProfile() {
  const existing = activeProfile();
  const profile = profileFromForm(existing);
  const index = state.vehicleProfiles.findIndex((entry) => entry.id === profile.id);
  if (index >= 0) state.vehicleProfiles[index] = profile;
  else state.vehicleProfiles.unshift(profile);
  state.selectedProfileId = profile.id;
  saveVehicleProfiles();
  const presetKey = profilePresetKey(profile);
  if (presetKey && elements.rulePreset?.value !== "custom") {
    applyRulePreset(presetKey, { reanalyze: true });
  }
  renderVehicleProfiles();
  render();
}

function createVehicleProfileDraft() {
  state.selectedProfileId = "";
  saveVehicleProfiles();
  renderVehicleProfiles();
  fillProfileForm({ name: "", engine: "", stage: "", fuel: "", map: "", hardware: "", notes: "", burbleMode: "unknown" });
  if (elements.vehicleProfileStatus) {
    elements.vehicleProfileStatus.textContent = t("newProfileDraft");
  }
}

function deleteCurrentVehicleProfile() {
  const profile = activeProfile();
  if (!profile) {
    createVehicleProfileDraft();
    return;
  }
  state.vehicleProfiles = state.vehicleProfiles.filter((entry) => entry.id !== profile.id);
  state.selectedProfileId = "";
  saveVehicleProfiles();
  renderVehicleProfiles();
  render();
}

function referenceExportPayload() {
  return {
    app: "BoostDoc",
    version: 1,
    exportedAt: new Date().toISOString(),
    count: state.referenceLibrary.length,
    references: state.referenceLibrary,
  };
}

function exportReferenceLibrary() {
  const payload = referenceExportPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `boostdoc-referenzen-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setReferenceImportStatus(t("referenceExported", { count: payload.count }));
}

function normalizeReferenceEntry(entry) {
  if (!entry || typeof entry !== "object" || !entry.summary || typeof entry.summary !== "object") return null;
  const numericKeys = [
    "duration",
    "rpmMin",
    "rpmMax",
    "boostAvgAbs",
    "boostPeak",
    "targetPeak",
    "timingMax",
    "railMin",
    "lpfpMin",
    "lambdaAvg",
    "wgdcAvg",
    "iatRise",
    "iatMax",
    "throttleClosurePct",
  ];
  const summary = {};
  numericKeys.forEach((key) => {
    const value = Number(entry.summary[key]);
    summary[key] = Number.isFinite(value) ? value : null;
  });
  return {
    id: String(entry.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    savedAt: entry.savedAt || new Date().toISOString(),
    filename: String(entry.filename || t("importedReference")),
    pullLabel: String(entry.pullLabel || t("referencePull")),
    engine: String(entry.engine || t("unknownValue")),
    stage: String(entry.stage || ""),
    fuel: String(entry.fuel || ""),
    profile: String(entry.profile || entry.engine || t("profileOpen")),
    referenceScore: entry.referenceScore === null || entry.referenceScore === undefined ? null : finiteOrNull(Number(entry.referenceScore)),
    summary,
  };
}

function mergeReferenceEntries(entries) {
  const before = state.referenceLibrary.length;
  const byKey = new Map();
  [...state.referenceLibrary, ...entries].forEach((entry) => {
    const key = entry.id || `${entry.engine}|${entry.filename}|${entry.pullLabel}|${entry.savedAt}`;
    byKey.set(key, entry);
  });
  state.referenceLibrary = [...byKey.values()]
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .slice(0, 80);
  saveReferenceLibrary();
  renderReferenceTools();
  return state.referenceLibrary.length - before;
}

async function importReferenceLibraryFile(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const rawEntries = Array.isArray(payload) ? payload : payload.references;
    if (!Array.isArray(rawEntries)) throw new Error("Reference list not found.");
    const entries = rawEntries.map(normalizeReferenceEntry).filter(Boolean);
    if (!entries.length) throw new Error("No valid references found.");
    const added = mergeReferenceEntries(entries);
    setReferenceImportStatus(t("referenceImportRead", { count: entries.length, added }));
    render();
  } catch {
    setReferenceImportStatus(t("referenceImportFailed"));
  }
}

function setReferenceImportStatus(text) {
  if (elements.referenceImportStatus) elements.referenceImportStatus.textContent = text;
}

function renderReferenceTools() {
  if (!elements.referenceToolsCount) return;
  const count = state.referenceLibrary.length;
  elements.referenceToolsCount.textContent = t("referenceCount", { count });
}

function presetKeyForEngine(engine) {
  if (/S63|S58/i.test(engine)) return "b58_gen2";
  if (/S55/i.test(engine)) return "n55";
  if (/B58 Gen2/i.test(engine)) return "b58_gen2";
  if (/B58 Gen1/i.test(engine)) return "b58_gen1";
  if (/B58/i.test(engine)) return "b58_gen1";
  if (/N55/i.test(engine)) return "n55";
  if (/N54/i.test(engine)) return "n54";
  return null;
}

function inferPresetKeyFromDocuments(documents) {
  const keys = documents
    .map((document) => {
      try {
        const result = LogAnalyzer.analyzeText(document.filename, document.text, LogAnalyzer.DEFAULT_RULES);
        return presetKeyForEngine(result.vehicleInfo?.engine || "");
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const unique = [...new Set(keys)];
  return unique.length === 1 ? unique[0] : null;
}

function formatRuleInputValue(value) {
  if (!Number.isFinite(value)) return "";
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

function setPresetHint(text) {
  if (elements.presetHint) elements.presetHint.textContent = text;
}

function applyRulePreset(selectedKey, options = {}) {
  const { documents = state.documents, reanalyze = false } = options;
  const key = selectedKey || "auto";

  if (elements.rulePreset) elements.rulePreset.value = key;
  writeStorage(STORAGE_KEYS.preset, key);

  if (key === "custom") {
    setPresetHint(presetText("custom", "detail", "Custom: current thresholds stay active."));
    return;
  }

  const inferredKey = key === "auto" ? inferPresetKeyFromDocuments(documents) || "n54" : key;
  const preset = LogAnalyzer.RULE_PRESETS[inferredKey] || LogAnalyzer.RULE_PRESETS.n54;
  const rules = LogAnalyzer.rulesForPreset(inferredKey);

  applyingPreset = true;
  Object.entries(RULE_FIELD_MAP).forEach(([id, config]) => {
    const input = document.getElementById(id);
    if (!input) return;
    const rawValue = rules[config.key];
    const value = config.toInput ? config.toInput(rawValue) : rawValue;
    input.value = formatRuleInputValue(value);
  });
  applyingPreset = false;

  const label = presetText(inferredKey, "label", preset.label);
  const detail = presetText(inferredKey, "detail", preset.detail);
  const prefix = key === "auto" ? `${tOr("auto", "Auto")}: ${label}` : label;
  setPresetHint(`${prefix} - ${detail}`);

  if (reanalyze && state.results.length) reanalyzeLoaded();
}

function setTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = nextTheme;
  if (elements.themeToggle) {
    elements.themeToggle.checked = nextTheme === "dark";
  }
  if (elements.themeModeText) {
    elements.themeModeText.textContent = nextTheme === "dark" ? t("dark") : t("light");
  }
  writeStorage(STORAGE_KEYS.theme, nextTheme);
}

function setView(view) {
  const allowed = ["dashboard", "current", "history", "settings"];
  const nextView = allowed.includes(view) ? view : "dashboard";
  document.body.dataset.view = nextView;
  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === nextView);
  });
  writeStorage(STORAGE_KEYS.view, nextView);
}

function currentView() {
  return document.body.dataset.view || "dashboard";
}

function currentRules() {
  const numberFrom = (id, fallback) => {
    const input = document.getElementById(id);
    const value = input ? Number(input.value) : NaN;
    return Number.isFinite(value) ? value : fallback;
  };

  return {
    pullMinDurationWarn: numberFrom("rulePullDurationWarn", LogAnalyzer.DEFAULT_RULES.pullMinDurationWarn),
    pedalAvgWarn: numberFrom("rulePedalWarn", LogAnalyzer.DEFAULT_RULES.pedalAvgWarn),
    boostEvaluationMinRpm: numberFrom("ruleBoostEvalMinRpm", LogAnalyzer.DEFAULT_RULES.boostEvaluationMinRpm),
    boostWarnAvgAbs: numberFrom("ruleBoostWarn", LogAnalyzer.DEFAULT_RULES.boostWarnAvgAbs),
    boostSevereAvgAbs: numberFrom("ruleBoostSevere", LogAnalyzer.DEFAULT_RULES.boostSevereAvgAbs),
    boostUnderWarn: -numberFrom("ruleBoostUnderWarn", Math.abs(LogAnalyzer.DEFAULT_RULES.boostUnderWarn)),
    boostUnderSevere: -numberFrom("ruleBoostUnderSevere", Math.abs(LogAnalyzer.DEFAULT_RULES.boostUnderSevere)),
    boostOverWarn: numberFrom("ruleBoostOverWarn", LogAnalyzer.DEFAULT_RULES.boostOverWarn),
    boostOverSevere: numberFrom("ruleBoostOverSevere", LogAnalyzer.DEFAULT_RULES.boostOverSevere),
    timingWarn: numberFrom("ruleTimingWarn", LogAnalyzer.DEFAULT_RULES.timingWarn),
    timingSevere: numberFrom("ruleTimingSevere", LogAnalyzer.DEFAULT_RULES.timingSevere),
    lpfpWarn: numberFrom("ruleLpfpWarn", LogAnalyzer.DEFAULT_RULES.lpfpWarn),
    lpfpSevere: numberFrom("ruleLpfpSevere", LogAnalyzer.DEFAULT_RULES.lpfpSevere),
    lpfpSustainedWarn: numberFrom("ruleLpfpSustainedWarn", LogAnalyzer.DEFAULT_RULES.lpfpSustainedWarn),
    lpfpSustainedPctWarn: numberFrom("ruleLpfpSustainedPctWarn", LogAnalyzer.DEFAULT_RULES.lpfpSustainedPctWarn * 100) / 100,
    railWarn: numberFrom("ruleRailWarn", LogAnalyzer.DEFAULT_RULES.railWarn),
    railSevere: numberFrom("ruleRailSevere", LogAnalyzer.DEFAULT_RULES.railSevere),
    lambdaBankDiffWarn: numberFrom("ruleLambdaDiffWarn", LogAnalyzer.DEFAULT_RULES.lambdaBankDiffWarn),
    afrLeanWarn: numberFrom("ruleAfrLeanWarn", LogAnalyzer.DEFAULT_RULES.afrLeanWarn),
    stftPeggedWarn: numberFrom("ruleStftPeggedWarn", LogAnalyzer.DEFAULT_RULES.stftPeggedWarn),
    fuelTrimBankDiffWarn: numberFrom("ruleFuelTrimBankDiffWarn", LogAnalyzer.DEFAULT_RULES.fuelTrimBankDiffWarn),
    ltftWarn: numberFrom("ruleLtftWarn", LogAnalyzer.DEFAULT_RULES.ltftWarn),
    wgdcWarnAvg: numberFrom("ruleWgdcWarnAvg", LogAnalyzer.DEFAULT_RULES.wgdcWarnAvg),
    wgdcSevereAvg: numberFrom("ruleWgdcSevereAvg", LogAnalyzer.DEFAULT_RULES.wgdcSevereAvg),
    wgdcSevereMax: numberFrom("ruleWgdcSevereMax", LogAnalyzer.DEFAULT_RULES.wgdcSevereMax),
    iatWarnMaxC: numberFrom("ruleIatWarnMax", LogAnalyzer.DEFAULT_RULES.iatWarnMaxC),
    iatSevereMaxC: numberFrom("ruleIatSevereMax", LogAnalyzer.DEFAULT_RULES.iatSevereMaxC),
    iatWarnRiseC: numberFrom("ruleIatWarnRise", LogAnalyzer.DEFAULT_RULES.iatWarnRiseC),
    iatSevereRiseC: numberFrom("ruleIatSevereRise", LogAnalyzer.DEFAULT_RULES.iatSevereRiseC),
    throttleClosurePctWarn: numberFrom("ruleThrottleClosureWarn", LogAnalyzer.DEFAULT_RULES.throttleClosurePctWarn * 100) / 100,
    throttleClosurePctSevere: numberFrom("ruleThrottleClosureSevere", LogAnalyzer.DEFAULT_RULES.throttleClosurePctSevere * 100) / 100,
    afrSpikeWarn: numberFrom("ruleAfrSpikeWarn", LogAnalyzer.DEFAULT_RULES.afrSpikeWarn),
    afrSpikeSevere: numberFrom("ruleAfrSpikeSevere", LogAnalyzer.DEFAULT_RULES.afrSpikeSevere),
    afrDropoutWarn: numberFrom("ruleAfrDropoutWarn", LogAnalyzer.DEFAULT_RULES.afrDropoutWarn),
    mhdAfrPlaceholderWarnCount: numberFrom("ruleMhdPlaceholderCount", LogAnalyzer.DEFAULT_RULES.mhdAfrPlaceholderWarnCount),
    throttleMismatchDeltaWarn: numberFrom("ruleThrottleMismatchDelta", LogAnalyzer.DEFAULT_RULES.throttleMismatchDeltaWarn),
    throttleMismatchPullCountWarn: numberFrom("ruleThrottleMismatchPullCount", LogAnalyzer.DEFAULT_RULES.throttleMismatchPullCountWarn),
    hesitationRpmMin: numberFrom("ruleHesitationRpmMin", LogAnalyzer.DEFAULT_RULES.hesitationRpmMin),
    hesitationRpmMax: numberFrom("ruleHesitationRpmMax", LogAnalyzer.DEFAULT_RULES.hesitationRpmMax),
    hesitationPullCountWarn: numberFrom("ruleHesitationPullCount", LogAnalyzer.DEFAULT_RULES.hesitationPullCountWarn),
    anomalySteadyThrottleMin: numberFrom("ruleAnomalySteadyThrottleMin", LogAnalyzer.DEFAULT_RULES.anomalySteadyThrottleMin),
    idleRpmMax: numberFrom("ruleIdleRpmMax", LogAnalyzer.DEFAULT_RULES.idleRpmMax),
    idleAfrSwingWarn: numberFrom("ruleIdleAfrSwingWarn", LogAnalyzer.DEFAULT_RULES.idleAfrSwingWarn),
    staticValueWarnRows: numberFrom("ruleStaticValueWarnRows", LogAnalyzer.DEFAULT_RULES.staticValueWarnRows),
    n54RecommendedGear: numberFrom("ruleN54RecommendedGear", LogAnalyzer.DEFAULT_RULES.n54RecommendedGear),
    n54RecommendedMinRpm: numberFrom("ruleN54RecommendedMinRpm", LogAnalyzer.DEFAULT_RULES.n54RecommendedMinRpm),
    n54RecommendedEndRpm: numberFrom("ruleN54RecommendedEndRpm", LogAnalyzer.DEFAULT_RULES.n54RecommendedEndRpm),
    missingChannelsWarnCount: numberFrom("ruleMissingChannelsWarn", LogAnalyzer.DEFAULT_RULES.missingChannelsWarnCount),
    __profile: activeProfile(),
    __language: state.language,
  };
}

function format(value, digits = 1, suffix = "") {
  return Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : "n/a";
}

function formatRange(range, digits = 0, suffix = "") {
  if (!range) return "n/a";
  return `${format(range[0], digits)}-${format(range[1], digits)}${suffix ? ` ${suffix}` : ""}`;
}

function formatStats(stats, digits = 1, suffix = "") {
  if (!stats) return "n/a";
  return `${format(stats.min, digits)} / ${format(stats.avg, digits)} / ${format(stats.max, digits)}${suffix}`;
}

function statusClass(status) {
  if (status === "neutral") return "neutral";
  return status === "red" ? "red" : status === "yellow" ? "yellow" : "green";
}

function statusRank(status) {
  if (status === "red") return 2;
  if (status === "yellow") return 1;
  return 0;
}

function defaultPullIndex(pulls) {
  if (!pulls.length) return 0;
  return [...pulls]
    .sort((a, b) => statusRank(b.status) - statusRank(a.status) || b.score - a.score)[0].index;
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function referenceSnapshot(parentResult, detailResult, selectedPull) {
  const metrics = detailResult.metrics || {};
  const vehicleInfo = parentResult.vehicleInfo || {};
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    savedAt: new Date().toISOString(),
    filename: parentResult.filename,
    pullLabel: selectedPull?.label || t("mainPull"),
    engine: vehicleInfo.engine || t("unknownValue"),
    stage: vehicleInfo.stage || "",
    fuel: vehicleInfo.fuel || "",
    profile: metrics.reference?.profile || vehicleInfo.engine || t("profileOpen"),
    referenceScore: finiteOrNull(metrics.reference?.score),
    summary: {
      gear: metrics.pull?.gear || "n/a",
      duration: finiteOrNull(metrics.selectedSegment?.duration),
      rpmMin: finiteOrNull(metrics.pull?.rpmRange?.[0]),
      rpmMax: finiteOrNull(metrics.pull?.rpmRange?.[1]),
      boostAvgAbs: finiteOrNull(metrics.boost?.error?.avgAbs),
      boostPeak: finiteOrNull(metrics.boost?.actual?.max),
      targetPeak: finiteOrNull(metrics.boost?.target?.max),
      timingMax: finiteOrNull(metrics.timing?.corrections?.max),
      railMin: finiteOrNull(metrics.fuel?.rail?.min),
      lpfpMin: finiteOrNull(metrics.fuel?.lpfp?.min),
      lambdaAvg: finiteOrNull(metrics.fuel?.lambda1?.avg),
      wgdcAvg: finiteOrNull(metrics.turbo?.wgdc?.avg),
      iatRise: finiteOrNull(metrics.temps?.iat?.rise),
      iatMax: finiteOrNull(metrics.temps?.iat?.max),
      throttleClosurePct: finiteOrNull(metrics.control?.throttleClosurePct),
    },
  };
}

function addReference(parentResult, detailResult, selectedPull) {
  const entry = referenceSnapshot(parentResult, detailResult, selectedPull);
  state.referenceLibrary = [entry, ...state.referenceLibrary].slice(0, 40);
  saveReferenceLibrary();
  renderReferenceTools();
  setReferenceImportStatus(t("referenceSaved"));
}

function deleteReference(referenceId) {
  state.referenceLibrary = state.referenceLibrary.filter((entry) => entry.id !== referenceId);
  saveReferenceLibrary();
  renderReferenceTools();
  setReferenceImportStatus(t("referenceDeleted"));
}

function matchingReferences(parentResult) {
  const vehicleInfo = parentResult.vehicleInfo || {};
  const engine = vehicleInfo.engine || t("unknownValue");
  const sameEngine = state.referenceLibrary.filter((entry) => entry.engine === engine);
  const exact = sameEngine.filter(
    (entry) =>
      (!vehicleInfo.stage || !entry.stage || entry.stage === vehicleInfo.stage) &&
      (!vehicleInfo.fuel || !entry.fuel || entry.fuel === vehicleInfo.fuel)
  );
  return exact.length ? exact : sameEngine;
}

function averageReferenceSummary(references) {
  const keys = [
    "duration",
    "rpmMin",
    "rpmMax",
    "boostAvgAbs",
    "boostPeak",
    "targetPeak",
    "timingMax",
    "railMin",
    "lpfpMin",
    "lambdaAvg",
    "wgdcAvg",
    "iatRise",
    "iatMax",
    "throttleClosurePct",
  ];
  const summary = {};
  keys.forEach((key) => {
    const values = references.map((entry) => entry.summary?.[key]).filter((value) => Number.isFinite(value));
    summary[key] = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  });
  const scores = references.map((entry) => entry.referenceScore).filter((value) => Number.isFinite(value));
  summary.referenceScore = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
  return summary;
}

function compareValue(label, current, reference, unit, mode, warn, severe) {
  if (!Number.isFinite(current) || !Number.isFinite(reference)) {
    return { label, status: "neutral", value: "n/a", detail: "Keine passende Vergleichszahl gespeichert." };
  }
  const delta = current - reference;
  const badDelta = mode === "higher" ? -delta : mode === "near" ? Math.abs(delta) : delta;
  const status = badDelta >= severe ? "red" : badDelta >= warn ? "yellow" : "green";
  const sign = delta > 0 ? "+" : "";
  return {
    label,
    status,
    value: `${format(current, unit === "%" ? 0 : 2, unit)} vs ${format(reference, unit === "%" ? 0 : 2, unit)}`,
    detail: `${sign}${format(delta, unit === "%" ? 0 : 2, unit)} zur Referenz`,
  };
}

function buildLibraryComparison(parentResult, detailResult) {
  const references = matchingReferences(parentResult);
  const metrics = detailResult.metrics || {};
  const current = {
    referenceScore: finiteOrNull(metrics.reference?.score),
    boostAvgAbs: finiteOrNull(metrics.boost?.error?.avgAbs),
    timingMax: finiteOrNull(metrics.timing?.corrections?.max),
    railMin: finiteOrNull(metrics.fuel?.rail?.min),
    lpfpMin: finiteOrNull(metrics.fuel?.lpfp?.min),
    lambdaAvg: finiteOrNull(metrics.fuel?.lambda1?.avg),
    wgdcAvg: finiteOrNull(metrics.turbo?.wgdc?.avg),
    iatRise: finiteOrNull(metrics.temps?.iat?.rise),
    throttleClosurePct: finiteOrNull(metrics.control?.throttleClosurePct),
  };

  if (!references.length) {
    return {
      status: "neutral",
      title: "Noch keine passende Referenz gespeichert",
      detail: "Speichere einen bekannten guten Pull dieser Plattform.",
      references: [],
      cards: [],
    };
  }

  const reference = averageReferenceSummary(references);
  const cards = [
    compareValue("Referenzscore", current.referenceScore, reference.referenceScore, "", "higher", 8, 18),
    compareValue("Boost Fehler", current.boostAvgAbs, reference.boostAvgAbs, " psi", "lower", 0.5, 1.5),
    compareValue("Timing", current.timingMax, reference.timingMax, " Grad", "lower", 1, 3),
    compareValue("Rail", current.railMin, reference.railMin, " psi", "higher", 100, 300),
    compareValue("LPFP", current.lpfpMin, reference.lpfpMin, " psi", "higher", 3, 8),
    compareValue("Lambda", current.lambdaAvg, reference.lambdaAvg, " AFR", "near", 0.35, 0.8),
    compareValue("WGDC", current.wgdcAvg, reference.wgdcAvg, "%", "lower", 5, 12),
    compareValue("IAT Anstieg", current.iatRise, reference.iatRise, " C", "lower", 5, 15),
    compareValue(
      "DME Closure",
      Number.isFinite(current.throttleClosurePct) ? current.throttleClosurePct * 100 : null,
      Number.isFinite(reference.throttleClosurePct) ? reference.throttleClosurePct * 100 : null,
      "%",
      "lower",
      5,
      15
    ),
  ];
  const activeCards = cards.filter((card) => card.status !== "neutral");
  const status = activeCards.some((card) => card.status === "red")
    ? "red"
    : activeCards.some((card) => card.status === "yellow")
      ? "yellow"
      : "green";
  const weak = cards.filter((card) => card.status === "red" || card.status === "yellow");
  return {
    status,
    title:
      status === "green"
        ? "Besser/nah an gespeicherter Referenz"
        : status === "yellow"
          ? "Abweichung zur Referenz sichtbar"
          : "Deutlich schlechter als Referenz",
    detail: weak.length
      ? weak.slice(0, 3).map((card) => card.label).join(", ")
      : `${references.length} gespeicherte Referenz(en) passen zur Plattform.`,
    references,
    cards,
  };
}

function shortName(filename) {
  return filename.length > 58 ? `${filename.slice(0, 32)}...${filename.slice(-20)}` : filename;
}

function setUploadStatus(text, tone = "neutral") {
  const statusText = safeText(text, t("uploadHint"));
  [elements.uploadStatus, elements.mobileUploadStatus].forEach((element) => {
    if (!element) return;
    element.textContent = statusText;
    element.dataset.tone = tone;
  });
}

async function handleFiles(fileList) {
  const files = [...fileList].filter((file) => /\.csv$/i.test(file.name));
  if (!files.length) {
    setUploadStatus(t("csvNotFound"), "warn");
    return;
  }

  elements.dropZone?.classList.add("processing");
  setUploadStatus(t("csvAnalyzing", { count: files.length, suffix: files.length === 1 ? "" : "s" }), "active");

  try {
    const loadedDocuments = await Promise.all(
      files.map(async (file) => {
        const text = await file.text();
        return { filename: file.name, text };
      })
    );

    state.documents.push(...loadedDocuments);
    if (elements.rulePreset?.value === "auto") {
      applyRulePreset("auto", { documents: state.documents, reanalyze: false });
    }
    const rules = currentRules();
    state.results = state.documents.map((document) =>
      LogAnalyzer.analyzeText(document.filename, document.text, rules)
    );
    state.selectedIndex = state.results.length - loadedDocuments.length;
    setUploadStatus(
      t("csvLoaded", {
        count: loadedDocuments.length,
        suffix: loadedDocuments.length === 1 ? "" : "s",
        filename: shortName(loadedDocuments[loadedDocuments.length - 1].filename),
      }),
      "ok"
    );
    render();
  } catch (error) {
    console.error(error);
    setUploadStatus(t("csvReadingError"), "warn");
  } finally {
    elements.dropZone?.classList.remove("processing");
  }
}

function updateMobileClearAction() {
  if (elements.mobileClearButton) {
    elements.mobileClearButton.hidden = !state.documents.length;
  }
}

function reanalyzeLoaded() {
  const rules = currentRules();
  state.results = state.documents.map((document) =>
    LogAnalyzer.analyzeText(document.filename, document.text, rules)
  );
  if (state.selectedIndex !== null && state.selectedIndex >= state.results.length) {
    state.selectedIndex = state.results.length ? state.results.length - 1 : null;
  }
  Object.keys(state.pullSelection).forEach((key) => {
    const result = state.results[Number(key)];
    const count = result?.metrics?.pullAnalyses?.length || 0;
    if (!count || state.pullSelection[key] >= count) state.pullSelection[key] = 0;
  });
  render();
}

function render() {
  updateMobileClearAction();
  renderReferenceTools();
  renderVehicleProfiles();
  renderSummary();
  renderTable();
  renderDetail();
  renderComparison();
  renderTrendAnalysis();
}

function renderSummary() {
  const total = state.results.length;
  const green = state.results.filter((result) => result.status === "green").length;
  const yellow = state.results.filter((result) => result.status === "yellow").length;
  const red = state.results.filter((result) => result.status === "red").length;
  const last = state.results[state.results.length - 1];

  elements.metricTotal.textContent = total;
  elements.metricGreen.textContent = green;
  elements.metricYellow.textContent = yellow;
  elements.metricRed.textContent = red;
  elements.metricLast.textContent = last ? `${statusLabel(last.status)}: ${last.headline}` : t("noCsvLoaded");
  elements.listCount.textContent = t("loadedCount", { count: total });
}

function renderTable() {
  if (!state.results.length) {
    elements.logTable.innerHTML = `<tr class="empty-row"><td colspan="4">${escapeHtml(t("noLogsLoaded"))}</td></tr>`;
    return;
  }

  elements.logTable.innerHTML = state.results
    .map((result, index) => {
      const metrics = result.metrics;
      const pull = metrics.pull
        ? `${metrics.pull.gear}. ${t("gear")} | ${formatRange(metrics.pull.rpmRange, 0, "rpm")}`
        : "n/a";
      const duration = metrics.selectedSegment?.duration;
      const durationText = Number.isFinite(duration) ? `${duration.toFixed(1)} s` : "n/a";
      return `
        <tr data-index="${index}" class="${index === state.selectedIndex ? "selected" : ""}">
          <td data-label="${escapeAttr(t("status"))}"><span class="status-pill ${statusClass(result.status)}">${escapeHtml(statusLabel(result.status))}</span></td>
          <td data-label="${escapeAttr(t("file"))}">
            <div class="filename" title="${escapeAttr(result.filename)}">${escapeHtml(shortName(result.filename))}</div>
            <div class="subtext">${result.vehicleInfo?.engine ?? t("platformOpen")} | ${result.metrics.pullCount || 1} Pull(s) | ${result.metrics.rows ?? 0} ${t("rows")} | ${result.metrics.columns ?? 0} ${t("channels")}</div>
          </td>
          <td data-label="${escapeAttr(t("pull"))}">
            <div>${pull}</div>
            <div class="subtext">${durationText}</div>
          </td>
          <td data-label="${escapeAttr(t("mainFinding"))}">${escapeHtml(result.headline)}</td>
        </tr>
      `;
    })
    .join("");

  elements.logTable.querySelectorAll("tr[data-index]").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedIndex = Number(row.dataset.index);
      if (currentView() === "history") {
        setView("current");
      }
      render();
    });
  });
}

function renderComparison() {
  if (!elements.compareView || !elements.compareSummary) return;

  if (!state.results.length) {
    elements.compareSummary.textContent = t("waitingCsvs");
    elements.compareView.innerHTML = `<p class="muted">${escapeHtml(t("compareEmpty"))}</p>`;
    return;
  }

  const rules = currentRules();
  const rows = state.results
    .map((result, index) => buildCompareRow(result, index, rules))
    .sort((a, b) => b.score - a.score);
  const assessment = buildFleetAssessment(rows);
  elements.compareSummary.textContent = assessment.short;

  elements.compareView.innerHTML = `
    <div class="fleet-verdict ${assessment.severity}">
      <strong>${escapeHtml(assessment.title)}</strong>
      <span>${escapeHtml(assessment.detail)}</span>
    </div>
    <div class="compare-actions">
      <button class="compare-export" type="button" data-comparison-export>${escapeHtml(t("comparisonExport"))}</button>
      <span>${escapeHtml(t("logsInComparison", { count: rows.length, suffix: rows.length === 1 ? "" : "s" }))}</span>
    </div>
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th>Log</th>
            <th>Fuel Score</th>
            <th>LPFP</th>
            <th>Rail</th>
            <th>DME Eingriff</th>
            <th>Boost</th>
            <th>Trims</th>
            <th>Fazit</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => renderCompareRow(row)).join("")}
        </tbody>
      </table>
    </div>
  `;

  elements.compareView.querySelectorAll("tr[data-index]").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedIndex = Number(row.dataset.index);
      render();
    });
  });

  const exportButton = elements.compareView.querySelector("[data-comparison-export]");
  if (exportButton) {
    exportButton.addEventListener("click", exportComparisonCsv);
  }
}

function buildCompareRow(result, index, rules) {
  const metrics = result.metrics || {};
  const lpfpMin = metrics.fuel?.lpfp?.min;
  const lpfpBelow50Pct = metrics.fuel?.lpfpBelow50Pct;
  const railMin = metrics.fuel?.rail?.min;
  const throttleClosurePct = metrics.control?.throttleClosurePct;
  const throttleMismatchRed = metrics.anomalies?.counts?.throttleMismatchRed ?? 0;
  const boostMax = metrics.boost?.actual?.max;
  const boostAvgAbs = metrics.boost?.error?.avgAbs;
  const stftDiff = metrics.fuel?.stftBankDiff?.max;
  const ltftDiff = metrics.fuel?.ltftBankDiff?.max;
  const ltftMaxAbs = metrics.fuel?.ltft
    ? Math.max(Math.abs(metrics.fuel.ltft.min), Math.abs(metrics.fuel.ltft.max))
    : NaN;
  const fuelIssues = result.issues.filter((issue) => issue.category === "Fuel");
  const lpfpIssue = fuelIssues.find((issue) => /LPFP/i.test(issue.text));
  const railIssue = fuelIssues.find((issue) => /Raildruck/i.test(issue.text));
  const score = fuelRiskScore({
    result,
    lpfpMin,
    lpfpBelow50Pct,
    railMin,
    throttleClosurePct,
    throttleMismatchRed,
    boostAvgAbs,
    stftDiff,
    ltftDiff,
    ltftMaxAbs,
    rules,
  });

  return {
    index,
    result,
    score,
    severity: score >= 70 ? "red" : score >= 35 ? "yellow" : "green",
    filename: result.filename,
    map: result.vehicleInfo?.map || result.vehicleInfo?.descriptor || result.vehicleInfo?.engine || "n/a",
    lpfpMin,
    lpfpBelow50Pct,
    railMin,
    throttleClosurePct,
    throttleMismatchRed,
    boostMax,
    boostAvgAbs,
    stftDiff,
    ltftDiff,
    ltftMaxAbs,
    lpfpIssue,
    railIssue,
    conclusion: compareConclusion({ lpfpIssue, railIssue, throttleClosurePct, throttleMismatchRed, stftDiff, ltftDiff, score }),
  };
}

function fuelRiskScore(input) {
  let score = input.result.status === "red" ? 10 : input.result.status === "yellow" ? 4 : 0;

  if (Number.isFinite(input.lpfpMin)) {
    if (input.lpfpMin <= input.rules.lpfpSevere) score += 38;
    else if (input.lpfpMin < input.rules.lpfpSustainedWarn) score += 24;
    else if (input.lpfpMin <= input.rules.lpfpWarn) score += 12;
  }

  if (
    Number.isFinite(input.lpfpMin) &&
    input.lpfpMin <= input.rules.lpfpWarn &&
    (input.throttleClosurePct >= input.rules.throttleClosurePctWarn || input.throttleMismatchRed >= 3)
  ) {
    score += 12;
  }

  if (Number.isFinite(input.lpfpBelow50Pct)) {
    score += Math.min(32, input.lpfpBelow50Pct * 42);
  }

  if (Number.isFinite(input.railMin)) {
    if (input.railMin <= input.rules.railSevere) score += 26;
    else if (input.railMin <= input.rules.railWarn) score += 16;
  }

  if (Number.isFinite(input.throttleClosurePct)) {
    if (input.throttleClosurePct >= input.rules.throttleClosurePctSevere) score += 16;
    else if (input.throttleClosurePct >= input.rules.throttleClosurePctWarn) score += 9;
  }

  score += Math.min(12, input.throttleMismatchRed / 8);

  if (Number.isFinite(input.boostAvgAbs) && input.boostAvgAbs >= input.rules.boostWarnAvgAbs) score += 5;
  if (Number.isFinite(input.stftDiff) && input.stftDiff >= input.rules.fuelTrimBankDiffWarn) score += 6;
  if (Number.isFinite(input.ltftDiff) && input.ltftDiff >= input.rules.fuelTrimBankDiffWarn) score += 6;
  if (Number.isFinite(input.ltftMaxAbs) && input.ltftMaxAbs > input.rules.ltftWarn) score += 6;

  return Math.min(100, Math.round(score));
}

function compareConclusion(input) {
  if (input.lpfpIssue && input.railIssue) return "LPFP zieht Rail mit runter";
  if (input.lpfpIssue && (input.throttleClosurePct >= 0.12 || input.throttleMismatchRed >= 3)) return "LPFP + DME-Eingriff";
  if (input.lpfpIssue) return "LPFP Reserve knapp";
  if (input.railIssue) return "Rail/HPFP prüfen";
  if (Number.isFinite(input.stftDiff) && input.stftDiff >= 10) return "Bank-Trims auffällig";
  if (Number.isFinite(input.ltftDiff) && input.ltftDiff >= 10) return "Langzeittrims differieren";
  if (input.score >= 35) return "Regelung auffällig";
  return "kein gemeinsamer Fuel-Hinweis";
}

function buildFleetAssessment(rows) {
  if (!rows.length) {
    return { severity: "green", short: "Keine Logs", title: "Noch keine Vergleichsdaten", detail: "Lade mehrere CSVs für ein Gesamtbild." };
  }

  const fuelRows = rows.filter((row) => /LPFP|Rail|Fuel/i.test(row.conclusion));
  const lpfpRows = rows.filter((row) => row.lpfpIssue);
  const dmeRows = rows.filter((row) => row.throttleClosurePct >= 0.12 || row.throttleMismatchRed >= 3);
  const worst = rows[0];
  const platformSet = new Set(rows.map((row) => row.result.vehicleInfo?.engine).filter(Boolean));
  const platform = platformSet.size === 1 ? [...platformSet][0] : "mehrere Plattformen";

  if (lpfpRows.length >= Math.max(2, Math.ceil(rows.length * 0.5))) {
    return {
      severity: "red",
      short: `${lpfpRows.length}/${rows.length} LPFP-Fuel`,
      title: "Gesamtfazit: LPFP/Fuel-Supply sehr wahrscheinlich",
      detail: `${platform}: ${lpfpRows.length} von ${rows.length} Logs zeigen LPFP-Fuel-Hinweise, ${dmeRows.length} mit DME-Eingriff. Kritischster Log: ${shortName(worst.filename)}.`,
    };
  }

  if (fuelRows.length) {
    return {
      severity: "yellow",
      short: `${fuelRows.length}/${rows.length} Fuel-Hinweise`,
      title: "Gesamtfazit: Fueling im Blick behalten",
      detail: `${fuelRows.length} Log(s) zeigen Fueling-Indizien. Kritischster Log: ${shortName(worst.filename)}.`,
    };
  }

  return {
    severity: rows.some((row) => row.severity === "red") ? "yellow" : "green",
    short: `${rows.length} verglichen`,
    title: "Gesamtfazit: kein gemeinsamer Fueling-Pfad",
    detail: `Die geladenen Logs zeigen keinen wiederkehrenden LPFP/Rail-Pfad. Kritischster Log nach Score: ${shortName(worst.filename)}.`,
  };
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function csvNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "";
}

function csvPercent(value, digits = 1) {
  return Number.isFinite(value) ? (value * 100).toFixed(digits) : "";
}

function exportComparisonCsv() {
  if (!state.results.length) return;
  const rules = currentRules();
  const profile = activeProfile();
  const headers = [
    "Profil",
    "Datei",
    "Status",
    "Engine",
    "Stage",
    "Fuel",
    "Map",
    "Pulls",
    "Gang",
    "RPM von",
    "RPM bis",
    "Dauer s",
    "Referenzscore",
    "Fuel Score",
    "LPFP min psi",
    "LPFP unter 50 %",
    "Rail min psi",
    "Boost peak psi",
    "Boost Fehler avg psi",
    "Timing max Grad",
    "WGDC avg %",
    "WGDC max %",
    "IAT Anstieg C",
    "IAT max C",
    "Throttle Closure %",
    "STFT Bankdiff %",
    "LTFT Bankdiff %",
    "Fehlende Kanäle",
    "Rote Befunde",
    "Gelbe Befunde",
    "Fazit",
    "Tuninghinweis",
  ];
  const rows = state.results
    .map((result, index) => buildCompareRow(result, index, rules))
    .sort((a, b) => b.score - a.score)
    .map((row) => {
      const result = row.result;
      const metrics = result.metrics || {};
      const rpmRange = metrics.pull?.rpmRange || [];
      const issueCount = (severity) => (result.issues || []).filter((issue) => issue.severity === severity).length;
      return [
        profileLabel(profile),
        result.filename,
        result.statusLabel,
        result.vehicleInfo?.engine || "",
        result.vehicleInfo?.stage || "",
        result.vehicleInfo?.fuel || "",
        result.vehicleInfo?.map || result.vehicleInfo?.descriptor || "",
        metrics.pullCount || 1,
        metrics.pull?.gear || "",
        csvNumber(rpmRange[0], 0),
        csvNumber(rpmRange[1], 0),
        csvNumber(metrics.selectedSegment?.duration, 2),
        csvNumber(metrics.reference?.score, 0),
        row.score,
        csvNumber(row.lpfpMin, 2),
        csvPercent(row.lpfpBelow50Pct, 1),
        csvNumber(row.railMin, 2),
        csvNumber(row.boostMax, 2),
        csvNumber(row.boostAvgAbs, 2),
        csvNumber(metrics.timing?.corrections?.max, 2),
        csvNumber(metrics.turbo?.wgdc?.avg, 2),
        csvNumber(metrics.turbo?.wgdc?.max, 2),
        csvNumber(metrics.temps?.iat?.rise, 2),
        csvNumber(metrics.temps?.iat?.max, 2),
        csvPercent(row.throttleClosurePct, 1),
        csvNumber(row.stftDiff, 2),
        csvNumber(row.ltftDiff, 2),
        (result.missingChannels || []).join(", "),
        issueCount("red"),
        issueCount("yellow"),
        row.conclusion,
        result.tuning || "",
      ];
    });
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `boostdoc-vergleich-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function dateFromFilename(filename) {
  const match = String(filename || "").match(/(\d{4})[-_](\d{2})[-_](\d{2})[\s_-]+(\d{2})[_:.-](\d{2})(?:[_:.-](\d{2}))?/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = "0"] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  return Number.isNaN(date.getTime()) ? null : date;
}

function trendDateLabel(date, fallbackIndex) {
  if (!date) return `Log ${fallbackIndex + 1}`;
  return date.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function buildTrendRow(result, index, rules) {
  const compare = buildCompareRow(result, index, rules);
  const metrics = result.metrics || {};
  const date = dateFromFilename(result.filename);
  return {
    index,
    result,
    date,
    order: date ? date.getTime() : index,
    label: trendDateLabel(date, index),
    referenceScore: metrics.reference?.score,
    fuelScore: compare.score,
    lpfpMin: compare.lpfpMin,
    railMin: compare.railMin,
    boostError: compare.boostAvgAbs,
    timingMax: metrics.timing?.corrections?.max,
    wgdcAvg: metrics.turbo?.wgdc?.avg,
    iatRise: metrics.temps?.iat?.rise,
    closurePct: compare.throttleClosurePct,
  };
}

const TREND_METRICS = [
  { key: "referenceScore", label: "Referenzscore", suffix: "", digits: 0, lowerBetter: false, warn: 10, note: "höher ist besser" },
  { key: "fuelScore", label: "Fuel Score", suffix: "", digits: 0, lowerBetter: true, warn: 15, note: "niedriger ist besser" },
  { key: "lpfpMin", label: "LPFP min", suffix: " psi", digits: 0, lowerBetter: false, warn: 5, note: "Reserve steigt mit höherem Wert" },
  { key: "railMin", label: "Rail min", suffix: " psi", digits: 0, lowerBetter: false, warn: 100, note: "Reserve steigt mit höherem Wert" },
  { key: "boostError", label: "Boost Fehler", suffix: " psi", digits: 2, lowerBetter: true, warn: 0.5, note: "kleiner ist besser" },
  { key: "timingMax", label: "Timing Corr.", suffix: " Grad", digits: 1, lowerBetter: true, warn: 1, note: "kleiner ist besser" },
  { key: "wgdcAvg", label: "WGDC avg", suffix: "%", digits: 0, lowerBetter: true, warn: 5, note: "kleiner bedeutet mehr Reserve" },
  { key: "iatRise", label: "IAT Anstieg", suffix: " C", digits: 1, lowerBetter: true, warn: 5, note: "kleiner ist thermisch besser" },
  { key: "closurePct", label: "Throttle Closure", suffix: "%", digits: 0, lowerBetter: true, warn: 0.05, percent: true, note: "kleiner ist besser" },
];

function trendValue(row, metric) {
  const value = row[metric.key];
  if (!Number.isFinite(value)) return NaN;
  return metric.percent ? value * 100 : value;
}

function formatTrendValue(value, metric) {
  if (!Number.isFinite(value)) return "n/a";
  return `${value.toFixed(metric.digits)}${metric.suffix}`;
}

function trendDeltaText(delta, metric) {
  if (!Number.isFinite(delta)) return "n/a";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(metric.digits)}${metric.suffix}`;
}

function trendTone(delta, metric) {
  if (!Number.isFinite(delta)) return "neutral";
  const warn = metric.percent ? metric.warn * 100 : metric.warn;
  if (Math.abs(delta) < warn) return "neutral";
  const improvement = metric.lowerBetter ? delta < 0 : delta > 0;
  if (improvement) return "green";
  return Math.abs(delta) >= warn * 2 ? "red" : "yellow";
}

function renderSparkline(values, tone) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length < 2) return "";
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min || 1;
  const width = 120;
  const height = 34;
  const points = values
    .map((value, index) => {
      if (!Number.isFinite(value)) return null;
      const x = values.length === 1 ? width : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");
  return `
    <svg class="trend-spark ${tone}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trend">
      <polyline points="${points}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
    </svg>
  `;
}

function renderTrendAnalysis() {
  if (!elements.trendView || !elements.trendSummary) return;
  if (state.results.length < 2) {
    elements.trendSummary.textContent = t("minTwoLogs");
    elements.trendView.innerHTML = `<p class="muted">${escapeHtml(t("trendEmpty"))}</p>`;
    return;
  }

  const rules = currentRules();
  const rows = state.results
    .map((result, index) => buildTrendRow(result, index, rules))
    .sort((a, b) => a.order - b.order);
  const cards = TREND_METRICS.map((metric) => {
    const values = rows.map((row) => trendValue(row, metric));
    const finite = values.filter((value) => Number.isFinite(value));
    if (finite.length < 2) return null;
    const first = finite[0];
    const last = finite[finite.length - 1];
    const delta = last - first;
    const tone = trendTone(delta, metric);
    return { metric, values, first, last, delta, tone };
  }).filter(Boolean);

  if (!cards.length) {
    elements.trendSummary.textContent = `${rows.length} Logs`;
    elements.trendView.innerHTML = '<p class="muted">Die geladenen Logs haben zu wenig gemeinsame Kennzahlen für einen Trend.</p>';
    return;
  }

  const worsening = cards.filter((card) => card.tone === "red" || card.tone === "yellow").length;
  const improving = cards.filter((card) => card.tone === "green").length;
  const profile = activeProfile();
  elements.trendSummary.textContent = worsening
    ? `${worsening} Trend${worsening === 1 ? "" : "s"} beobachten`
    : `${improving} Trend${improving === 1 ? "" : "s"} besser`;

  elements.trendView.innerHTML = `
    <div class="trend-head ${worsening ? "yellow" : "green"}">
      <div>
        <strong>${escapeHtml(profile ? profileLabel(profile) : "Aktuell geladene Logs")}</strong>
        <span>${escapeHtml(rows[0].label)} bis ${escapeHtml(rows[rows.length - 1].label)} - ${rows.length} Logs</span>
      </div>
    </div>
    <div class="trend-grid">
      ${cards
        .map(
          (card) => `
            <div class="trend-card ${card.tone}">
              <div>
                <strong>${escapeHtml(card.metric.label)}</strong>
                <span>${escapeHtml(card.metric.note)}</span>
              </div>
              ${renderSparkline(card.values, card.tone)}
              <div class="trend-values">
                <span>${escapeHtml(formatTrendValue(card.first, card.metric))}</span>
                <strong>${escapeHtml(formatTrendValue(card.last, card.metric))}</strong>
                <span>${escapeHtml(trendDeltaText(card.delta, card.metric))}</span>
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderCompareRow(row) {
  return `
    <tr data-index="${row.index}" class="${row.index === state.selectedIndex ? "selected" : ""}">
      <td data-label="Log">
        <div class="filename">${escapeHtml(shortName(row.filename))}</div>
        <div class="subtext">${escapeHtml(row.map)}</div>
      </td>
      <td data-label="Fuel Score"><span class="score-pill ${row.severity}">${row.score}</span></td>
      <td data-label="LPFP">
        <strong>${format(row.lpfpMin, 0, " psi")}</strong>
        <div class="subtext">${formatPct(row.lpfpBelow50Pct)} unter 50</div>
      </td>
      <td data-label="Rail"><strong>${format(row.railMin, 0, " psi")}</strong></td>
      <td data-label="DME Eingriff">
        <strong>${formatPct(row.throttleClosurePct)}</strong>
        <div class="subtext">${row.throttleMismatchRed} harte Treffer</div>
      </td>
      <td data-label="Boost">
        <strong>${format(row.boostMax, 1, " psi")}</strong>
        <div class="subtext">${format(row.boostAvgAbs, 2, " psi")} Fehler</div>
      </td>
      <td data-label="Trims">
        <strong>${format(row.stftDiff, 0, "%")} STFT</strong>
        <div class="subtext">${format(row.ltftDiff, 0, "%")} LTFT</div>
      </td>
      <td data-label="Fazit">${escapeHtml(row.conclusion)}</td>
    </tr>
  `;
}

function formatPct(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(0)}%` : "n/a";
}

function renderPullSelector(result, selectedPullIndex) {
  const pulls = result.metrics?.pullAnalyses || [];
  if (!pulls.length) return "";

  return `
    <div class="section-block pull-switcher">
      <h3>Pulls in dieser CSV</h3>
      <div class="pull-options">
        ${pulls
          .map((pull, index) => {
            const summary = pull.summary || {};
            const status = statusClass(pull.status);
            const duration = format(summary.duration, 1, " s");
            const rpm = formatRange(summary.rpmRange, 0, "rpm");
            const boost = Number.isFinite(summary.boostAvgAbs) ? `${format(summary.boostAvgAbs, 2, " psi")} Boost` : "Boost n/a";
            const timing = Number.isFinite(summary.timingMax) ? `${format(summary.timingMax, 1)} Grad Timing` : "Timing n/a";
            const reference = Number.isFinite(pull.metrics?.reference?.score) ? `${pull.metrics.reference.score}/100 Ref` : "Ref n/a";
            return `
              <button class="pull-option ${status} ${index === selectedPullIndex ? "active" : ""}" type="button" data-pull-index="${index}">
                <span class="status-dot ${status}"></span>
                <strong>${escapeHtml(pull.label)} - ${escapeHtml(summary.gear ?? "n/a")}. Gang</strong>
                <small>${escapeHtml(duration)} | ${escapeHtml(rpm)} | ${escapeHtml(boost)} | ${escapeHtml(timing)} | ${escapeHtml(reference)}</small>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderDetail() {
  const result = state.results[state.selectedIndex];
  if (!result) {
    elements.detailBadge.className = "status-pill neutral";
    elements.detailBadge.textContent = t("ready");
    elements.detailView.innerHTML = `<p class="muted">${escapeHtml(t("chooseLog"))}</p>`;
    return;
  }

  const pullAnalyses = result.metrics?.pullAnalyses || [];
  const selectedPullIndex = pullAnalyses.length
    ? Math.max(0, Math.min(pullAnalyses.length - 1, state.pullSelection[state.selectedIndex] ?? defaultPullIndex(pullAnalyses)))
    : null;
  const selectedPull = selectedPullIndex !== null ? pullAnalyses[selectedPullIndex] : null;
  const detailResult = selectedPull
    ? {
        ...result,
        status: selectedPull.status,
        statusLabel: selectedPull.statusLabel,
        headline: selectedPull.headline,
        tuning: selectedPull.tuning,
        issues: selectedPull.issues,
        diagnoses: selectedPull.diagnoses,
        notes: selectedPull.notes,
        missingChannels: selectedPull.missingChannels,
        metrics: selectedPull.metrics,
      }
    : result;

  elements.detailBadge.className = `status-pill ${statusClass(detailResult.status)}`;
  elements.detailBadge.textContent = statusLabel(detailResult.status);

  const metrics = detailResult.metrics;
  const boostError = metrics.boost?.error;
  const iat = metrics.temps?.iat;
  const timing = metrics.timing?.corrections;
  const rail = metrics.fuel?.rail;
  const lpfp = metrics.fuel?.lpfp;
  const wgdc = metrics.turbo?.wgdc;
  const anomalies = metrics.anomalies;
  const validation = metrics.validation;
  const platformContext = metrics.platformContext;
  const trace = metrics.trace;
  const displayFilename = shortName(result.filename);

  elements.detailView.innerHTML = `
    <div class="detail-title">
      <div>
        <strong class="detail-filename" title="${escapeAttr(result.filename)}">${escapeHtml(displayFilename)}</strong>
        ${result.filename !== displayFilename ? `<small class="file-meta">${escapeHtml(result.filename)}</small>` : ""}
        <p class="muted">${escapeHtml(selectedPull ? `${selectedPull.label}: ${detailResult.headline}` : detailResult.headline)}</p>
      </div>
      <button class="report-export" type="button" data-report-export>Bericht exportieren</button>
    </div>

    ${renderPullSelector(result, selectedPullIndex)}

    <div class="stat-grid">
      ${statBlock("Pull", `${metrics.pull?.gear ?? "n/a"}. Gang | ${format(metrics.selectedSegment?.duration, 1, " s")}`)}
      ${statBlock("Plattform", result.vehicleInfo?.engine ?? "n/a")}
      ${statBlock("RPM", formatRange(metrics.pull?.rpmRange, 0, "rpm"))}
      ${statBlock("Boost Ist", formatStats(metrics.boost?.actual, 1, " psi"))}
      ${statBlock("Boost Fehler", boostError ? `${format(boostError.avgAbs, 2, " psi")} avg` : "n/a")}
      ${statBlock("Timing Corr.", timing ? `${format(timing.max, 1)} Grad max` : "n/a")}
      ${statBlock("WGDC", wgdc ? `${format(wgdc.avg, 0, "%")} avg / ${format(wgdc.max, 0, "%")} max` : "n/a")}
      ${statBlock("Rail", rail ? `${format(rail.min, 0, " psi")} min` : "n/a")}
      ${statBlock("LPFP", lpfp ? `${format(lpfp.min, 0, " psi")} min` : "n/a")}
      ${statBlock("IAT", iat ? `${format(iat.start, 0)}-${format(iat.end, 0)} C` : "n/a")}
      ${statBlock("Lambda", lambdaSummary(metrics))}
      ${statBlock("Fuel Trims", fuelTrimSummary(metrics))}
      ${statBlock("Anomalien", anomalySummary(anomalies))}
      ${statBlock("Pull Check", validationSummary(validation))}
    </div>

    ${renderVehicleProfileContext(result)}

    ${renderStateTimeline(metrics.states)}

    ${renderIssueOverview(detailResult)}

    ${renderNextActions(result, detailResult)}

    ${renderChannelChecklist(result)}

    ${renderReferenceComparison(metrics.reference)}

    ${renderReferenceLibrary(result, detailResult, selectedPull)}

    ${renderPlatformContext(platformContext)}

    ${renderTrace(trace)}

    ${renderValidation(validation)}

    ${renderAnomalies(anomalies)}

    <div class="section-block">
      <h3>Tuningpotential</h3>
      <p class="muted">${escapeHtml(detailResult.tuning)}</p>
    </div>

    <div class="section-block">
      <h3>Mögliche Fehlerbilder</h3>
      <div class="diagnosis-list">
        ${
          detailResult.diagnoses?.length
            ? detailResult.diagnoses.map((diagnosis) => `
              <div class="diagnosis">
                <strong>${escapeHtml(diagnosis.title)}</strong>
                <ul>
                  ${diagnosis.causes.map((cause) => `<li>${escapeHtml(cause)}</li>`).join("")}
                </ul>
              </div>
            `).join("")
            : '<div class="issue green">Keine typischen Fehlerbilder aus den Regeln abgeleitet.</div>'
        }
      </div>
    </div>

  `;

  elements.detailView.querySelectorAll("[data-pull-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pullSelection[state.selectedIndex] = Number(button.dataset.pullIndex);
      renderDetail();
    });
  });

  const saveReferenceButton = elements.detailView.querySelector("[data-reference-action='save']");
  if (saveReferenceButton) {
    saveReferenceButton.addEventListener("click", () => {
      addReference(result, detailResult, selectedPull);
      renderDetail();
    });
  }

  elements.detailView.querySelectorAll("[data-reference-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteReference(button.dataset.referenceDelete);
      renderDetail();
    });
  });

  const reportButton = elements.detailView.querySelector("[data-report-export]");
  if (reportButton) {
    reportButton.addEventListener("click", () => {
      exportAnalysisReport(result, detailResult, selectedPull);
    });
  }
}

function anomalySummary(anomalies) {
  if (!anomalies || !anomalies.total) return "ruhig";
  if (Number.isFinite(anomalies.relevantTotal) && anomalies.relevantTotal > 0) {
    return `${anomalies.relevantTotal} relevant / ${anomalies.total} Kontext`;
  }
  const counts = anomalies.counts || {};
  const categories = [
    counts.afrSpike,
    counts.afrDropout,
    counts.throttleMismatch,
    counts.hesitation,
    counts.idleAfrInstability,
    counts.sensorFlatline,
  ].filter(Boolean).length;
  return `${categories || 1} Kontextfelder`;
}

function validationSummary(validation) {
  if (!validation) return "n/a";
  return validation.summary;
}

function renderVehicleProfileContext(result) {
  const profile = activeProfile();
  if (!profile) return "";
  const detected = result.vehicleInfo || {};
  const profilePreset = profilePresetKey(profile);
  const detectedPreset = presetKeyForEngine(detected.engine || "");
  const mismatch = profilePreset && detectedPreset && profilePreset !== detectedPreset;
  const rows = [
    ["Profil", profile.name],
    ["Profil-Motor", profile.engine || "Auto"],
    ["Erkannt", detected.engine || "offen"],
    ["Stage", profile.stage || detected.stage || "n/a"],
    ["Kraftstoff", profile.fuel || detected.fuel || "n/a"],
    ["Map", profile.map || detected.map || detected.descriptor || "n/a"],
    ["Hardware", profile.hardware || "n/a"],
  ];

  return `
    <div class="section-block profile-context-block">
      <div class="profile-context-head ${mismatch ? "yellow" : "green"}">
        <div>
          <h3>Fahrzeugprofil</h3>
          <strong>${escapeHtml(profileLabel(profile))}</strong>
          <span>${escapeHtml(mismatch ? "Profil-Motor passt nicht zur erkannten Log-Plattform." : "Profil und Log wirken plausibel zusammen.")}</span>
        </div>
      </div>
      <div class="profile-context-grid">
        ${rows
          .map(
            ([label, value]) => `
              <div>
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
              </div>
            `
          )
          .join("")}
      </div>
      ${profile.notes ? `<p class="profile-note">${escapeHtml(profile.notes)}</p>` : ""}
    </div>
  `;
}

function isBankedEngine(engine) {
  return /N54|N55|S55|S63/i.test(engine || "");
}

function channelChecklistFor(result) {
  const engine = result.vehicleInfo?.engine || "";
  const items = CHANNEL_CHECKLIST.map((item) => {
    if (/B58/i.test(engine) && item.key === "lpfp") {
      return {
        ...item,
        priority: "recommended",
        why: "Bei vielen B58-Logs nicht immer aktiv, für Fueling-Reserve aber sehr hilfreich.",
      };
    }
    return item;
  });
  if (isBankedEngine(engine)) items.push(...BANKED_ENGINE_CHANNELS);
  return items;
}

function hasChecklistChannel(result, key) {
  if (key === "timingCorrections") {
    return !(result.missingChannels || []).includes("Timing Corrections");
  }
  return Boolean(result.columns?.[key]);
}

function checklistColumnLabel(result, item) {
  if (item.key === "timingCorrections") return hasChecklistChannel(result, item.key) ? "vorhanden" : "fehlt";
  return result.columns?.[item.key] || "fehlt";
}

function renderChannelChecklist(result) {
  const rows = channelChecklistFor(result).map((item) => ({
    ...item,
    present: hasChecklistChannel(result, item.key),
    column: checklistColumnLabel(result, item),
  }));
  const requiredMissing = rows.filter((item) => item.priority === "required" && !item.present);
  const recommendedMissing = rows.filter((item) => item.priority === "recommended" && !item.present);
  const presentRequired = rows.filter((item) => item.priority === "required" && item.present).length;
  const requiredTotal = rows.filter((item) => item.priority === "required").length;
  const tone = requiredMissing.length ? "red" : recommendedMissing.length ? "yellow" : "green";
  const title = requiredMissing.length
    ? `${requiredMissing.length} Pflichtkanal${requiredMissing.length === 1 ? "" : "e"} fehlen`
    : recommendedMissing.length
      ? "Pflichtkanäle vollständig"
      : "Log-Kanäle sehr gut";
  const detail = requiredMissing.length
    ? `Nächster Log: ${requiredMissing.slice(0, 4).map((item) => item.label).join(", ")} aktivieren.`
    : recommendedMissing.length
      ? `${recommendedMissing.length} empfohlene Zusatzkanäle würden die Diagnose schärfen.`
      : "Alle Pflicht- und Empfehlungskanäle sind vorhanden.";
  const groupOrder = ["Basis", "Boost", "Fuel", "Zündung", "Thermik", "Regelung", "Turbo", "Luftmasse"];
  const primaryRows = rows.filter((item) => item.priority === "required");
  const extraRows = rows.filter((item) => item.priority !== "required");
  const groupedRequired = groupOrder
    .map((group) => [group, primaryRows.filter((item) => item.group === group)])
    .filter(([, items]) => items.length);
  const extraSummary = extraRows.length
    ? `${extraRows.filter((item) => item.present).length}/${extraRows.length} Zusatzkanäle vorhanden`
    : "Keine Zusatzkanäle definiert";
  const renderChannelPill = (item) => `
    <div class="channel-pill ${item.present ? "present" : "missing"} ${item.priority}" title="${escapeAttr(item.present ? item.column : item.why)}">
      <span class="channel-pill-dot"></span>
      <strong>${escapeHtml(item.label)}</strong>
      <small>${escapeHtml(item.present ? item.column : "fehlt")}</small>
    </div>
  `;

  return `
    <div class="section-block channel-checklist-block">
      <div class="channel-checklist-head ${tone}">
        <div>
          <h3>Logging-Kanäle</h3>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(detail)}</span>
        </div>
        <div class="channel-score">
          <strong>${presentRequired}/${requiredTotal}</strong>
          <span>Pflicht</span>
        </div>
      </div>
      <div class="channel-compact-groups">
        ${groupedRequired
          .map(
            ([group, items]) => `
              <div class="channel-group">
                <strong>${escapeHtml(group)}</strong>
                <div class="channel-pill-row">
                  ${items.map(renderChannelPill).join("")}
                </div>
              </div>
            `
          )
          .join("")}
      </div>
      ${
        extraRows.length
          ? `
            <details class="channel-extra-details">
              <summary>${escapeHtml(extraSummary)}</summary>
              <div class="channel-pill-row compact">
                ${extraRows.map(renderChannelPill).join("")}
              </div>
            </details>
          `
          : ""
      }
    </div>
  `;
}

function renderIssueOverview(result) {
  const groups = groupIssues(result);

  return `
    <div class="section-block priority-block">
      <h3>Priorität</h3>
      <div class="priority-summary ${groups.critical.length ? "red" : groups.watch.length ? "yellow" : "green"}">
        <strong>${escapeHtml(result.headline)}</strong>
        <span>${escapeHtml(prioritySummaryText(groups))}</span>
      </div>
      <div class="priority-columns">
        ${priorityColumn("Wichtig", groups.critical, "red", "Keine harte Ursache erkannt.")}
        ${priorityColumn("Beobachten", groups.watch, "yellow", "Keine relevanten Nebenbefunde.")}
        ${priorityColumn("Daten & Rest", groups.info, "neutral", "Datenlage wirkt ausreichend.")}
      </div>
    </div>
  `;
}

function nextActionItems(parentResult, detailResult) {
  const groups = groupIssues(detailResult);
  const checklist = channelChecklistFor(parentResult).map((item) => ({
    ...item,
    present: hasChecklistChannel(parentResult, item.key),
  }));
  const missingRequired = checklist.filter((item) => item.priority === "required" && !item.present);
  const missingRecommended = checklist.filter((item) => item.priority === "recommended" && !item.present);
  const failedChecks = detailResult.metrics?.validation?.checks?.filter((check) => !check.ok) || [];
  const reference = detailResult.metrics?.reference;
  const items = [];

  if (groups.critical.length) {
    const first = groups.critical[0];
    items.push({
      tone: "red",
      title: "Erst Ursache prüfen",
      detail: `${first.category}: ${first.text}`,
    });
  }

  if (missingRequired.length) {
    items.push({
      tone: "red",
      title: "Nächsten Log erweitern",
      detail: `Pflichtkanäle aktivieren: ${missingRequired.slice(0, 5).map((item) => item.label).join(", ")}.`,
    });
  }

  if (failedChecks.length) {
    items.push({
      tone: "yellow",
      title: "Pull wiederholen",
      detail: failedChecks.slice(0, 3).map((check) => `${check.label}: ${check.detail}`).join(" | "),
    });
  }

  if (reference && reference.status !== "green") {
    items.push({
      tone: statusClass(reference.status),
      title: "Referenzvergleich beachten",
      detail: `${reference.score ?? "n/a"}/100: ${reference.detail}`,
    });
  }

  if (!missingRequired.length && missingRecommended.length) {
    items.push({
      tone: "yellow",
      title: "Daten schärfen",
      detail: `Empfohlen für nächste Logs: ${missingRecommended.slice(0, 4).map((item) => item.label).join(", ")}.`,
    });
  }

  if (!items.length && detailResult.status === "green") {
    items.push({
      tone: "green",
      title: "Als Referenz sichern",
      detail: "Der Pull wirkt brauchbar. Mit zweitem sauberen Log bestätigen und dann als Referenz speichern.",
    });
  }

  if (!items.length) {
    items.push({
      tone: "neutral",
      title: "Weiter beobachten",
      detail: "Keine harte Einzelursache. Gleichen Pull unter ähnlichen Bedingungen wiederholen und vergleichen.",
    });
  }

  return items.slice(0, 4);
}

function renderNextActions(parentResult, detailResult) {
  const items = nextActionItems(parentResult, detailResult);
  const topTone = items.some((item) => item.tone === "red")
    ? "red"
    : items.some((item) => item.tone === "yellow")
      ? "yellow"
      : items.every((item) => item.tone === "neutral")
        ? "neutral"
        : "green";
  const summary =
    topTone === "red"
      ? "Vor Tuning/Freigabe zuerst die roten Punkte abarbeiten."
      : topTone === "yellow"
        ? "Log ist verwertbar, aber die nächste Messung kann gezielter werden."
        : topTone === "neutral"
          ? "Aktuellen Stand mit einem zweiten sauberen Pull bestätigen."
          : "Aktueller Stand wirkt als Vergleichsbasis brauchbar.";

  return `
    <div class="section-block next-actions-block">
      <div class="next-actions-head ${topTone}">
        <div>
          <h3>Nächster Schritt</h3>
          <strong>${escapeHtml(summary)}</strong>
        </div>
      </div>
      <div class="next-actions-grid">
        ${items
          .map(
            (item) => `
              <div class="next-action ${item.tone}">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.detail)}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function groupIssues(result) {
  const groups = {
    critical: [],
    watch: [],
    info: [],
  };

  result.issues.forEach((issue) => {
    const isData = issue.category === "Daten";
    const isContext = issue.category === "Regelung" || /AFR-Dropout|Placeholder|Mismatch|Throttle closures/i.test(issue.text);
    if (issue.severity === "red" && !isData && !isContext) {
      groups.critical.push(issue);
    } else if (issue.severity === "yellow" && !isData) {
      groups.watch.push(issue);
    } else {
      groups.info.push(issue);
    }
  });

  if (result.missingChannels.length) {
    groups.info.push({
      severity: "neutral",
      category: "Daten",
      text: `Fehlende Kanäle: ${result.missingChannels.join(", ")}.`,
    });
  }

  result.notes.forEach((note) => {
    groups.info.push({ severity: "neutral", category: "Notiz", text: note });
  });

  return groups;
}

function prioritySummaryText(groups) {
  const parts = [];
  if (groups.critical.length) parts.push(`${groups.critical.length} kritisch`);
  if (groups.watch.length) parts.push(`${groups.watch.length} beobachten`);
  if (groups.info.length) parts.push(`${groups.info.length} Daten/Info`);
  return parts.length ? parts.join(" | ") : "Keine groben Auffälligkeiten erkannt.";
}

function priorityColumn(title, issues, tone, emptyText) {
  return `
    <div class="priority-column ${tone}">
      <div class="priority-column-head">
        <strong>${escapeHtml(title)}</strong>
        <span>${issues.length}</span>
      </div>
      <div class="priority-list">
        ${
          issues.length
            ? issues.map((issue) => renderPriorityIssue(issue, tone)).join("")
            : `<div class="priority-empty">${escapeHtml(emptyText)}</div>`
        }
      </div>
    </div>
  `;
}

function renderPriorityIssue(issue, fallbackTone) {
  const tone = issue.severity === "red" || issue.severity === "yellow" ? issue.severity : fallbackTone;
  const category = issue.categoryLabel || t(`analysis.category.${issue.category}`) || issue.category;
  return `
    <div class="priority-issue ${tone}">
      <strong>${escapeHtml(category)}</strong>
      <span>${escapeHtml(issue.text)}</span>
    </div>
  `;
}

function renderReferenceComparison(reference) {
  if (!reference) return "";
  const scoreText = Number.isFinite(reference.score) ? `${reference.score}/100` : "n/a";
  const meta = [reference.profile, reference.stage, reference.fuel].filter(Boolean).join(" | ");

  return `
    <div class="section-block reference-block">
      <div class="reference-head ${statusClass(reference.status)}">
        <div>
          <h3>Referenzvergleich</h3>
          <strong>${escapeHtml(reference.title)}</strong>
          <span>${escapeHtml(meta || "Plattformprofil")}</span>
        </div>
        <div class="reference-score">
          <span>${escapeHtml(scoreText)}</span>
          <small>${escapeHtml(reference.detail)}</small>
        </div>
      </div>
      <div class="reference-grid">
        ${(reference.cards || [])
          .map((card) => `
            <div class="reference-card ${statusClass(card.status)}">
              <div>
                <strong>${escapeHtml(card.label)}</strong>
                <span>${escapeHtml(card.value)}</span>
              </div>
              <meter min="0" max="100" value="${Number.isFinite(card.score) ? card.score : 0}"></meter>
              <p>${escapeHtml(card.detail)}</p>
            </div>
          `)
          .join("")}
      </div>
    </div>
  `;
}

function formatSavedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unbekannt";
  return date.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function renderReferenceLibrary(parentResult, detailResult, selectedPull) {
  const comparison = buildLibraryComparison(parentResult, detailResult);
  const allCount = state.referenceLibrary.length;
  const saveLabel = selectedPull ? `${selectedPull.label} als Referenz speichern` : "Pull als Referenz speichern";
  const canSave = Boolean(detailResult.metrics?.selectedSegment);

  return `
    <div class="section-block library-block">
      <div class="library-head ${statusClass(comparison.status)}">
        <div>
          <h3>Referenzbibliothek</h3>
          <strong>${escapeHtml(comparison.title)}</strong>
          <span>${escapeHtml(comparison.detail)}</span>
        </div>
        ${
          canSave
            ? `<button class="library-save" type="button" data-reference-action="save">${escapeHtml(saveLabel)}</button>`
            : '<span class="library-disabled">Kein Pull speicherbar</span>'
        }
      </div>
      ${
        comparison.cards.length
          ? `<div class="library-grid">
              ${comparison.cards
                .map((card) => `
                  <div class="library-card ${statusClass(card.status)}">
                    <strong>${escapeHtml(card.label)}</strong>
                    <span>${escapeHtml(card.value)}</span>
                    <p>${escapeHtml(card.detail)}</p>
                  </div>
                `)
                .join("")}
            </div>`
          : `<div class="library-empty">Noch keine passende Referenz für ${escapeHtml(parentResult.vehicleInfo?.engine || "diese Plattform")}. Insgesamt gespeichert: ${allCount}.</div>`
      }
      ${
        comparison.references.length
          ? `<div class="library-list">
              ${comparison.references.slice(0, 6).map((entry) => renderReferenceEntry(entry)).join("")}
            </div>`
          : ""
      }
    </div>
  `;
}

function renderReferenceEntry(entry) {
  const meta = [entry.engine, entry.stage, entry.fuel, entry.pullLabel].filter(Boolean).join(" | ");
  return `
    <div class="library-entry">
      <div>
        <strong>${escapeHtml(shortName(entry.filename))}</strong>
        <span>${escapeHtml(meta)} | ${escapeHtml(formatSavedAt(entry.savedAt))}</span>
      </div>
      <button type="button" data-reference-delete="${escapeAttr(entry.id)}">Löschen</button>
    </div>
  `;
}

function safeFilename(value) {
  return String(value || "analyse")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "analyse";
}

function reportMetricRows(metrics) {
  const boostError = metrics.boost?.error;
  const timing = metrics.timing?.corrections;
  const wgdc = metrics.turbo?.wgdc;
  const rail = metrics.fuel?.rail;
  const lpfp = metrics.fuel?.lpfp;
  const iat = metrics.temps?.iat;
  return [
    ["Pull", `${metrics.pull?.gear ?? "n/a"}. Gang | ${format(metrics.selectedSegment?.duration, 1, " s")}`],
    ["RPM", formatRange(metrics.pull?.rpmRange, 0, "rpm")],
    ["Boost Ist", formatStats(metrics.boost?.actual, 1, " psi")],
    ["Boost Fehler", boostError ? `${format(boostError.avgAbs, 2, " psi")} avg` : "n/a"],
    ["Timing Corr.", timing ? `${format(timing.max, 1)} Grad max` : "n/a"],
    ["WGDC", wgdc ? `${format(wgdc.avg, 0, "%")} avg / ${format(wgdc.max, 0, "%")} max` : "n/a"],
    ["Rail", rail ? `${format(rail.min, 0, " psi")} min` : "n/a"],
    ["LPFP", lpfp ? `${format(lpfp.min, 0, " psi")} min` : "n/a"],
    ["IAT", iat ? `${format(iat.start, 0)}-${format(iat.end, 0)} C` : "n/a"],
    ["Lambda", lambdaSummary(metrics)],
    ["Fuel Trims", fuelTrimSummary(metrics)],
  ];
}

function reportRowsHtml(rows) {
  return rows.map(([label, value]) => `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");
}

function reportIssuesHtml(issues) {
  if (!issues?.length) return '<p class="empty">Keine Befunde.</p>';
  return issues.map((issue) => `
    <div class="issue ${statusClass(issue.severity)}">
      <strong>${escapeHtml(issue.categoryLabel || t(`analysis.category.${issue.category}`) || issue.category)}</strong>
      <span>${escapeHtml(issue.text)}</span>
    </div>
  `).join("");
}

function reportNextActionsHtml(parentResult, detailResult) {
  const items = nextActionItems(parentResult, detailResult);
  return items.map((item) => `
    <div class="issue ${statusClass(item.tone)}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.detail)}</span>
    </div>
  `).join("");
}

function reportReferenceHtml(reference) {
  if (!reference) return '<p class="empty">Keine Referenzbewertung vorhanden.</p>';
  return `
    <div class="verdict ${statusClass(reference.status)}">
      <strong>${escapeHtml(reference.score ?? "n/a")}/100 - ${escapeHtml(reference.title)}</strong>
      <span>${escapeHtml(reference.profile || "Plattformprofil")} - ${escapeHtml(reference.detail)}</span>
    </div>
    <div class="cards">
      ${(reference.cards || []).map((card) => `
        <div class="card ${statusClass(card.status)}">
          <strong>${escapeHtml(card.label)}</strong>
          <span>${escapeHtml(card.value)}</span>
          <p>${escapeHtml(card.detail)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function reportLibraryHtml(comparison) {
  if (!comparison?.cards?.length) return `<p class="empty">${escapeHtml(comparison?.detail || "Keine gespeicherte Referenz.")}</p>`;
  return `
    <div class="verdict ${statusClass(comparison.status)}">
      <strong>${escapeHtml(comparison.title)}</strong>
      <span>${escapeHtml(comparison.detail)}</span>
    </div>
    <div class="cards">
      ${comparison.cards.map((card) => `
        <div class="card ${statusClass(card.status)}">
          <strong>${escapeHtml(card.label)}</strong>
          <span>${escapeHtml(card.value)}</span>
          <p>${escapeHtml(card.detail)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function buildReportHtml(parentResult, detailResult, selectedPull) {
  const metrics = detailResult.metrics || {};
  const libraryComparison = buildLibraryComparison(parentResult, detailResult);
  const title = `${parentResult.filename}${selectedPull ? ` - ${selectedPull.label}` : ""}`;
  const created = new Date().toLocaleString("de-CH");
  const vehicle = [
    parentResult.vehicleInfo?.engine,
    parentResult.vehicleInfo?.stage,
    parentResult.vehicleInfo?.fuel,
    parentResult.vehicleInfo?.drive,
  ].filter(Boolean).join(" | ");

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, Segoe UI, Arial, sans-serif; color: #18212b; background: #f3f6f9; }
    body { margin: 0; padding: 28px; }
    main { max-width: 1120px; margin: 0 auto; background: #fff; border: 1px solid #d7e0ea; border-radius: 10px; padding: 24px; }
    h1 { margin: 0; font-size: 1.45rem; }
    h2 { margin: 24px 0 10px; font-size: .92rem; text-transform: uppercase; letter-spacing: .04em; }
    .muted, .empty { color: #64748b; }
    .headline { margin-top: 10px; padding: 12px; border-radius: 8px; background: #eef5ff; }
    .status { display: inline-block; margin-top: 12px; padding: 5px 10px; border-radius: 999px; font-weight: 800; }
    .green { border-color: #2f9e44 !important; }
    .yellow { border-color: #d69e2e !important; }
    .red { border-color: #d64545 !important; }
    .neutral { border-color: #94a3b8 !important; }
    .metrics, .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
    .metric, .card, .issue, .verdict { border: 1px solid #d7e0ea; border-left: 5px solid #94a3b8; border-radius: 8px; padding: 11px; background: #fbfdff; }
    .metric span, .card span, .issue span, .verdict span { display: block; margin-top: 4px; color: #64748b; font-size: .86rem; }
    .metric strong, .card strong, .issue strong, .verdict strong { display: block; }
    .issue + .issue { margin-top: 8px; }
    .card p { margin: 7px 0 0; color: #64748b; font-size: .82rem; line-height: 1.4; }
    @media print { body { background: #fff; padding: 0; } main { border: 0; } }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p class="muted">${escapeHtml(vehicle || "Plattform offen")} - erstellt ${escapeHtml(created)}</p>
    <div class="headline ${statusClass(detailResult.status)}">
      <strong>${escapeHtml(detailResult.statusLabel)}: ${escapeHtml(detailResult.headline)}</strong>
      <p>${escapeHtml(detailResult.tuning || "")}</p>
    </div>

    <h2>Kennzahlen</h2>
    <div class="metrics">${reportRowsHtml(reportMetricRows(metrics))}</div>

    <h2>Nächster Schritt</h2>
    ${reportNextActionsHtml(parentResult, detailResult)}

    <h2>Referenzprofil</h2>
    ${reportReferenceHtml(metrics.reference)}

    <h2>Gespeicherte Referenzbibliothek</h2>
    ${reportLibraryHtml(libraryComparison)}

    <h2>Befunde</h2>
    ${reportIssuesHtml(detailResult.issues)}
  </main>
</body>
</html>`;
}

function exportAnalysisReport(parentResult, detailResult, selectedPull) {
  const html = buildReportHtml(parentResult, detailResult, selectedPull);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const suffix = selectedPull ? `-${selectedPull.label.toLowerCase().replace(/\s+/g, "-")}` : "";
  link.href = url;
  link.download = `${safeFilename(parentResult.filename)}${suffix}-bericht.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderValidation(validation) {
  if (!validation) return "";

  return `
    <div class="section-block">
      <h3>Pull-Validierung</h3>
      <div class="check-grid">
        ${validation.checks
          .map(
            (check) => `
              <div class="check ${check.ok ? "green" : "yellow"}">
                <strong>${escapeHtml(check.label)}</strong>
                <span>${escapeHtml(check.detail)}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderTrace(trace) {
  if (!trace?.charts?.length) return "";

  return `
    <div class="section-block">
      <h3>Zeitkurven</h3>
      <div class="trace-stack">
        ${trace.charts.map((chart) => renderTraceChart(chart)).join("")}
      </div>
    </div>
  `;
}

function renderTraceChart(chart) {
  const geometry = traceGeometry(chart);
  if (!geometry) return "";

  const thresholdLines = (chart.thresholds || [])
    .filter((threshold) => Number.isFinite(threshold.value))
    .filter((threshold) => threshold.value >= geometry.yMin && threshold.value <= geometry.yMax)
    .map((threshold) => {
      const y = yForTrace(threshold.value, geometry);
      return `
        <line class="trace-threshold ${threshold.severity}" x1="${geometry.left}" x2="${geometry.rightEdge}" y1="${y}" y2="${y}" />
        <text class="trace-threshold-label" x="${geometry.rightEdge - 4}" y="${Math.max(12, y - 4)}">${escapeHtml(threshold.label)}</text>
      `;
    })
    .join("");

  const paths = chart.series
    .map((series) => {
      const path = tracePath(series.points, geometry);
      return path ? `<path class="trace-line ${series.color}" d="${path}" />` : "";
    })
    .join("");

  const legend = chart.series
    .map((series) => `
      <span class="trace-legend-item">
        <i class="${series.color}"></i>
        ${escapeHtml(series.label)} ${format(series.min, 0)}-${format(series.max, 0)}
      </span>
    `)
    .join("");

  return `
    <div class="trace-card">
      <div class="trace-head">
        <strong>${escapeHtml(chart.label)}</strong>
        <span>${escapeHtml(chart.unit)}</span>
      </div>
      <svg class="trace-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" preserveAspectRatio="none" aria-hidden="true">
        <line class="trace-axis" x1="${geometry.left}" x2="${geometry.rightEdge}" y1="${geometry.bottomEdge}" y2="${geometry.bottomEdge}" />
        <line class="trace-axis" x1="${geometry.left}" x2="${geometry.left}" y1="${geometry.top}" y2="${geometry.bottomEdge}" />
        <text class="trace-axis-label" x="6" y="${geometry.top + 8}">${format(geometry.yMax, 0)}</text>
        <text class="trace-axis-label" x="6" y="${geometry.bottomEdge}">${format(geometry.yMin, 0)}</text>
        <text class="trace-axis-label" x="${geometry.left}" y="${geometry.height - 5}">${formatTime(geometry.xMin)}</text>
        <text class="trace-axis-label end" x="${geometry.rightEdge}" y="${geometry.height - 5}">${formatTime(geometry.xMax)}</text>
        ${thresholdLines}
        ${paths}
      </svg>
      <div class="trace-legend">${legend}</div>
    </div>
  `;
}

function traceGeometry(chart) {
  const yValues = chart.series.flatMap((series) => series.points.map((point) => point.y));
  const xValues = chart.series.flatMap((series) => series.points.map((point) => point.x));
  if (!xValues.length || !yValues.length) return null;

  const thresholdValues = (chart.thresholds || [])
    .map((threshold) => threshold.value)
    .filter((value) => Number.isFinite(value));
  const allY = [...yValues, ...thresholdValues];
  const fixedY = Number.isFinite(chart.yMin) && Number.isFinite(chart.yMax);
  let yMin = Number.isFinite(chart.yMin) ? chart.yMin : Math.min(...allY);
  let yMax = Number.isFinite(chart.yMax) ? chart.yMax : Math.max(...allY);
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  } else if (!fixedY) {
    const pad = (yMax - yMin) * 0.08;
    yMin -= pad;
    yMax += pad;
  }

  const [rangeStart, rangeEnd] = chart.timeRange || [Math.min(...xValues), Math.max(...xValues)];
  const xMin = Number.isFinite(rangeStart) ? rangeStart : Math.min(...xValues);
  const xMax = Number.isFinite(rangeEnd) && rangeEnd > xMin ? rangeEnd : Math.max(...xValues);

  return {
    width: 640,
    height: 154,
    left: 46,
    right: 10,
    top: 12,
    bottom: 28,
    rightEdge: 630,
    bottomEdge: 126,
    xMin,
    xMax: xMax === xMin ? xMin + 1 : xMax,
    yMin,
    yMax,
  };
}

function xForTrace(value, geometry) {
  const span = geometry.xMax - geometry.xMin || 1;
  const pct = (value - geometry.xMin) / span;
  return Number((geometry.left + pct * (geometry.rightEdge - geometry.left)).toFixed(1));
}

function yForTrace(value, geometry) {
  const span = geometry.yMax - geometry.yMin || 1;
  const pct = (value - geometry.yMin) / span;
  return Number((geometry.bottomEdge - pct * (geometry.bottomEdge - geometry.top)).toFixed(1));
}

function tracePath(points, geometry) {
  return points
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${xForTrace(point.x, geometry)} ${yForTrace(point.y, geometry)}`;
    })
    .join(" ");
}

function renderPlatformContext(context) {
  if (!context) return "";

  return `
    <div class="section-block">
      <h3>${escapeHtml(context.platform)}-Kontext</h3>
      <div class="context-grid">
        ${context.cards
          .map(
            (card) => `
              <div class="context-card ${card.severity}">
                <strong>${escapeHtml(card.label)}</strong>
                <span>${escapeHtml(card.detail)}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderAnomalies(anomalies) {
  if (!anomalies) return "";

  const hasEvents = anomalies.total > 0;
  const summary = hasEvents
    ? `${anomalies.total} Einzelpunkte zu ${anomalies.clusters.length} Gruppen gebündelt`
    : "Keine zusätzlichen Kontexttreffer erkannt.";

  return `
    <div class="section-block">
      <h3>Kontext-Scanner</h3>
      <div class="anomaly-overview ${hasEvents ? "" : "empty"}">
        <div>
          <strong>${escapeHtml(summary)}</strong>
          <span>${escapeHtml(anomalyBreakdown(anomalies))}</span>
        </div>
      </div>
      ${renderAnomalyTimeline(anomalies)}
      ${
        hasEvents
          ? `<div class="event-list">${anomalies.clusters.map((cluster) => renderCluster(cluster)).join("")}</div>`
          : '<div class="issue green">AFR, 235.19-Placeholder, Pedal/Throttle und Leerlauf-AFR wirken unauffällig.</div>'
      }
    </div>
  `;
}

function anomalyBreakdown(anomalies) {
  if (!anomalies || !anomalies.total) return "AFR-Spikes, MHD-Placeholder, Sensor-Flatlines und Transientbereiche wurden geprüft.";
  const counts = anomalies.counts || {};
  const parts = [
    counts.afrSpikePull ? `${counts.afrSpikePull} AFR Pull` : counts.afrSpike ? `${counts.afrSpike} AFR Kontext` : "",
    counts.afrDropoutPull ? `${counts.afrDropoutPull} Dropout Pull` : counts.afrDropout ? `${counts.afrDropout} Dropout Kontext` : "",
    counts.mhdAfrPlaceholder ? `${counts.mhdAfrPlaceholder}x 235.19` : "",
    counts.throttleMismatchPull ? `${counts.throttleMismatchPull} Throttle Pull` : counts.throttleMismatch ? `${counts.throttleMismatch} Throttle Kontext` : "",
    counts.hesitationPull ? `${counts.hesitationPull} Hesitation Pull` : counts.hesitation ? `${counts.hesitation} Hesitation Kontext` : "",
    counts.idleAfrInstability ? `${counts.idleAfrInstability} Idle` : "",
    counts.sensorFlatline ? `${counts.sensorFlatline} Flatline` : "",
  ].filter(Boolean);
  return parts.join(" | ") || "Treffer ohne Kategorie";
}

function renderAnomalyTimeline(anomalies) {
  if (!anomalies?.events?.length || !anomalies.timeRange) return "";
  const [start, end] = anomalies.timeRange;
  const span = Math.max(0.01, end - start);
  const markers = anomalies.events
    .slice(0, 28)
    .map((event) => {
      const left = Math.max(0, Math.min(100, ((event.time - start) / span) * 100));
      return `<span class="timeline-marker ${event.severity}" style="left: ${left.toFixed(2)}%;" title="${escapeAttr(event.label)}"></span>`;
    })
    .join("");

  return `
    <div class="anomaly-timeline">
      <div class="timeline-meta">
        <span>${formatTime(start)}</span>
        <span>${formatTime(end)}</span>
      </div>
      <div class="timeline-track">${markers}</div>
    </div>
  `;
}

function renderEvent(event) {
  const context = [
    `t ${formatTime(event.time)}`,
    event.rpm !== null ? `${format(event.rpm, 0, " rpm")}` : "",
    event.boost !== null ? `${format(event.boost, 1, " psi")}` : "",
    event.phase ? event.phase : "",
    event.relevant ? "relevant" : "",
  ].filter(Boolean);

  return `
    <div class="event-card ${event.severity}">
      <div>
        <strong>${escapeHtml(event.type)}</strong>
        <span>${escapeHtml(context.join(" | "))}</span>
      </div>
      <p>${escapeHtml(event.label)}${event.detail ? ` ${escapeHtml(event.detail)}` : ""}</p>
    </div>
  `;
}

function renderCluster(cluster) {
  const time =
    Math.abs(cluster.endTime - cluster.startTime) < 0.05
      ? formatTime(cluster.startTime)
      : `${formatTime(cluster.startTime)}-${formatTime(cluster.endTime)}`;
  const context = [time, cluster.phase, `${cluster.count}x`, cluster.relevant ? "relevant" : ""].filter(Boolean);

  return `
    <div class="event-card ${cluster.severity}">
      <div>
        <strong>${escapeHtml(cluster.type)}</strong>
        <span>${escapeHtml(context.join(" | "))}</span>
      </div>
      <p>${escapeHtml(cluster.label)}</p>
    </div>
  `;
}

function formatTime(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} s` : "n/a";
}

function statBlock(label, value) {
  return `
    <div class="stat">
      <span>${label}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function lambdaSummary(metrics) {
  const bank1 = metrics.fuel?.lambda1;
  const bank2 = metrics.fuel?.lambda2;
  if (bank1 && bank2) return `${format(bank1.avg, 2)} / ${format(bank2.avg, 2)} AFR`;
  if (bank1) return `${format(bank1.avg, 2)} AFR`;
  return "n/a";
}

function fuelTrimSummary(metrics) {
  const stft = metrics.fuel?.stft;
  const ltft = metrics.fuel?.ltft;
  if (!stft && !ltft) return "n/a";
  const parts = [];
  if (stft) parts.push(`STFT ${format(stft.avg, 0, "%")} avg`);
  if (ltft) parts.push(`LTFT ${format(ltft.avg, 0, "%")} avg`);
  return parts.join(" / ");
}

function rowStateLabel(state) {
  const labels = {
    wot_pull: t("rowStateWot"),
    overrun_burble: t("rowStateBurble"),
    shift_transient: t("rowStateShift"),
    idle_cold_start: t("rowStateIdle"),
    data_error: t("rowStateData"),
    unknown: t("rowStateUnknown"),
  };
  return labels[state] || t("rowStateUnknown");
}

function stateShareText(states, state) {
  const count = states?.counts?.[state] || 0;
  const pct = states?.total ? (count / states.total) * 100 : 0;
  return `${count} / ${pct.toFixed(0)}%`;
}

function renderStateTimeline(states) {
  if (!states?.total) return "";
  const order = ["wot_pull", "shift_transient", "overrun_burble", "idle_cold_start", "data_error", "unknown"];
  const segments = (states.segments || [])
    .map((segment) => {
      const width = states.total ? Math.max(1.5, (segment.count / states.total) * 100) : 0;
      const title = `${rowStateLabel(segment.state)} ${formatTime(segment.startTime)}-${formatTime(segment.endTime)}`;
      return `<span class="state-segment ${segment.state}" style="width:${width.toFixed(2)}%;" title="${escapeAttr(title)}"></span>`;
    })
    .join("");

  return `
    <div class="section-block state-block">
      <div class="state-head">
        <h3>${escapeHtml(t("stateOverview"))}</h3>
        <span>${escapeHtml(t("stateDominates", { state: rowStateLabel(states.dominant) }))}</span>
      </div>
      <div class="state-timeline">${segments}</div>
      <div class="state-legend">
        ${order
          .map(
            (state) => `
              <span class="state-chip ${state}">
                <i></i>
                ${escapeHtml(rowStateLabel(state))}: ${escapeHtml(stateShareText(states, state))}
              </span>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

elements.fileInput.addEventListener("change", (event) => {
  handleFiles(event.target.files);
  event.target.value = "";
});

if (elements.mobileCsvButton) {
  elements.mobileCsvButton.addEventListener("click", () => {
    elements.fileInput.click();
  });
}

function clearLoadedLogs() {
  state.documents = [];
  state.results = [];
  state.selectedIndex = null;
  state.pullSelection = {};
  setUploadStatus(t("uploadHint"));
  setView("dashboard");
  render();
}

if (elements.clearButton) {
  elements.clearButton.addEventListener("click", clearLoadedLogs);
}

if (elements.mobileClearButton) {
  elements.mobileClearButton.addEventListener("click", clearLoadedLogs);
}

["dragenter", "dragover"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("dragging");
  });
});

elements.dropZone.addEventListener("drop", (event) => {
  handleFiles(event.dataTransfer.files);
});

elements.ruleInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (!applyingPreset && elements.rulePreset) {
      elements.rulePreset.value = "custom";
      writeStorage(STORAGE_KEYS.preset, "custom");
      setPresetHint(t("customThresholdChanged"));
    }
    if (!state.results.length) return;
    reanalyzeLoaded();
  });
});

if (elements.rulePreset) {
  elements.rulePreset.addEventListener("change", () => {
    applyRulePreset(elements.rulePreset.value, { reanalyze: true });
  });
}

if (elements.referenceExportButton) {
  elements.referenceExportButton.addEventListener("click", exportReferenceLibrary);
}

if (elements.referenceImportButton && elements.referenceImportInput) {
  elements.referenceImportButton.addEventListener("click", () => {
    elements.referenceImportInput.click();
  });
  elements.referenceImportInput.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    importReferenceLibraryFile(file);
    event.target.value = "";
  });
}

if (elements.vehicleProfileSelect) {
  elements.vehicleProfileSelect.addEventListener("change", () => {
    selectVehicleProfile(elements.vehicleProfileSelect.value, { reanalyze: true });
  });
}

if (elements.vehicleProfileSaveButton) {
  elements.vehicleProfileSaveButton.addEventListener("click", saveCurrentVehicleProfile);
}

if (elements.vehicleProfileNewButton) {
  elements.vehicleProfileNewButton.addEventListener("click", createVehicleProfileDraft);
}

if (elements.vehicleProfileDeleteButton) {
  elements.vehicleProfileDeleteButton.addEventListener("click", deleteCurrentVehicleProfile);
}

if (elements.themeToggle) {
  elements.themeToggle.addEventListener("change", () => {
    setTheme(elements.themeToggle.checked ? "dark" : "light");
  });
}

if (elements.languageSelect) {
  elements.languageSelect.addEventListener("change", () => {
    setLanguage(elements.languageSelect.value);
  });
}

elements.navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.view);
    render();
  });
});

migrateStorageKeys();

const savedTheme = readStorage(STORAGE_KEYS.theme);
state.referenceLibrary = readJsonStorage(STORAGE_KEYS.referenceLibrary, []).filter(
  (entry) => entry && entry.id && entry.summary
);
state.vehicleProfiles = readJsonStorage(STORAGE_KEYS.vehicleProfiles, [])
  .map(normalizeVehicleProfile)
  .filter(Boolean);
state.selectedProfileId = readStorage(STORAGE_KEYS.selectedProfileId) || "";
if (state.selectedProfileId && !activeProfile()) state.selectedProfileId = "";
setLanguage(readStorage(STORAGE_KEYS.language) || "de", { rerender: false });
setTheme(savedTheme || "dark");
setView(readStorage(STORAGE_KEYS.view) || "dashboard");
const savedPreset = readStorage(STORAGE_KEYS.preset) || "auto";
const initialProfilePreset = savedPreset !== "custom" ? profilePresetKey(activeProfile()) : null;
applyRulePreset(initialProfilePreset || savedPreset, { reanalyze: false });
render();
