(function attachAnalyzer(root) {
  const DEFAULT_RULES = {
    pullMinDurationWarn: 2.2,
    pedalAvgWarn: 88,
    boostEvaluationMinRpm: 3500,
    boostWarnAvgAbs: 2,
    boostSevereAvgAbs: 4,
    boostUnderWarn: -3.5,
    boostUnderSevere: -7,
    boostOverWarn: 3,
    boostOverSevere: 5,
    timingWarn: 3,
    timingSevere: 6,
    lpfpWarn: 55,
    lpfpSevere: 45,
    lpfpSustainedWarn: 50,
    lpfpSustainedPctWarn: 0.12,
    railWarn: 1400,
    railSevere: 1200,
    lambdaBankDiffWarn: 0.5,
    afrLeanWarn: 13.2,
    stftPeggedWarn: 32,
    fuelTrimBankDiffWarn: 10,
    ltftWarn: 10,
    wgdcWarnAvg: 70,
    wgdcSevereAvg: 80,
    wgdcSevereMax: 95,
    iatWarnMaxC: 60,
    iatSevereMaxC: 75,
    iatWarnRiseC: 20,
    iatSevereRiseC: 30,
    throttleClosurePctWarn: 0.12,
    throttleClosurePctSevere: 0.25,
    afrSpikeWarn: 20,
    afrSpikeSevere: 30,
    afrDropoutWarn: 50,
    mhdAfrPlaceholder: 235.19,
    mhdAfrPlaceholderWarnCount: 3,
    throttleMismatchPedalMin: 60,
    throttleMismatchThrottleMax: 70,
    throttleMismatchDeltaWarn: 35,
    throttleMismatchPullCountWarn: 3,
    hesitationRpmMin: 1600,
    hesitationRpmMax: 1800,
    hesitationPullCountWarn: 3,
    anomalySteadyThrottleMin: 65,
    idleRpmMax: 900,
    idleAfrSwingWarn: 1.3,
    staticValueWarnRows: 12,
    stateWotPedalMin: 85,
    stateWotThrottleMin: 60,
    stateWotMinRpm: 1500,
    stateOverrunPedalMax: 15,
    stateOverrunThrottleMax: 35,
    stateShiftPedalDeltaWarn: 35,
    stateShiftThrottleDeltaWarn: 40,
    stateShiftBoostDeltaWarn: 6,
    stateColdStartWindowSec: 90,
    stateDataBoostAbsMax: 60,
    stateDataRpmMax: 8500,
    burbleMinRpm: 1800,
    burbleMaxRpm: 5500,
    burbleDurationWindow: 2.5,
    n54RecommendedGear: 3,
    n54RecommendedMinRpm: 2500,
    n54RecommendedEndRpm: 6000,
    missingChannelsWarnCount: 4,
  };

  const ROW_STATES = {
    WOT: "wot_pull",
    BURBLE: "overrun_burble",
    SHIFT: "shift_transient",
    IDLE: "idle_cold_start",
    DATA: "data_error",
    UNKNOWN: "unknown",
  };

  const BURBLE_PROFILES = {
    unknown: { label: "Unknown", minRpm: 1800, maxRpm: 5500, durationWindow: 2.5, aggression: 3 },
    off: { label: "Off", minRpm: 1800, maxRpm: 5500, durationWindow: 0.4, aggression: 0 },
    mild: { label: "Mild", minRpm: 1800, maxRpm: 5200, durationWindow: 1.5, aggression: 2 },
    medium: { label: "Medium", minRpm: 1700, maxRpm: 5600, durationWindow: 3, aggression: 5 },
    aggressive: { label: "Aggressive", minRpm: 1500, maxRpm: 6200, durationWindow: 5, aggression: 8 },
  };

  function i18nApi() {
    if (root.BoostDocI18n) return root.BoostDocI18n;
    if (typeof require === "function") {
      try {
        return require("./i18n.js");
      } catch {
        return null;
      }
    }
    return null;
  }

  function analysisLanguage(rules = {}) {
    const fromRules = rules.__language || rules.__profile?.language;
    return i18nApi()?.normalizeLanguage ? i18nApi().normalizeLanguage(fromRules) : fromRules || "de";
  }

  function msg(rules, key, vars = {}) {
    const api = i18nApi();
    return api?.t ? api.t(analysisLanguage(rules), key, vars) : key;
  }

  function msgOr(rules, key, fallback, vars = {}) {
    const text = msg(rules, key, vars);
    return text === key ? fallback : text;
  }

  function makeLocalizedIssue(rules, severity, category, key, vars = {}) {
    return {
      severity,
      category,
      categoryLabel: msg(rules, `analysis.category.${category}`),
      text: msg(rules, key, vars),
      i18nKey: key,
      i18nVars: vars,
    };
  }

  const RULE_PRESETS = {
    n54: {
      label: "N54 Standard",
      detail: "N54-MHD defaults for a typical 3rd-gear WOT log.",
      rules: { ...DEFAULT_RULES },
    },
    n55: {
      label: "N55 Standard",
      detail: "Slightly higher Rail/WGDC margin for N55 logs.",
      rules: {
        ...DEFAULT_RULES,
        boostEvaluationMinRpm: 3300,
        railWarn: 1500,
        railSevere: 1250,
        wgdcWarnAvg: 75,
        wgdcSevereAvg: 85,
        iatWarnMaxC: 65,
        iatSevereMaxC: 80,
        n54RecommendedEndRpm: 6200,
        missingChannelsWarnCount: 5,
      },
    },
    b58_gen1: {
      label: "B58 Gen1",
      detail: "B58 Gen1/MHD defaults with higher Rail pressure and often high WGDC.",
      rules: {
        ...DEFAULT_RULES,
        boostEvaluationMinRpm: 3500,
        timingWarn: 3.5,
        railWarn: 2200,
        railSevere: 1900,
        lpfpWarn: 50,
        lpfpSevere: 40,
        wgdcWarnAvg: 88,
        wgdcSevereAvg: 94,
        wgdcSevereMax: 98,
        iatWarnMaxC: 65,
        iatSevereMaxC: 82,
        iatWarnRiseC: 25,
        iatSevereRiseC: 35,
        missingChannelsWarnCount: 5,
      },
    },
    b58_gen2: {
      label: "B58 Gen2",
      detail: "B58TU/Gen2 defaults with stricter Rail and temperature context.",
      rules: {
        ...DEFAULT_RULES,
        boostEvaluationMinRpm: 3500,
        timingWarn: 3.5,
        railWarn: 2400,
        railSevere: 2050,
        lpfpWarn: 50,
        lpfpSevere: 40,
        wgdcWarnAvg: 86,
        wgdcSevereAvg: 93,
        wgdcSevereMax: 98,
        iatWarnMaxC: 62,
        iatSevereMaxC: 78,
        iatWarnRiseC: 22,
        iatSevereRiseC: 32,
        missingChannelsWarnCount: 5,
      },
    },
    // TODO: calibrate S63 thresholds with real V8 bi-turbo logs; GDI rail/LPFP match b58_gen2, WGDC and IAT may differ
    s63: {
      label: "S63",
      detail: "S63 V8 bi-turbo — placeholder thresholds matching b58_gen2, pending S63-specific calibration.",
      rules: {
        ...DEFAULT_RULES,
        boostEvaluationMinRpm: 3500,
        timingWarn: 3.5,
        railWarn: 2400,
        railSevere: 2050,
        lpfpWarn: 50,
        lpfpSevere: 40,
        wgdcWarnAvg: 86,
        wgdcSevereAvg: 93,
        wgdcSevereMax: 98,
        iatWarnMaxC: 62,
        iatSevereMaxC: 78,
        iatWarnRiseC: 22,
        iatSevereRiseC: 32,
        missingChannelsWarnCount: 5,
      },
    },
  };

  function rulesForPreset(key) {
    return { ...DEFAULT_RULES, ...(RULE_PRESETS[key]?.rules || {}) };
  }

  function presetKeyForVehicle(vehicleInfo) {
    const engine = vehicleInfo?.engine || "";
    if (/S63/i.test(engine)) return "s63";
    if (/S58/i.test(engine)) return "b58_gen2";
    if (/S55/i.test(engine)) return "n55";
    if (/B58 Gen2/i.test(engine)) return "b58_gen2";
    if (/B58 Gen1/i.test(engine)) return "b58_gen1";
    if (/B58/i.test(engine)) return "b58_gen1";
    if (/B4[68]/i.test(engine)) return "b58_gen1";
    if (/N13/i.test(engine)) return "n55";
    if (/N55/i.test(engine)) return "n55";
    if (/N54/i.test(engine)) return "n54";
    return "n54";
  }

  function referenceStatusFromScore(score) {
    if (score < 60) return "red";
    if (score < 80) return "yellow";
    return "green";
  }

  function scoreBelow(value, warn, severe) {
    if (!Number.isFinite(value)) return null;
    if (value <= severe) return 35;
    if (value <= warn) return 68;
    return 100;
  }

  function scoreAbove(value, warn, severe) {
    if (!Number.isFinite(value)) return null;
    if (value >= severe) return 35;
    if (value >= warn) return 68;
    return 100;
  }

  function referenceCard(label, score, value, detail) {
    const finalScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null;
    return {
      label,
      score: finalScore,
      status: finalScore === null ? "neutral" : referenceStatusFromScore(finalScore),
      value,
      detail,
    };
  }

  function scoreFromValidation(validation) {
    if (!validation) return null;
    if (validation.status === "red") return 35;
    if (validation.status === "yellow") return 72;
    return 100;
  }

  function buildReferenceComparison(vehicleInfo, metrics, rules) {
    const presetKey = presetKeyForVehicle(vehicleInfo);
    const preset = RULE_PRESETS[presetKey] || RULE_PRESETS.n54;
    const referenceRules = rulesForPreset(presetKey);
    const boostError = metrics.boost?.error;
    const timing = metrics.timing?.corrections;
    const rail = metrics.fuel?.rail;
    const lpfp = metrics.fuel?.lpfp;
    const lambda1 = metrics.fuel?.lambda1;
    const stft = metrics.fuel?.stft;
    const ltft = metrics.fuel?.ltft;
    const wgdc = metrics.turbo?.wgdc;
    const iat = metrics.temps?.iat;
    const control = metrics.control || {};
    const cards = [];

    cards.push(
      referenceCard(
        msg(rules, "analysis.ref.logForm"),
        scoreFromValidation(metrics.validation),
        metrics.validation?.summary || "n/a",
        msg(rules, "analysis.ref.logFormDetail")
      )
    );

    const boostScore = boostError ? scoreAbove(boostError.avgAbs, referenceRules.boostWarnAvgAbs, referenceRules.boostSevereAvgAbs) : null;
    cards.push(
      referenceCard(
        "Boost Tracking",
        boostScore,
        boostError ? `${boostError.avgAbs.toFixed(2)} psi avg` : "n/a",
        msg(rules, "analysis.ref.boostDetail")
      )
    );

    const timingScore = timing ? scoreAbove(timing.max, referenceRules.timingWarn, referenceRules.timingSevere) : null;
    cards.push(
      referenceCard(
        "Timing",
        timingScore,
        timing ? `${timing.max.toFixed(1)} ${msg(rules, "analysis.unit.degree")} max` : "n/a",
        msg(rules, "analysis.ref.timingDetail")
      )
    );

    const railScore = rail ? scoreBelow(rail.min, referenceRules.railWarn, referenceRules.railSevere) : null;
    const lpfpScore = lpfp ? scoreBelow(lpfp.min, referenceRules.lpfpWarn, referenceRules.lpfpSevere) : null;
    const fuelScores = [railScore, lpfpScore].filter((score) => score !== null);
    let trimPenalty = 0;
    if (stft && Math.max(Math.abs(stft.min), Math.abs(stft.max)) >= referenceRules.stftPeggedWarn) trimPenalty += 18;
    if (ltft && Math.max(Math.abs(ltft.min), Math.abs(ltft.max)) > referenceRules.ltftWarn) trimPenalty += 12;
    const fuelScore = fuelScores.length
      ? Math.max(0, Math.min(...fuelScores) - trimPenalty)
      : trimPenalty
        ? Math.max(0, 78 - trimPenalty)
        : null;
    cards.push(
      referenceCard(
        "Fueling",
        fuelScore,
        [
          rail ? `Rail ${rail.min.toFixed(0)} psi` : "Rail n/a",
          lpfp ? `LPFP ${lpfp.min.toFixed(0)} psi` : "LPFP n/a",
        ].join(" / "),
        msg(rules, "analysis.ref.fuelDetail")
      )
    );

    const lambdaScore = lambda1 ? scoreAbove(lambda1.avg, referenceRules.afrLeanWarn, referenceRules.afrLeanWarn + 0.6) : null;
    cards.push(
      referenceCard(
        "Lambda / AFR",
        lambdaScore,
        lambda1 ? `${lambda1.avg.toFixed(2)} AFR avg` : "n/a",
        msg(rules, "analysis.ref.lambdaDetail")
      )
    );

    const wgdcScore = wgdc ? scoreAbove(wgdc.avg, referenceRules.wgdcWarnAvg, referenceRules.wgdcSevereAvg) : null;
    cards.push(
      referenceCard(
        msg(rules, "analysis.ref.turboReserve"),
        wgdcScore,
        wgdc ? `${wgdc.avg.toFixed(0)}% avg` : "n/a",
        msg(rules, "analysis.ref.turboDetail")
      )
    );

    const iatScore = iat
      ? Math.min(
          scoreAbove(iat.max, referenceRules.iatWarnMaxC, referenceRules.iatSevereMaxC),
          scoreAbove(iat.rise, referenceRules.iatWarnRiseC, referenceRules.iatSevereRiseC)
        )
      : null;
    cards.push(
      referenceCard(
        msg(rules, "analysis.category.Temperatur"),
        iatScore,
        iat ? `${iat.max.toFixed(0)} C max / +${iat.rise.toFixed(0)} C` : "n/a",
        msg(rules, "analysis.ref.iatDetail")
      )
    );

    const interventionScore = control.torqueLimiterActive
      ? 30
      : Number.isFinite(control.throttleClosurePct)
        ? scoreAbove(control.throttleClosurePct, referenceRules.throttleClosurePctWarn, referenceRules.throttleClosurePctSevere)
        : null;
    cards.push(
      referenceCard(
        msg(rules, "analysis.ref.dmeIntervention"),
        interventionScore,
        control.torqueLimiterActive ? "Torque Limiter" : `${((control.throttleClosurePct || 0) * 100).toFixed(0)}% Closure`,
        msg(rules, "analysis.ref.dmeDetail")
      )
    );

    const scored = cards.filter((card) => card.score !== null);
    const weightedScore = scored.length
      ? scored.reduce((sum, card) => sum + card.score, 0) / scored.length
      : null;
    const score = weightedScore === null ? null : Math.round(weightedScore);
    const weakCards = cards.filter((card) => card.status === "red" || card.status === "yellow");
    const status =
      score === null
        ? "neutral"
        : weakCards.some((card) => card.status === "red") || score < 60
          ? "red"
          : weakCards.length || score < 80
            ? "yellow"
            : "green";

    return {
      profile: msgOr(rules, `analysis.preset.${presetKey}.label`, preset.label),
      presetKey,
      stage: vehicleInfo?.stage || "",
      fuel: vehicleInfo?.fuel || "",
      score,
      status,
      title:
        score === null
          ? msg(rules, "analysis.ref.notReady")
          : status === "green"
            ? msg(rules, "analysis.ref.nearClean")
            : status === "yellow"
              ? msg(rules, "analysis.ref.partlyBelow")
              : msg(rules, "analysis.ref.clearlyBelow"),
      detail: weakCards.length
        ? weakCards.slice(0, 3).map((card) => card.label).join(", ")
        : msg(rules, "analysis.ref.noDeviation"),
      cards,
    };
  }

  function countDelimiterOutsideQuotes(line, delimiter) {
    let count = 0;
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      const next = line[i + 1];
      if (ch === '"' && next === '"') {
        i += 1;
      } else if (ch === '"') {
        quoted = !quoted;
      } else if (!quoted && ch === delimiter) {
        count += 1;
      }
    }
    return count;
  }

  function detectHeaderIndex(lines) {
    const index = lines.findIndex((line) => /(^|[,;\t])\s*(Time|Timestamp)\s*([,;\t]|$)/i.test(line));
    return index >= 0 ? index : 0;
  }

  function detectDelimiter(lines) {
    const candidates = [",", ";", "\t"];
    const sample = lines.filter((line) => line.trim()).slice(0, 5);
    const scored = candidates
      .map((delimiter) => ({
        delimiter,
        score: sample.reduce((total, line) => total + countDelimiterOutsideQuotes(line, delimiter), 0),
      }))
      .sort((a, b) => b.score - a.score);
    return scored[0]?.score > 0 ? scored[0].delimiter : ",";
  }

  function parseDelimitedRecords(csvText, delimiter) {
    const records = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let i = 0; i < csvText.length; i += 1) {
      const ch = csvText[i];
      const next = csvText[i + 1];

      if (quoted) {
        if (ch === '"' && next === '"') {
          cell += '"';
          i += 1;
        } else if (ch === '"') {
          quoted = false;
        } else {
          cell += ch;
        }
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === delimiter) {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        records.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }

    if (cell.length || row.length) {
      row.push(cell);
      records.push(row);
    }

    return records;
  }

  function parseCsv(text) {
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalized.split("\n");
    const headerIndex = detectHeaderIndex(lines);
    const csvLines = lines.slice(headerIndex);
    const csvText = csvLines.join("\n").trim();
    if (!csvText) return { headers: [], rows: [] };

    const delimiter = detectDelimiter(csvLines);
    const records = parseDelimitedRecords(csvText, delimiter);
    const headers = (records.shift() || []).map((value) => value.trim());
    const rows = records
      .filter((record) => record.some((value) => String(value).trim() !== ""))
      .map((record) => {
        const item = {};
        headers.forEach((header, index) => {
          item[header] = record[index] ?? "";
        });
        return item;
      });

    return { headers, rows };
  }

  function numberValue(value) {
    if (value === null || value === undefined) return NaN;
    const clean = String(value).trim().replace(/\s+/g, "");
    if (!clean) return NaN;
    const normalized = /^[-+]?\d+,\d+(?:e[-+]?\d+)?$/i.test(clean) && !clean.includes(".")
      ? clean.replace(",", ".")
      : clean;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function pickColumn(headers, patterns) {
    for (const pattern of patterns) {
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, "i");
      const match = headers.find((header) => regex.test(header));
      if (match) return match;
    }
    return null;
  }

  function isTimingCorrectionColumn(header) {
    return /(?:Cyl[\s.]*\d+\s*Timing\s*Cor|Timing\s*Cor(?:rection)?\s*Cyl[\s.]*\d+|Ignition\s*Cor(?:rection)?\s*Cyl[\s.]*\d+|Knock\s*Cor(?:rection)?\s*Cyl[\s.]*\d+)/i.test(header);
  }

  function buildColumnMap(headers) {
    return {
      time: pickColumn(headers, [/^Time(?:\s*(?:\(s\)|\[s\]|\[ms\]))?$/i, /^Zeit/i, /^Timestamp/i]),
      pedal: pickColumn(headers, [/Accel\.?\s*Ped/i, /Accelerator Pedal/i, /Pedal Position/i, /^Pedal/i]),
      boost: pickColumn(headers, [/^Boost \((PSI|Bar)\)$/i, /^Boost \[(hPa|kPa|MPa)\]$/i, /Boost intake \[(hPa|kPa)\]/i, /Boost pressure/i, /^Boost mean/i, /Boost actual/i, /Boost \(mani\)/i]),
      boostMani: pickColumn(headers, [/Boost \(mani\)/i, /Manifold pressure/i, /Boost intake \[(hPa|kPa)\]/i]),
      boostDeviation: pickColumn(headers, [/Boost deviation \((PSI|Bar|MPa)\)/i, /Boost deviation \[(hPa|kPa|MPa)\]/i, /Boost deviation RAM/i]),
      target: pickColumn(headers, [/^Boost target \((PSI|Bar)\)$/i, /^Boost target \[(hPa|kPa|MPa)\]$/i, /Boost target RAM/i, /MHD\+ Boost Target/i, /Target Boost/i, /Boost target/i, /Boost requested/i]),
      gear: pickColumn(headers, [/^Gear/i, /^Gang/i]),
      rpm: pickColumn(headers, [/^RPM(?:\s*\(rpm\))?$/i, /Engine speed/i, /Motor speed/i, /RPM/i]),
      speed: pickColumn(headers, [/^Speed/i, /^Vehicle speed/i, /^Geschwindigkeit/i]),
      iat: pickColumn(headers, [/^IAT/i, /Intake air temp/i, /Air intake temperature/i, /^Charge air temp/i, /Charge Air temperature/i]),
      chargeAirTemp: pickColumn(headers, [/^Charge air temp/i, /Charge Air temperature/i, /Intake air temp/i, /Air intake temperature/i]),
      coolant: pickColumn(headers, [/^Coolant/i, /^Engine temperature/i, /^Water temperature/i]),
      oilTemp: pickColumn(headers, [/^Oil temp/i, /^Engine Oil temperature/i]),
      egt: pickColumn(headers, [/Exhaust gas calculated temp/i, /^EGT/i, /Abgastemperatur/i]),
      railReq: pickColumn(headers, [/Rail pressure req/i, /Rail pressure requested/i, /Rail pressure target/i, /Fuel rail pressure target/i, /High pressure fuel target/i]),
      lpfp: pickColumn(headers, [/PI\+\s*LPFP Actual/i, /LPFP Actual/i, /Fuel low pressure/i, /Low pressure fuel pump/i, /Low pressure fuel/i, /^LPFP/i]),
      rail: pickColumn(headers, [/Rail pressure mean\s*1?\s*(?:\((PSI|Bar|MPa)\)|\[(hPa|kPa|MPa)\])?/i, /Rail pressure actual/i, /^Rail pressure (?:\((PSI|Bar|MPa)\)|\[(hPa|kPa|MPa)\])$/i, /Fuel rail pressure/i, /Fuel high pressure/i, /High pressure fuel/i, /^HPFP/i]),
      lambda1: pickColumn(headers, [/^Lambda 1(?: \(AFR\))?$/i, /^Lambda actual/i, /^AFR$/i, /AFR bank 1/i, /Lambda bank 1/i]),
      lambda2: pickColumn(headers, [/^Lambda 2(?: \(AFR\))?$/i, /AFR bank 2/i, /Lambda bank 2/i]),
      lambdaTarget: pickColumn(headers, [/Lambda target/i]),
      wgdc: pickColumn(headers, [/^WGDC 1 \(%\)$/i, /WGDC Bank 1/i, /^WGDC \(%\)$/i, /WGDC After PID/i, /Wastegate Duty/i]),
      wgdcBase: pickColumn(headers, [/WGDC Base Value/i, /MHD\+ WGDC Base/i]),
      throttle: pickColumn(headers, [/Throttle Position/i, /Throttle plate/i, /Throttle angle/i, /Throttle valve/i, /^TPS/i, /Drosselklappe/i]),
      loadActual: pickColumn(headers, [/^Load actual$/i, /Load act\./i, /Load actual RAM/i, /Load act\. \(%\)/i]),
      loadReq: pickColumn(headers, [/^Load req\.?$/i, /Load req\. \(%\)/i, /Load requested/i, /Load request/i, /^Load target/i]),
      maf: pickColumn(headers, [/^MAF \(g\/s\)$/i, /^Air mass \[kg\/h\]$/i]),
      mafReq: pickColumn(headers, [/MAF Req/i, /MAF req/i, /MAF REQ/i]),
      stft1: pickColumn(headers, [/STFT 1/i, /Short Fuel Trim/i]),
      stft2: pickColumn(headers, [/STFT 2/i]),
      ltft1: pickColumn(headers, [/LTFT 1/i, /^LTFT/i]),
      ltft2: pickColumn(headers, [/LTFT 2/i]),
      ethanol: pickColumn(headers, [/Ethanol Content \(Active\)/i, /Ethanol Content \(Wired\)/i, /Ethanol Content \(CAN\)/i, /^Ethanol Content/i]),
      torqueLimit: pickColumn(headers, [/Torque Lim\. active/i, /Torque Limiter active/i, /Status Torque limiter/i]),
      torqueLimitIndex: pickColumn(headers, [/Torque lim\.?\s*1/i, /^Limiter 1/i, /^TQ Max Index/i, /^RF Max Index/i]),
      antilag: pickColumn(headers, [/Antilag Active/i]),
    };
  }

  function values(rows, column, options = {}) {
    if (!column) return [];
    const { ignoreZero = false, valid = () => true, convert = (value) => value } = options;
    return rows
      .map((row) => numberValue(row[column]))
      .filter((value) => Number.isFinite(value))
      .filter((value) => !ignoreZero || Math.abs(value) > 1e-9)
      .map(convert)
      .filter((value) => Number.isFinite(value) && valid(value));
  }

  function stats(list) {
    if (!list.length) return null;
    const sum = list.reduce((total, value) => total + value, 0);
    return {
      min: Math.min(...list),
      avg: sum / list.length,
      max: Math.max(...list),
    };
  }

  function pairedDiffs(rows, columnA, columnB, options = {}) {
    if (!columnA || !columnB) return [];
    const { valid = () => true } = options;
    return rows
      .map((row) => {
        const first = numberValue(row[columnA]);
        const second = numberValue(row[columnB]);
        return Number.isFinite(first) && Number.isFinite(second) && valid(first) && valid(second)
          ? Math.abs(first - second)
          : NaN;
      })
      .filter((value) => Number.isFinite(value));
  }

  function percentile(list, percentileValue) {
    if (!list.length) return NaN;
    const sorted = [...list].sort((a, b) => a - b);
    const index = Math.round(percentileValue * (sorted.length - 1));
    return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
  }

  function convertTemp(value, column) {
    if (!Number.isFinite(value)) return NaN;
    return column && /(\*F|\(F\)|\[F\]|°F)/i.test(column) ? ((value - 32) * 5) / 9 : value;
  }

  function normalizeTime(value, column) {
    if (!Number.isFinite(value)) return NaN;
    return column && /\[ms\]|\(ms\)/i.test(column) ? value / 1000 : value;
  }

  function pressureToPsi(value, column) {
    if (!Number.isFinite(value)) return NaN;
    if (!column) return value;
    if (/(\(bar\)|\[bar\])/i.test(column)) return value * 14.5038;
    if (/(\(MPa\)|\[MPa\])/i.test(column)) return value * 145.038;
    if (/(\(kPa\)|\[kPa\])/i.test(column)) {
      return /boost|manifold|intake/i.test(column) && value > 120
        ? (value - 100) * 0.145038
        : value * 0.145038;
    }
    if (/(\(hPa\)|\[hPa\])/i.test(column)) {
      // Datazap [hPa] exports gauge pressure for boost/intake/target columns;
      // the old value>1200 absolute-detection caused a discontinuity at high gauge values.
      return value * 0.0145038;
    }
    return value;
  }

  function lambdaToAfr(value, column) {
    if (!Number.isFinite(value)) return NaN;
    const looksLikeLambdaUnit = column && /(\[lambda\]|\(lambda\)|Lambda actual)/i.test(column);
    return looksLikeLambdaUnit && value > 0 && value < 2 ? value * 14.7 : value;
  }

  function massFlowToGps(value, column) {
    if (!Number.isFinite(value)) return NaN;
    return column && /\[kg\/h\]|\(kg\/h\)/i.test(column) ? value / 3.6 : value;
  }

  function contiguousSegments(indices) {
    if (!indices.length) return [];
    const segments = [];
    let start = indices[0];
    let previous = indices[0];

    for (const index of indices.slice(1)) {
      if (index === previous + 1) {
        previous = index;
      } else {
        segments.push([start, previous]);
        start = index;
        previous = index;
      }
    }

    segments.push([start, previous]);
    return segments;
  }

  function splitByGear(rows, segment, columns) {
    const [start, end] = segment;
    if (!columns.gear) return [segment];
    const parts = [];
    let partStart = start;
    let lastGear = roundedGear(rows[start], columns.gear);

    for (let index = start + 1; index <= end; index += 1) {
      const gear = roundedGear(rows[index], columns.gear);
      if (gear !== lastGear && gear !== null && lastGear !== null) {
        parts.push([partStart, index - 1]);
        partStart = index;
      }
      if (gear !== null) lastGear = gear;
    }

    parts.push([partStart, end]);
    return parts;
  }

  function roundedGear(row, gearColumn) {
    const gear = numberValue(row[gearColumn]);
    return Number.isFinite(gear) ? Math.round(gear) : null;
  }

  function duration(rows, segment, timeColumn) {
    if (!timeColumn) return NaN;
    const first = normalizeTime(numberValue(rows[segment[0]][timeColumn]), timeColumn);
    const last = normalizeTime(numberValue(rows[segment[1]][timeColumn]), timeColumn);
    return Number.isFinite(first) && Number.isFinite(last) ? last - first : NaN;
  }

  function rangeLabel(min, max, suffix = "", digits = 0) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return "n/a";
    return `${min.toFixed(digits)}-${max.toFixed(digits)}${suffix ? ` ${suffix}` : ""}`;
  }

  function makeSegments(rows, columns) {
    const pedal = columns.pedal;
    const boost = columns.boost;
    const target = columns.target;
    const loadReq = columns.loadReq;
    const indices90 = [];
    const indices85 = [];
    const fallback = [];

    rows.forEach((row, index) => {
      const pedalValue = numberValue(row[pedal]);
      const boostValue = pressureToPsi(numberValue(row[boost]), boost);
      const targetValue = pressureToPsi(numberValue(row[target]), target);
      const loadValue = numberValue(row[loadReq]);

      if (Number.isFinite(pedalValue) && pedalValue >= 90) indices90.push(index);
      if (Number.isFinite(pedalValue) && pedalValue >= 85) indices85.push(index);
      if (
        (Number.isFinite(boostValue) && boostValue >= 5) ||
        (Number.isFinite(targetValue) && targetValue >= 5) ||
        (Number.isFinite(loadValue) && loadValue >= 120)
      ) {
        fallback.push(index);
      }
    });

    const baseSegments =
      contiguousSegments(indices90).length > 0
        ? contiguousSegments(indices90)
        : contiguousSegments(indices85).length > 0
          ? contiguousSegments(indices85)
          : contiguousSegments(fallback);

    const byGear = baseSegments.flatMap((segment) => splitByGear(rows, segment, columns));
    return { baseSegments, byGear };
  }

  function scoreSegment(rows, segment, columns) {
    const segmentRows = rows.slice(segment[0], segment[1] + 1);
    const dur = duration(rows, segment, columns.time);
    const rpmValues = values(segmentRows, columns.rpm);
    const boostValues = values(segmentRows, columns.boost, {
      convert: (value) => pressureToPsi(value, columns.boost),
    });
    const targetValues = values(segmentRows, columns.target, {
      convert: (value) => pressureToPsi(value, columns.target),
    });
    const rpmSpan = rpmValues.length ? Math.max(...rpmValues) - Math.min(...rpmValues) : 0;
    const targetPeak = targetValues.length ? Math.max(...targetValues) : 0;
    const boostPeak = boostValues.length ? Math.max(...boostValues) : 0;
    const rowScore = segmentRows.length / 20;
    return (
      (Number.isFinite(dur) ? dur : 0) +
      rpmSpan / 800 +
      targetPeak / 5 +
      boostPeak / 7 +
      rowScore
    );
  }

  function selectSegment(rows, columns, segments) {
    const baseCandidates = segments.baseSegments
      .filter((segment) => segment[1] - segment[0] + 1 >= 5)
      .map((segment) => ({ segment, score: scoreSegment(rows, segment, columns) }))
      .sort((a, b) => b.score - a.score);

    if (baseCandidates.length) return baseCandidates[0].segment;

    const gearCandidates = segments.byGear
      .filter((segment) => segment[1] - segment[0] + 1 >= 5)
      .map((segment) => ({ segment, score: scoreSegment(rows, segment, columns) }))
      .sort((a, b) => b.score - a.score);

    if (gearCandidates.length) return gearCandidates[0].segment;

    const fallback = segments.baseSegments
      .filter((segment) => segment[1] - segment[0] + 1 >= 3)
      .map((segment) => ({ segment, score: scoreSegment(rows, segment, columns) }))
      .sort((a, b) => b.score - a.score);

    return fallback.length ? fallback[0].segment : null;
  }

  function segmentKey(segment) {
    return `${segment[0]}:${segment[1]}`;
  }

  function makePullCandidates(rows, columns, segments) {
    const source = segments.byGear.length ? segments.byGear : segments.baseSegments;
    const seen = new Set();
    return source
      .filter((segment) => segment[1] - segment[0] + 1 >= 5)
      .map((segment) => ({ segment, score: scoreSegment(rows, segment, columns) }))
      .filter((candidate) => {
        const key = segmentKey(candidate.segment);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.segment[0] - b.segment[0])
      .map((candidate, index) => ({
        ...candidate,
        index,
        label: `Pull ${index + 1}`,
      }));
  }

  function summarizePullResult(result, candidate) {
    const metrics = result.metrics || {};
    return {
      index: candidate.index,
      label: candidate.label,
      segment: candidate.segment,
      score: candidate.score,
      status: result.status,
      statusLabel: result.statusLabel,
      headline: result.headline,
      tuning: result.tuning,
      issues: result.issues || [],
      diagnoses: result.diagnoses || [],
      notes: result.notes || [],
      missingChannels: result.missingChannels || [],
      metrics,
      summary: {
        gear: metrics.pull?.gear ?? "n/a",
        duration: metrics.selectedSegment?.duration ?? NaN,
        rpmRange: metrics.pull?.rpmRange ?? null,
        boostAvgAbs: metrics.boost?.error?.avgAbs ?? NaN,
        timingMax: metrics.timing?.corrections?.max ?? NaN,
        railMin: metrics.fuel?.rail?.min ?? NaN,
        lpfpMin: metrics.fuel?.lpfp?.min ?? NaN,
        wgdcAvg: metrics.turbo?.wgdc?.avg ?? NaN,
      },
    };
  }

  function statusFromStatuses(statuses) {
    if (statuses.includes("red")) return "red";
    if (statuses.includes("yellow")) return "yellow";
    return "green";
  }

  function headlineFromPulls(pulls, fallback, rules) {
    if (pulls.length <= 1) return fallback;
    const worst = [...pulls].sort(
      (a, b) => severityRank(b.status) - severityRank(a.status) || b.score - a.score
    )[0];
    const red = pulls.filter((pull) => pull.status === "red").length;
    const yellow = pulls.filter((pull) => pull.status === "yellow").length;
    if (red) return msg(rules, "analysis.headline.multiRed", { pulls: pulls.length, count: red, headline: worst.headline });
    if (yellow) return msg(rules, "analysis.headline.multiYellow", { pulls: pulls.length, count: yellow, headline: worst.headline });
    return msg(rules, "analysis.headline.multiClean", { pulls: pulls.length });
  }

  function statusFromIssues(issues) {
    if (issues.some((issue) => issue.severity === "red")) return "red";
    if (issues.some((issue) => issue.severity === "yellow")) return "yellow";
    return "green";
  }

  function labelForStatus(status, rules) {
    if (status === "red") return msg(rules, "statusRed");
    if (status === "yellow") return msg(rules, "statusYellow");
    return msg(rules, "statusGreen");
  }

  function inferVehicleInfo(filename, headers, rules = DEFAULT_RULES) {
    const descriptor = headers.find((header) => /^MHD\s/i.test(header)) || "";
    const source = `${filename} ${descriptor}`.toUpperCase();
    const normalizedSource = source.replace(/[_-]+/g, " ");
    let engine = msg(rules, "analysis.vehicle.unknown");

    if (source.includes("S63") || source.includes("F9X") || source.includes("00004ACF")) {
      engine = "S63";
    } else if (source.includes("S58")) {
      engine = "S58";
    } else if (source.includes("S55")) {
      engine = "S55";
    } else if (source.includes("GEN2") || source.includes("B58TU2")) {
      engine = "B58 Gen2";
    } else if (source.includes("GEN1") || source.includes("000030") || source.includes("B58")) {
      engine = "B58 Gen1";
    } else if (source.includes("B48") || source.includes("B46") || source.includes("B48TU") || source.includes("B46TU")) {
      engine = "B48";
    } else if (source.includes("N13")) {
      engine = "N13";
    } else if (source.includes("I8A0S") || source.includes("IJE0S")) {
      engine = "N54";
    } else if (source.includes("N55") || source.includes("98G0B") || source.includes("9E60B") || source.includes("000021571")) {
      engine = "N55";
    }

    const drive = source.includes("XDRIVE") ? "xDrive" : "";
    const stageMatch =
      source.match(/STAGE\s*\d\+?|STG\s*\d\+?/i) ||
      normalizedSource.match(/\bST\s*\d(?:\.\d)?\b/i);
    const ethanolMatch = normalizedSource.match(/\bE(?:10|15|20|25|30|40|50|60|70|85)\b/i);
    const octaneMatch = normalizedSource.match(/\b(?:91|93|95|98|100)\s*(?:AKI|RON|OCT|OCTANE)\b/i);
    const fuelMatch = ethanolMatch || octaneMatch;
    const map = descriptor
      .replace(/^MHD\s+\S+\s+/i, "")
      .replace(/\.mhd$/i, "")
      .trim();

    return {
      engine,
      drive,
      descriptor,
      map,
      stage: stageMatch ? stageMatch[0].replace(/\s+/g, " ").trim() : "",
      fuel: fuelMatch ? fuelMatch[0].replace(/\s+/g, "").toUpperCase() : "",
    };
  }

  function severityRank(severity) {
    if (severity === "red") return 2;
    if (severity === "yellow") return 1;
    return 0;
  }

  function eventTime(row, columns, fallbackIndex) {
    const time = columns.time ? normalizeTime(numberValue(row[columns.time]), columns.time) : NaN;
    return Number.isFinite(time) ? time : fallbackIndex;
  }

  function timeLabel(value) {
    return Number.isFinite(value) ? `${value.toFixed(2)} s` : "n/a";
  }

  function isMhdAfrPlaceholder(value, rules) {
    return Math.abs(value - rules.mhdAfrPlaceholder) < 0.02 || value > 100;
  }

  function isAfrDropout(value, rules) {
    return isMhdAfrPlaceholder(value, rules) || value >= rules.afrDropoutWarn;
  }

  function drivingContext(row, columns, rules) {
    const rpm = columns.rpm ? numberValue(row[columns.rpm]) : NaN;
    const pedal = columns.pedal ? numberValue(row[columns.pedal]) : NaN;
    const throttle = columns.throttle ? numberValue(row[columns.throttle]) : NaN;
    const boost = columns.boost ? pressureToPsi(numberValue(row[columns.boost]), columns.boost) : NaN;
    const target = columns.target ? pressureToPsi(numberValue(row[columns.target]), columns.target) : NaN;
    const loadReq = columns.loadReq ? numberValue(row[columns.loadReq]) : NaN;
    const hasPedal = Number.isFinite(pedal);
    const hasThrottle = Number.isFinite(throttle);
    const hasRpm = Number.isFinite(rpm);
    const loaded =
      (hasPedal && pedal >= 45) ||
      (Number.isFinite(boost) && boost > 3) ||
      (Number.isFinite(target) && target > 5) ||
      (Number.isFinite(loadReq) && loadReq >= 120);
    const idle =
      hasRpm &&
      rpm > 450 &&
      rpm < rules.idleRpmMax &&
      (!hasPedal || pedal < 12) &&
      (!Number.isFinite(boost) || boost < 2);
    const overrun =
      hasRpm &&
      rpm >= rules.idleRpmMax &&
      hasPedal &&
      pedal <= 8 &&
      (!hasThrottle || throttle <= 20) &&
      (!Number.isFinite(boost) || boost < 2);
    const steadyPull =
      loaded &&
      hasPedal &&
      pedal >= 85 &&
      (!hasRpm || rpm >= rules.boostEvaluationMinRpm) &&
      (!hasThrottle || throttle >= rules.anomalySteadyThrottleMin);
    const spool =
      loaded &&
      hasRpm &&
      rpm < rules.boostEvaluationMinRpm &&
      hasPedal &&
      pedal >= 60;
    const transient = loaded && !steadyPull;
    let phase = msg(rules, "analysis.phase.partLoad");

    if (steadyPull) phase = msg(rules, "analysis.phase.steadyPull");
    else if (spool) phase = msg(rules, "analysis.phase.spool");
    else if (overrun) phase = msg(rules, "analysis.phase.overrun");
    else if (idle) phase = msg(rules, "analysis.phase.idle");
    else if (transient) phase = msg(rules, "analysis.phase.transient");

    return {
      rpm,
      pedal,
      throttle,
      boost,
      target,
      loadReq,
      loaded,
      idle,
      overrun,
      steadyPull,
      spool,
      transient,
      phase,
    };
  }

  function resolveBurbleProfile(profile = {}, rules = DEFAULT_RULES) {
    const mode = String(profile?.burbleMode || profile?.burble?.mode || "unknown").toLowerCase();
    const preset = BURBLE_PROFILES[mode] || BURBLE_PROFILES.unknown;
    const custom = mode === "custom";
    const numberFrom = (value, fallback) => {
      if (value === null || value === undefined || String(value).trim() === "") return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    return {
      mode: custom ? "custom" : preset === BURBLE_PROFILES.unknown ? "unknown" : mode,
      label: custom
        ? msgOr(rules, "analysis.burble.custom", "Custom")
        : msgOr(rules, `analysis.burble.${mode}`, preset.label),
      minRpm: numberFrom(profile?.burbleMinRpm ?? profile?.burble?.minRpm, preset.minRpm ?? rules.burbleMinRpm),
      maxRpm: numberFrom(profile?.burbleMaxRpm ?? profile?.burble?.maxRpm, preset.maxRpm ?? rules.burbleMaxRpm),
      durationWindow: numberFrom(
        profile?.burbleDuration ?? profile?.burble?.durationWindow,
        preset.durationWindow ?? rules.burbleDurationWindow
      ),
      aggression: numberFrom(profile?.burbleAggression ?? profile?.burble?.aggression, preset.aggression ?? 3),
      minSpeed: numberFrom(profile?.burbleMinSpeed ?? profile?.burble?.minSpeed, 0),
    };
  }

  function valueFrom(row, column, convert = (value) => value) {
    if (!row || !column) return NaN;
    const raw = numberValue(row[column]);
    if (!Number.isFinite(raw)) return NaN;
    const converted = convert(raw);
    return Number.isFinite(converted) ? converted : NaN;
  }

  function normalizeSignals(row, prev = null, next = null, ctx = {}) {
    const columns = ctx.columns || buildColumnMap(Object.keys(row || {}));
    const readPressure = (source, column) => valueFrom(source, column, (value) => pressureToPsi(value, column));
    const time = normalizeTime(valueFrom(row, columns.time), columns.time);
    const prevTime = normalizeTime(valueFrom(prev, columns.time), columns.time);
    const nextTime = normalizeTime(valueFrom(next, columns.time), columns.time);
    const dtPrev = Number.isFinite(time) && Number.isFinite(prevTime) && time !== prevTime ? Math.abs(time - prevTime) : 1;
    const dtNext = Number.isFinite(nextTime) && Number.isFinite(time) && nextTime !== time ? Math.abs(nextTime - time) : 1;
    const rpm = valueFrom(row, columns.rpm);
    const prevRpm = valueFrom(prev, columns.rpm);
    const nextRpm = valueFrom(next, columns.rpm);
    const pedal = valueFrom(row, columns.pedal);
    const prevPedal = valueFrom(prev, columns.pedal);
    const throttle = valueFrom(row, columns.throttle);
    const prevThrottle = valueFrom(prev, columns.throttle);
    const boost = readPressure(row, columns.boost);
    const prevBoost = readPressure(prev, columns.boost);
    const target = readPressure(row, columns.target);
    const gear = valueFrom(row, columns.gear);
    const prevGear = valueFrom(prev, columns.gear);

    return {
      time,
      rpm,
      pedal,
      throttle,
      boost,
      target,
      rail: readPressure(row, columns.rail),
      lpfp: readPressure(row, columns.lpfp),
      lambda1: valueFrom(row, columns.lambda1),
      lambda2: valueFrom(row, columns.lambda2),
      wgdc: valueFrom(row, columns.wgdc),
      loadReq: valueFrom(row, columns.loadReq),
      loadActual: valueFrom(row, columns.loadActual),
      speed: valueFrom(row, columns.speed),
      gear,
      dRpm: Number.isFinite(rpm) && Number.isFinite(prevRpm) ? (rpm - prevRpm) / dtPrev : NaN,
      nextDRpm: Number.isFinite(nextRpm) && Number.isFinite(rpm) ? (nextRpm - rpm) / dtNext : NaN,
      dPedal: Number.isFinite(pedal) && Number.isFinite(prevPedal) ? pedal - prevPedal : NaN,
      dThrottle: Number.isFinite(throttle) && Number.isFinite(prevThrottle) ? throttle - prevThrottle : NaN,
      dBoost: Number.isFinite(boost) && Number.isFinite(prevBoost) ? boost - prevBoost : NaN,
      gearChanged:
        Number.isFinite(gear) &&
        Number.isFinite(prevGear) &&
        Math.round(gear) > 0 &&
        Math.round(prevGear) > 0 &&
        Math.round(gear) !== Math.round(prevGear),
    };
  }

  function detectFlags(signals, ctx = {}) {
    const rules = ctx.rules || DEFAULT_RULES;
    const burble = ctx.burble || resolveBurbleProfile({}, rules);
    const hasPedal = Number.isFinite(signals.pedal);
    const hasThrottle = Number.isFinite(signals.throttle);
    const hasRpm = Number.isFinite(signals.rpm);
    const secondsSincePedalLift = Number.isFinite(ctx.secondsSincePedalLift)
      ? ctx.secondsSincePedalLift
      : NaN;
    const timeFromStart = Number.isFinite(ctx.timeFromStart) ? ctx.timeFromStart : NaN;
    const loaded =
      (hasPedal && signals.pedal >= 45) ||
      (Number.isFinite(signals.boost) && signals.boost > 3) ||
      (Number.isFinite(signals.target) && signals.target > 5) ||
      (Number.isFinite(signals.loadReq) && signals.loadReq >= 120);
    const rpmInBurbleRange =
      hasRpm &&
      signals.rpm >= burble.minRpm &&
      (!Number.isFinite(burble.maxRpm) || signals.rpm <= burble.maxRpm);
    const recentlyLifted =
      Number.isFinite(secondsSincePedalLift) && secondsSincePedalLift <= Math.max(0.2, burble.durationWindow);
    const speedOk = !Number.isFinite(signals.speed) || signals.speed >= (burble.minSpeed || 0);
    const lambdaDropout =
      (Number.isFinite(signals.lambda1) && isAfrDropout(signals.lambda1, rules)) ||
      (Number.isFinite(signals.lambda2) && isAfrDropout(signals.lambda2, rules));

    const dataError =
      lambdaDropout ||
      (hasRpm && (signals.rpm < 0 || signals.rpm > rules.stateDataRpmMax)) ||
      (Number.isFinite(signals.boost) && Math.abs(signals.boost) > rules.stateDataBoostAbsMax) ||
      (Number.isFinite(signals.target) && Math.abs(signals.target) > rules.stateDataBoostAbsMax);
    const idleColdStart =
      hasRpm &&
      signals.rpm > 450 &&
      signals.rpm <= Math.max(1600, rules.idleRpmMax) &&
      (!hasPedal || signals.pedal < 8) &&
      (!Number.isFinite(signals.speed) || signals.speed < 4) &&
      (!Number.isFinite(timeFromStart) || timeFromStart <= rules.stateColdStartWindowSec || signals.rpm < rules.idleRpmMax);
    const shiftTransient =
      signals.gearChanged ||
      (Number.isFinite(signals.dPedal) && Math.abs(signals.dPedal) >= rules.stateShiftPedalDeltaWarn) ||
      (Number.isFinite(signals.dThrottle) && Math.abs(signals.dThrottle) >= rules.stateShiftThrottleDeltaWarn) ||
      (Number.isFinite(signals.dBoost) && Math.abs(signals.dBoost) >= rules.stateShiftBoostDeltaWarn && hasPedal && signals.pedal > 30);
    const wotPull =
      loaded &&
      hasPedal &&
      signals.pedal >= rules.stateWotPedalMin &&
      (!hasThrottle || signals.throttle >= rules.stateWotThrottleMin) &&
      (!hasRpm || signals.rpm >= rules.stateWotMinRpm);
    const overrunBurble =
      rpmInBurbleRange &&
      speedOk &&
      hasPedal &&
      signals.pedal <= rules.stateOverrunPedalMax &&
      (!hasThrottle || signals.throttle <= rules.stateOverrunThrottleMax) &&
      (recentlyLifted || !Number.isFinite(signals.dRpm) || signals.dRpm < -30) &&
      (!Number.isFinite(signals.boost) || signals.boost < 4);

    return {
      dataError,
      idleColdStart,
      shiftTransient,
      wotPull,
      overrunBurble,
      loaded,
      lambdaDropout,
      recentlyLifted,
    };
  }

  function pickStateByPriority(flags) {
    if (flags.dataError) return ROW_STATES.DATA;
    if (flags.idleColdStart) return ROW_STATES.IDLE;
    if (flags.shiftTransient) return ROW_STATES.SHIFT;
    if (flags.wotPull) return ROW_STATES.WOT;
    if (flags.overrunBurble) return ROW_STATES.BURBLE;
    return ROW_STATES.UNKNOWN;
  }

  function stateConfidence(flags, state) {
    if (state === ROW_STATES.DATA && flags.dataError) return 0.95;
    if (state === ROW_STATES.WOT && flags.wotPull && flags.loaded) return 0.9;
    if (state === ROW_STATES.BURBLE && flags.overrunBurble && flags.recentlyLifted) return 0.88;
    if (state === ROW_STATES.SHIFT && flags.shiftTransient) return 0.82;
    if (state === ROW_STATES.IDLE && flags.idleColdStart) return 0.84;
    return 0.45;
  }

  function classifyRow(row, prev = null, next = null, ctx = {}) {
    const signals = normalizeSignals(row, prev, next, ctx);
    const flags = detectFlags(signals, ctx);
    const state = pickStateByPriority(flags);
    return {
      state,
      confidence: stateConfidence(flags, state),
      flags,
      signals,
      index: ctx.index ?? null,
      time: Number.isFinite(signals.time) ? signals.time : ctx.index ?? null,
    };
  }

  function classifyRows(rows, columnsInput = {}, rules = DEFAULT_RULES, profile = {}) {
    const columns = columnsInput?.time || columnsInput?.rpm
      ? columnsInput
      : columnsInput?.columns || buildColumnMap(Object.keys(rows[0] || {}));
    const activeProfile = profile?.vehicle || profile?.profile || profile || {};
    const burble = resolveBurbleProfile(activeProfile, rules);
    const firstTime = columns.time ? normalizeTime(numberValue(rows[0]?.[columns.time]), columns.time) : NaN;
    let previousPedal = NaN;
    let lastPedalLiftTime = NaN;
    let lastPedalLiftIndex = NaN;

    return rows.map((row, index) => {
      const time = columns.time ? normalizeTime(numberValue(row[columns.time]), columns.time) : NaN;
      const fallbackTime = index * 0.1;
      const currentTime = Number.isFinite(time) ? time : fallbackTime;
      const pedal = columns.pedal ? numberValue(row[columns.pedal]) : NaN;
      if (
        Number.isFinite(previousPedal) &&
        previousPedal > 30 &&
        Number.isFinite(pedal) &&
        pedal <= rules.stateOverrunPedalMax
      ) {
        lastPedalLiftTime = currentTime;
        lastPedalLiftIndex = index;
      }
      const secondsSincePedalLift = Number.isFinite(lastPedalLiftTime)
        ? currentTime - lastPedalLiftTime
        : Number.isFinite(lastPedalLiftIndex)
          ? (index - lastPedalLiftIndex) * 0.1
          : NaN;
      const result = classifyRow(row, rows[index - 1] || null, rows[index + 1] || null, {
        columns,
        rules,
        burble,
        index,
        timeFromStart: Number.isFinite(firstTime) && Number.isFinite(time) ? time - firstTime : index * 0.1,
        secondsSincePedalLift,
      });
      if (Number.isFinite(pedal)) previousPedal = pedal;
      return result;
    });
  }

  function stateLabel(state, rules = DEFAULT_RULES) {
    if (state === ROW_STATES.WOT) return msg(rules, "rowStateWot");
    if (state === ROW_STATES.BURBLE) return msg(rules, "rowStateBurble");
    if (state === ROW_STATES.SHIFT) return msg(rules, "rowStateShift");
    if (state === ROW_STATES.IDLE) return msg(rules, "rowStateIdle");
    if (state === ROW_STATES.DATA) return msg(rules, "rowStateData");
    return msg(rules, "rowStateUnknown");
  }

  function buildStateSummary(rowStates) {
    const total = rowStates.length;
    const counts = Object.values(ROW_STATES).reduce((acc, state) => ({ ...acc, [state]: 0 }), {});
    rowStates.forEach((entry) => {
      counts[entry.state] = (counts[entry.state] || 0) + 1;
    });

    const segments = [];
    rowStates.forEach((entry, index) => {
      const current = segments[segments.length - 1];
      const time = Number.isFinite(entry.time) ? entry.time : index;
      if (current && current.state === entry.state) {
        current.end = index;
        current.endTime = time;
        current.count += 1;
        return;
      }
      segments.push({
        state: entry.state,
        label: stateLabel(entry.state),
        start: index,
        end: index,
        startTime: time,
        endTime: time,
        count: 1,
      });
    });

    return {
      total,
      counts,
      shares: Object.fromEntries(
        Object.entries(counts).map(([state, count]) => [state, total ? count / total : 0])
      ),
      dominant: Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || ROW_STATES.UNKNOWN,
      segments,
    };
  }

  function maxTimingCorrectionForRow(row, timingCorrectionColumns) {
    const valuesForRow = timingCorrectionColumns
      .map((column) => Math.abs(numberValue(row[column])))
      .filter((value) => Number.isFinite(value));
    return valuesForRow.length ? Math.max(...valuesForRow) : NaN;
  }

  function evaluateTiming(row, state, ctx = {}) {
    const rules = ctx.rules || DEFAULT_RULES;
    const maxCorrection = maxTimingCorrectionForRow(row, ctx.timingCorrectionColumns || []);
    if (!Number.isFinite(maxCorrection)) return { severity: "neutral", hard: false, value: null };
    if (state !== ROW_STATES.WOT) {
      return {
        severity: maxCorrection >= rules.timingWarn ? "context" : "neutral",
        hard: false,
        value: maxCorrection,
        text: msg(rules, "analysis.eval.timingOutsideWot", { value: maxCorrection.toFixed(1), state: stateLabel(state, rules) }),
      };
    }
    if (maxCorrection >= rules.timingSevere) {
      return { severity: "red", hard: true, value: maxCorrection, text: msg(rules, "analysis.issue.timingCorrection", { value: maxCorrection.toFixed(1) }) };
    }
    if (maxCorrection > rules.timingWarn) {
      return { severity: "yellow", hard: true, value: maxCorrection, text: msg(rules, "analysis.issue.timingCorrection", { value: maxCorrection.toFixed(1) }) };
    }
    return { severity: "green", hard: true, value: maxCorrection };
  }

  function evaluateBoost(row, state, ctx = {}) {
    const rules = ctx.rules || DEFAULT_RULES;
    const columns = ctx.columns || {};
    const actual = columns.boost ? pressureToPsi(numberValue(row[columns.boost]), columns.boost) : NaN;
    const target = columns.target ? pressureToPsi(numberValue(row[columns.target]), columns.target) : NaN;
    if (!Number.isFinite(actual) || !Number.isFinite(target) || target <= 1) {
      return { severity: "neutral", hard: false, value: null };
    }
    const error = actual - target;
    const abs = Math.abs(error);
    if (state !== ROW_STATES.WOT) {
      return {
        severity: abs >= rules.boostWarnAvgAbs ? "context" : "neutral",
        hard: false,
        value: error,
        text: msg(rules, "analysis.eval.boostOutsideWot", { value: error.toFixed(1), state: stateLabel(state, rules) }),
      };
    }
    if (abs >= rules.boostSevereAvgAbs || error <= rules.boostUnderSevere || error >= rules.boostOverSevere) {
      return { severity: "red", hard: true, value: error };
    }
    if (abs >= rules.boostWarnAvgAbs || error <= rules.boostUnderWarn || error >= rules.boostOverWarn) {
      return { severity: "yellow", hard: true, value: error };
    }
    return { severity: "green", hard: true, value: error };
  }

  function evaluateFueling(row, state, ctx = {}) {
    const rules = ctx.rules || DEFAULT_RULES;
    const columns = ctx.columns || {};
    const lpfp = columns.lpfp ? pressureToPsi(numberValue(row[columns.lpfp]), columns.lpfp) : NaN;
    const rail = columns.rail ? pressureToPsi(numberValue(row[columns.rail]), columns.rail) : NaN;
    const hard = state === ROW_STATES.WOT;
    const evidence = [];
    if (Number.isFinite(lpfp) && lpfp <= rules.lpfpSustainedWarn) evidence.push("lpfp_low");
    if (Number.isFinite(rail) && rail <= rules.railWarn) evidence.push("rail_low");
    if (!hard && evidence.length) {
      return { severity: "context", hard: false, value: { lpfp, rail }, evidence };
    }
    if (hard && ((Number.isFinite(lpfp) && lpfp <= rules.lpfpSevere) || (Number.isFinite(rail) && rail <= rules.railSevere))) {
      return { severity: "red", hard: true, value: { lpfp, rail }, evidence };
    }
    if (hard && evidence.length) return { severity: "yellow", hard: true, value: { lpfp, rail }, evidence };
    return { severity: "green", hard, value: { lpfp, rail }, evidence };
  }

  function summarizeStateEvaluations(rows, rowStates, columns, rules, timingCorrectionColumns) {
    const byState = {};
    Object.values(ROW_STATES).forEach((state) => {
      byState[state] = {
        timingMax: null,
        timingHits: 0,
        boostHits: 0,
        fuelingHits: 0,
      };
    });

    rows.forEach((row, index) => {
      const state = rowStates[index]?.state || ROW_STATES.UNKNOWN;
      const timing = evaluateTiming(row, state, { rules, timingCorrectionColumns });
      const boost = evaluateBoost(row, state, { rules, columns });
      const fuel = evaluateFueling(row, state, { rules, columns });
      if (Number.isFinite(timing.value)) {
        byState[state].timingMax = Math.max(byState[state].timingMax ?? timing.value, timing.value);
        if (timing.severity === "red" || timing.severity === "yellow" || timing.severity === "context") {
          byState[state].timingHits += 1;
        }
      }
      if (boost.severity === "red" || boost.severity === "yellow" || boost.severity === "context") {
        byState[state].boostHits += 1;
      }
      if (fuel.severity === "red" || fuel.severity === "yellow" || fuel.severity === "context") {
        byState[state].fuelingHits += 1;
      }
    });

    const contextTimingStates = Object.entries(byState)
      .filter(([state, item]) => state !== ROW_STATES.WOT && Number.isFinite(item.timingMax) && item.timingHits > 0)
      .map(([state, item]) => ({
        state,
        label: stateLabel(state, rules),
        max: item.timingMax,
        hits: item.timingHits,
      }))
      .sort((a, b) => b.max - a.max);

    return {
      byState,
      contextTimingStates,
      contextTimingMax: contextTimingStates.length ? contextTimingStates[0].max : null,
    };
  }

  function makeEvent(severity, type, label, row, index, columns, detail = "", value = null, meta = {}) {
    const context = meta.context || drivingContext(row, columns, DEFAULT_RULES);

    return {
      severity,
      type,
      label,
      detail,
      value,
      phase: context.phase || null,
      relevant: Boolean(meta.relevant),
      index,
      time: eventTime(row, columns, index),
      rpm: Number.isFinite(context.rpm) ? context.rpm : null,
      pedal: Number.isFinite(context.pedal) ? context.pedal : null,
      throttle: Number.isFinite(context.throttle) ? context.throttle : null,
      boost: Number.isFinite(context.boost) ? context.boost : null,
    };
  }

  function compactEventSamples(events, maxPerType = 8) {
    const perType = {};
    return events
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || a.time - b.time)
      .filter((event) => {
        perType[event.type] = perType[event.type] || 0;
        if (perType[event.type] >= maxPerType) return false;
        perType[event.type] += 1;
        return true;
      })
      .slice(0, 42)
      .sort((a, b) => a.time - b.time);
  }

  function compactEventClusters(events) {
    const sorted = [...events].sort((a, b) => a.type.localeCompare(b.type) || a.time - b.time);
    const clusters = [];

    sorted.forEach((event) => {
      const current = clusters[clusters.length - 1];
      if (current && current.type === event.type && Math.abs(event.time - current.endTime) <= 0.9) {
        current.count += 1;
        current.endTime = event.time;
        current.relevant = current.relevant || event.relevant;
        if (severityRank(event.severity) > severityRank(current.severity)) {
          current.severity = event.severity;
          current.label = event.label;
          current.phase = event.phase;
        }
        return;
      }

      clusters.push({
        type: event.type,
        label: event.label,
        severity: event.severity,
        phase: event.phase,
        relevant: event.relevant,
        startTime: event.time,
        endTime: event.time,
        count: 1,
      });
    });

    return clusters
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.count - a.count)
      .slice(0, 12)
      .sort((a, b) => a.startTime - b.startTime);
  }

  function detectStaticRuns(rows, column, label, columns, rules, options = {}) {
    if (!column) return [];

    const {
      minRows = rules.staticValueWarnRows,
      include = () => true,
      ignore = () => false,
    } = options;
    const events = [];
    let runStart = null;
    let runValue = null;
    let runLength = 0;
    let runRow = null;

    const flush = () => {
      if (runLength >= minRows && runRow) {
        events.push(
          makeEvent(
            "yellow",
            "Sensor-Flatline",
            msg(rules, "analysis.event.staticRunText", { label, rows: runLength }),
            runRow,
            runStart,
            columns,
            msg(rules, "analysis.event.staticRunDetail", { label, value: runValue }),
            runValue
          )
        );
      }
      runStart = null;
      runValue = null;
      runLength = 0;
      runRow = null;
    };

    rows.forEach((row, index) => {
      const value = numberValue(row[column]);
      const rounded = Number.isFinite(value) ? Number(value.toFixed(3)) : null;
      if (!Number.isFinite(value) || !include(row, value) || ignore(value)) {
        flush();
        return;
      }

      if (rounded === runValue) {
        runLength += 1;
      } else {
        flush();
        runStart = index;
        runValue = rounded;
        runLength = 1;
        runRow = row;
      }
    });

    flush();
    return events;
  }

  function analyzeAnomalies(rows, columns, rules) {
    const events = [];
    const lambdaColumns = [
      ["AFR Bank 1", columns.lambda1],
      ["AFR Bank 2", columns.lambda2],
    ].filter(([, column]) => column);

    const counts = {
      afrSpike: 0,
      afrSpikeRed: 0,
      afrSpikePull: 0,
      afrSpikeContext: 0,
      afrDropout: 0,
      afrDropoutPull: 0,
      afrDropoutContext: 0,
      mhdAfrPlaceholder: 0,
      throttleMismatch: 0,
      throttleMismatchRed: 0,
      throttleMismatchPull: 0,
      throttleMismatchContext: 0,
      hesitation: 0,
      hesitationPull: 0,
      hesitationContext: 0,
      idleAfrInstability: 0,
      sensorFlatline: 0,
    };
    const maxima = {
      afrSpike: null,
      afrSpikePull: null,
      afrDropout: null,
      idleAfrSwing: null,
      throttleMismatchDelta: null,
    };

    rows.forEach((row, index) => {
      const context = drivingContext(row, columns, rules);
      const { rpm, pedal, throttle, boost, target } = context;

      lambdaColumns.forEach(([label, column]) => {
        const afr = numberValue(row[column]);
        if (!Number.isFinite(afr)) return;

        if (isMhdAfrPlaceholder(afr, rules)) {
          counts.mhdAfrPlaceholder += 1;
          counts.afrDropout += 1;
          if (context.steadyPull) counts.afrDropoutPull += 1;
          else counts.afrDropoutContext += 1;
          maxima.afrDropout = Math.max(maxima.afrDropout ?? afr, afr);
          events.push(
            makeEvent(
              "yellow",
              "MHD-Placeholder",
              msg(rules, "analysis.event.mhdPlaceholderText", { label, value: rules.mhdAfrPlaceholder.toFixed(2) }),
              row,
              index,
              columns,
              context.steadyPull
                ? msg(rules, "analysis.event.mhdPlaceholderPull")
                : msg(rules, "analysis.event.mhdPlaceholderContext", { phase: context.phase }),
              afr,
              { context, relevant: context.steadyPull }
            )
          );
          return;
        }

        if (afr >= rules.afrDropoutWarn) {
          counts.afrDropout += 1;
          if (context.steadyPull) counts.afrDropoutPull += 1;
          else counts.afrDropoutContext += 1;
          maxima.afrDropout = Math.max(maxima.afrDropout ?? afr, afr);
          events.push(
            makeEvent(
              "yellow",
              "AFR-Dropout",
              msg(rules, "analysis.event.afrDropoutText", { label, value: afr.toFixed(1) }),
              row,
              index,
              columns,
              context.steadyPull
                ? msg(rules, "analysis.event.afrDropoutPull")
                : msg(rules, "analysis.event.afrDropoutContext", { phase: context.phase }),
              afr,
              { context, relevant: context.steadyPull }
            )
          );
          return;
        }

        if (afr >= rules.afrSpikeWarn) {
          const underLoad = context.steadyPull;
          const severity = "yellow";
          counts.afrSpike += 1;
          if (underLoad) {
            counts.afrSpikePull += 1;
            maxima.afrSpikePull = Math.max(maxima.afrSpikePull ?? afr, afr);
          } else {
            counts.afrSpikeContext += 1;
          }
          if (afr >= rules.afrSpikeSevere && underLoad) counts.afrSpikeRed += 1;
          maxima.afrSpike = Math.max(maxima.afrSpike ?? afr, afr);
          events.push(
            makeEvent(
              severity,
              "AFR-Spike",
              msg(rules, "analysis.event.afrSpikeText", { label, value: afr.toFixed(1) }),
              row,
              index,
              columns,
              underLoad ? msg(rules, "analysis.event.afrSpikePull") : msg(rules, "analysis.event.afrSpikeContext", { phase: context.phase }),
              afr,
              { context, relevant: underLoad }
            )
          );
        }
      });

      if (
        columns.pedal &&
        columns.throttle &&
        Number.isFinite(pedal) &&
        Number.isFinite(throttle) &&
        pedal >= rules.throttleMismatchPedalMin &&
        throttle <= rules.throttleMismatchThrottleMax
      ) {
        const delta = pedal - throttle;
        if (delta >= rules.throttleMismatchDeltaWarn) {
          const boostError =
            Number.isFinite(boost) && Number.isFinite(target) && target > 1 ? boost - target : NaN;
          const overboostContext = Number.isFinite(boostError) && boostError >= rules.boostOverWarn;
          const hardMismatch = pedal >= 90 && throttle < 45 && !overboostContext;
          const relevantMismatch = context.steadyPull && hardMismatch;
          counts.throttleMismatch += 1;
          if (context.steadyPull) counts.throttleMismatchPull += 1;
          else counts.throttleMismatchContext += 1;
          if (relevantMismatch) counts.throttleMismatchRed += 1;
          maxima.throttleMismatchDelta = Math.max(maxima.throttleMismatchDelta ?? delta, delta);
          events.push(
            makeEvent(
              "yellow",
              "Pedal/Throttle",
              msg(rules, "analysis.event.throttleMismatchText", { pedal: pedal.toFixed(0), throttle: throttle.toFixed(0) }),
              row,
              index,
              columns,
              overboostContext
                ? msg(rules, "analysis.event.throttleMismatchOverboost")
                : context.steadyPull
                  ? msg(rules, "analysis.event.throttleMismatchPull")
                  : msg(rules, "analysis.event.throttleMismatchContext", { phase: context.phase }),
              delta,
              { context, relevant: relevantMismatch }
            )
          );
        }
      }

      if (
        Number.isFinite(rpm) &&
        rpm >= rules.hesitationRpmMin &&
        rpm <= rules.hesitationRpmMax &&
        Number.isFinite(pedal) &&
        pedal >= 25
      ) {
        const lowThrottle = Number.isFinite(throttle) && throttle + 25 < pedal;
        const boostLag = Number.isFinite(boost) && Number.isFinite(target) && target > 5 && boost + 3 < target;
        const afrOdd = lambdaColumns.some(([, column]) => {
          const afr = numberValue(row[column]);
          return Number.isFinite(afr) && (afr >= rules.afrSpikeWarn || isAfrDropout(afr, rules));
        });

        if (lowThrottle || boostLag || afrOdd) {
          const relevantHesitation = context.loaded && !context.spool && !context.overrun && !context.idle;
          counts.hesitation += 1;
          if (relevantHesitation) counts.hesitationPull += 1;
          else counts.hesitationContext += 1;
          events.push(
            makeEvent(
              "yellow",
              "Hesitation-Zone",
              msg(rules, "analysis.event.hesitationText", { rpm: rpm.toFixed(0) }),
              row,
              index,
              columns,
              [lowThrottle ? "Throttle" : "", boostLag ? "Boost-Lag" : "", afrOdd ? "AFR" : ""]
                .filter(Boolean)
                .join(" / "),
              rpm,
              { context, relevant: relevantHesitation }
            )
          );
        }
      }
    });

    lambdaColumns.forEach(([label, column]) => {
      const idleValues = rows
        .filter((row) => {
          const rpm = columns.rpm ? numberValue(row[columns.rpm]) : NaN;
          return Number.isFinite(rpm) && rpm > 450 && rpm < rules.idleRpmMax;
        })
        .map((row) => numberValue(row[column]))
        .filter((value) => Number.isFinite(value) && value > 5 && value < rules.afrSpikeWarn);

      if (idleValues.length >= 8) {
        const range = Math.max(...idleValues) - Math.min(...idleValues);
        const deltas = idleValues.slice(1).map((value, index) => Math.abs(value - idleValues[index]));
        const maxDelta = deltas.length ? Math.max(...deltas) : 0;
        if (range >= rules.idleAfrSwingWarn || maxDelta >= rules.idleAfrSwingWarn * 0.75) {
          counts.idleAfrInstability += 1;
          maxima.idleAfrSwing = Math.max(maxima.idleAfrSwing ?? range, range);
          const idleRow = rows.find((row) => {
            const rpm = columns.rpm ? numberValue(row[columns.rpm]) : NaN;
            const afr = numberValue(row[column]);
            return Number.isFinite(rpm) && rpm > 450 && rpm < rules.idleRpmMax && Number.isFinite(afr);
          });
          events.push(
            makeEvent(
              "yellow",
              "Idle-AFR",
              msg(rules, "analysis.event.idleAfrText", { label, value: range.toFixed(2) }),
              idleRow || rows[0],
              idleRow ? rows.indexOf(idleRow) : 0,
              columns,
              msg(rules, "analysis.event.idleAfrDetail", { value: maxDelta.toFixed(2) }),
              range
            )
          );
        }
      }

      detectStaticRuns(rows, column, label, columns, rules, {
        ignore: (value) => isAfrDropout(value, rules),
        include: (row, value) => value > 5 && value < rules.afrSpikeWarn && (value < 10 || value >= 16),
      }).forEach((event) => {
        counts.sensorFlatline += 1;
        events.push(event);
      });
    });

    const timeValues = events.map((event) => event.time).filter((value) => Number.isFinite(value));
    const red = events.filter((event) => event.severity === "red").length;
    const yellow = events.filter((event) => event.severity === "yellow").length;
    const relevantTotal = events.filter((event) => event.relevant).length;

    return {
      total: events.length,
      relevantTotal,
      contextTotal: Math.max(0, events.length - relevantTotal),
      red,
      yellow,
      counts,
      maxima,
      events: compactEventSamples(events),
      clusters: compactEventClusters(events),
      timeRange: timeValues.length ? [Math.min(...timeValues), Math.max(...timeValues)] : null,
    };
  }

  function issuesFromAnomalies(anomalies, rules) {
    if (!anomalies || !anomalies.total) return [];
    const issues = [];
    const { counts, maxima } = anomalies;

    if (counts.afrSpikePull) {
      const spikeMax = maxima.afrSpikePull ?? maxima.afrSpike;
      issues.push(
        makeLocalizedIssue(rules, "yellow", "Fuel", "analysis.issue.afrSpikesPull", { value: spikeMax.toFixed(1) })
      );
    }

    if (counts.afrDropoutPull) {
      issues.push(
        makeLocalizedIssue(rules, "yellow", "Daten", "analysis.issue.afrDropoutsPull", { value: maxima.afrDropout.toFixed(1) })
      );
    } else if (counts.afrDropout >= rules.mhdAfrPlaceholderWarnCount * 2) {
      issues.push(
        makeLocalizedIssue(rules, "yellow", "Daten", "analysis.issue.afrDropoutsContext", { value: maxima.afrDropout.toFixed(1) })
      );
    }

    if (counts.mhdAfrPlaceholder >= rules.mhdAfrPlaceholderWarnCount) {
      issues.push(
        makeLocalizedIssue(rules, "yellow", "Daten", "analysis.issue.mhdAfrPlaceholder", { value: rules.mhdAfrPlaceholder.toFixed(2), count: counts.mhdAfrPlaceholder })
      );
    }

    if (
      counts.throttleMismatchRed >= rules.throttleMismatchPullCountWarn ||
      counts.throttleMismatchPull >= rules.throttleMismatchPullCountWarn
    ) {
      issues.push(
        makeLocalizedIssue(rules, "yellow", "Regelung", "analysis.issue.throttleMismatch", { value: maxima.throttleMismatchDelta.toFixed(0) })
      );
    }

    if (counts.hesitationPull >= rules.hesitationPullCountWarn) {
      issues.push(
        makeLocalizedIssue(rules, "yellow", "Regelung", "analysis.issue.hesitationPull", { min: rules.hesitationRpmMin, max: rules.hesitationRpmMax, count: counts.hesitationPull })
      );
    }

    if (counts.idleAfrInstability) {
      issues.push(
        makeLocalizedIssue(rules, "yellow", "Leerlauf", "analysis.issue.idleAfrSwing", { value: maxima.idleAfrSwing.toFixed(2) })
      );
    }

    if (counts.sensorFlatline) {
      issues.push(
        makeLocalizedIssue(rules, "yellow", "Daten", "analysis.issue.sensorFlatline", { count: counts.sensorFlatline })
      );
    }

    return issues;
  }

  function buildPullValidation(valuesForCheck) {
    const {
      dur,
      rpmValues,
      gearSet,
      pedalValues,
      throttleClosurePct,
      torqueLimiterActive,
      rules,
    } = valuesForCheck;
    const pedalAvg = pedalValues.length ? stats(pedalValues).avg : NaN;
    const rpmSpan = rpmValues.length ? Math.max(...rpmValues) - Math.min(...rpmValues) : NaN;
    const checks = [
      {
        label: msg(rules, "analysis.validation.duration"),
        ok: Number.isFinite(dur) && dur >= rules.pullMinDurationWarn,
        detail: Number.isFinite(dur) ? `${dur.toFixed(1)} s` : msg(rules, "analysis.validation.noTime"),
      },
      {
        label: msg(rules, "analysis.validation.pedal"),
        ok: !Number.isFinite(pedalAvg) || pedalAvg >= rules.pedalAvgWarn,
        detail: Number.isFinite(pedalAvg) ? `${pedalAvg.toFixed(0)}% avg` : msg(rules, "analysis.validation.noPedal"),
      },
      {
        label: msg(rules, "analysis.validation.singleGear"),
        ok: gearSet.length <= 1,
        detail: gearSet.length ? gearSet.join("/") : msg(rules, "analysis.validation.noGear"),
      },
      {
        label: msg(rules, "analysis.validation.rpmBand"),
        ok: !Number.isFinite(rpmSpan) || rpmSpan >= 2200,
        detail: Number.isFinite(rpmSpan) ? `${rpmSpan.toFixed(0)} rpm Span` : msg(rules, "analysis.validation.noRpm"),
      },
      {
        label: msg(rules, "analysis.validation.noInterventions"),
        ok: throttleClosurePct < rules.throttleClosurePctWarn && !torqueLimiterActive,
        detail: torqueLimiterActive ? "Torque Limiter" : `${(throttleClosurePct * 100).toFixed(0)}% Throttle Closure`,
      },
    ];
    const failed = checks.filter((check) => !check.ok);

    return {
      status: failed.length >= 2 || torqueLimiterActive ? "red" : failed.length ? "yellow" : "green",
      checks,
      failed: failed.length,
      summary: failed.length ? msg(rules, "analysis.validation.checksOpen", { count: failed.length }) : msg(rules, "analysis.validation.pullUsable"),
    };
  }

  function buildPlatformContext(vehicleInfo, valuesForCheck) {
    if (vehicleInfo?.engine !== "N54") return null;

    const {
      gearSet,
      rpmValues,
      lpfpValues,
      railValues,
      throttleClosurePct,
      anomalies,
      rules,
    } = valuesForCheck;
    const cards = [];
    const lpfpMin = lpfpValues.length ? Math.min(...lpfpValues) : NaN;
    const railMin = railValues.length ? Math.min(...railValues) : NaN;
    const rpmMin = rpmValues.length ? Math.min(...rpmValues) : NaN;
    const rpmMax = rpmValues.length ? Math.max(...rpmValues) : NaN;
    const singleGear = gearSet.length === 1 ? gearSet[0] : null;
    const intervention =
      throttleClosurePct >= rules.throttleClosurePctWarn ||
      (anomalies?.counts?.throttleMismatchRed ?? 0) >= 3;

    if (Number.isFinite(lpfpMin)) {
      if (lpfpMin <= rules.lpfpSevere && Number.isFinite(railMin) && railMin <= rules.railWarn) {
        cards.push({
          severity: "red",
          label: msg(rules, "analysis.platform.fuelChain"),
          detail: msg(rules, "analysis.platform.fuelChainDetail", { lpfp: lpfpMin.toFixed(0), rail: railMin.toFixed(0) }),
        });
      } else if (lpfpMin <= rules.lpfpWarn && intervention) {
        cards.push({
          severity: "red",
          label: msg(rules, "analysis.platform.lpfpIntervention"),
          detail: msg(rules, "analysis.platform.lpfpInterventionDetail", { lpfp: lpfpMin.toFixed(0) }),
        });
      } else if (lpfpMin <= rules.lpfpWarn) {
        cards.push({
          severity: "yellow",
          label: msg(rules, "analysis.platform.lpfpReserve"),
          detail: msg(rules, "analysis.platform.lpfpReserveDetail", { lpfp: lpfpMin.toFixed(0) }),
        });
      }
    }

    if (intervention) {
      cards.push({
        severity: "yellow",
        label: msg(rules, "analysis.platform.throttleContext"),
        detail: msg(rules, "analysis.platform.throttleContextDetail"),
      });
    }

    if (anomalies?.counts?.afrDropout) {
      cards.push({
        severity: "yellow",
        label: msg(rules, "analysis.platform.afrData"),
        detail: msg(rules, "analysis.platform.afrDataDetail"),
      });
    }

    const logShapeWarnings = [];
    if (singleGear !== null && singleGear !== rules.n54RecommendedGear) {
      logShapeWarnings.push(msg(rules, "analysis.platform.gearInstead", { gear: singleGear, target: rules.n54RecommendedGear }));
    }
    if (Number.isFinite(rpmMin) && rpmMin > rules.n54RecommendedMinRpm + 700) {
      logShapeWarnings.push(msg(rules, "analysis.platform.startLate", { rpm: rpmMin.toFixed(0) }));
    } else if (Number.isFinite(rpmMin) && rpmMin < rules.n54RecommendedMinRpm - 900) {
      logShapeWarnings.push(msg(rules, "analysis.platform.startEarly", { rpm: rpmMin.toFixed(0) }));
    }
    if (Number.isFinite(rpmMax) && rpmMax < rules.n54RecommendedEndRpm - 150) {
      logShapeWarnings.push(msg(rules, "analysis.platform.endAt", { rpm: rpmMax.toFixed(0) }));
    }
    if (gearSet.length !== 1 && gearSet.length > 0) {
      logShapeWarnings.push(msg(rules, "analysis.platform.multiGear", { gears: gearSet.join("/") }));
    }
    if (logShapeWarnings.length) {
      cards.push({
        severity: "yellow",
        label: msg(rules, "analysis.ref.logForm"),
        detail: msg(rules, "analysis.platform.logShapeDetail", { warnings: logShapeWarnings.join(", ") }),
      });
    } else {
      cards.push({
        severity: "green",
        label: msg(rules, "analysis.ref.logForm"),
        detail: msg(rules, "analysis.platform.logShapeOk"),
      });
    }

    const red = cards.filter((card) => card.severity === "red").length;
    return {
      platform: "N54",
      status: red ? "red" : cards.some((card) => card.severity === "yellow") ? "yellow" : "green",
      summary: red ? msg(rules, "analysis.platform.n54FuelContextRed") : msg(rules, "analysis.platform.n54ContextChecked"),
      cards,
    };
  }

  function relativeTime(row, index, columns, startTime) {
    const rawTime = columns.time ? normalizeTime(numberValue(row[columns.time]), columns.time) : NaN;
    if (Number.isFinite(rawTime) && Number.isFinite(startTime)) return rawTime - startTime;
    if (Number.isFinite(rawTime)) return rawTime;
    return index;
  }

  function samplePoints(points, maxPoints = 220) {
    if (points.length <= maxPoints) return points;
    const sampled = [];
    const step = (points.length - 1) / (maxPoints - 1);
    for (let index = 0; index < maxPoints; index += 1) {
      sampled.push(points[Math.round(index * step)]);
    }
    return sampled;
  }

  function buildTraceSeries(rows, columns, specs) {
    const startTime = columns.time
      ? rows.map((row) => normalizeTime(numberValue(row[columns.time]), columns.time)).find((value) => Number.isFinite(value))
      : NaN;

    return specs
      .map((spec) => {
        const points = rows
          .map((row, index) => {
            const y = spec.value(row);
            const x = relativeTime(row, index, columns, startTime);
            return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
          })
          .filter(Boolean);

        if (points.length < 2) return null;
        const yValues = points.map((point) => point.y);
        return {
          label: spec.label,
          color: spec.color,
          points: samplePoints(points),
          min: Math.min(...yValues),
          max: Math.max(...yValues),
          avg: yValues.reduce((sum, value) => sum + value, 0) / yValues.length,
        };
      })
      .filter(Boolean);
  }

  function makeTraceChart(id, label, unit, rows, columns, specs, options = {}) {
    const series = buildTraceSeries(rows, columns, specs);
    if (!series.length) return null;
    const xValues = series.flatMap((item) => item.points.map((point) => point.x));
    return {
      id,
      label,
      unit,
      yMin: options.yMin ?? null,
      yMax: options.yMax ?? null,
      thresholds: options.thresholds ?? [],
      timeRange: [Math.min(...xValues), Math.max(...xValues)],
      series,
    };
  }

  function buildTraceCharts(rows, columns, rules) {
    const charts = [
      makeTraceChart(
        "boost",
        msg(rules, "analysis.chart.boost"),
        "psi",
        rows,
        columns,
        [
          {
            label: msg(rules, "analysis.chart.actual"),
            color: "blue",
            value: (row) => (columns.boost ? pressureToPsi(numberValue(row[columns.boost]), columns.boost) : NaN),
          },
          {
            label: msg(rules, "analysis.chart.target"),
            color: "cyan",
            value: (row) => (columns.target ? pressureToPsi(numberValue(row[columns.target]), columns.target) : NaN),
          },
        ],
        { yMin: 0 }
      ),
      makeTraceChart(
        "lpfp",
        msg(rules, "analysis.chart.lpfp"),
        "psi",
        rows,
        columns,
        [
          {
            label: msg(rules, "analysis.chart.lpfp"),
            color: "green",
            value: (row) => (columns.lpfp ? pressureToPsi(numberValue(row[columns.lpfp]), columns.lpfp) : NaN),
          },
        ],
        {
          thresholds: [
            { value: rules.lpfpSustainedWarn, label: `${rules.lpfpSustainedWarn.toFixed(0)} psi`, severity: "yellow" },
            { value: rules.lpfpSevere, label: `${rules.lpfpSevere.toFixed(0)} psi`, severity: "red" },
          ],
        }
      ),
      makeTraceChart(
        "rail",
        msg(rules, "analysis.chart.rail"),
        "psi",
        rows,
        columns,
        [
          {
            label: msg(rules, "analysis.chart.rail"),
            color: "red",
            value: (row) => (columns.rail ? pressureToPsi(numberValue(row[columns.rail]), columns.rail) : NaN),
          },
          {
            label: msg(rules, "analysis.chart.requested"),
            color: "muted",
            value: (row) => (columns.railReq ? pressureToPsi(numberValue(row[columns.railReq]), columns.railReq) : NaN),
          },
        ],
        {
          thresholds: [
            { value: rules.railWarn, label: `${rules.railWarn.toFixed(0)} psi`, severity: "yellow" },
            { value: rules.railSevere, label: `${rules.railSevere.toFixed(0)} psi`, severity: "red" },
          ],
        }
      ),
      makeTraceChart(
        "control",
        msg(rules, "analysis.chart.pedalThrottle"),
        "%",
        rows,
        columns,
        [
          {
            label: msg(rules, "analysis.chart.pedal"),
            color: "blue",
            value: (row) => (columns.pedal ? numberValue(row[columns.pedal]) : NaN),
          },
          {
            label: msg(rules, "analysis.chart.throttle"),
            color: "yellow",
            value: (row) => (columns.throttle ? numberValue(row[columns.throttle]) : NaN),
          },
        ],
        { yMin: 0, yMax: 100 }
      ),
      makeTraceChart(
        "fuel-trims",
        msg(rules, "analysis.chart.fuelTrims"),
        "%",
        rows,
        columns,
        [
          { label: "STFT 1", color: "blue", value: (row) => (columns.stft1 ? numberValue(row[columns.stft1]) : NaN) },
          { label: "STFT 2", color: "cyan", value: (row) => (columns.stft2 ? numberValue(row[columns.stft2]) : NaN) },
          { label: "LTFT 1", color: "green", value: (row) => (columns.ltft1 ? numberValue(row[columns.ltft1]) : NaN) },
          { label: "LTFT 2", color: "yellow", value: (row) => (columns.ltft2 ? numberValue(row[columns.ltft2]) : NaN) },
        ],
        {
          yMin: -40,
          yMax: 40,
          thresholds: [
            { value: rules.stftPeggedWarn, label: `+${rules.stftPeggedWarn.toFixed(0)}%`, severity: "red" },
            { value: -rules.stftPeggedWarn, label: `-${rules.stftPeggedWarn.toFixed(0)}%`, severity: "red" },
            { value: rules.ltftWarn, label: `+${rules.ltftWarn.toFixed(0)}%`, severity: "yellow" },
            { value: -rules.ltftWarn, label: `-${rules.ltftWarn.toFixed(0)}%`, severity: "yellow" },
          ],
        }
      ),
    ];

    return {
      charts: charts.filter(Boolean),
    };
  }

  function analyzeRows(filename, parsed, rulesInput = {}) {
    const rules = { ...DEFAULT_RULES, ...rulesInput };
    const { headers, rows } = parsed;
    const vehicleInfo = inferVehicleInfo(filename, headers, rules);
    const columns = buildColumnMap(headers);
    const timingCorrectionColumns = headers.filter(isTimingCorrectionColumn);
    const ignitionTimingColumns = headers.filter(
      (header) => /Timing Cyl/i.test(header) && !/Timing Cor/i.test(header)
    );
    const issues = [];
    const notes = [];
    const forcedSegment = Array.isArray(rulesInput.__segment) ? rulesInput.__segment : null;
    const skipPullAnalyses = Boolean(rulesInput.__skipPullAnalyses);
    const activeProfile = rulesInput.__profile || null;

    if (!rows.length) {
      const issuesForEmpty = [makeLocalizedIssue(rules, "red", "Datei", "analysis.issue.emptyCsv")];
      return {
        filename,
        status: "red",
        statusLabel: labelForStatus("red", rules),
        headline: msg(rules, "analysis.headline.noRows"),
        issues: issuesForEmpty,
        diagnoses: buildDiagnoses(issuesForEmpty, rules),
        vehicleInfo,
        notes: [],
        metrics: {},
        columns,
        missingChannels: [],
      };
    }

    const allRowStates = classifyRows(rows, columns, rules, activeProfile);
    const allStateSummary = buildStateSummary(allRowStates);
    const segments = makeSegments(rows, columns);
    const selectedSegment = forcedSegment || selectSegment(rows, columns, segments);
    const anomalyRows = forcedSegment && selectedSegment ? rows.slice(selectedSegment[0], selectedSegment[1] + 1) : rows;
    const anomalies = analyzeAnomalies(anomalyRows, columns, rules);

    if (!selectedSegment) {
      const issuesForMissingPull = [
        makeLocalizedIssue(rules, "red", "Pull", "analysis.issue.noStablePull"),
        ...issuesFromAnomalies(anomalies, rules),
      ];
      return {
        filename,
        status: "red",
        statusLabel: labelForStatus("red", rules),
        headline: msg(rules, "analysis.headline.noPull"),
        issues: issuesForMissingPull,
        diagnoses: buildDiagnoses(issuesForMissingPull, rules),
        vehicleInfo,
        notes,
        metrics: {
          rows: rows.length,
          columns: headers.length,
          states: allStateSummary,
          anomalies,
        },
        columns,
        missingChannels: [],
      };
    }

    const segmentRows = rows.slice(selectedSegment[0], selectedSegment[1] + 1);
    const segmentRowStates = allRowStates.slice(selectedSegment[0], selectedSegment[1] + 1);
    const segmentStateSummary = buildStateSummary(segmentRowStates);
    const dur = duration(rows, selectedSegment, columns.time);
    const segmentStartTime = columns.time ? normalizeTime(numberValue(rows[selectedSegment[0]][columns.time]), columns.time) : NaN;
    const legacySteadyRows = segmentRows.filter((row) => {
      const time = columns.time ? normalizeTime(numberValue(row[columns.time]), columns.time) : NaN;
      const pedal = columns.pedal ? numberValue(row[columns.pedal]) : NaN;
      const afterSpool = !Number.isFinite(time) || !Number.isFinite(segmentStartTime) || time >= segmentStartTime + 0.75 || dur < 1.2;
      const pedalOk = !columns.pedal || !Number.isFinite(pedal) || pedal >= 85;
      return afterSpool && pedalOk;
    });
    const stateSteadyRows = segmentRows.filter((row, index) => {
      const stateEntry = segmentRowStates[index];
      if (stateEntry?.state !== ROW_STATES.WOT) return false;
      const time = columns.time ? normalizeTime(numberValue(row[columns.time]), columns.time) : NaN;
      return !Number.isFinite(time) || !Number.isFinite(segmentStartTime) || time >= segmentStartTime + 0.75 || dur < 1.2;
    });
    const hardWotReady = stateSteadyRows.length >= 3;
    const steady = hardWotReady ? stateSteadyRows : legacySteadyRows.length ? legacySteadyRows : segmentRows;
    const timingRows = hardWotReady ? stateSteadyRows : [];
    const stateEvaluations = summarizeStateEvaluations(segmentRows, segmentRowStates, columns, rules, timingCorrectionColumns);
    if (!hardWotReady && segmentRows.length) {
      notes.push(
        stateSteadyRows.length
          ? msg(rules, "analysis.note.fewWotRows", { count: stateSteadyRows.length })
          : msg(rules, "analysis.note.noWotRows")
      );
    }

    const rpmValues = values(segmentRows, columns.rpm);
    const speedValues = values(segmentRows, columns.speed);
    const pedalValues = values(segmentRows, columns.pedal);
    const gearValues = values(segmentRows, columns.gear).map((value) => Math.round(value));
    const gearSet = [...new Set(gearValues)].filter((value) => value !== 0);
    const iatValues = values(segmentRows, columns.iat, {
      convert: (value) => convertTemp(value, columns.iat),
    });
    const coolantValues = values(segmentRows, columns.coolant, {
      convert: (value) => convertTemp(value, columns.coolant),
    });
    const oilValues = values(segmentRows, columns.oilTemp, {
      convert: (value) => convertTemp(value, columns.oilTemp),
    });
    const boostValues = values(steady, columns.boost, {
      convert: (value) => pressureToPsi(value, columns.boost),
    });
    const targetValues = values(steady, columns.target, {
      convert: (value) => pressureToPsi(value, columns.target),
    });
    const railValues = values(steady, columns.rail, {
      ignoreZero: true,
      convert: (value) => pressureToPsi(value, columns.rail),
    });
    const railReqValues = values(steady, columns.railReq, {
      ignoreZero: true,
      convert: (value) => pressureToPsi(value, columns.railReq),
    });
    const lpfpValues = values(steady, columns.lpfp, {
      ignoreZero: true,
      convert: (value) => pressureToPsi(value, columns.lpfp),
    });
    const wgdcValues = values(steady, columns.wgdc, { ignoreZero: true });
    const throttleValues = values(steady, columns.throttle);
    const lambda1Values = values(steady, columns.lambda1, {
      convert: (value) => lambdaToAfr(value, columns.lambda1),
      valid: (value) => value < 30,
    });
    const lambda2Values = values(steady, columns.lambda2, {
      convert: (value) => lambdaToAfr(value, columns.lambda2),
      valid: (value) => value < 30,
    });
    const lambdaTargetValues = values(steady, columns.lambdaTarget, {
      convert: (value) => lambdaToAfr(value, columns.lambdaTarget),
      valid: (value) => value < 30,
    });
    const stft1Values = values(steady, columns.stft1);
    const stft2Values = values(steady, columns.stft2);
    const stftValues = [
      ...stft1Values,
      ...stft2Values,
    ];
    const stftBankDiffs = pairedDiffs(steady, columns.stft1, columns.stft2);
    const ltft1Values = values(steady, columns.ltft1);
    const ltft2Values = values(steady, columns.ltft2);
    const ltftValues = [
      ...ltft1Values,
      ...ltft2Values,
    ];
    const ltftBankDiffs = pairedDiffs(steady, columns.ltft1, columns.ltft2);
    const ethanolValues = values(steady, columns.ethanol);
    const loadActualValues = values(steady, columns.loadActual);
    const loadReqValues = values(steady, columns.loadReq);
    const mafValues = values(steady, columns.maf, {
      convert: (value) => massFlowToGps(value, columns.maf),
    });
    const mafReqValues = values(steady, columns.mafReq);

    const boostRowsForEvaluation = steady.filter((row) => {
      if (!columns.rpm) return true;
      const rpm = numberValue(row[columns.rpm]);
      return Number.isFinite(rpm) && rpm >= rules.boostEvaluationMinRpm;
    });
    const evaluatedBoostRows = boostRowsForEvaluation.length ? boostRowsForEvaluation : steady;
    const boostErrors = evaluatedBoostRows
      .map((row) => {
        const actual = columns.boost ? pressureToPsi(numberValue(row[columns.boost]), columns.boost) : NaN;
        const target = columns.target ? pressureToPsi(numberValue(row[columns.target]), columns.target) : NaN;
        return Number.isFinite(actual) && Number.isFinite(target) && target > 1
          ? actual - target
          : NaN;
      })
      .filter((value) => Number.isFinite(value));
    const absBoostErrors = boostErrors.map((value) => Math.abs(value));

    const timingValues = [];
    const timingByCylinder = {};
    timingCorrectionColumns.forEach((column) => {
      const cylinderValues = values(timingRows, column).map((value) => Math.abs(value));
      if (cylinderValues.length) {
        const max = Math.max(...cylinderValues);
        timingByCylinder[column] = max;
        timingValues.push(...cylinderValues);
      }
    });
    const ignitionEndValues = ignitionTimingColumns
      .map((column) => values(timingRows, column))
      .filter((list) => list.length)
      .map((list) => list[list.length - 1]);
    const timingContext = {
      ...stateEvaluations,
      wotRows: stateSteadyRows.length,
    };

    const lambdaBankDiffs = [];
    if (columns.lambda1 && columns.lambda2) {
      steady.forEach((row) => {
        const bank1 = lambdaToAfr(numberValue(row[columns.lambda1]), columns.lambda1);
        const bank2 = lambdaToAfr(numberValue(row[columns.lambda2]), columns.lambda2);
        if (Number.isFinite(bank1) && Number.isFinite(bank2) && bank1 < 30 && bank2 < 30) {
          lambdaBankDiffs.push(Math.abs(bank1 - bank2));
        }
      });
    }

    const throttleClosures = steady.filter((row) => {
      const pedal = columns.pedal ? numberValue(row[columns.pedal]) : NaN;
      const throttle = columns.throttle ? numberValue(row[columns.throttle]) : NaN;
      return Number.isFinite(pedal) && pedal >= 90 && Number.isFinite(throttle) && throttle < 70;
    }).length;
    const throttleClosurePct = steady.length ? throttleClosures / steady.length : 0;

    const torqueLimitValues = values(steady, columns.torqueLimit);
    const torqueLimiterActive = torqueLimitValues.some((value) => Math.abs(value) > 0);
    const multiGearBase = forcedSegment
      ? new Set(gearValues.filter((value) => value !== 0)).size > 1
      : segments.baseSegments.some((segment) => {
          const gears = values(rows.slice(segment[0], segment[1] + 1), columns.gear).map((value) => Math.round(value));
          return new Set(gears.filter((value) => value !== 0)).size > 1;
        });

    if (Number.isFinite(dur) && dur < rules.pullMinDurationWarn) {
      issues.push(makeLocalizedIssue(rules, "yellow", "Pull", "analysis.issue.pullShort", { duration: dur.toFixed(1) }));
    }
    if (multiGearBase) {
      issues.push(makeLocalizedIssue(rules, "yellow", "Pull", "analysis.issue.gearShift"));
    }
    if (pedalValues.length && stats(pedalValues).avg < rules.pedalAvgWarn) {
      issues.push(makeLocalizedIssue(rules, "yellow", "Pull", "analysis.issue.pedalNotWot"));
    }

    if (boostErrors.length) {
      const avgAbs = absBoostErrors.reduce((sum, value) => sum + value, 0) / absBoostErrors.length;
      const minError = Math.min(...boostErrors);
      const maxError = Math.max(...boostErrors);
      if (hardWotReady) {
        if (avgAbs >= rules.boostSevereAvgAbs || minError <= rules.boostUnderSevere) {
          issues.push(makeLocalizedIssue(rules, "red", "Boost", "analysis.issue.boostUnder", { value: avgAbs.toFixed(1) }));
        } else if (avgAbs >= rules.boostWarnAvgAbs || minError <= rules.boostUnderWarn) {
          issues.push(makeLocalizedIssue(rules, "yellow", "Boost", "analysis.issue.boostTracking", { value: avgAbs.toFixed(1) }));
        }
        if (maxError >= rules.boostOverSevere) {
          issues.push(makeLocalizedIssue(rules, "red", "Boost", "analysis.issue.overboost", { value: maxError.toFixed(1) }));
        } else if (maxError >= rules.boostOverWarn) {
          issues.push(makeLocalizedIssue(rules, "yellow", "Boost", "analysis.issue.overboost", { value: maxError.toFixed(1) }));
        }
      } else if (avgAbs >= rules.boostWarnAvgAbs || minError <= rules.boostUnderWarn || maxError >= rules.boostOverWarn) {
        notes.push(msg(rules, "analysis.note.boostContext", { value: avgAbs.toFixed(1) }));
      }
    } else {
      notes.push(msg(rules, "analysis.note.boostNotComplete"));
    }

    if (timingValues.length) {
      const timingMax = Math.max(...timingValues);
      if (timingMax >= rules.timingSevere) {
        issues.push(makeLocalizedIssue(rules, "red", "Timing", "analysis.issue.timingCorrection", { value: timingMax.toFixed(1) }));
      } else if (timingMax > rules.timingWarn) {
        issues.push(makeLocalizedIssue(rules, "yellow", "Timing", "analysis.issue.timingCorrection", { value: timingMax.toFixed(1) }));
      }
      if (timingContext.contextTimingStates.length) {
        const topContext = timingContext.contextTimingStates[0];
        notes.push(
          msg(rules, "analysis.note.timingContextOutside", { state: topContext.label, value: topContext.max.toFixed(1) })
        );
      }
    } else {
      if (timingContext.contextTimingStates.length) {
        const topContext = timingContext.contextTimingStates[0];
        notes.push(
          msg(rules, "analysis.note.timingOnlyOutside", { state: topContext.label, value: topContext.max.toFixed(1) })
        );
      } else if (timingCorrectionColumns.length && stateSteadyRows.length > 0 && stateSteadyRows.length < 3) {
        notes.push(msg(rules, "analysis.note.timingFewWot"));
      } else {
        notes.push(msg(rules, "analysis.note.noTimingChannels"));
      }
    }

    if (lpfpValues.length) {
      const lpfpMin = Math.min(...lpfpValues);
      const lpfpBelowSustainedCount = lpfpValues.filter((value) => value < rules.lpfpSustainedWarn).length;
      const lpfpBelowSustainedPct = lpfpBelowSustainedCount / lpfpValues.length;
      const railMinForLpfp = railValues.length ? Math.min(...railValues) : NaN;
      const railDropText =
        Number.isFinite(railMinForLpfp) && railMinForLpfp <= rules.railWarn
          ? msg(rules, "analysis.text.railDropsWith", { rail: railMinForLpfp.toFixed(0) })
          : "";
      const interventionContext =
        throttleClosurePct >= rules.throttleClosurePctWarn ||
        (anomalies.counts?.throttleMismatchRed ?? 0) >= 3;
      if (hardWotReady) {
        if (lpfpMin <= rules.lpfpSevere) {
          issues.push(makeLocalizedIssue(rules, "red", "Fuel", "analysis.issue.lpfpCritical", { lpfp: lpfpMin.toFixed(0), railDrop: railDropText }));
        } else if (lpfpBelowSustainedPct >= rules.lpfpSustainedPctWarn) {
          issues.push(
            makeLocalizedIssue(
              rules,
              "red",
              "Fuel",
              "analysis.issue.lpfpLongLow",
              { threshold: rules.lpfpSustainedWarn.toFixed(0), pct: (lpfpBelowSustainedPct * 100).toFixed(0), railDrop: railDropText }
            )
          );
        } else if (lpfpMin <= rules.lpfpWarn && interventionContext) {
          issues.push(
            makeLocalizedIssue(
              rules,
              "red",
              "Fuel",
              "analysis.issue.lpfpWithIntervention",
              { lpfp: lpfpMin.toFixed(0), railDrop: railDropText }
            )
          );
        } else if (lpfpMin <= rules.lpfpWarn) {
          issues.push(makeLocalizedIssue(rules, "yellow", "Fuel", "analysis.issue.lpfpBorderline", { lpfp: lpfpMin.toFixed(0) }));
        }
      } else if (lpfpMin <= rules.lpfpWarn || lpfpBelowSustainedPct >= rules.lpfpSustainedPctWarn) {
        notes.push(msg(rules, "analysis.note.lpfpContext", { lpfp: lpfpMin.toFixed(0) }));
      }
    } else {
      notes.push(msg(rules, "analysis.note.lpfpMissing"));
    }

    if (hardWotReady && stftValues.length) {
      const stftMaxAbs = Math.max(...stftValues.map((value) => Math.abs(value)));
      if (stftMaxAbs >= rules.stftPeggedWarn) {
        issues.push(makeLocalizedIssue(rules, "yellow", "Fuel", "analysis.issue.stftPegged", { value: stftMaxAbs.toFixed(0) }));
      }
    }

    if (hardWotReady && stftBankDiffs.length && Math.max(...stftBankDiffs) >= rules.fuelTrimBankDiffWarn) {
      issues.push(makeLocalizedIssue(rules, "yellow", "Fuel", "analysis.issue.stftBankDiff", { value: Math.max(...stftBankDiffs).toFixed(0) }));
    }

    if (hardWotReady && ltftValues.length) {
      const ltftMaxAbs = Math.max(...ltftValues.map((value) => Math.abs(value)));
      if (ltftMaxAbs > rules.ltftWarn) {
        issues.push(makeLocalizedIssue(rules, "yellow", "Fuel", "analysis.issue.ltftHigh", { threshold: rules.ltftWarn.toFixed(0), value: ltftMaxAbs.toFixed(0) }));
      }
    }

    if (hardWotReady && ltftBankDiffs.length && Math.max(...ltftBankDiffs) >= rules.fuelTrimBankDiffWarn) {
      issues.push(makeLocalizedIssue(rules, "yellow", "Fuel", "analysis.issue.ltftBankDiff", { value: Math.max(...ltftBankDiffs).toFixed(0) }));
    }

    if (railValues.length) {
      const railMin = Math.min(...railValues);
      if (hardWotReady) {
        if (railMin <= rules.railSevere) {
          issues.push(makeLocalizedIssue(rules, "red", "Fuel", "analysis.issue.railCritical", { rail: railMin.toFixed(0) }));
        } else if (railMin <= rules.railWarn) {
          issues.push(makeLocalizedIssue(rules, "yellow", "Fuel", "analysis.issue.railLow", { rail: railMin.toFixed(0) }));
        }
      } else if (railMin <= rules.railWarn) {
        notes.push(msg(rules, "analysis.note.railContext", { rail: railMin.toFixed(0) }));
      }
    } else {
      notes.push(msg(rules, "analysis.note.railMissing"));
    }

    if (hardWotReady && lambdaBankDiffs.length && Math.max(...lambdaBankDiffs) > rules.lambdaBankDiffWarn) {
      issues.push(makeLocalizedIssue(rules, "yellow", "Fuel", "analysis.issue.lambdaBankDiff", { value: Math.max(...lambdaBankDiffs).toFixed(2) }));
    }

    const lambdaEvalValues = evaluatedBoostRows
      .map((row) => {
        const lambda = columns.lambda1 ? numberValue(row[columns.lambda1]) : NaN;
        const boost = columns.boost ? pressureToPsi(numberValue(row[columns.boost]), columns.boost) : NaN;
        return Number.isFinite(lambda) && Number.isFinite(boost) && boost > 10 && lambda < 16 ? lambda : NaN;
      })
      .filter((value) => Number.isFinite(value));

    if (hardWotReady && lambdaEvalValues.length && targetValues.length && Math.max(...targetValues) > 10) {
      const lambdaAvg = stats(lambdaEvalValues).avg;
      if (lambdaAvg > rules.afrLeanWarn && !lambdaTargetValues.length) {
        issues.push(makeLocalizedIssue(rules, "yellow", "Fuel", "analysis.issue.afrLean", { value: lambdaAvg.toFixed(2) }));
      }
    }

    if (hardWotReady && wgdcValues.length) {
      const wgdcStat = stats(wgdcValues);
      const underboost = boostErrors.length ? Math.min(...boostErrors) <= rules.boostUnderWarn : false;
      const boostAvgAbs = boostErrors.length
        ? boostErrors.map((value) => Math.abs(value)).reduce((sum, value) => sum + value, 0) / boostErrors.length
        : 0;
      if (
        (wgdcStat.avg >= rules.wgdcSevereAvg && underboost) ||
        (wgdcStat.max >= rules.wgdcSevereMax && underboost && wgdcStat.avg >= rules.wgdcWarnAvg && boostAvgAbs > 2.5)
      ) {
        issues.push(makeLocalizedIssue(rules, "red", "Turbo", "analysis.issue.wgdcHigh", { value: wgdcStat.avg.toFixed(0) }));
      } else if (wgdcStat.avg >= rules.wgdcWarnAvg || wgdcStat.avg >= rules.wgdcSevereAvg) {
        issues.push(makeLocalizedIssue(rules, "yellow", "Turbo", "analysis.issue.wgdcRaised", { value: wgdcStat.avg.toFixed(0) }));
      }
    }

    if (iatValues.length) {
      const rise = iatValues[iatValues.length - 1] - iatValues[0];
      const max = Math.max(...iatValues);
      if (max >= rules.iatSevereMaxC || rise >= rules.iatSevereRiseC) {
        issues.push(makeLocalizedIssue(rules, "red", "Temperatur", "analysis.issue.iatHigh", { max: max.toFixed(0), rise: rise.toFixed(0) }));
      } else if (max >= rules.iatWarnMaxC || rise >= rules.iatWarnRiseC) {
        issues.push(makeLocalizedIssue(rules, "yellow", "Temperatur", "analysis.issue.iatWarm", { max: max.toFixed(0), rise: rise.toFixed(0) }));
      }
    }

    if (hardWotReady && throttleClosures > 0) {
      if (throttleClosurePct >= rules.throttleClosurePctSevere) {
        issues.push(makeLocalizedIssue(rules, "yellow", "Regelung", "analysis.issue.throttleClosureIntervention", { pct: (throttleClosurePct * 100).toFixed(0) }));
      } else if (throttleClosurePct >= rules.throttleClosurePctWarn) {
        issues.push(makeLocalizedIssue(rules, "yellow", "Regelung", "analysis.issue.throttleClosure", { pct: (throttleClosurePct * 100).toFixed(0) }));
      }
    }

    if (torqueLimiterActive) {
      if (hardWotReady) {
        issues.push(makeLocalizedIssue(rules, "red", "Limiter", "analysis.issue.torqueLimiter"));
      } else {
        notes.push(msg(rules, "analysis.note.torqueLimiterContext"));
      }
    }

    issues.push(...issuesFromAnomalies(anomalies, rules));

    const missingChannels = [
      ["RPM", columns.rpm],
      ["Gear", columns.gear],
      ["IAT", columns.iat],
      ["Rail", columns.rail],
      ["LPFP", columns.lpfp],
      ["Lambda", columns.lambda1],
      ["WGDC", columns.wgdc],
      ["Throttle", columns.throttle],
      ["Timing Corrections", timingCorrectionColumns.length ? "ok" : null],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missingChannels.length >= rules.missingChannelsWarnCount) {
      issues.push(makeLocalizedIssue(rules, "yellow", "Daten", "analysis.issue.missingChannels", { channels: missingChannels.join(", ") }));
    }

    const status = statusFromIssues(issues);
    const validation = buildPullValidation({
      dur,
      rpmValues,
      gearSet,
      pedalValues,
      throttleClosurePct,
      torqueLimiterActive,
      rules,
    });
    const platformContext = buildPlatformContext(vehicleInfo, {
      gearSet,
      rpmValues,
      lpfpValues,
      railValues,
      throttleClosurePct,
      anomalies,
      rules,
    });
    const trace = buildTraceCharts(segmentRows, columns, rules);
    const metrics = {
      rows: rows.length,
      columns: headers.length,
      selectedSegment: {
        start: selectedSegment[0],
        end: selectedSegment[1],
        rows: segmentRows.length,
        duration: dur,
      },
      evaluation: {
        hardWotReady,
        hardWotRows: stateSteadyRows.length,
      },
      states: segmentStateSummary,
      allStates: allStateSummary,
      pull: {
        gear: gearSet.length === 1 ? String(gearSet[0]) : gearSet.length ? gearSet.join("/") : "n/a",
        rpmRange: rpmValues.length ? [Math.min(...rpmValues), Math.max(...rpmValues)] : null,
        speedRange: speedValues.length ? [Math.min(...speedValues), Math.max(...speedValues)] : null,
        speedUnit: columns.speed && /mph/i.test(columns.speed) ? "mph" : "km/h",
        pedal: stats(pedalValues),
      },
      boost: {
        actual: stats(boostValues),
        target: stats(targetValues),
        error: boostErrors.length
          ? {
              min: Math.min(...boostErrors),
              avg: boostErrors.reduce((sum, value) => sum + value, 0) / boostErrors.length,
              max: Math.max(...boostErrors),
              avgAbs: absBoostErrors.reduce((sum, value) => sum + value, 0) / absBoostErrors.length,
              p90Abs: percentile(absBoostErrors, 0.9),
            }
          : null,
      },
      fuel: {
        rail: stats(railValues),
        railReq: stats(railReqValues),
        lpfp: stats(lpfpValues),
        lpfpBelow50Pct: lpfpValues.length
          ? lpfpValues.filter((value) => value < rules.lpfpSustainedWarn).length / lpfpValues.length
          : null,
        lambda1: stats(lambda1Values),
        lambda2: stats(lambda2Values),
        lambdaTarget: stats(lambdaTargetValues),
        lambdaBankDiff: stats(lambdaBankDiffs),
        stft: stats(stftValues),
        stft1: stats(stft1Values),
        stft2: stats(stft2Values),
        stftBankDiff: stats(stftBankDiffs),
        ltft: stats(ltftValues),
        ltft1: stats(ltft1Values),
        ltft2: stats(ltft2Values),
        ltftBankDiff: stats(ltftBankDiffs),
        ethanol: stats(ethanolValues),
      },
      turbo: {
        wgdc: stats(wgdcValues),
      },
      temps: {
        iat: iatValues.length
          ? {
              start: iatValues[0],
              end: iatValues[iatValues.length - 1],
              min: Math.min(...iatValues),
              max: Math.max(...iatValues),
              rise: iatValues[iatValues.length - 1] - iatValues[0],
            }
          : null,
        coolant: stats(coolantValues),
        oil: stats(oilValues),
      },
      timing: {
        corrections: timingValues.length
          ? {
              max: Math.max(...timingValues),
              avg: timingValues.reduce((sum, value) => sum + value, 0) / timingValues.length,
              countGt3: timingValues.filter((value) => value > 3).length,
              countGt6: timingValues.filter((value) => value > 6).length,
              byCylinder: timingByCylinder,
            }
          : null,
        context: timingContext,
        ignitionEndAvg: ignitionEndValues.length
          ? ignitionEndValues.reduce((sum, value) => sum + value, 0) / ignitionEndValues.length
          : null,
      },
      control: {
        throttle: stats(throttleValues),
        throttleClosures,
        throttleClosurePct,
        torqueLimiterActive,
      },
      load: {
        actual: stats(loadActualValues),
        requested: stats(loadReqValues),
        maf: stats(mafValues),
        mafReq: stats(mafReqValues),
      },
      anomalies,
      validation,
      platformContext,
      trace,
    };
    metrics.reference = buildReferenceComparison(vehicleInfo, metrics, rules);

    const pullAnalyses = skipPullAnalyses
      ? []
      : makePullCandidates(rows, columns, segments).map((candidate) => {
          const analysis = analyzeRows(filename, parsed, {
            ...rulesInput,
            __segment: candidate.segment,
            __skipPullAnalyses: true,
          });
          return summarizePullResult(analysis, candidate);
        });

    if (pullAnalyses.length) {
      metrics.pullAnalyses = pullAnalyses;
      metrics.pullCount = pullAnalyses.length;
    }

    const finalStatus = pullAnalyses.length
      ? statusFromStatuses([status, ...pullAnalyses.map((pull) => pull.status)])
      : status;
    const headline = headlineFromPulls(pullAnalyses, makeHeadline(status, issues, metrics, rules), rules);
    const tuning = tuningHint(finalStatus, issues, metrics, rules);
    const diagnoses = buildDiagnoses(issues, rules);

    return {
      filename,
      status: finalStatus,
      statusLabel: labelForStatus(finalStatus, rules),
      headline,
      tuning,
      issues,
      diagnoses,
      vehicleInfo,
      notes,
      metrics,
      columns,
      missingChannels,
    };
  }

  function buildDiagnoses(issues, rules = DEFAULT_RULES) {
    const diagnoses = [];
    const seen = new Set();

    issues.forEach((issue) => {
      diagnosisForIssue(issue, rules).forEach((diagnosis) => {
        const key = diagnosis.title;
        if (seen.has(key)) return;
        seen.add(key);
        diagnoses.push(diagnosis);
      });
    });

    return diagnoses.slice(0, 8);
  }

  function diagnosis(rules, titleKey, causeKeys) {
    return {
      title: msg(rules, titleKey),
      causes: causeKeys.map((key) => msg(rules, key)),
    };
  }

  function diagnosisForIssue(issue, rules = DEFAULT_RULES) {
    const text = issue.text.toLowerCase();
    const category = issue.category;

    if (category === "Datei") {
      return [diagnosis(rules, "analysis.diag.csvBad.title", [
        "analysis.diag.csvBad.c1",
        "analysis.diag.csvBad.c2",
        "analysis.diag.csvBad.c3",
      ])];
    }

    if (category === "Pull") {
      if (text.includes("gangwechsel") || issue.i18nKey === "analysis.issue.gearShift") {
        return [diagnosis(rules, "analysis.diag.shiftLog.title", [
          "analysis.diag.shiftLog.c1",
          "analysis.diag.shiftLog.c2",
          "analysis.diag.shiftLog.c3",
        ])];
      }
      if (text.includes("kurz") || issue.i18nKey === "analysis.issue.pullShort") {
        return [diagnosis(rules, "analysis.diag.shortPull.title", [
          "analysis.diag.shortPull.c1",
          "analysis.diag.shortPull.c2",
          "analysis.diag.shortPull.c3",
        ])];
      }
      return [diagnosis(rules, "analysis.diag.unclearWot.title", [
        "analysis.diag.unclearWot.c1",
        "analysis.diag.unclearWot.c2",
        "analysis.diag.unclearWot.c3",
      ])];
    }

    if (category === "Boost") {
      if (text.includes("under") || text.includes("unter target") || text.includes("folgt target") || issue.i18nKey === "analysis.issue.boostUnder" || issue.i18nKey === "analysis.issue.boostTracking") {
        return [diagnosis(rules, "analysis.diag.underboost.title", [
          "analysis.diag.underboost.c1",
          "analysis.diag.underboost.c2",
          "analysis.diag.underboost.c3",
          "analysis.diag.underboost.c4",
        ])];
      }
      if (text.includes("overboost") || issue.i18nKey === "analysis.issue.overboost") {
        return [diagnosis(rules, "analysis.diag.overboost.title", [
          "analysis.diag.overboost.c1",
          "analysis.diag.overboost.c2",
          "analysis.diag.overboost.c3",
          "analysis.diag.overboost.c4",
        ])];
      }
    }

    if (category === "Timing") {
      return [diagnosis(rules, "analysis.diag.timing.title", [
        "analysis.diag.timing.c1",
        "analysis.diag.timing.c2",
        "analysis.diag.timing.c3",
        "analysis.diag.timing.c4",
      ])];
    }

    if (category === "Fuel") {
      if (/^analysis\.issue\.lpfp/.test(issue.i18nKey || "") || text.includes("lpfp")) {
        const titleKey = String(issue.i18nVars?.railDrop || "").trim() || text.includes("rail")
          ? "analysis.diag.lpfpRail.title"
          : "analysis.diag.lpfp.title";
        return [diagnosis(rules, titleKey, [
          "analysis.diag.lpfp.c1",
          "analysis.diag.lpfp.c2",
          "analysis.diag.lpfp.c3",
          "analysis.diag.lpfp.c4",
          "analysis.diag.lpfp.c5",
        ])];
      }
      if (issue.i18nKey === "analysis.issue.railCritical" || issue.i18nKey === "analysis.issue.railLow" || text.includes("rail")) {
        return [diagnosis(rules, "analysis.diag.rail.title", [
          "analysis.diag.rail.c1",
          "analysis.diag.rail.c2",
          "analysis.diag.rail.c3",
          "analysis.diag.rail.c4",
        ])];
      }
      if (text.includes("lambda-bank") || issue.i18nKey === "analysis.issue.lambdaBankDiff") {
        return [diagnosis(rules, "analysis.diag.lambdaBank.title", [
          "analysis.diag.lambdaBank.c1",
          "analysis.diag.lambdaBank.c2",
          "analysis.diag.lambdaBank.c3",
        ])];
      }
      return [diagnosis(rules, "analysis.diag.fuelMix.title", [
        "analysis.diag.fuelMix.c1",
        "analysis.diag.fuelMix.c2",
        "analysis.diag.fuelMix.c3",
      ])];
    }

    if (category === "Turbo") {
      return [diagnosis(rules, "analysis.diag.wgdc.title", [
        "analysis.diag.wgdc.c1",
        "analysis.diag.wgdc.c2",
        "analysis.diag.wgdc.c3",
        "analysis.diag.wgdc.c4",
      ])];
    }

    if (category === "Temperatur") {
      return [diagnosis(rules, "analysis.diag.iat.title", [
        "analysis.diag.iat.c1",
        "analysis.diag.iat.c2",
        "analysis.diag.iat.c3",
      ])];
    }

    if (category === "Regelung") {
      if (text.includes("hesitation") || issue.i18nKey === "analysis.issue.hesitationPull") {
        return [diagnosis(rules, "analysis.diag.hesitation.title", [
          "analysis.diag.hesitation.c1",
          "analysis.diag.hesitation.c2",
          "analysis.diag.hesitation.c3",
        ])];
      }
      return [diagnosis(rules, "analysis.diag.throttleClosure.title", [
        "analysis.diag.throttleClosure.c1",
        "analysis.diag.throttleClosure.c2",
        "analysis.diag.throttleClosure.c3",
      ])];
    }

    if (category === "Leerlauf") {
      return [diagnosis(rules, "analysis.diag.idleAfr.title", [
        "analysis.diag.idleAfr.c1",
        "analysis.diag.idleAfr.c2",
        "analysis.diag.idleAfr.c3",
      ])];
    }

    if (category === "Limiter") {
      return [diagnosis(rules, "analysis.diag.limiter.title", [
        "analysis.diag.limiter.c1",
        "analysis.diag.limiter.c2",
        "analysis.diag.limiter.c3",
      ])];
    }

    if (category === "Daten") {
      return [diagnosis(rules, "analysis.diag.dataQuality.title", [
        "analysis.diag.dataQuality.c1",
        "analysis.diag.dataQuality.c2",
        "analysis.diag.dataQuality.c3",
      ])];
    }

    return [];
  }

  function makeHeadline(status, issues, metrics, rules = DEFAULT_RULES) {
    const lpfpProblem = issues.find((issue) => issue.severity === "red" && /LPFP/i.test(issue.text));
    const firstProblem =
      lpfpProblem ||
      issues.find((issue) => issue.severity === "red") ||
      issues.find((issue) => issue.severity === "yellow");
    if (firstProblem) return firstProblem.text;
    const boost = metrics.boost?.actual;
    const timing = metrics.timing?.corrections;
    if (status === "green" && boost) {
      return timing
        ? msg(rules, "analysis.headline.cleanPullTiming", { boost: boost.max.toFixed(1), timing: timing.max.toFixed(1) })
        : msg(rules, "analysis.headline.cleanPull", { boost: boost.max.toFixed(1) });
    }
    return msg(rules, "analysis.headline.noFindings");
  }

  function tuningHint(status, issues, metrics, rules = DEFAULT_RULES) {
    const categories = new Set(issues.map((issue) => issue.category));
    if (categories.has("Fuel")) return msg(rules, "analysis.tuning.fuel");
    if (categories.has("Timing")) return msg(rules, "analysis.tuning.timing");
    if (categories.has("Regelung") || categories.has("Boost")) return msg(rules, "analysis.tuning.boostControl");
    if (categories.has("Turbo")) return msg(rules, "analysis.tuning.turbo");
    const wgdcAvg = metrics.turbo?.wgdc?.avg;
    const timingMax = metrics.timing?.corrections?.max ?? 0;
    const iatRise = metrics.temps?.iat?.rise ?? 0;
    if (status === "green" && (!Number.isFinite(wgdcAvg) || wgdcAvg < 60) && timingMax < 2 && iatRise < 15) {
      return msg(rules, "analysis.tuning.headroom");
    }
    return msg(rules, "analysis.tuning.compareOnly");
  }

  function analyzeText(filename, text, rules) {
    return analyzeRows(filename, parseCsv(text), rules);
  }

  const api = {
    DEFAULT_RULES,
    ROW_STATES,
    BURBLE_PROFILES,
    RULE_PRESETS,
    analyzeRows,
    analyzeText,
    classifyRows,
    classifyRow,
    normalizeSignals,
    detectFlags,
    pickStateByPriority,
    evaluateTiming,
    evaluateFueling,
    evaluateBoost,
    parseCsv,
    rangeLabel,
    rulesForPreset,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.LogAnalyzer = api;
})(typeof window !== "undefined" ? window : globalThis);
