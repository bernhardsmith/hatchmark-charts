"use strict";
(() => {
  // node_modules/hatchmark/src/notation.ts
  var COLOR = {
    measuredDark: "#333333",
    measuredLight: "#A0A0A0",
    outlineStroke: "#333333",
    desirable: "#89B54A",
    undesirable: "#E2001A",
    neutral: "#0066CC",
    background: "#FFFFFF"
  };
  var MODE_MAP = {
    colour: { desirable: COLOR.desirable, undesirable: COLOR.undesirable, neutral: COLOR.neutral },
    monochrome: { desirable: "#BFBFBF", undesirable: "#333333", neutral: "#808080" },
    cvd: { desirable: "#1B9E77", undesirable: COLOR.undesirable, neutral: COLOR.neutral }
  };
  function scenarioFill(scenario) {
    switch (scenario) {
      case "PL":
      case "BU":
        return "outlined";
      case "FC":
        return "hatched";
      default:
        return "solid";
    }
  }
  function scenarioColor(scenario) {
    return scenario === "PY" ? COLOR.measuredLight : COLOR.measuredDark;
  }
  function impactFor(value, interpretable, goodDirection2 = "up") {
    if (!interpretable || value === 0) return "neutral";
    const desirable = goodDirection2 === "up" ? value > 0 : value < 0;
    return desirable ? "desirable" : "undesirable";
  }
  function impactColour(impact, mode = "colour") {
    return MODE_MAP[mode][impact];
  }
  function applyPeriodNotation(label, mode = "none") {
    switch (mode) {
      case "ytd":
        return `_${label}`;
      case "ytg":
        return `${label}_`;
      case "moving":
        return `~${label}`;
      // UN 4.2: temporal averages APPEND the average sign.
      case "average-temporal":
        return `${label}\u2205`;
      // UN 4.3: structural averaging allows prefix (or appended).
      case "average-structural":
        return `\u2205${label}`;
      case "first-day":
        return `.${label}`;
      case "last-day":
        return `${label}.`;
      default:
        return label;
    }
  }
  var MINUS = "\u2212";
  function formatNumber(v, decimals = 0, prefix = "", suffix = "") {
    const absStr = Math.abs(v).toFixed(decimals);
    const body = `${prefix}${absStr}${suffix}`;
    if (Number(absStr) === 0) return body;
    return v < 0 ? `${MINUS}${body}` : body;
  }
  function formatSigned(v, decimals = 0, prefix = "", suffix = "") {
    const body = formatNumber(v, decimals, prefix, suffix);
    return v > 0 && Number(Math.abs(v).toFixed(decimals)) !== 0 ? `+${body}` : body;
  }

  // node_modules/hatchmark/src/svg.ts
  function esc(text2) {
    return text2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmt(v) {
    if (typeof v === "number") {
      const r = Math.round(v * 100) / 100;
      return String(r);
    }
    return v;
  }
  function el(tag, attrs = {}, ...children) {
    const a = Object.entries(attrs).filter(([, v]) => v !== void 0).map(([k, v]) => ` ${k}="${esc(fmt(v))}"`).join("");
    const inner = children.join("");
    return inner ? `<${tag}${a}>${inner}</${tag}>` : `<${tag}${a}/>`;
  }
  function text(attrs, content) {
    const a = Object.entries(attrs).filter(([, v]) => v !== void 0).map(([k, v]) => ` ${k}="${esc(fmt(v))}"`).join("");
    return `<text${a}>${esc(content)}</text>`;
  }
  function hatchPattern(id, color) {
    return el(
      "pattern",
      { id, patternUnits: "userSpaceOnUse", width: 4, height: 4, patternTransform: "rotate(45)" },
      el("line", { x1: 0, y1: 0, x2: 0, y2: 4, stroke: color, "stroke-width": 1.5 })
    );
  }
  function fillProps(treatment, color, hatchId) {
    switch (treatment) {
      case "solid":
        return { fill: color, stroke: color, "stroke-width": 0.5 };
      case "hatched":
        return { fill: `url(#${hatchId})`, stroke: color, "stroke-width": 0.5 };
      case "outlined":
        return { fill: "transparent", stroke: color, "stroke-width": 1.5 };
    }
  }

  // node_modules/hatchmark/src/render/shared.ts
  var FS = { title: 7.5, axisLabel: 6.5, axisUnit: 7.5, dataLabel: 6 };
  var STYLE = {
    axisColor: "#333333",
    axisLineW: 0.75,
    tickLength: 3,
    tickLineW: 0.5,
    gridlineColor: "#E5E7EB",
    gridlineW: 0.25,
    fontFamily: "'Barlow', sans-serif"
  };
  var CATEGORY_GAP = 2;
  var RATIO_ABSOLUTE = 2 / 3;
  var RATIO_RELATIVE = 1 / 3;
  var CHAR_WIDTH_FACTOR = 0.52;
  var CAP_HEIGHT_FACTOR = 0.72;
  var PIN_LABEL_GAP = 2;
  function pinLabelBaseline(tipY, headSize, positive, fs) {
    return positive ? tipY - headSize / 2 - PIN_LABEL_GAP : tipY + headSize / 2 + PIN_LABEL_GAP + fs * CAP_HEIGHT_FACTOR;
  }
  function pinLabelRoom(headMax, labelled, fs) {
    return headMax / 2 + (labelled ? PIN_LABEL_GAP + fs * CAP_HEIGHT_FACTOR + 1 : 1);
  }
  var TITLE_LINE_H = Math.ceil(FS.title * 1.25);
  function wrapWords(words, maxChars) {
    const lines = [];
    let cur = [];
    let len = 0;
    for (const w of words) {
      const wlen = w.text.length;
      const addLen = cur.length > 0 ? wlen + 1 : wlen;
      if (cur.length > 0 && len + addLen > maxChars) {
        lines.push(cur);
        cur = [];
        len = 0;
      }
      if (wlen > maxChars) {
        let rest = w.text;
        while (rest.length > maxChars) {
          lines.push([{ text: rest.slice(0, maxChars), bold: w.bold }]);
          rest = rest.slice(maxChars);
        }
        cur = [{ text: rest, bold: w.bold }];
        len = rest.length;
        continue;
      }
      cur.push(w);
      len += cur.length === 1 ? wlen : wlen + 1;
    }
    if (cur.length > 0) lines.push(cur);
    return lines;
  }
  function toWords(s, bold) {
    return s.split(/\s+/).filter(Boolean).map((text2) => ({ text: text2, bold }));
  }
  function prepareTitleLines(t, maxChars) {
    const out = [];
    if (t.reportingUnit) out.push(...wrapWords(toWords(t.reportingUnit), maxChars));
    if (t.measure) {
      const words = [...toWords(t.measure, true), ...t.unit ? toWords(`in ${t.unit}`) : []];
      out.push(...wrapWords(words, maxChars));
    }
    if (t.timePeriod) out.push(...wrapWords(toWords(t.timePeriod), maxChars));
    return out;
  }
  function computeLayout(width, height, title, showValueAxis, unitLabelText, maxTickLabelChars) {
    const yAxisW = showValueAxis ? 28 : 2;
    const labelW = maxTickLabelChars * FS.axisLabel * CHAR_WIDTH_FACTOR;
    const titleX = showValueAxis && maxTickLabelChars > 0 ? Math.max(0, yAxisW - STYLE.tickLength - 1 - labelW) : 0;
    const availW = Math.max(20, width - titleX - 2);
    const maxChars = Math.max(8, Math.floor(availW / (FS.title * CHAR_WIDTH_FACTOR)));
    const titleLines = prepareTitleLines(title, maxChars);
    const titleH = titleLines.length > 0 ? TITLE_LINE_H * titleLines.length + 6 : 2;
    const xAxisH = Math.ceil(FS.axisLabel * 1.25) + STYLE.tickLength;
    const unitLabelH = showValueAxis && unitLabelText ? FS.axisUnit + 1 : 0;
    const padLeft = yAxisW;
    const padTop = titleH + unitLabelH;
    const plotW = Math.max(10, width - padLeft - 6);
    const plotH = Math.max(10, height - padTop - xAxisH);
    return { width, height, padLeft, padTop, plotW, plotH, titleH, unitLabelH, titleX, titleLines };
  }
  function titleBlock(layout) {
    if (layout.titleLines.length === 0) return "";
    const rendered = layout.titleLines.map((runs, lineIdx) => {
      const groups = [];
      for (const run of runs) {
        const last = groups[groups.length - 1];
        if (last && !!last.bold === !!run.bold) last.text += ` ${run.text}`;
        else groups.push({ ...run });
      }
      let content = "";
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const t = esc(g.text) + (i < groups.length - 1 ? " " : "");
        content += g.bold ? `<tspan font-weight="600">${t}</tspan>` : t;
      }
      return `<tspan x="${layout.titleX}" dy="${lineIdx === 0 ? 0 : TITLE_LINE_H}">${content}</tspan>`;
    }).join("");
    return `<text x="${layout.titleX}" y="${FS.title}" font-size="${FS.title}" fill="${COLOR.measuredDark}">${rendered}</text>`;
  }
  function tickValues(a) {
    const range = a.max - a.min;
    if (range <= 0 || a.ticks <= 0) return [];
    const out = [];
    for (let i = 0; i <= a.ticks; i++) out.push(a.min + range / a.ticks * i);
    return out;
  }
  function formatTick(v, a) {
    return formatNumber(v, a.decimals, a.prefix, a.suffix);
  }
  function makeFormatter(values, a, autoScale = true) {
    const maxAbs = values.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    let div = 1;
    let unit = "";
    if (autoScale && !a.suffix) {
      if (maxAbs >= 1e10) {
        div = 1e9;
        unit = "bn";
      } else if (maxAbs >= 1e7) {
        div = 1e6;
        unit = "M";
      } else if (maxAbs >= 1e4) {
        div = 1e3;
        unit = "K";
      }
    }
    const suffix = unit ? unit + a.suffix : a.suffix;
    return {
      div,
      suffix: unit,
      plain: (v) => formatNumber(v / div, a.decimals, a.prefix, suffix),
      signed: (v) => {
        const body = formatNumber(v / div, a.decimals, a.prefix, suffix);
        const rounds0 = Number(Math.abs(v / div).toFixed(a.decimals)) === 0;
        return v > 0 && !rounds0 ? `+${body}` : body;
      }
    };
  }
  function yFor(v, a, plotH) {
    const range = a.max - a.min;
    if (range <= 0) return plotH;
    return plotH - (v - a.min) / range * plotH;
  }
  function clampToPlot(y, plotH) {
    return Math.min(plotH, Math.max(0, y));
  }
  function valueAxis(a, layout, fmt2) {
    const parts = [];
    const ticks = tickValues(a);
    for (const t of ticks) {
      const y = yFor(t, a, layout.plotH);
      if (y < -0.5 || y > layout.plotH + 0.5) continue;
      parts.push(el("line", { x1: 0, y1: y, x2: layout.plotW, y2: y, stroke: STYLE.gridlineColor, "stroke-width": STYLE.gridlineW }));
    }
    parts.push(el("line", { x1: 0, y1: 0, x2: 0, y2: layout.plotH, stroke: STYLE.axisColor, "stroke-width": STYLE.axisLineW }));
    for (const t of ticks) {
      const y = yFor(t, a, layout.plotH);
      if (y < -0.5 || y > layout.plotH + 0.5) continue;
      parts.push(el("line", { x1: -STYLE.tickLength, y1: y, x2: 0, y2: y, stroke: STYLE.axisColor, "stroke-width": STYLE.tickLineW }));
      if (layout.unitLabelH > 0 && y < FS.axisLabel + 2) continue;
      parts.push(text({ x: -(STYLE.tickLength + 1), y: y + 2.5, "font-size": FS.axisLabel, fill: STYLE.axisColor, "text-anchor": "end" }, fmt2 ? fmt2.plain(t) : formatTick(t, a)));
    }
    return parts.join("");
  }
  function unitLabel(a, layout) {
    if (!a.label || layout.unitLabelH === 0) return "";
    return text(
      { x: layout.padLeft - 2, y: layout.titleH + layout.unitLabelH - 1, "font-size": FS.axisUnit, fill: STYLE.axisColor, "text-anchor": "end" },
      a.label
    );
  }
  function bands(plotW, n) {
    const categoryW = (plotW - CATEGORY_GAP * (n - 1)) / n;
    const out = [];
    for (let i = 0; i < n; i++) out.push({ x: i * (categoryW + CATEGORY_GAP), categoryW });
    return out;
  }
  function truncateLabel(label, enabled) {
    if (!enabled || label.length <= 4) return label;
    return label.slice(0, 3) + ".";
  }
  function categoryLabels(periods, layout, truncate, periodNotation = "none") {
    const bs = bands(layout.plotW, periods.length);
    return periods.map((p, i) => {
      const b = bs[i];
      const label = applyPeriodNotation(truncateLabel(p, truncate), periodNotation);
      return text(
        { x: b.x + b.categoryW / 2, y: layout.plotH + FS.axisLabel + 3, "font-size": FS.axisLabel, fill: STYLE.axisColor, "text-anchor": "middle" },
        label
      );
    }).join("");
  }
  function referenceAxis(pos, length, baseline, orientation = "h") {
    const line = (offset, stroke, width) => orientation === "h" ? el("line", { x1: 0, y1: pos + offset, x2: length, y2: pos + offset, stroke, "stroke-width": width }) : el("line", { x1: pos + offset, y1: 0, x2: pos + offset, y2: length, stroke, "stroke-width": width });
    if (baseline === "PL" || baseline === "BU") {
      return line(-0.9, COLOR.measuredDark, 0.5) + line(0.9, COLOR.measuredDark, 0.5);
    }
    if (baseline === "PY") {
      return line(0, COLOR.measuredLight, 2);
    }
    return line(0, COLOR.measuredDark, 0.75);
  }
  function svgRoot(layout, defs, content, desc) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" font-family="${STYLE.fontFamily.replace(/"/g, "&quot;")}">` + (desc ? `<desc>${esc(desc)}</desc>` : "") + (defs ? `<defs>${defs}</defs>` : "") + // The canvas is part of the notation: outlined fills are interiors of
    // this colour (notation/colors.yaml → background).
    el("rect", { x: 0, y: 0, width: layout.width, height: layout.height, fill: COLOR.background }) + content + "</svg>";
  }

  // node_modules/hatchmark/src/render/data.ts
  function seriesFor(dataset, scenario) {
    return dataset.series.find((s) => s.scenario === scenario);
  }
  function compareValues(dataset, compare) {
    return dataset.periods.map((_, i) => {
      for (const sc of compare) {
        const s = seriesFor(dataset, sc);
        const v = s?.values[i];
        if (v !== null && v !== void 0) return { value: v, scenario: sc };
      }
      return { value: null, scenario: null };
    });
  }
  function goodDirection(dataset, compare) {
    for (const sc of compare) {
      const s = seriesFor(dataset, sc);
      if (s?.good_direction) return s.good_direction;
    }
    return "up";
  }
  function resolveTitle(dataset, options, defaultMeasureSuffix = "") {
    const t = options.title ?? {};
    const scenarios = dataset.series.map((s) => s.scenario).join(", ");
    return {
      reportingUnit: t.reporting_unit ?? dataset.reporting_unit,
      measure: t.measure ?? dataset.measure + defaultMeasureSuffix,
      unit: t.unit !== void 0 ? t.unit : dataset.unit,
      timePeriod: t.time_period ?? scenarios
    };
  }

  // node_modules/hatchmark/src/render/basicColumn.ts
  function renderBasicColumn(dataset, options = {}) {
    const width = options.width ?? 260;
    const height = options.height ?? 160;
    const requested = options.scenarios ?? options.compare ?? dataset.series.map((s) => s.scenario);
    const scenarios = [...new Set(requested)];
    const chosen = scenarios.map((sc) => seriesFor(dataset, sc)).filter((s) => s !== void 0);
    const values = chosen.flatMap((s) => s.values.filter((v) => v !== null));
    const dataMax = values.length ? Math.max(...values, 0) : null;
    const dataMin = values.length ? Math.min(...values, 0) : 0;
    const axis = {
      min: options.axis?.min ?? Math.min(0, dataMin),
      max: options.axis?.max ?? defaultMax(dataMax),
      ticks: options.axis?.ticks ?? 5,
      decimals: options.axis?.decimals ?? 0,
      prefix: options.axis?.prefix ?? "",
      suffix: options.axis?.suffix ?? "",
      label: options.axis?.label ?? dataset.unit
    };
    const title = resolveTitle(dataset, options);
    const maxTickChars = Math.max(0, ...tickValues(axis).map((t) => formatTick(t, axis).length));
    const layout = computeLayout(width, height, title, true, axis.label, maxTickChars);
    const prefix = options.id_prefix ?? `hm-${dataset.id}-basic-column`;
    const usedHatch = /* @__PURE__ */ new Map();
    const bs = bands(layout.plotW, dataset.periods.length);
    const zeroInRange = axis.min <= 0 && axis.max >= 0;
    const zeroY = clampToPlot(yFor(0, axis, layout.plotH), layout.plotH);
    const marks = [];
    const labels = [];
    dataset.periods.forEach((_, i) => {
      const present = chosen.filter((s) => s.values[i] !== null && s.values[i] !== void 0);
      if (present.length === 0) return;
      const band = bs[i];
      const blockW = band.categoryW * RATIO_ABSOLUTE;
      const blockX = band.x + (band.categoryW - blockW) / 2;
      const subW = blockW / present.length;
      present.forEach((s, j) => {
        const v = s.values[i];
        const yv = clampToPlot(yFor(v, axis, layout.plotH), layout.plotH);
        const yTop = Math.min(yv, zeroY);
        const h = Math.abs(yv - zeroY);
        if (h <= 0) return;
        const treatment = scenarioFill(s.scenario);
        const color = scenarioColor(s.scenario);
        let hatchId = "";
        if (treatment === "hatched") {
          if (!usedHatch.has(color)) usedHatch.set(color, `${prefix}-hatch-${usedHatch.size}`);
          hatchId = usedHatch.get(color);
        }
        const fp = fillProps(treatment, color, hatchId);
        marks.push(el("rect", { x: blockX + j * subW, y: yTop, width: subW, height: h, ...fp }));
        if (options.show_data_labels) {
          const labelY = v >= 0 ? yTop - 2 : yTop + h + FS.dataLabel + 1;
          labels.push(text(
            { x: blockX + j * subW + subW / 2, y: labelY, "font-size": FS.dataLabel, fill: COLOR.measuredDark, "text-anchor": "middle" },
            formatNumber(v, axis.decimals, axis.prefix, axis.suffix)
          ));
        }
      });
    });
    const plot = valueAxis(axis, layout) + marks.join("") + // Category baseline at zero (CH 1.1) — only when zero is on the scale.
    (zeroInRange ? el("line", { x1: 0, y1: zeroY, x2: layout.plotW, y2: zeroY, stroke: STYLE.axisColor, "stroke-width": STYLE.axisLineW }) : "") + labels.join("") + categoryLabels(dataset.periods, layout, options.truncate_labels !== false, options.period_notation);
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const content = titleBlock(layout) + unitLabel(axis, layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>`;
    const desc = `hatchmark${options.version ? ` v${options.version}` : ""} basic-column`;
    return svgRoot(layout, defs, content, desc);
  }
  function defaultMax(dataMax) {
    if (dataMax === null) return 100;
    if (dataMax <= 0) return 0;
    const mag = Math.pow(10, Math.floor(Math.log10(dataMax)));
    return Math.ceil(dataMax / mag) * mag;
  }

  // node_modules/hatchmark/src/render/varianceColumn.ts
  var VARIANCE_MAX_EXTENT = 0.45;
  function renderVarianceColumn(dataset, options = {}) {
    const width = options.width ?? 260;
    const height = options.height ?? 160;
    const compare = options.compare ?? ["AC", "FC"];
    const baseline = options.baseline ?? "PL";
    const mode = options.colour_mode ?? "colour";
    const good = goodDirection(dataset, compare);
    const decimals = options.axis?.decimals ?? 0;
    const base = seriesFor(dataset, baseline);
    const cmp = compareValues(dataset, compare);
    const diffs = dataset.periods.map((_, i) => {
      const c = cmp[i];
      const b = base?.values[i];
      if (c.value === null || b === null || b === void 0) return null;
      return { diff: c.value - b, scenario: c.scenario };
    });
    const title = resolveTitle(dataset, options, ` \u0394${baseline}`);
    const layout = computeLayout(width, height, title, false, "", 0);
    const prefix = options.id_prefix ?? `hm-${dataset.id}-abs-variance`;
    const usedHatch = /* @__PURE__ */ new Map();
    const maxAbs = Math.max(1e-6, ...diffs.filter((d) => d !== null).map((d) => Math.abs(d.diff)));
    const varScale = layout.plotH * VARIANCE_MAX_EXTENT / maxAbs;
    const mid = layout.plotH * 0.5;
    const bs = bands(layout.plotW, dataset.periods.length);
    const marks = [];
    const labels = [];
    diffs.forEach((d, i) => {
      if (d === null) return;
      const band = bs[i];
      const barW = band.categoryW * RATIO_ABSOLUTE;
      const x = band.x + (band.categoryW - barW) / 2;
      const h = Math.abs(d.diff) * varScale;
      const y = d.diff >= 0 ? mid - h : mid;
      const impact = impactFor(d.diff, true, good);
      const color = impactColour(impact, mode);
      if (d.scenario === "FC") {
        if (!usedHatch.has(impact)) usedHatch.set(impact, `${prefix}-hatch-${impact}`);
        marks.push(el("rect", { x, y, width: barW, height: h, fill: `url(#${usedHatch.get(impact)})`, stroke: color, "stroke-width": 0.5 }));
      } else {
        marks.push(el("rect", { x, y, width: barW, height: h, fill: color }));
      }
      if (options.show_data_labels) {
        const tipY = d.diff >= 0 ? y : y + h;
        const labelY = d.diff >= 0 ? tipY - 2 : tipY + FS.dataLabel + 1;
        labels.push(text(
          { x: x + barW / 2, y: labelY, "font-size": FS.dataLabel, fill: COLOR.measuredDark, "text-anchor": "middle" },
          formatSigned(d.diff, decimals, options.axis?.prefix ?? "", options.axis?.suffix ?? "")
        ));
      }
    });
    const plot = marks.join("") + referenceAxis(mid, layout.plotW, baseline) + labels.join("") + categoryLabels(dataset.periods, layout, options.truncate_labels !== false, options.period_notation);
    const defs = [...usedHatch.entries()].map(([impact, id]) => hatchPattern(id, impactColour(impact, mode))).join("");
    const content = titleBlock(layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>`;
    const desc = `hatchmark${options.version ? ` v${options.version}` : ""} absolute-variance-column`;
    return svgRoot(layout, defs, content, desc);
  }

  // node_modules/hatchmark/src/render/variancePins.ts
  var PIN_MAX_EXTENT = 0.42;
  var PIN_SHAFT_MAX = 2;
  var PIN_HEAD_MAX = 5;
  function pinShaftWidth(barW) {
    return Math.max(1, Math.min(barW * 0.16, PIN_SHAFT_MAX));
  }
  function pinHeadSize(barW) {
    return Math.max(3, Math.min(barW * 0.45, PIN_HEAD_MAX));
  }
  function renderVariancePins(dataset, options = {}) {
    const width = options.width ?? 260;
    const height = options.height ?? 160;
    const compare = options.compare ?? ["AC", "FC"];
    const baseline = options.baseline ?? "PL";
    const mode = options.colour_mode ?? "colour";
    const good = goodDirection(dataset, compare);
    const decimals = options.axis?.decimals ?? 0;
    const base = seriesFor(dataset, baseline);
    const cmp = compareValues(dataset, compare);
    const pins = dataset.periods.map((_, i) => {
      const c = cmp[i];
      const b = base?.values[i];
      const interpretable = c.value !== null && b !== null && b !== void 0 && b > 0;
      const pct = interpretable ? (c.value - b) / b * 100 : 0;
      return { pct, interpretable, compareMissing: c.value === null, scenario: c.scenario ?? compare[0] ?? "AC" };
    });
    const title = resolveTitle(dataset, options, ` \u0394${baseline}%`);
    const layout = computeLayout(width, height, title, false, "", 0);
    const prefix = options.id_prefix ?? `hm-${dataset.id}-rel-variance`;
    const usedHatch = /* @__PURE__ */ new Map();
    const interpretablePcts = pins.filter((p) => p.interpretable).map((p) => Math.abs(p.pct));
    const maxAbs = Math.max(1e-6, ...interpretablePcts);
    const roomLabelled = pinLabelRoom(PIN_HEAD_MAX, options.show_data_labels === true, FS.dataLabel);
    const showLabels = options.show_data_labels === true && layout.plotH / 2 - roomLabelled >= layout.plotH * 0.15;
    const room = pinLabelRoom(PIN_HEAD_MAX, showLabels, FS.dataLabel);
    const maxExtent = Math.max(layout.plotH * 0.15, Math.min(layout.plotH * PIN_MAX_EXTENT, layout.plotH / 2 - room));
    const varScale = maxExtent / maxAbs;
    const mid = layout.plotH * 0.5;
    const bs = bands(layout.plotW, dataset.periods.length);
    const marks = [];
    const labels = [];
    pins.forEach((p, i) => {
      if (p.compareMissing) return;
      const band = bs[i];
      const barW = band.categoryW * RATIO_RELATIVE;
      const shaftW = pinShaftWidth(barW);
      const headSize = pinHeadSize(barW);
      const shaftX = band.x + (band.categoryW - shaftW) / 2;
      const cx = shaftX + shaftW / 2;
      const h = p.interpretable ? Math.abs(p.pct) * varScale : 0;
      const stemY = p.pct >= 0 ? mid - h : mid;
      const tipY = p.interpretable ? p.pct >= 0 ? mid - h : mid + h : mid;
      const stemColor = impactColour(impactFor(p.pct, p.interpretable, good), mode);
      if (h > 0) marks.push(el("rect", { x: shaftX, y: stemY, width: shaftW, height: h, fill: stemColor }));
      const sc = p.scenario;
      const treatment = scenarioFill(sc);
      const color = scenarioColor(sc);
      let hatchId = "";
      if (treatment === "hatched") {
        if (!usedHatch.has(color)) usedHatch.set(color, `${prefix}-hatch-${usedHatch.size}`);
        hatchId = usedHatch.get(color);
      }
      const fp = fillProps(treatment, color, hatchId);
      const headFill = fp.fill === "transparent" ? COLOR.background : fp.fill;
      marks.push(el("rect", {
        x: cx - headSize / 2,
        y: tipY - headSize / 2,
        width: headSize,
        height: headSize,
        fill: headFill,
        stroke: fp.stroke ?? COLOR.measuredDark,
        "stroke-width": fp["stroke-width"] ?? 0.5
      }));
      if (showLabels) {
        const label = p.interpretable ? formatSigned(p.pct, decimals, "", "%") : "N/A";
        const labelY = pinLabelBaseline(tipY, headSize, p.pct >= 0 || !p.interpretable, FS.dataLabel);
        labels.push(text(
          { x: cx, y: labelY, "font-size": FS.dataLabel, fill: COLOR.measuredDark, "text-anchor": "middle" },
          label
        ));
      }
    });
    const plot = marks.join("") + referenceAxis(mid, layout.plotW, baseline) + labels.join("") + categoryLabels(dataset.periods, layout, options.truncate_labels !== false, options.period_notation);
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const content = titleBlock(layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>`;
    const desc = `hatchmark${options.version ? ` v${options.version}` : ""} relative-variance-pins`;
    return svgRoot(layout, defs, content, desc);
  }

  // node_modules/hatchmark/src/render/waterfall.ts
  function buildBars(dataset, options, contribution) {
    const compare = options.compare ?? ["AC", "FC"];
    const bars = [];
    if (contribution) {
      const baseline = options.baseline ?? "PL";
      const base = seriesFor(dataset, baseline);
      const cmp = compareValues(dataset, compare);
      const good = goodDirection(dataset, compare);
      const baseTotal = (base?.values ?? []).reduce((s, v) => s + (v ?? 0), 0);
      bars.push({ label: baseline, from: 0, to: baseTotal, kind: "total", scenario: baseline });
      let cum = baseTotal;
      dataset.periods.forEach((p, i) => {
        const c = cmp[i];
        const b = base?.values[i];
        if (c.value === null || b === null || b === void 0) return;
        const diff = c.value - b;
        bars.push({
          label: p,
          from: cum,
          to: cum + diff,
          kind: "delta",
          scenario: c.scenario,
          impact: impactFor(diff, true, good)
        });
        cum += diff;
      });
      bars.push({ label: compare[0] ?? "AC", from: 0, to: cum, kind: "total", scenario: compare[0] ?? "AC" });
    } else {
      const cmp = compareValues(dataset, compare);
      let cum = 0;
      dataset.periods.forEach((p, i) => {
        const c = cmp[i];
        if (c.value === null) return;
        bars.push({ label: p, from: cum, to: cum + c.value, kind: "delta", scenario: c.scenario });
        cum += c.value;
      });
      if (options.end_total !== false) {
        bars.push({ label: "\u03A3", from: 0, to: cum, kind: "total", scenario: compare[0] ?? "AC" });
      }
    }
    return bars;
  }
  function renderWaterfall(dataset, options = {}, contribution = false) {
    const width = options.width ?? 260;
    const height = options.height ?? 160;
    const mode = options.colour_mode ?? "colour";
    const bars = buildBars(dataset, options, contribution);
    const decimals = options.axis?.decimals ?? 0;
    const extents = bars.flatMap((b) => [b.from, b.to]);
    let lo = Math.min(0, ...extents);
    const hi = Math.max(0, ...extents);
    let axisBreak = false;
    if (contribution && options.axis?.min === void 0) {
      const action = bars.flatMap((b) => b.kind === "total" ? [b.to] : [b.from, b.to]);
      const aLo = Math.min(...action);
      const span = Math.max(1e-6, Math.max(...action) - aLo);
      if (aLo > 0 && aLo > span * 1.5) {
        lo = aLo - span * 0.4;
        axisBreak = true;
      }
    }
    const axis = {
      min: options.axis?.min ?? lo,
      max: options.axis?.max ?? (hi === lo ? lo + 1 : hi * 1.05),
      ticks: options.axis?.ticks ?? 4,
      decimals,
      prefix: options.axis?.prefix ?? "",
      suffix: options.axis?.suffix ?? "",
      label: options.axis?.label ?? dataset.unit
    };
    const fmt2 = makeFormatter(extents, axis, options.axis?.auto_scale !== false);
    const suffixTitle = contribution ? ` bridge \u0394${options.baseline ?? "PL"}` : "";
    const title = resolveTitle(dataset, options, suffixTitle);
    const maxTickChars = Math.max(0, ...tickValues(axis).map((t) => fmt2.plain(t).length));
    const layout = computeLayout(width, height, title, true, axis.label, maxTickChars);
    const prefix = options.id_prefix ?? `hm-${dataset.id}-waterfall`;
    const usedHatch = /* @__PURE__ */ new Map();
    const hatchFor = (color) => {
      if (!usedHatch.has(color)) usedHatch.set(color, `${prefix}-hatch-${usedHatch.size}`);
      return usedHatch.get(color);
    };
    const labels = bars.map((b) => b.label);
    const bs = bands(layout.plotW, bars.length);
    const marks = [];
    const texts = [];
    const zeroY = clampToPlot(yFor(0, axis, layout.plotH), layout.plotH);
    bars.forEach((b, i) => {
      const band = bs[i];
      const barW = band.categoryW * RATIO_ABSOLUTE;
      const x = band.x + (band.categoryW - barW) / 2;
      const yA = clampToPlot(yFor(b.from, axis, layout.plotH), layout.plotH);
      const yB = clampToPlot(yFor(b.to, axis, layout.plotH), layout.plotH);
      const yTop = Math.min(yA, yB);
      const h = Math.max(0.5, Math.abs(yA - yB));
      let attrs;
      if (b.kind === "total") {
        const treatment = scenarioFill(b.scenario);
        const color = scenarioColor(b.scenario);
        attrs = fillProps(treatment, color, treatment === "hatched" ? hatchFor(color) : "");
      } else if (contribution) {
        const color = impactColour(b.impact, mode);
        attrs = b.scenario === "FC" ? { fill: `url(#${hatchFor(color)})`, stroke: color, "stroke-width": 0.5 } : { fill: color };
      } else {
        const treatment = scenarioFill(b.scenario);
        const color = scenarioColor(b.scenario);
        attrs = fillProps(treatment, color, treatment === "hatched" ? hatchFor(color) : "");
      }
      marks.push(el("rect", { x, y: yTop, width: barW, height: h, ...attrs }));
      if (axisBreak && b.kind === "total") {
        const yb = Math.max(yTop + 3, layout.plotH - 7);
        marks.push(el("path", { d: `M ${x - 2} ${yb + 2} l ${barW + 4} -4`, stroke: COLOR.background, "stroke-width": 3.5, fill: "none" }));
        marks.push(el("path", { d: `M ${x - 2} ${yb} l ${barW + 4} -4`, stroke: STYLE.axisColor, "stroke-width": 0.6, fill: "none" }));
        marks.push(el("path", { d: `M ${x - 2} ${yb + 4} l ${barW + 4} -4`, stroke: STYLE.axisColor, "stroke-width": 0.6, fill: "none" }));
      }
      if (i < bars.length - 1) {
        const next = bs[i + 1];
        const nx = next.x + (next.categoryW - next.categoryW * RATIO_ABSOLUTE) / 2;
        marks.push(el("line", { x1: x + barW, y1: yB, x2: nx + next.categoryW * RATIO_ABSOLUTE, y2: yB, stroke: STYLE.axisColor, "stroke-width": 0.5 }));
      }
      if (options.show_data_labels) {
        const rising = b.to >= b.from;
        const value = b.kind === "total" ? b.to : b.to - b.from;
        const labelY = rising ? yTop - 2 : yTop + h + FS.dataLabel + 1;
        texts.push(text(
          { x: x + barW / 2, y: labelY, "font-size": FS.dataLabel, fill: COLOR.measuredDark, "text-anchor": "middle" },
          b.kind === "total" ? fmt2.plain(value) : fmt2.signed(value)
        ));
      }
    });
    const axisTicks = tickValues(axis);
    const axisParts = [];
    for (const t of axisTicks) {
      const y = yFor(t, axis, layout.plotH);
      if (y < -0.5 || y > layout.plotH + 0.5) continue;
      axisParts.push(el("line", { x1: 0, y1: y, x2: layout.plotW, y2: y, stroke: STYLE.gridlineColor, "stroke-width": STYLE.gridlineW }));
    }
    axisParts.push(el("line", { x1: 0, y1: 0, x2: 0, y2: layout.plotH, stroke: STYLE.axisColor, "stroke-width": STYLE.axisLineW }));
    for (const t of axisTicks) {
      const y = yFor(t, axis, layout.plotH);
      if (y < -0.5 || y > layout.plotH + 0.5) continue;
      axisParts.push(el("line", { x1: -STYLE.tickLength, y1: y, x2: 0, y2: y, stroke: STYLE.axisColor, "stroke-width": STYLE.tickLineW }));
      if (layout.unitLabelH > 0 && y < FS.axisLabel + 2) continue;
      axisParts.push(text({ x: -(STYLE.tickLength + 1), y: y + 2.5, "font-size": FS.axisLabel, fill: STYLE.axisColor, "text-anchor": "end" }, fmt2.plain(t)));
    }
    if (axisBreak) {
      const yb = layout.plotH - 7;
      axisParts.push(el("path", { d: `M -4 ${yb + 2} l 8 -4`, stroke: COLOR.background, "stroke-width": 3.5, fill: "none" }));
      axisParts.push(el("path", { d: `M -4 ${yb} l 8 -4`, stroke: STYLE.axisColor, "stroke-width": 0.6, fill: "none" }));
      axisParts.push(el("path", { d: `M -4 ${yb + 4} l 8 -4`, stroke: STYLE.axisColor, "stroke-width": 0.6, fill: "none" }));
    }
    const fakeLayout = { ...layout };
    const plot = axisParts.join("") + marks.join("") + el("line", {
      x1: 0,
      y1: axisBreak ? layout.plotH : zeroY,
      x2: layout.plotW,
      y2: axisBreak ? layout.plotH : zeroY,
      stroke: STYLE.axisColor,
      "stroke-width": STYLE.axisLineW
    }) + texts.join("") + categoryLabels(labels, fakeLayout, options.truncate_labels !== false, options.period_notation);
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const chartId = contribution ? "contribution-waterfall" : "waterfall-column";
    const content = titleBlock(layout) + unitLabel(axis, layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>`;
    const desc = `hatchmark${options.version ? ` v${options.version}` : ""} ${chartId}`;
    return svgRoot(layout, defs, content, desc);
  }

  // node_modules/hatchmark/src/render/lineArea.ts
  var LINE_W_ABSOLUTE = 2.4;
  var DASHES = {
    AC: void 0,
    PY: void 0,
    PL: "6,3",
    BU: "6,3",
    FC: "4,2"
  };
  function renderLineArea(dataset, options = {}, area = false) {
    const width = options.width ?? 260;
    const height = options.height ?? 160;
    const compare = options.compare ?? ["AC", "FC"];
    const others = (options.scenarios ?? dataset.series.map((s) => s.scenario)).filter((sc) => !compare.includes(sc));
    const all = dataset.series.flatMap((s) => s.values.filter((v) => v !== null));
    const dataMax = all.length ? Math.max(...all, 0) : 100;
    const dataMin = all.length ? Math.min(...all, 0) : 0;
    const axis = {
      min: options.axis?.min ?? Math.min(0, dataMin),
      max: options.axis?.max ?? (dataMax <= 0 ? 0 : niceMax(dataMax)),
      ticks: options.axis?.ticks ?? 4,
      decimals: options.axis?.decimals ?? 0,
      prefix: options.axis?.prefix ?? "",
      suffix: options.axis?.suffix ?? "",
      label: options.axis?.label ?? dataset.unit
    };
    const fmt2 = makeFormatter(all, axis, options.axis?.auto_scale !== false);
    const title = resolveTitle(dataset, options);
    const maxTickChars = Math.max(0, ...tickValues(axis).map((t) => fmt2.plain(t).length));
    const layout = computeLayout(width, height, title, true, axis.label, maxTickChars);
    const bs = bands(layout.plotW, dataset.periods.length);
    const cx = (i) => bs[i].x + bs[i].categoryW / 2;
    const zeroY = clampToPlot(yFor(0, axis, layout.plotH), layout.plotH);
    const prefix = options.id_prefix ?? `hm-${dataset.id}-line`;
    const usedHatch = /* @__PURE__ */ new Map();
    const hatchFor = (color) => {
      if (!usedHatch.has(color)) usedHatch.set(color, `${prefix}-hatch-${usedHatch.size}`);
      return usedHatch.get(color);
    };
    const marks = [];
    const texts = [];
    const cmp = compareValues(dataset, compare);
    const pts = [];
    cmp.forEach((c, i) => {
      if (c.value !== null) pts.push({ x: cx(i), y: clampToPlot(yFor(c.value, axis, layout.plotH), layout.plotH), src: c.scenario });
    });
    if (area && pts.length > 1) {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const expected = b.src === "FC";
        const color = COLOR.measuredDark;
        const fill = expected ? `url(#${hatchFor(color)})` : color;
        marks.push(el("path", {
          d: `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${b.x} ${zeroY} L ${a.x} ${zeroY} Z`,
          fill,
          "fill-opacity": expected ? 1 : 0.9,
          stroke: "none"
        }));
      }
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      marks.push(el("line", {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        stroke: COLOR.measuredDark,
        "stroke-width": LINE_W_ABSOLUTE,
        "stroke-dasharray": DASHES[b.src],
        "stroke-linecap": "round"
      }));
    }
    for (const sc of others) {
      const s = seriesFor(dataset, sc);
      if (!s) continue;
      const spts = [];
      s.values.forEach((v, i) => {
        if (v !== null) spts.push({ x: cx(i), y: clampToPlot(yFor(v, axis, layout.plotH), layout.plotH), src: sc });
      });
      for (let i = 0; i < spts.length - 1; i++) {
        marks.push(el("line", {
          x1: spts[i].x,
          y1: spts[i].y,
          x2: spts[i + 1].x,
          y2: spts[i + 1].y,
          stroke: scenarioColor(sc),
          "stroke-width": LINE_W_ABSOLUTE,
          "stroke-dasharray": DASHES[sc],
          "stroke-linecap": "round"
        }));
      }
    }
    if (options.show_data_labels) {
      cmp.forEach((c, i) => {
        if (c.value === null) return;
        const y = clampToPlot(yFor(c.value, axis, layout.plotH), layout.plotH);
        texts.push(text(
          { x: cx(i), y: y - 4, "font-size": FS.dataLabel, fill: COLOR.measuredDark, "text-anchor": "middle" },
          fmt2.plain(c.value)
        ));
      });
    }
    const plot = valueAxis(axis, layout, fmt2) + marks.join("") + el("line", { x1: 0, y1: zeroY, x2: layout.plotW, y2: zeroY, stroke: STYLE.axisColor, "stroke-width": STYLE.axisLineW }) + texts.join("") + categoryLabels(dataset.periods, layout, options.truncate_labels !== false, options.period_notation);
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const chartId = area ? "basic-area" : "basic-line";
    const content = titleBlock(layout) + unitLabel(axis, layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>`;
    const desc = `hatchmark${options.version ? ` v${options.version}` : ""} ${chartId}`;
    return svgRoot(layout, defs, content, desc);
  }
  function niceMax(v) {
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.ceil(v / mag) * mag;
  }

  // node_modules/hatchmark/src/render/bars.ts
  var LEFT_GUTTER = 38;
  function hBands(plotH, n) {
    const categoryH = (plotH - CATEGORY_GAP * (n - 1)) / n;
    return Array.from({ length: n }, (_, i) => ({ y: i * (categoryH + CATEGORY_GAP), categoryH }));
  }
  function hLayout(width, height, title) {
    const base = computeLayout(width, height, title, false, "", 0);
    const padLeft = LEFT_GUTTER;
    return { ...base, padLeft, plotW: Math.max(10, width - padLeft - 8) };
  }
  function categoryLabelsLeft(labels, layout) {
    const rows = hBands(layout.plotH, labels.length);
    return labels.map((p, i) => text(
      { x: -4, y: rows[i].y + rows[i].categoryH / 2 + FS.axisLabel / 3, "font-size": FS.axisLabel, fill: STYLE.axisColor, "text-anchor": "end" },
      p
    )).join("");
  }
  function renderBasicBar(dataset, options = {}) {
    const width = options.width ?? 260;
    const height = options.height ?? 160;
    const requested = options.scenarios ?? options.compare ?? dataset.series.map((s) => s.scenario);
    const chosen = [...new Set(requested)].map((sc) => seriesFor(dataset, sc)).filter((s) => s !== void 0);
    const values = chosen.flatMap((s) => s.values.filter((v) => v !== null));
    const maxV = values.length ? Math.max(...values, 0) : 100;
    const axis = {
      min: options.axis?.min ?? 0,
      max: options.axis?.max ?? maxV * 1.15,
      ticks: 0,
      decimals: options.axis?.decimals ?? 0,
      prefix: options.axis?.prefix ?? "",
      suffix: options.axis?.suffix ?? "",
      label: options.axis?.label ?? dataset.unit
    };
    const fmt2 = makeFormatter(values, axis, options.axis?.auto_scale !== false);
    const title = resolveTitle(dataset, options);
    const layout = hLayout(width, height, title);
    const rows = hBands(layout.plotH, dataset.periods.length);
    const range = axis.max - axis.min;
    const xFor = (v) => range <= 0 ? 0 : (v - axis.min) / range * layout.plotW;
    const prefix = options.id_prefix ?? `hm-${dataset.id}-basic-bar`;
    const usedHatch = /* @__PURE__ */ new Map();
    const marks = [];
    const texts = [];
    dataset.periods.forEach((_, i) => {
      const present = chosen.filter((s) => s.values[i] !== null && s.values[i] !== void 0);
      if (present.length === 0) return;
      const row = rows[i];
      const blockH = row.categoryH * RATIO_ABSOLUTE;
      const blockY = row.y + (row.categoryH - blockH) / 2;
      const subH = blockH / present.length;
      present.forEach((s, j) => {
        const v = s.values[i];
        const w = Math.max(0, Math.min(xFor(v), layout.plotW));
        const treatment = scenarioFill(s.scenario);
        const color = scenarioColor(s.scenario);
        let hatchId = "";
        if (treatment === "hatched") {
          if (!usedHatch.has(color)) usedHatch.set(color, `${prefix}-hatch-${usedHatch.size}`);
          hatchId = usedHatch.get(color);
        }
        marks.push(el("rect", { x: 0, y: blockY + j * subH, width: w, height: subH, ...fillProps(treatment, color, hatchId) }));
        if (options.show_data_labels) {
          texts.push(text(
            { x: w + 3, y: blockY + j * subH + subH / 2 + FS.dataLabel / 3, "font-size": FS.dataLabel, fill: COLOR.measuredDark, "text-anchor": "start" },
            fmt2.plain(v)
          ));
        }
      });
    });
    const plot = el("line", { x1: 0, y1: 0, x2: 0, y2: layout.plotH, stroke: STYLE.axisColor, "stroke-width": STYLE.axisLineW }) + marks.join("") + texts.join("") + categoryLabelsLeft(dataset.periods, layout);
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const unitNote = text({ x: layout.padLeft + layout.plotW, y: layout.titleH + FS.axisUnit, "font-size": FS.axisUnit, fill: STYLE.axisColor, "text-anchor": "end" }, axis.label + (fmt2.suffix ? ` (${fmt2.suffix})` : ""));
    const content = titleBlock(layout) + unitNote + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>`;
    return svgRoot(layout, defs, content, `hatchmark${options.version ? ` v${options.version}` : ""} basic-bar`);
  }
  function deriveDiffs(dataset, options) {
    const compare = options.compare ?? ["AC", "FC"];
    const baseline = options.baseline ?? "PL";
    const base = seriesFor(dataset, baseline);
    const cmp = compareValues(dataset, compare);
    const good = goodDirection(dataset, compare);
    return {
      baseline,
      good,
      rows: dataset.periods.map((_, i) => {
        const c = cmp[i];
        const b = base?.values[i];
        if (c.value === null || b === null || b === void 0) return null;
        return { diff: c.value - b, pct: b > 0 ? (c.value - b) / b * 100 : null, scenario: c.scenario };
      })
    };
  }
  function renderVarianceBar(dataset, options = {}, relative = false) {
    const width = options.width ?? 260;
    const height = options.height ?? 160;
    const mode = options.colour_mode ?? "colour";
    const decimals = options.axis?.decimals ?? 0;
    const { baseline, good, rows: diffs } = deriveDiffs(dataset, options);
    const suffix = relative ? `%` : "";
    const title = resolveTitle(dataset, options, ` \u0394${baseline}${suffix}`);
    const layout = hLayout(width, height, title);
    const rows = hBands(layout.plotH, dataset.periods.length);
    const valuesFor = diffs.map((d) => d === null ? 0 : relative ? d.pct ?? 0 : d.diff);
    const maxAbs = Math.max(1e-6, ...valuesFor.map(Math.abs));
    const extent = relative ? 0.42 : 0.45;
    const scale = layout.plotW * extent / maxAbs;
    const midX = layout.plotW * 0.5;
    const fmt2 = makeFormatter(valuesFor, { min: 0, max: 1, ticks: 0, decimals, prefix: options.axis?.prefix ?? "", suffix: options.axis?.suffix ?? "", label: "" }, options.axis?.auto_scale !== false && !relative);
    const prefix = options.id_prefix ?? `hm-${dataset.id}-var-bar`;
    const usedHatch = /* @__PURE__ */ new Map();
    const hatchFor = (color) => {
      if (!usedHatch.has(color)) usedHatch.set(color, `${prefix}-hatch-${usedHatch.size}`);
      return usedHatch.get(color);
    };
    const marks = [];
    const texts = [];
    diffs.forEach((d, i) => {
      if (d === null) return;
      const row = rows[i];
      const ratio = relative ? RATIO_RELATIVE : RATIO_ABSOLUTE;
      const barH = row.categoryH * ratio;
      const shaftH = relative ? Math.max(1, Math.min(barH * 0.16, 2)) : barH;
      const y = row.y + (row.categoryH - shaftH) / 2;
      const value = relative ? d.pct : d.diff;
      const interpretable = value !== null;
      const v = value ?? 0;
      const w = Math.abs(v) * scale;
      const x = v >= 0 ? midX : midX - w;
      const color = impactColour(impactFor(v, interpretable, good), mode);
      if (interpretable && w > 0) {
        const isFc = d.scenario === "FC" && !relative;
        marks.push(el("rect", {
          x,
          y,
          width: w,
          height: shaftH,
          ...isFc ? { fill: `url(#${hatchFor(color)})`, stroke: color, "stroke-width": 0.5 } : { fill: color }
        }));
      }
      const headSize = relative ? Math.max(3, Math.min(barH * 0.45, 5)) : 0;
      if (relative) {
        const tipX = interpretable ? v >= 0 ? midX + w : midX - w : midX;
        const treatment = scenarioFill(d.scenario);
        const scolor = scenarioColor(d.scenario);
        const fp = fillProps(treatment, scolor, treatment === "hatched" ? hatchFor(scolor) : "");
        marks.push(el("rect", {
          x: tipX - headSize / 2,
          y: y + shaftH / 2 - headSize / 2,
          width: headSize,
          height: headSize,
          fill: fp.fill === "transparent" ? COLOR.background : fp.fill,
          stroke: fp.stroke ?? COLOR.measuredDark,
          "stroke-width": fp["stroke-width"] ?? 0.5
        }));
      }
      if (options.show_data_labels) {
        const label = !interpretable ? "N/A" : relative ? formatSigned(v, decimals, "", "%") : fmt2.signed(v);
        const anchorRight = v >= 0 || !interpretable;
        const clear = Math.max(4, headSize / 2 + PIN_LABEL_GAP);
        const lx = anchorRight ? midX + w + clear : midX - w - clear;
        texts.push(text(
          { x: lx, y: row.y + row.categoryH / 2 + FS.dataLabel / 3, "font-size": FS.dataLabel, fill: COLOR.measuredDark, "text-anchor": anchorRight ? "start" : "end" },
          label
        ));
      }
    });
    const plot = marks.join("") + referenceAxis(midX, layout.plotH, baseline, "v") + texts.join("") + categoryLabelsLeft(dataset.periods, layout);
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const chartId = relative ? "relative-variance-pins-bar" : "absolute-variance-bar";
    const content = titleBlock(layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>`;
    return svgRoot(layout, defs, content, `hatchmark${options.version ? ` v${options.version}` : ""} ${chartId}`);
  }

  // node_modules/hatchmark/src/render/smallMultiples.ts
  var PANEL_GAP = 12;
  var PANEL_TITLE_H = 9;
  function renderSmallMultiplesColumn(dataset, options = {}) {
    const width = options.width ?? 260;
    const height = options.height ?? 160;
    const series = dataset.series;
    const n = Math.max(1, series.length);
    const cols = options.multiples_columns && options.multiples_columns >= 1 ? Math.min(Math.floor(options.multiples_columns), n) : n <= 3 ? n : Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const values = series.flatMap((s) => s.values.filter((v) => v !== null));
    const maxV = values.length ? Math.max(...values, 0) : 100;
    const axis = {
      min: 0,
      max: options.axis?.max ?? maxV * 1.1,
      ticks: 1,
      decimals: options.axis?.decimals ?? 0,
      prefix: options.axis?.prefix ?? "",
      suffix: options.axis?.suffix ?? "",
      label: options.axis?.label ?? dataset.unit
    };
    const fmt2 = makeFormatter(values, axis, options.axis?.auto_scale !== false);
    const title = resolveTitle(dataset, options);
    const layout = computeLayout(width, height, title, true, axis.label, fmt2.plain(axis.max).length);
    const panelW = (layout.plotW - PANEL_GAP * (cols - 1)) / cols;
    const panelH = (layout.plotH - PANEL_GAP * (rows - 1)) / rows;
    const innerH = panelH - PANEL_TITLE_H;
    const parts = [];
    series.forEach((s, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const px = col * (panelW + PANEL_GAP);
      const py = row * (panelH + PANEL_GAP);
      const g = [];
      g.push(text({ x: 0, y: FS.dataLabel + 1, "font-size": FS.dataLabel, "font-weight": 600, fill: COLOR.measuredDark }, s.label ?? s.scenario));
      const bs = bands(panelW, dataset.periods.length);
      const treatment = scenarioFill(s.scenario);
      const color = scenarioColor(s.scenario);
      s.values.forEach((v, i) => {
        if (v === null) return;
        const band = bs[i];
        const barW = band.categoryW * RATIO_ABSOLUTE;
        const range = axis.max - axis.min;
        const h = range <= 0 ? 0 : Math.max(0, (v - axis.min) / range * innerH);
        g.push(el("rect", {
          x: band.x + (band.categoryW - barW) / 2,
          y: PANEL_TITLE_H + innerH - h,
          width: barW,
          height: h,
          fill: treatment === "outlined" ? "transparent" : color,
          stroke: color,
          "stroke-width": treatment === "outlined" ? 1.5 : 0.5
        }));
      });
      g.push(el("line", { x1: 0, y1: PANEL_TITLE_H + innerH, x2: panelW, y2: PANEL_TITLE_H + innerH, stroke: STYLE.axisColor, "stroke-width": STYLE.axisLineW }));
      if (col === 0) {
        g.push(text({ x: -3, y: PANEL_TITLE_H + innerH + 2, "font-size": 5.5, fill: STYLE.axisColor, "text-anchor": "end" }, fmt2.plain(0)));
        g.push(text({ x: -3, y: PANEL_TITLE_H + 4, "font-size": 5.5, fill: STYLE.axisColor, "text-anchor": "end" }, fmt2.plain(axis.max)));
      }
      const first = dataset.periods[0];
      const last = dataset.periods[dataset.periods.length - 1];
      if (first && last && dataset.periods.length > 1) {
        g.push(text({ x: bs[0].x + bs[0].categoryW / 2, y: PANEL_TITLE_H + innerH + 7, "font-size": 5.5, fill: STYLE.axisColor, "text-anchor": "middle" }, truncateLabel(first, true)));
        const lastBand = bs[bs.length - 1];
        g.push(text({ x: lastBand.x + lastBand.categoryW / 2, y: PANEL_TITLE_H + innerH + 7, "font-size": 5.5, fill: STYLE.axisColor, "text-anchor": "middle" }, truncateLabel(last, true)));
      }
      parts.push(`<g transform="translate(${px},${py})">${g.join("")}</g>`);
    });
    const unitNote = text({ x: layout.padLeft - 2, y: layout.titleH + layout.unitLabelH - 1, "font-size": FS.axisUnit, fill: STYLE.axisColor, "text-anchor": "end" }, axis.label + (fmt2.suffix ? ` (${fmt2.suffix})` : ""));
    const content = titleBlock(layout) + unitNote + `<g transform="translate(${layout.padLeft},${layout.padTop})">${parts.join("")}</g>`;
    return svgRoot(layout, "", content, `hatchmark${options.version ? ` v${options.version}` : ""} small-multiples-column`);
  }

  // node_modules/hatchmark/src/render/columnWithVariance.ts
  var TIER_RATIO = 0.22;
  var TIER_GAP = 5;
  var TIER_FS = 5.5;
  var TIER_HEAD_MAX = 5;
  function renderColumnWithVariance(dataset, options = {}) {
    const width = options.width ?? 260;
    const height = options.height ?? 190;
    const mode = options.colour_mode ?? "colour";
    const compare = options.compare ?? ["AC", "FC"];
    const baseline = options.baseline ?? "PL";
    const tiers = (options.tiers ?? ["relative", "absolute"]).slice(0, 3);
    const decimals = options.axis?.decimals ?? 0;
    const good = goodDirection(dataset, compare);
    const base = seriesFor(dataset, baseline);
    const cmp = compareValues(dataset, compare);
    const diffs = dataset.periods.map((_, i) => {
      const c = cmp[i];
      const b = base?.values[i];
      if (c.value === null || b === null || b === void 0) return null;
      return { diff: c.value - b, pct: b > 0 ? (c.value - b) / b * 100 : null, scenario: c.scenario };
    });
    const values = cmp.filter((c) => c.value !== null).map((c) => c.value);
    const maxV = values.length ? Math.max(...values, 0) : 100;
    const axis = {
      min: 0,
      max: options.axis?.max ?? maxV * 1.1,
      ticks: options.axis?.ticks ?? 3,
      decimals,
      prefix: options.axis?.prefix ?? "",
      suffix: options.axis?.suffix ?? "",
      label: options.axis?.label ?? dataset.unit
    };
    const fmt2 = makeFormatter(values, axis, options.axis?.auto_scale !== false);
    const title = resolveTitle(dataset, options);
    const layout = computeLayout(width, height, title, true, axis.label, Math.max(0, ...tickValues(axis).map((t) => fmt2.plain(t).length)));
    const preferredTierH = Math.max(16, layout.plotH * TIER_RATIO);
    const maxTierBlock = layout.plotH * 0.6;
    const tierH = tiers.length > 0 ? Math.max(10, Math.min(preferredTierH, maxTierBlock / tiers.length - TIER_GAP)) : 0;
    const mainH = Math.max(20, layout.plotH - tiers.length * (tierH + TIER_GAP));
    const bs = bands(layout.plotW, dataset.periods.length);
    const prefix = options.id_prefix ?? `hm-${dataset.id}-cwv`;
    const usedHatch = /* @__PURE__ */ new Map();
    const hatchFor = (color) => {
      if (!usedHatch.has(color)) usedHatch.set(color, `${prefix}-hatch-${usedHatch.size}`);
      return usedHatch.get(color);
    };
    const groups = [];
    let cursorY = 0;
    for (const tier of tiers) {
      const g = [];
      const rel = tier === "relative";
      const tierValues = diffs.map((d) => d === null ? null : rel ? d.pct : d.diff);
      const maxAbs = Math.max(1e-6, ...tierValues.filter((v) => v !== null).map(Math.abs));
      const roomLabelled = pinLabelRoom(rel ? TIER_HEAD_MAX : 0, options.show_data_labels === true, TIER_FS);
      const showLabels = options.show_data_labels === true && tierH / 2 - roomLabelled >= tierH * 0.15;
      const room = pinLabelRoom(rel ? TIER_HEAD_MAX : 0, showLabels, TIER_FS);
      const scale = Math.max(tierH * 0.15, Math.min(tierH * 0.4, tierH / 2 - room)) / maxAbs;
      const mid = tierH / 2;
      g.push(text({ x: -3, y: 5.5, "font-size": TIER_FS, fill: STYLE.axisColor, "text-anchor": "end" }, `\u0394${baseline}${rel ? "%" : ""}`));
      diffs.forEach((d, i) => {
        if (d === null) return;
        const v = rel ? d.pct : d.diff;
        const band = bs[i];
        const ratio = rel ? RATIO_RELATIVE : RATIO_ABSOLUTE;
        const barW = band.categoryW * ratio;
        const shaftW = rel ? Math.max(1, Math.min(barW * 0.16, 2)) : barW;
        const headSize = rel ? Math.max(3, Math.min(barW * 0.45, TIER_HEAD_MAX)) : 0;
        const x = band.x + (band.categoryW - shaftW) / 2;
        const interpretable = v !== null;
        const val = v ?? 0;
        const h = Math.abs(val) * scale;
        const y = val >= 0 ? mid - h : mid;
        const color = impactColour(impactFor(val, interpretable, good), mode);
        if (interpretable && h > 0) {
          const isFc = d.scenario === "FC" && !rel;
          g.push(el("rect", {
            x,
            y,
            width: shaftW,
            height: h,
            ...isFc ? { fill: `url(#${hatchFor(color)})`, stroke: color, "stroke-width": 0.5 } : { fill: color }
          }));
        }
        if (rel) {
          const tipY = interpretable ? val >= 0 ? mid - h : mid + h : mid;
          const treatment = scenarioFill(d.scenario);
          const scolor = scenarioColor(d.scenario);
          const fp = fillProps(treatment, scolor, treatment === "hatched" ? hatchFor(scolor) : "");
          g.push(el("rect", {
            x: x + shaftW / 2 - headSize / 2,
            y: tipY - headSize / 2,
            width: headSize,
            height: headSize,
            fill: fp.fill === "transparent" ? COLOR.background : fp.fill,
            stroke: fp.stroke ?? COLOR.measuredDark,
            "stroke-width": fp["stroke-width"] ?? 0.5
          }));
        }
        if (showLabels) {
          const label = !interpretable ? "N/A" : rel ? formatSigned(val, decimals, "", "%") : fmt2.signed(val);
          const tipY = val >= 0 ? mid - h : mid + h;
          g.push(text(
            { x: band.x + band.categoryW / 2, y: pinLabelBaseline(tipY, headSize, val >= 0, TIER_FS), "font-size": TIER_FS, fill: COLOR.measuredDark, "text-anchor": "middle" },
            label
          ));
        }
      });
      g.push(referenceAxis(mid, layout.plotW, baseline, "h"));
      groups.push(`<g transform="translate(0,${cursorY})">${g.join("")}</g>`);
      cursorY += tierH + TIER_GAP;
    }
    const main = [];
    const mainLayout = { ...layout, plotH: mainH };
    main.push(valueAxis(axis, mainLayout, fmt2));
    cmp.forEach((c, i) => {
      if (c.value === null) return;
      const band = bs[i];
      const barW = band.categoryW * RATIO_ABSOLUTE;
      const x = band.x + (band.categoryW - barW) / 2;
      const yv = clampToPlot(yFor(c.value, axis, mainH), mainH);
      const treatment = scenarioFill(c.scenario);
      const color = scenarioColor(c.scenario);
      const fp = fillProps(treatment, color, treatment === "hatched" ? hatchFor(color) : "");
      main.push(el("rect", { x, y: yv, width: barW, height: mainH - yv, ...fp }));
    });
    main.push(el("line", { x1: 0, y1: mainH, x2: layout.plotW, y2: mainH, stroke: STYLE.axisColor, "stroke-width": STYLE.axisLineW }));
    main.push(categoryLabels(dataset.periods, mainLayout, options.truncate_labels !== false, options.period_notation));
    groups.push(`<g transform="translate(0,${cursorY})">${main.join("")}</g>`);
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const content = titleBlock(layout) + unitLabel(axis, layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${groups.join("")}</g>`;
    return svgRoot(layout, defs, content, `hatchmark${options.version ? ` v${options.version}` : ""} column-with-variance`);
  }

  // node_modules/hatchmark/src/render/varianceTable.ts
  var ROW_H = 11;
  var HEADER_H = 12;
  function renderVarianceTable(dataset, options = {}) {
    const compare = options.compare ?? ["AC", "FC"];
    const baseline = options.baseline ?? "PL";
    const mode = options.colour_mode ?? "colour";
    const decimals = options.axis?.decimals ?? 0;
    const good = goodDirection(dataset, compare);
    const base = seriesFor(dataset, baseline);
    const cmp = compareValues(dataset, compare);
    const rows = dataset.periods.map((p, i) => {
      const c = cmp[i].value;
      const b = base?.values[i] ?? null;
      return {
        label: p,
        ac: c,
        pl: b,
        diff: c !== null && b !== null ? c - b : null,
        pct: c !== null && b !== null && b > 0 ? (c - b) / b * 100 : null
      };
    });
    const totAc = rows.reduce((s, r) => s + (r.ac ?? 0), 0);
    const totPl = rows.reduce((s, r) => s + (r.pl ?? 0), 0);
    const total = { label: "\u03A3", ac: totAc, pl: totPl, diff: totAc - totPl, pct: totPl > 0 ? (totAc - totPl) / totPl * 100 : null };
    const allValues = rows.flatMap((r) => [r.ac ?? 0, r.pl ?? 0]).concat([totAc, totPl]);
    const axis = { min: 0, max: 1, ticks: 0, decimals, prefix: options.axis?.prefix ?? "", suffix: options.axis?.suffix ?? "", label: options.axis?.label ?? dataset.unit };
    const fmt2 = makeFormatter(allValues, axis, options.axis?.auto_scale !== false);
    const height = options.height ?? Math.max(120, 8 + HEADER_H + (rows.length + 1) * ROW_H + 46);
    const width = options.width ?? 260;
    const title = resolveTitle(dataset, options, ` \u0394${baseline}`);
    const layout = computeLayout(width, height, title, false, "", 0);
    const wLabel = 30;
    const wNum = Math.max(26, layout.plotW * 0.14);
    const wVar = Math.max(30, (layout.plotW - wLabel - 2 * wNum) / 2);
    const xAc = wLabel + wNum;
    const xPl = xAc + wNum;
    const xDiff = xPl;
    const numW = Math.max(24, wVar * 0.45);
    const barZone = wVar - numW - 4;
    const maxAbsDiff = Math.max(1e-6, ...rows.map((r) => Math.abs(r.diff ?? 0)), Math.abs(total.diff));
    const maxAbsPct = Math.max(1e-6, ...rows.map((r) => Math.abs(r.pct ?? 0)), Math.abs(total.pct ?? 0));
    const prefix = options.id_prefix ?? `hm-${dataset.id}-vtable`;
    const parts = [];
    const yTop = 0;
    const headY = yTop + HEADER_H - 3;
    const th = (x, label, anchor = "end") => text({ x, y: headY, "font-size": 7, "font-weight": 600, fill: COLOR.measuredDark, "text-anchor": anchor }, label);
    parts.push(th(xAc, compare[0] ?? "AC"));
    parts.push(th(xPl, baseline));
    parts.push(th(xDiff + numW, `\u0394${baseline}`));
    parts.push(th(xDiff + wVar + numW, `\u0394${baseline}%`));
    parts.push(el("line", { x1: 0, y1: HEADER_H, x2: layout.plotW, y2: HEADER_H, stroke: STYLE.axisColor, "stroke-width": 0.75 }));
    const drawRow = (r, rowIdx, isTotal) => {
      const y = HEADER_H + rowIdx * ROW_H;
      const baselineY = y + ROW_H - 3;
      const weight = isTotal ? 600 : 400;
      const td = (x, s, anchor = "end", fill = COLOR.measuredDark) => text({ x, y: baselineY, "font-size": 7, "font-weight": weight, fill, "text-anchor": anchor }, s);
      parts.push(td(wLabel - 2, r.label, "end"));
      if (r.ac !== null) parts.push(td(xAc, fmt2.plain(r.ac)));
      if (r.pl !== null) parts.push(td(xPl, fmt2.plain(r.pl)));
      if (r.diff !== null) {
        const impact = impactFor(r.diff, true, good);
        const color = impactColour(impact, mode);
        parts.push(td(xDiff + numW, fmt2.signed(r.diff), "end", color));
        const half = barZone / 2;
        const cx0 = xDiff + numW + 4 + half;
        const w = Math.abs(r.diff) / maxAbsDiff * half;
        parts.push(el("rect", {
          x: r.diff >= 0 ? cx0 : cx0 - w,
          y: y + 2.5,
          width: Math.max(w, 0.5),
          height: ROW_H - 6,
          fill: color
        }));
        parts.push(el("line", { x1: cx0, y1: y + 1, x2: cx0, y2: y + ROW_H - 2, stroke: STYLE.axisColor, "stroke-width": 0.5 }));
      }
      if (r.pct !== null) {
        const impact = impactFor(r.pct, true, good);
        const color = impactColour(impact, mode);
        parts.push(td(xDiff + wVar + numW, formatSigned(r.pct, decimals, "", "%"), "end", color));
        const half = barZone / 2;
        const cx0 = xDiff + wVar + numW + 4 + half;
        const w = Math.abs(r.pct) / maxAbsPct * half;
        const cy = y + ROW_H / 2 - 1;
        parts.push(el("line", { x1: cx0, y1: cy, x2: r.pct >= 0 ? cx0 + w : cx0 - w, y2: cy, stroke: color, "stroke-width": 1.6 }));
        parts.push(el("rect", { x: (r.pct >= 0 ? cx0 + w : cx0 - w) - 1.5, y: cy - 1.5, width: 3, height: 3, fill: COLOR.measuredDark }));
        parts.push(el("line", { x1: cx0, y1: y + 1, x2: cx0, y2: y + ROW_H - 2, stroke: STYLE.axisColor, "stroke-width": 0.5 }));
      } else if (r.ac !== null && r.pl !== null) {
        parts.push(td(xDiff + wVar + numW, "N/A"));
      }
    };
    rows.forEach((r, i) => drawRow({ ...r, pct: r.pct }, i, false));
    const totalY = HEADER_H + rows.length * ROW_H;
    parts.push(el("line", { x1: 0, y1: totalY, x2: layout.plotW, y2: totalY, stroke: STYLE.axisColor, "stroke-width": 0.5 }));
    drawRow(total, rows.length, true);
    parts.push(el("line", { x1: 0, y1: totalY + ROW_H + 1, x2: layout.plotW, y2: totalY + ROW_H + 1, stroke: STYLE.axisColor, "stroke-width": 0.75 }));
    const unitNote = text({ x: layout.padLeft + layout.plotW, y: layout.titleH + FS.axisUnit, "font-size": FS.axisUnit, fill: STYLE.axisColor, "text-anchor": "end" }, axis.label + (fmt2.suffix ? ` (${fmt2.suffix})` : ""));
    const content = titleBlock(layout) + unitNote + `<g transform="translate(${layout.padLeft},${layout.padTop})">${parts.join("")}</g>`;
    return svgRoot(layout, "", content, `hatchmark${options.version ? ` v${options.version}` : ""} variance-table`);
  }

  // node_modules/hatchmark/src/render/index.ts
  function renderChart(chart, dataset, options = {}) {
    switch (chart) {
      case "basic-column":
        return renderBasicColumn(dataset, options);
      case "absolute-variance-column":
        return renderVarianceColumn(dataset, options);
      case "relative-variance-pins":
        return renderVariancePins(dataset, options);
      case "waterfall-column":
        return renderWaterfall(dataset, options, false);
      case "contribution-waterfall":
        return renderWaterfall(dataset, options, true);
      case "basic-line":
        return renderLineArea(dataset, options, false);
      case "basic-area":
        return renderLineArea(dataset, options, true);
      case "basic-bar":
        return renderBasicBar(dataset, options);
      case "absolute-variance-bar":
        return renderVarianceBar(dataset, options, false);
      case "relative-variance-pins-bar":
        return renderVarianceBar(dataset, options, true);
      case "small-multiples-column":
        return renderSmallMultiplesColumn(dataset, options);
      case "column-with-variance":
        return renderColumnWithVariance(dataset, options);
      case "variance-table":
        return renderVarianceTable(dataset, options);
      default: {
        const never = chart;
        throw new Error(`Unknown chart type: ${String(never)}`);
      }
    }
  }

  // src/rangeMapping.ts
  var SCENARIOS = ["AC", "PY", "PL", "BU", "FC"];
  var ALIASES = {
    ACT: "AC",
    ACTUAL: "AC",
    ACTUALS: "AC",
    PLAN: "PL",
    PLANNED: "PL",
    BUD: "BU",
    BUDGET: "BU",
    FCST: "FC",
    FORECAST: "FC",
    PREV: "PY",
    "PREVIOUS YEAR": "PY",
    "PREV YEAR": "PY",
    "LAST YEAR": "PY",
    LY: "PY"
  };
  function parseScenarioCell(raw) {
    const s = String(raw ?? "").trim();
    if (s === "") return { scenario: null };
    const resolve = (code) => {
      const up = code.trim().toUpperCase();
      if (SCENARIOS.includes(up)) return { scenario: up };
      if (ALIASES[up]) return { scenario: ALIASES[up], normalizedFrom: up };
      return null;
    };
    const punct = s.match(/^(.+?)\s*[:—–-]\s*(.+)$/);
    if (punct) {
      const r = resolve(punct[1]);
      if (r) return { ...r, label: punct[2].trim() };
    }
    const sp = s.match(/^([A-Za-z]{2})\s+(.+)$/);
    if (sp && SCENARIOS.includes(sp[1].toUpperCase())) {
      return { scenario: sp[1].toUpperCase(), label: sp[2].trim() };
    }
    const whole = resolve(s);
    if (whole) return whole;
    return { scenario: null };
  }
  function detectGranularity(labels) {
    const first = (labels[0] ?? "").trim();
    if (/^W\d/i.test(first)) return "weekly";
    if (/^P\d/i.test(first)) return "4-week";
    if (/^Q\d/i.test(first)) return "quarterly";
    if (/^\d{4}$/.test(first)) return "annual";
    return "monthly";
  }
  function isScenarioCode(cell) {
    return parseScenarioCell(cell).scenario !== null;
  }
  function scenarioScore(labels) {
    const nonBlank = labels.filter((c) => String(c ?? "").trim() !== "");
    if (nonBlank.length === 0) return 0;
    return nonBlank.filter(isScenarioCode).length / nonBlank.length;
  }
  function detectOrientation(values) {
    const headerRow = values[0]?.slice(1) ?? [];
    const firstColumn = values.slice(1).map((row) => row[0]);
    const rowScore = scenarioScore(firstColumn);
    const columnScore = scenarioScore(headerRow);
    if (rowScore === 0 && columnScore === 0) return null;
    return rowScore >= columnScore ? "scenarios-in-rows" : "scenarios-in-columns";
  }
  function transpose(values) {
    const cols = Math.max(...values.map((row) => row.length));
    return Array.from({ length: cols }, (_, c) => values.map((row) => row[c] ?? ""));
  }
  function cellToValue(cell) {
    if (cell === null || cell === void 0 || cell === "") return null;
    if (typeof cell === "number" && Number.isFinite(cell)) return cell;
    if (typeof cell === "string") {
      const trimmed = cell.trim();
      if (trimmed === "") return null;
      const n = Number(trimmed.replace(/,/g, ""));
      if (Number.isFinite(n)) return n;
    }
    return "invalid";
  }
  var ROW_LOCATORS = {
    cell: (r, c) => `Row ${r + 1}, column ${c + 1}`,
    scenarioHeader: (r) => `Row ${r + 1}`
  };
  var COLUMN_LOCATORS = {
    cell: (r, c) => `Row ${c + 1}, column ${r + 1}`,
    scenarioHeader: (r) => `Column ${r + 1}`
  };
  var LAYOUT_HELP = "Lay data out with period labels across the top and one scenario row (AC, PY, PL, BU, FC) per row \u2014 or sideways, with scenario codes across the top and periods down the first column.";
  function rangeToDataset(values, meta) {
    if (!values || values.length < 2 || (values[0]?.length ?? 0) < 2) {
      return { errors: [`Select at least 2 rows \xD7 2 columns. ${LAYOUT_HELP}`] };
    }
    const orientation = detectOrientation(values);
    if (orientation === null) {
      return { errors: [`No scenario codes found in the first column or the header row. ${LAYOUT_HELP}`] };
    }
    const grid = orientation === "scenarios-in-rows" ? values : transpose(values);
    const locate2 = orientation === "scenarios-in-rows" ? ROW_LOCATORS : COLUMN_LOCATORS;
    const errors = [];
    const header = grid[0];
    const periods = header.slice(1).map((c) => String(c ?? "").trim());
    if (periods.some((p) => p === "")) {
      errors.push(
        orientation === "scenarios-in-rows" ? "Every period cell in the header row needs a label (e.g. Jan, Feb, Q1, 2026)." : "Every period cell in the first column needs a label (e.g. Jan, Feb, Q1, 2026)."
      );
    }
    const series = [];
    const seen = /* @__PURE__ */ new Set();
    const normalized = [];
    const badCodes = [];
    for (let r = 1; r < grid.length; r++) {
      const row = grid[r];
      const rawText = String(row[0] ?? "").trim();
      if (rawText === "" && row.slice(1).every((c) => c === "" || c === null || c === void 0)) continue;
      const parsed = parseScenarioCell(row[0]);
      if (parsed.scenario === null) {
        badCodes.push({ where: locate2.scenarioHeader(r), text: rawText });
        continue;
      }
      if (parsed.normalizedFrom) normalized.push(`${parsed.normalizedFrom} \u2192 ${parsed.scenario}`);
      const key = `${parsed.scenario}|${parsed.label ?? ""}`;
      if (seen.has(key)) {
        const hint = parsed.label ? ` "${parsed.label}"` : ` \u2014 add labels ("${parsed.scenario} North") for small multiples`;
        errors.push(`${locate2.scenarioHeader(r)}: scenario ${parsed.scenario}${hint} appears more than once.`);
        continue;
      }
      seen.add(key);
      const rawCode = parsed.scenario;
      const rowValues = [];
      for (let c = 1; c <= periods.length; c++) {
        const v = cellToValue(row[c]);
        if (v === "invalid") {
          errors.push(`${locate2.cell(r, c)}: "${row[c]}" is not a number (leave the cell blank for no value).`);
          rowValues.push(null);
        } else {
          rowValues.push(v);
        }
      }
      const s = { scenario: rawCode, values: rowValues };
      if (parsed.label) s.label = parsed.label;
      if (rawCode === "AC" && meta.good_direction) s.good_direction = meta.good_direction;
      series.push(s);
    }
    if (badCodes.length === 1) {
      errors.push(`${badCodes[0].where}: "${badCodes[0].text}" is not a scenario code \u2014 use one of ${SCENARIOS.join(", ")} (or e.g. "AC North" for small multiples).`);
    } else if (badCodes.length > 1) {
      const shown = badCodes.slice(0, 4).map((b) => `"${b.text}"`).join(", ");
      const more = badCodes.length > 4 ? ` and ${badCodes.length - 4} more` : "";
      errors.push(`${badCodes.map((b) => b.where).slice(0, 4).join(", ")}${more}: ${shown} are not scenario codes \u2014 every line starts with ${SCENARIOS.join(", ")}, a friendly name (Actual, Plan, Forecast\u2026), or "AC North" for small multiples. Tip: select only your data block.`);
    }
    if (series.length === 0) errors.push(`No scenario lines found. ${LAYOUT_HELP}`);
    if (errors.length > 0) return { orientation, errors };
    return {
      orientation,
      normalized: normalized.length > 0 ? normalized : void 0,
      errors: [],
      dataset: {
        id: "excel-selection",
        reporting_unit: meta.reporting_unit || void 0,
        measure: meta.measure || "Measure",
        unit: meta.unit || "",
        granularity: detectGranularity(periods),
        periods,
        series
      }
    };
  }

  // src/a1.ts
  function colToNumber(col) {
    let n = 0;
    for (const ch of col.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n;
  }
  function parseAddress(address) {
    let sheet = null;
    let ref = address;
    const bang = address.lastIndexOf("!");
    if (bang >= 0) {
      sheet = address.slice(0, bang).replace(/^'(.*)'$/, "$1").replace(/''/g, "'");
      ref = address.slice(bang + 1);
    }
    const m = ref.match(/^\$?([A-Za-z]{1,3})\$?(\d+)(?::\$?([A-Za-z]{1,3})\$?(\d+))?$/);
    if (!m) return null;
    const c1 = colToNumber(m[1]);
    const r1 = parseInt(m[2], 10);
    const c2 = m[3] ? colToNumber(m[3]) : c1;
    const r2 = m[4] ? parseInt(m[4], 10) : r1;
    return {
      sheet,
      c1: Math.min(c1, c2),
      r1: Math.min(r1, r2),
      c2: Math.max(c1, c2),
      r2: Math.max(r1, r2)
    };
  }
  function rangesIntersect(a, b) {
    if (a.sheet !== null && b.sheet !== null && a.sheet !== b.sheet) return false;
    return a.c1 <= b.c2 && b.c1 <= a.c2 && a.r1 <= b.r2 && b.r1 <= a.r2;
  }
  function addressesIntersect(a, b) {
    const pa = parseAddress(a);
    const pb = parseAddress(b);
    if (!pa || !pb) return false;
    return rangesIntersect(pa, pb);
  }

  // src/tableWriter.ts
  function colLetter(n) {
    let s = "";
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }
  function quoteSheet(name) {
    return `'${name.replace(/'/g, "''")}'`;
  }
  function locate(values, sourceAddress, orientation) {
    const ref = parseAddress(sourceAddress);
    if (!ref || ref.sheet === null) return "Source address could not be parsed.";
    const sheet = quoteSheet(ref.sheet) + "!";
    const addr = (r0, c0) => `${sheet}${colLetter(ref.c1 + c0)}${ref.r1 + r0}`;
    const scenarioLines = [];
    const grid = orientation === "scenarios-in-rows" ? values : transpose2(values);
    for (let i = 1; i < grid.length; i++) {
      const parsed = parseScenarioCell(grid[i][0]);
      if (parsed.scenario) scenarioLines.push({ scenario: parsed.scenario, label: parsed.label, index: i });
    }
    const lineFor = (sc) => scenarioLines.find((l) => l.scenario === sc && !l.label) ?? scenarioLines.find((l) => l.scenario === sc);
    const ambiguous = (sc) => {
      const matches = scenarioLines.filter((l) => l.scenario === sc);
      return matches.length > 1 && !matches.some((l) => !l.label);
    };
    const periods = (grid[0] ?? []).slice(1).map((p, j) => ({
      label: String(p ?? "").trim(),
      cell: (colOffset = 0) => orientation === "scenarios-in-rows" ? addr(0, j + 1 + colOffset) : addr(j + 1 + colOffset, 0)
    }));
    const cellFor = (sc, periodIdx) => {
      const line = lineFor(sc);
      if (!line) return null;
      return orientation === "scenarios-in-rows" ? addr(line.index, periodIdx + 1) : addr(periodIdx + 1, line.index);
    };
    const present = (sc, periodIdx) => {
      const line = lineFor(sc);
      if (!line) return false;
      const v = grid[line.index][periodIdx + 1];
      return v !== null && v !== void 0 && String(v).trim() !== "";
    };
    return { periods, cellFor, present, ambiguous };
  }
  function transpose2(values) {
    const cols = Math.max(...values.map((r) => r.length));
    return Array.from({ length: cols }, (_, c) => values.map((row) => row[c] ?? ""));
  }
  function buildNativeTable(input, anchorRow, anchorCol) {
    const located = locate(input.values, input.sourceAddress, input.orientation);
    if (typeof located === "string") {
      return { formulas: [], header: [], rows: 0, numberFormats: [], cols: { label: 0, value: 1, base: 2, diff: 3, pct: 4 }, goodDirection: input.good_direction, errors: [located] };
    }
    for (const sc of [...input.compare, input.baseline]) {
      if (located.ambiguous(sc)) {
        return {
          formulas: [],
          header: [],
          rows: 0,
          numberFormats: [],
          cols: { label: 0, value: 1, base: 2, diff: 3, pct: 4 },
          goodDirection: input.good_direction,
          errors: [`${sc} exists only as labelled breakouts (${sc} North, ${sc} South, \u2026). Add a total ${sc} line, or select a single entity's block.`]
        };
      }
    }
    const compareHeader = input.compare.join("&");
    const header = [input.measure || "Period", compareHeader, input.baseline, `\u0394${input.baseline}`, `\u0394${input.baseline}%`];
    const cValue = colLetter(anchorCol + 1);
    const cBase = colLetter(anchorCol + 2);
    const cDiff = colLetter(anchorCol + 3);
    const body = [];
    let anyBase = false;
    located.periods.forEach((p, i) => {
      const srcCompare = input.compare.find((sc) => located.present(sc, i)) ?? null;
      const valueRef = srcCompare ? located.cellFor(srcCompare, i) : null;
      const baseRef = located.present(input.baseline, i) ? located.cellFor(input.baseline, i) : null;
      if (baseRef) anyBase = true;
      const rowNum = anchorRow + 1 + i;
      body.push([
        p.label,
        valueRef ? `=${valueRef}` : null,
        baseRef ? `=${baseRef}` : null,
        valueRef && baseRef ? `=${cValue}${rowNum}-${cBase}${rowNum}` : null,
        valueRef && baseRef ? `=IF(${cBase}${rowNum}<=0,"N/A",(${cValue}${rowNum}-${cBase}${rowNum})/${cBase}${rowNum})` : null
      ]);
    });
    const firstData = anchorRow + 1;
    const lastData = anchorRow + located.periods.length;
    const totalRowNum = lastData + 1;
    const total = [
      "\u03A3",
      `=SUM(${cValue}${firstData}:${cValue}${lastData})`,
      anyBase ? `=SUM(${cBase}${firstData}:${cBase}${lastData})` : null,
      anyBase ? `=IF(${cBase}${totalRowNum}<=0,"N/A",${cValue}${totalRowNum}-${cBase}${totalRowNum})` : null,
      anyBase ? `=IF(${cBase}${totalRowNum}<=0,"N/A",${cDiff}${totalRowNum}/${cBase}${totalRowNum})` : null
    ];
    return {
      formulas: [header, ...body, total],
      header,
      rows: located.periods.length,
      numberFormats: [null, "#,##0", "#,##0", "+#,##0;-#,##0;0", "+0.0%;-0.0%;0.0%"],
      cols: { label: 0, value: 1, base: 2, diff: 3, pct: 4 },
      goodDirection: input.good_direction,
      errors: []
    };
  }

  // src/liveCharts.ts
  var REGISTRY_VERSION = "0.2.3";
  var SETTINGS_KEY = "hatchmark-live-charts";
  function newRecordId() {
    try {
      return crypto.randomUUID().slice(0, 8);
    } catch {
      return Math.random().toString(36).slice(2, 10);
    }
  }
  function loadRecords() {
    const raw = Office.context.document.settings.get(SETTINGS_KEY);
    return Array.isArray(raw) ? raw : [];
  }
  function persist(records) {
    Office.context.document.settings.set(SETTINGS_KEY, records);
    return new Promise((resolve, reject) => {
      Office.context.document.settings.saveAsync(
        (res) => res.status === Office.AsyncResultStatus.Succeeded ? resolve() : reject(new Error(res.error?.message ?? "settings save failed"))
      );
    });
  }
  async function upsertRecord(record) {
    const records = loadRecords().filter((r) => r.id !== record.id);
    records.push(record);
    await persist(records);
    return records;
  }
  async function removeRecord(id) {
    const records = loadRecords().filter((r) => r.id !== id);
    await persist(records);
    return records;
  }
  function chartsAffectedBy(records, worksheetId, changedAddress) {
    return records.filter(
      (r) => r.worksheetId === worksheetId && addressesIntersect(stripSheet(r.sourceAddress), stripSheet(changedAddress))
    );
  }
  function stripSheet(address) {
    const bang = address.lastIndexOf("!");
    return bang >= 0 ? address.slice(bang + 1) : address;
  }
  var RASTER_SCALE = 3;
  function svgToPngBase64(svg, width, height, scale = RASTER_SCALE) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""));
      };
      img.onerror = () => reject(new Error("Could not rasterise the chart SVG."));
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    });
  }
  function renderRecordSvg(record, values) {
    const mapped = rangeToDataset(values, record.meta);
    if (!mapped.dataset) return { errors: mapped.errors };
    const svg = renderChart(record.chart, mapped.dataset, {
      ...record.options,
      compare: ["AC", "FC"],
      version: REGISTRY_VERSION
    });
    return { svg, errors: [] };
  }
  var lastValues = /* @__PURE__ */ new Map();
  function valuesChanged(recordId, values) {
    const key = JSON.stringify(values);
    if (lastValues.get(recordId) === key) return false;
    lastValues.set(recordId, key);
    return true;
  }
  function altText(record) {
    return `hatchmark v${REGISTRY_VERSION} ${record.chart} \u2014 live from ${record.sourceAddress}`;
  }
  function encodeRecord(record) {
    return JSON.stringify(record);
  }
  function decodeRecord(raw) {
    if (typeof raw !== "string" || !raw.startsWith("{")) return null;
    try {
      const r = JSON.parse(raw);
      if (typeof r.id === "string" && typeof r.shapeName === "string" && typeof r.worksheetId === "string" && typeof r.sourceAddress === "string" && typeof r.chart === "string" && r.meta !== null && typeof r.meta === "object" && r.options !== null && typeof r.options === "object") {
        return r;
      }
    } catch {
    }
    return null;
  }
  async function reconcileRecords() {
    const known = new Set(loadRecords().map((r) => r.id));
    const recovered = [];
    await Excel.run(async (ctx) => {
      const sheets = ctx.workbook.worksheets;
      sheets.load("items/id");
      await ctx.sync();
      for (const ws of sheets.items) {
        ws.shapes.load("items/name,items/altTextTitle");
        await ctx.sync();
        for (const s of ws.shapes.items) {
          if (!s.name.startsWith("hatchmark:")) continue;
          const id = s.name.slice("hatchmark:".length);
          if (known.has(id)) continue;
          const rec = decodeRecord(s.altTextTitle);
          if (rec && rec.id === id) {
            rec.hostSheetId = ws.id;
            recovered.push(rec);
            known.add(id);
          }
        }
      }
    });
    for (const rec of recovered) await upsertRecord(rec);
    return recovered;
  }
  async function refreshRecord(record, force = false) {
    let values = [];
    let missingSource = false;
    await Excel.run(async (ctx) => {
      const sheet = ctx.workbook.worksheets.getItemOrNullObject(record.worksheetId);
      await ctx.sync();
      if (sheet.isNullObject) {
        missingSource = true;
        return;
      }
      const range = sheet.getRange(stripSheet(record.sourceAddress));
      range.load("values");
      await ctx.sync();
      values = range.values;
    });
    if (missingSource) return { ok: false, message: `${record.shapeName}: source worksheet no longer exists.` };
    if (!valuesChanged(record.id, values) && !force) {
      return { ok: true, skipped: true, message: `${record.chart}: no data change` };
    }
    const rendered = renderRecordSvg(record, values);
    if (!rendered.svg) return { ok: false, message: `${record.shapeName}: ${rendered.errors.join(" ")}` };
    const png = await svgToPngBase64(rendered.svg, record.options.width, record.options.height);
    let structuralChange = false;
    let orphaned = false;
    await Excel.run(async (ctx) => {
      const sheets = ctx.workbook.worksheets;
      sheets.load("items/id");
      const selection = ctx.workbook.getSelectedRange();
      selection.load("address");
      await ctx.sync();
      const ordered = [
        ...sheets.items.filter((ws) => ws.id === record.hostSheetId),
        ...sheets.items.filter((ws) => ws.id !== record.hostSheetId)
      ];
      let geometry = null;
      let hostSheet = null;
      for (const ws of ordered) {
        ws.shapes.load("items/name,items/left,items/top,items/width,items/height");
        await ctx.sync();
        const shape2 = ws.shapes.items.find((s) => s.name === record.shapeName);
        if (shape2) {
          geometry = { left: shape2.left, top: shape2.top, width: shape2.width, height: shape2.height };
          hostSheet = ws;
          shape2.delete();
          break;
        }
      }
      if (!hostSheet) {
        orphaned = true;
        return;
      }
      const target = hostSheet;
      if (record.hostSheetId !== target.id || record.registry_version !== REGISTRY_VERSION) {
        record.hostSheetId = target.id;
        record.registry_version = REGISTRY_VERSION;
        record.updated = (/* @__PURE__ */ new Date()).toISOString();
        structuralChange = true;
      }
      const shape = target.shapes.addImage(png);
      shape.left = geometry.left;
      shape.top = geometry.top;
      shape.width = geometry.width;
      shape.height = geometry.height;
      shape.name = record.shapeName;
      shape.altTextDescription = altText(record);
      shape.altTextTitle = encodeRecord(record);
      if (!selection.address.includes(",")) {
        ctx.workbook.worksheets.getActiveWorksheet().getRange(stripSheet(selection.address)).select();
      }
      await ctx.sync();
    });
    if (orphaned) {
      await removeRecord(record.id);
      return { ok: true, message: `${record.chart}: its picture was deleted, so it is no longer tracked (${record.sourceAddress})` };
    }
    if (structuralChange) await upsertRecord(record);
    return { ok: true, message: `${record.chart} refreshed from ${record.sourceAddress}` };
  }
  async function refreshAll(onProgress) {
    const records = loadRecords();
    if (records.length === 0) return "No live charts recorded in this workbook yet.";
    let ok = 0;
    const problems = [];
    for (const record of records) {
      const res = await refreshRecord(record, true);
      if (res.ok) ok++;
      else problems.push(res.message);
      onProgress?.(res.message);
    }
    return problems.length === 0 ? `Refreshed ${ok} chart(s).` : `Refreshed ${ok}; problems: ${problems.join(" \xB7 ")}`;
  }
  var listenerAttached = false;
  var liveEnabled = true;
  var pending = /* @__PURE__ */ new Map();
  function setLiveEnabled(enabled) {
    liveEnabled = enabled;
  }
  async function attachChangeListener(onRefreshed) {
    if (listenerAttached) return;
    listenerAttached = true;
    await Excel.run(async (ctx) => {
      ctx.workbook.worksheets.onChanged.add(async (event) => {
        if (!liveEnabled) return;
        const affected = chartsAffectedBy(loadRecords(), event.worksheetId, event.address);
        for (const record of affected) {
          clearTimeout(pending.get(record.id));
          pending.set(
            record.id,
            setTimeout(() => {
              pending.delete(record.id);
              refreshRecord(record).then((res) => {
                if (!res.skipped) onRefreshed(res.message);
              }).catch((e) => onRefreshed(String(e)));
            }, 250)
          );
        }
      });
      await ctx.sync();
    });
  }

  // src/taskpane.ts
  var state = { dataset: null, sideways: false, source: null };
  var sharedRuntime = false;
  function liveScopeText() {
    return sharedRuntime ? "while this workbook is open" : "while this pane is open";
  }
  function $(id) {
    return document.getElementById(id);
  }
  function readOptions() {
    const chart = $("chart-type").value;
    const baseline = $("baseline").value;
    const colourMode = $("colour-mode").value;
    const showLabels = $("show-labels").checked;
    const chartHeights = { "column-with-variance": 260, "small-multiples-column": 230 };
    const options = {
      width: 320,
      height: chart === "variance-table" ? void 0 : chartHeights[chart] ?? 200,
      show_data_labels: showLabels,
      colour_mode: colourMode,
      baseline,
      compare: ["AC", "FC"],
      version: REGISTRY_VERSION
    };
    return { chart, options };
  }
  function readMeta() {
    return {
      measure: $("measure").value.trim(),
      unit: $("unit").value.trim(),
      reporting_unit: $("reporting-unit").value.trim(),
      good_direction: $("good-direction").value
    };
  }
  function setStatus(text2, isError = false) {
    const el2 = $("status");
    el2.textContent = text2;
    el2.className = isError ? "status error" : "status";
  }
  function updateLiveCount() {
    const n = loadRecords().length;
    $("live-count").textContent = n === 0 ? "No live charts in this workbook yet." : `${n} live chart${n === 1 ? "" : "s"} in this workbook.`;
    $("refresh-all").disabled = n === 0;
  }
  function refreshPreview() {
    if (!state.dataset) return;
    const { chart, options } = readOptions();
    try {
      const svg = renderChart(chart, state.dataset, options);
      $("preview").innerHTML = svg;
      const note = chart === "waterfall-column" ? " \xB7 dark by design: green/red is variance notation \u2014 for that, use the Bridge" : "";
      setStatus(`Preview: ${chart} \xB7 registry v${REGISTRY_VERSION}${state.sideways ? " \xB7 sideways layout detected" : ""}${note}`);
      $("insert").disabled = false;
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
      $("insert").disabled = true;
    }
  }
  async function loadSelection() {
    try {
      await Excel.run(async (ctx) => {
        const range = ctx.workbook.getSelectedRange();
        range.load(["values", "address"]);
        range.worksheet.load("id");
        await ctx.sync();
        const meta = readMeta();
        const result = rangeToDataset(range.values, meta);
        if (result.errors.length > 0) {
          setStatus(result.errors.join(" "), true);
          state.dataset = null;
          state.source = null;
          $("insert").disabled = true;
          return;
        }
        state.dataset = result.dataset;
        state.sideways = result.orientation === "scenarios-in-columns";
        state.source = { worksheetId: range.worksheet.id, address: range.address, values: range.values, orientation: result.orientation };
        $("insert-native-table").disabled = false;
        refreshPreview();
        if (result.normalized) setStatus(`${$("status").textContent} \xB7 normalised ${result.normalized.join(", ")}`);
      });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
    }
  }
  var EXAMPLE_DATA = [
    ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    ["AC", 57, 63, 58, "", "", ""],
    ["FC", "", "", "", 64, 69, 71],
    ["PL", 60, 60, 62, 62, 64, 64]
  ];
  async function insertExampleData() {
    try {
      await Excel.run(async (ctx) => {
        const anchor = ctx.workbook.getSelectedRange().getCell(0, 0);
        const block = anchor.getResizedRange(EXAMPLE_DATA.length - 1, EXAMPLE_DATA[0].length - 1);
        block.values = EXAMPLE_DATA;
        block.getRow(0).format.font.bold = true;
        block.select();
        await ctx.sync();
      });
      await loadSelection();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
    }
  }
  async function insertNativeTable() {
    if (!state.source) return;
    const meta = readMeta();
    const baseline = $("baseline").value;
    try {
      const src = state.source;
      await Excel.run(async (ctx) => {
        const sheet = ctx.workbook.worksheets.getActiveWorksheet();
        const sel = ctx.workbook.getSelectedRange();
        sel.load(["rowIndex", "columnIndex", "columnCount"]);
        await ctx.sync();
        const anchorRow = sel.rowIndex + 1;
        const anchorCol = sel.columnIndex + sel.columnCount + 2;
        const model = buildNativeTable({
          values: src.values,
          sourceAddress: src.address,
          orientation: src.orientation,
          compare: ["AC", "FC"],
          baseline,
          good_direction: meta.good_direction,
          measure: meta.measure
        }, anchorRow, anchorCol);
        if (model.errors.length > 0) throw new Error(model.errors.join(" "));
        const rows = model.formulas.length;
        const cols = model.header.length;
        const block = sheet.getRangeByIndexes(anchorRow - 1, anchorCol - 1, rows, cols);
        block.formulas = model.formulas.map((r) => r.map((c) => c === null ? "" : c));
        for (let c = 1; c < cols; c++) {
          if (model.numberFormats[c]) {
            sheet.getRangeByIndexes(anchorRow, anchorCol - 1 + c, rows - 1, 1).numberFormat = [[model.numberFormats[c]]];
          }
        }
        const header = sheet.getRangeByIndexes(anchorRow - 1, anchorCol - 1, 1, cols);
        header.format.font.bold = true;
        header.format.borders.getItem("EdgeBottom").style = "Continuous";
        const totalRange = sheet.getRangeByIndexes(anchorRow - 1 + rows - 1, anchorCol - 1, 1, cols);
        totalRange.format.font.bold = true;
        totalRange.format.borders.getItem("EdgeTop").style = "Continuous";
        const GREEN = "#4E7A2B";
        const RED = "#B3261E";
        const posColor = meta.good_direction === "down" ? RED : GREEN;
        const negColor = meta.good_direction === "down" ? GREEN : RED;
        for (const c of [model.cols.diff, model.cols.pct]) {
          const target = sheet.getRangeByIndexes(anchorRow, anchorCol - 1 + c, rows - 1, 1);
          const pos = target.conditionalFormats.add(Excel.ConditionalFormatType.cellValue);
          pos.cellValue.rule = { formula1: "0", operator: Excel.ConditionalCellValueOperator.greaterThan };
          pos.cellValue.format.font.color = posColor;
          const neg = target.conditionalFormats.add(Excel.ConditionalFormatType.cellValue);
          neg.cellValue.rule = { formula1: "0", operator: Excel.ConditionalCellValueOperator.lessThan };
          neg.cellValue.format.font.color = negColor;
        }
        block.format.autofitColumns();
        sel.select();
        await ctx.sync();
      });
      setStatus(`Inserted a native ${meta.measure || ""} table vs ${baseline} \u2014 real formulas, updates by recalculation, no add-in needed to view or edit.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
    }
  }
  async function insertChart() {
    if (!state.dataset || !state.source) return;
    const { chart, options } = readOptions();
    const meta = readMeta();
    const id = newRecordId();
    const shapeName = `hatchmark:${id}`;
    try {
      let dataset = state.dataset;
      await Excel.run(async (ctx) => {
        const sheet = ctx.workbook.worksheets.getItemOrNullObject(state.source.worksheetId);
        await ctx.sync();
        if (sheet.isNullObject) return;
        const range = sheet.getRange(state.source.address.split("!").pop());
        range.load("values");
        await ctx.sync();
        const fresh = rangeToDataset(range.values, meta);
        if (fresh.dataset) dataset = fresh.dataset;
      });
      const svg = renderChart(chart, dataset, options);
      const size = svg.match(/width="(\d+(?:\.\d+)?)" height="(\d+(?:\.\d+)?)"/);
      const width = size ? Number(size[1]) : options.width ?? 320;
      const height = size ? Number(size[2]) : options.height ?? 200;
      const png = await svgToPngBase64(svg, width, height);
      const record = {
        id,
        shapeName,
        worksheetId: state.source.worksheetId,
        hostSheetId: "",
        sourceAddress: state.source.address,
        chart,
        meta,
        options: {
          baseline: options.baseline,
          colour_mode: options.colour_mode ?? "colour",
          show_data_labels: options.show_data_labels ?? false,
          width,
          height
        },
        registry_version: REGISTRY_VERSION,
        updated: (/* @__PURE__ */ new Date()).toISOString()
      };
      await Excel.run(async (ctx) => {
        const sheet = ctx.workbook.worksheets.getActiveWorksheet();
        const sel = ctx.workbook.getSelectedRange();
        sel.load(["left", "top", "width"]);
        sheet.load("id");
        await ctx.sync();
        record.hostSheetId = sheet.id;
        const shape = sheet.shapes.addImage(png);
        shape.left = sel.left + sel.width + 12;
        shape.top = sel.top;
        shape.width = width;
        shape.height = height;
        shape.name = shapeName;
        shape.altTextDescription = `hatchmark v${REGISTRY_VERSION} ${chart} \u2014 live from ${state.source.address}`;
        shape.altTextTitle = encodeRecord(record);
        await ctx.sync();
      });
      await upsertRecord(record);
      updateLiveCount();
      setStatus(`Inserted ${chart} \u2014 updates automatically from ${state.source.address} ${liveScopeText()}.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
    }
  }
  Office.onReady((info) => {
    if (info.host !== Office.HostType.Excel) {
      setStatus("This add-in runs in Excel.", true);
      return;
    }
    if (!Office.context.requirements.isSetSupported("ExcelApi", "1.9")) {
      setStatus("Your Excel version does not support inserting images from add-ins (ExcelApi 1.9 needed \u2014 Excel 2019+ or Microsoft 365).", true);
      $("load").disabled = true;
      $("insert").disabled = true;
      return;
    }
    sharedRuntime = Office.context.requirements.isSetSupported("SharedRuntime", "1.1");
    if (sharedRuntime) {
      try {
        void Office.addin.setStartupBehavior(Office.StartupBehavior.none);
      } catch {
      }
      $("live-toggle-label").textContent = "Update charts automatically while the workbook is open";
    }
    $("load").addEventListener("click", loadSelection);
    $("insert").addEventListener("click", insertChart);
    $("example").addEventListener("click", insertExampleData);
    $("insert-native-table").addEventListener("click", insertNativeTable);
    $("refresh-all").addEventListener("click", async () => {
      setStatus("Refreshing\u2026");
      setStatus(await refreshAll());
      updateLiveCount();
    });
    $("live-toggle").addEventListener("change", () => {
      setLiveEnabled($("live-toggle").checked);
    });
    for (const id of ["chart-type", "baseline", "colour-mode", "show-labels", "measure", "unit", "reporting-unit", "good-direction"]) {
      $(id).addEventListener("change", () => {
        if (state.dataset) {
          const meta = readMeta();
          state.dataset = {
            ...state.dataset,
            reporting_unit: meta.reporting_unit || void 0,
            measure: meta.measure || state.dataset.measure,
            unit: meta.unit,
            series: state.dataset.series.map(
              (s) => s.scenario === "AC" ? { ...s, good_direction: meta.good_direction } : s
            )
          };
        }
        refreshPreview();
      });
    }
    updateLiveCount();
    attachChangeListener((msg) => {
      setStatus(`Live update: ${msg}`);
      updateLiveCount();
    }).catch((err) => setStatus(String(err), true));
    setStatus('Select your data range, then press "Load selection".');
    reconcileRecords().then(async (recovered) => {
      if (recovered.length === 0) return;
      for (const rec of recovered) await refreshRecord(rec, true);
      updateLiveCount();
      setStatus(`Reconnected ${recovered.length} chart(s) found in this workbook \u2014 live updates restored.`);
    }).catch(() => {
    });
  });
})();
