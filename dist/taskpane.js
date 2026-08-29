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
  function yFor(v, a, plotH) {
    const range = a.max - a.min;
    if (range <= 0) return plotH;
    return plotH - (v - a.min) / range * plotH;
  }
  function clampToPlot(y, plotH) {
    return Math.min(plotH, Math.max(0, y));
  }
  function valueAxis(a, layout) {
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
      parts.push(text({ x: -(STYLE.tickLength + 1), y: y + 2.5, "font-size": FS.axisLabel, fill: STYLE.axisColor, "text-anchor": "end" }, formatTick(t, a)));
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
  function referenceAxis(y, plotW, baseline) {
    if (baseline === "PL" || baseline === "BU") {
      return el("line", { x1: 0, y1: y - 0.9, x2: plotW, y2: y - 0.9, stroke: COLOR.measuredDark, "stroke-width": 0.5 }) + el("line", { x1: 0, y1: y + 0.9, x2: plotW, y2: y + 0.9, stroke: COLOR.measuredDark, "stroke-width": 0.5 });
    }
    if (baseline === "PY") {
      return el("line", { x1: 0, y1: y, x2: plotW, y2: y, stroke: COLOR.measuredLight, "stroke-width": 2 });
    }
    return el("line", { x1: 0, y1: y, x2: plotW, y2: y, stroke: COLOR.measuredDark, "stroke-width": 0.75 });
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
    const varScale = layout.plotH * PIN_MAX_EXTENT / maxAbs;
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
      if (options.show_data_labels) {
        const label = p.interpretable ? formatSigned(p.pct, decimals, "", "%") : "N/A";
        const labelY = p.pct >= 0 || !p.interpretable ? tipY - headSize / 2 - 1 : tipY + headSize / 2 + FS.dataLabel;
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

  // node_modules/hatchmark/src/render/index.ts
  function renderChart(chart, dataset, options = {}) {
    switch (chart) {
      case "basic-column":
        return renderBasicColumn(dataset, options);
      case "absolute-variance-column":
        return renderVarianceColumn(dataset, options);
      case "relative-variance-pins":
        return renderVariancePins(dataset, options);
      default: {
        const never = chart;
        throw new Error(`Unknown chart type: ${String(never)}`);
      }
    }
  }

  // src/rangeMapping.ts
  var SCENARIOS = ["AC", "PY", "PL", "BU", "FC"];
  function detectGranularity(labels) {
    const first = (labels[0] ?? "").trim();
    if (/^W\d/i.test(first)) return "weekly";
    if (/^P\d/i.test(first)) return "4-week";
    if (/^Q\d/i.test(first)) return "quarterly";
    if (/^\d{4}$/.test(first)) return "annual";
    return "monthly";
  }
  function isScenarioCode(cell) {
    return SCENARIOS.includes(String(cell ?? "").trim().toUpperCase());
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
    const locate = orientation === "scenarios-in-rows" ? ROW_LOCATORS : COLUMN_LOCATORS;
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
    for (let r = 1; r < grid.length; r++) {
      const row = grid[r];
      const rawCode = String(row[0] ?? "").trim().toUpperCase();
      if (rawCode === "" && row.slice(1).every((c) => c === "" || c === null || c === void 0)) continue;
      if (!SCENARIOS.includes(rawCode)) {
        errors.push(`${locate.scenarioHeader(r)}: "${row[0]}" is not a scenario code \u2014 use one of ${SCENARIOS.join(", ")}.`);
        continue;
      }
      if (seen.has(rawCode)) {
        errors.push(`${locate.scenarioHeader(r)}: scenario ${rawCode} appears more than once.`);
        continue;
      }
      seen.add(rawCode);
      const rowValues = [];
      for (let c = 1; c <= periods.length; c++) {
        const v = cellToValue(row[c]);
        if (v === "invalid") {
          errors.push(`${locate.cell(r, c)}: "${row[c]}" is not a number (leave the cell blank for no value).`);
          rowValues.push(null);
        } else {
          rowValues.push(v);
        }
      }
      const s = { scenario: rawCode, values: rowValues };
      if (rawCode === "AC" && meta.good_direction) s.good_direction = meta.good_direction;
      series.push(s);
    }
    if (series.length === 0) errors.push(`No scenario lines found. ${LAYOUT_HELP}`);
    if (errors.length > 0) return { orientation, errors };
    return {
      orientation,
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

  // src/liveCharts.ts
  var REGISTRY_VERSION = "0.1.1";
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
      const target = hostSheet ?? ctx.workbook.worksheets.getItem(record.worksheetId);
      const shape = target.shapes.addImage(png);
      shape.left = geometry?.left ?? 0;
      shape.top = geometry?.top ?? 0;
      shape.width = geometry?.width ?? record.options.width;
      shape.height = geometry?.height ?? record.options.height;
      shape.name = record.shapeName;
      shape.altTextDescription = altText(record);
      if (!selection.address.includes(",")) {
        ctx.workbook.worksheets.getActiveWorksheet().getRange(stripSheet(selection.address)).select();
      }
      await ctx.sync();
      if (record.hostSheetId !== target.id || record.registry_version !== REGISTRY_VERSION) {
        record.hostSheetId = target.id;
        record.registry_version = REGISTRY_VERSION;
        record.updated = (/* @__PURE__ */ new Date()).toISOString();
        structuralChange = true;
      }
    });
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
    const options = {
      width: 320,
      height: 200,
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
      setStatus(`Preview: ${chart} \xB7 registry v${REGISTRY_VERSION}${state.sideways ? " \xB7 sideways layout detected" : ""}`);
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
        state.source = { worksheetId: range.worksheet.id, address: range.address };
        refreshPreview();
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
  async function insertChart() {
    if (!state.dataset || !state.source) return;
    const { chart, options } = readOptions();
    const meta = readMeta();
    const width = options.width ?? 320;
    const height = options.height ?? 200;
    const id = newRecordId();
    const shapeName = `hatchmark:${id}`;
    try {
      const svg = renderChart(chart, state.dataset, options);
      const png = await svgToPngBase64(svg, width, height);
      let hostSheetId = "";
      await Excel.run(async (ctx) => {
        const sheet = ctx.workbook.worksheets.getActiveWorksheet();
        const sel = ctx.workbook.getSelectedRange();
        sel.load(["left", "top", "width"]);
        sheet.load("id");
        await ctx.sync();
        const shape = sheet.shapes.addImage(png);
        shape.left = sel.left + sel.width + 12;
        shape.top = sel.top;
        shape.width = width;
        shape.height = height;
        shape.name = shapeName;
        shape.altTextDescription = `hatchmark v${REGISTRY_VERSION} ${chart} \u2014 live from ${state.source.address}`;
        await ctx.sync();
        hostSheetId = sheet.id;
      });
      const record = {
        id,
        shapeName,
        worksheetId: state.source.worksheetId,
        hostSheetId,
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
  });
})();
