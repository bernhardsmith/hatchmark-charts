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
  var HEX_COLOUR = /^#[0-9A-Fa-f]{6}$/;
  function impactColour(impact, mode = "colour", theme) {
    if (mode === "colour" && theme) {
      const override = theme[impact];
      if (override && HEX_COLOUR.test(override)) return override;
    }
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
  function computeLayout(width, height, title, showValueAxis, unitLabelText, maxTickLabelChars, footnoteLines = 0, markerStrip = 0) {
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
    const padTop = titleH + unitLabelH + markerStrip;
    const footnoteH = footnoteLines > 0 ? footnoteLines * FOOTNOTE_LINE_H + 3 : 0;
    const plotW = Math.max(10, width - padLeft - 6);
    const plotH = Math.max(10, height - padTop - xAxisH - footnoteH);
    return { width, height, padLeft, padTop, plotW, plotH, titleH, unitLabelH, titleX, titleLines, footnoteH };
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
    const decimals = div > 1 && maxAbs / div < 20 ? Math.max(a.decimals, 1) : a.decimals;
    return {
      div,
      suffix: unit,
      plain: (v) => formatNumber(v / div, decimals, a.prefix, suffix),
      signed: (v) => {
        const body = formatNumber(v / div, decimals, a.prefix, suffix);
        const rounds0 = Number(Math.abs(v / div).toFixed(decimals)) === 0;
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
  var SAFE_FONT = /^[A-Za-z0-9 ,'-]{1,120}$/;
  function svgRoot(layout, defs, content, desc, fontFamily) {
    const font = fontFamily && SAFE_FONT.test(fontFamily.trim()) ? fontFamily.trim() : STYLE.fontFamily;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" font-family="${esc(font)}">` + (desc ? `<desc>${esc(desc)}</desc>` : "") + (defs ? `<defs>${defs}</defs>` : "") + // The canvas is part of the notation: outlined fills are interiors of
    // this colour (notation/colors.yaml → background).
    el("rect", { x: 0, y: 0, width: layout.width, height: layout.height, fill: COLOR.background }) + content + "</svg>";
  }
  var FOOTNOTE_FS = 5.5;
  var FOOTNOTE_LINE_H = Math.ceil(FOOTNOTE_FS * 1.3);
  var COMMENT_MARKER_R = 3.4;
  var MAX_COMMENTS = 9;
  var MARKER_STRIP_H = COMMENT_MARKER_R * 2 + 2.5;
  var MIN_COMMENT_PLOT = 45;
  function resolveComments(comments, periods) {
    if (!comments || comments.length === 0) return [];
    const index = new Map(periods.map((p, i) => [p.trim().toLowerCase(), i]));
    const resolved = [];
    for (const c of comments) {
      const i = index.get(c.period.trim().toLowerCase());
      if (i === void 0 || resolved.length >= MAX_COMMENTS) continue;
      resolved.push({ n: resolved.length + 1, periodIndex: i, text: c.text });
    }
    return resolved;
  }
  function commentMarkers(resolved, xFor) {
    const byPeriod = /* @__PURE__ */ new Map();
    for (const c of resolved) {
      if (!byPeriod.has(c.periodIndex)) byPeriod.set(c.periodIndex, []);
      byPeriod.get(c.periodIndex).push(c);
    }
    const cy = -(MARKER_STRIP_H / 2);
    const parts = [];
    for (const [periodIndex, group] of byPeriod) {
      const centre = xFor(periodIndex);
      group.forEach((c, k) => {
        const cx = centre + (k - (group.length - 1) / 2) * (COMMENT_MARKER_R * 2 + 1);
        parts.push(
          el("circle", { cx, cy, r: COMMENT_MARKER_R, fill: COLOR.background, stroke: STYLE.axisColor, "stroke-width": 0.6 }) + text({ x: cx, y: cy + 1.7, "font-size": 4.5, fill: STYLE.axisColor, "text-anchor": "middle" }, String(c.n))
        );
      });
    }
    return parts.join("");
  }
  function commentFootnotes(resolved, layout) {
    if (resolved.length === 0 || layout.footnoteH === 0) return "";
    const top = layout.height - layout.footnoteH + 2;
    const maxChars = Math.max(8, Math.floor((layout.width - layout.padLeft - 8) / (FOOTNOTE_FS * CHAR_WIDTH_FACTOR)));
    return resolved.map((c, line) => {
      const body = c.text.length > maxChars ? c.text.slice(0, maxChars - 1) + "\u2026" : c.text;
      const y = top + (line + 1) * FOOTNOTE_LINE_H - 2;
      return el("circle", { cx: layout.padLeft + COMMENT_MARKER_R, cy: y - 1.7, r: COMMENT_MARKER_R * 0.85, fill: COLOR.background, stroke: STYLE.axisColor, "stroke-width": 0.5 }) + text({ x: layout.padLeft + COMMENT_MARKER_R, y: y - 0.3, "font-size": 4, fill: STYLE.axisColor, "text-anchor": "middle" }, String(c.n)) + text({ x: layout.padLeft + COMMENT_MARKER_R * 2 + 2.5, y, "font-size": FOOTNOTE_FS, fill: STYLE.axisColor }, body);
    }).join("");
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
    let comments = resolveComments(options.comments, dataset.periods);
    let layout = computeLayout(width, height, title, true, axis.label, maxTickChars, comments.length, comments.length > 0 ? MARKER_STRIP_H : 0);
    if (comments.length > 0 && layout.plotH < MIN_COMMENT_PLOT) {
      comments = [];
      layout = computeLayout(width, height, title, true, axis.label, maxTickChars, 0);
    }
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
    (zeroInRange ? el("line", { x1: 0, y1: zeroY, x2: layout.plotW, y2: zeroY, stroke: STYLE.axisColor, "stroke-width": STYLE.axisLineW }) : "") + labels.join("") + categoryLabels(dataset.periods, layout, options.truncate_labels !== false, options.period_notation) + commentMarkers(comments, (i) => {
      const b = bs[i];
      return b.x + b.categoryW / 2;
    });
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const content = titleBlock(layout) + unitLabel(axis, layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>` + commentFootnotes(comments, layout);
    const desc = `hatchmark${options.version ? ` v${options.version}` : ""} basic-column`;
    return svgRoot(layout, defs, content, desc, options.theme?.font_family);
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
    let comments = resolveComments(options.comments, dataset.periods);
    let layout = computeLayout(width, height, title, false, "", 0, comments.length, comments.length > 0 ? MARKER_STRIP_H : 0);
    if (comments.length > 0 && layout.plotH < MIN_COMMENT_PLOT) {
      comments = [];
      layout = computeLayout(width, height, title, false, "", 0, 0);
    }
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
      const color = impactColour(impact, mode, options.theme);
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
    const plot = marks.join("") + referenceAxis(mid, layout.plotW, baseline) + labels.join("") + categoryLabels(dataset.periods, layout, options.truncate_labels !== false, options.period_notation) + commentMarkers(comments, (i) => {
      const b = bs[i];
      return b.x + b.categoryW / 2;
    });
    const defs = [...usedHatch.entries()].map(([impact, id]) => hatchPattern(id, impactColour(impact, mode, options.theme))).join("");
    const content = titleBlock(layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>` + commentFootnotes(comments, layout);
    const desc = `hatchmark${options.version ? ` v${options.version}` : ""} absolute-variance-column`;
    return svgRoot(layout, defs, content, desc, options.theme?.font_family);
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
    let comments = resolveComments(options.comments, dataset.periods);
    let layout = computeLayout(width, height, title, false, "", 0, comments.length, comments.length > 0 ? MARKER_STRIP_H : 0);
    if (comments.length > 0 && layout.plotH < MIN_COMMENT_PLOT) {
      comments = [];
      layout = computeLayout(width, height, title, false, "", 0, 0);
    }
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
      const stemColor = impactColour(impactFor(p.pct, p.interpretable, good), mode, options.theme);
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
    const plot = marks.join("") + referenceAxis(mid, layout.plotW, baseline) + labels.join("") + categoryLabels(dataset.periods, layout, options.truncate_labels !== false, options.period_notation) + commentMarkers(comments, (i) => {
      const b = bs[i];
      return b.x + b.categoryW / 2;
    });
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const content = titleBlock(layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>` + commentFootnotes(comments, layout);
    const desc = `hatchmark${options.version ? ` v${options.version}` : ""} relative-variance-pins`;
    return svgRoot(layout, defs, content, desc, options.theme?.font_family);
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
    const barIndexByLabel = new Map(bars.map((b, j) => [b.label, j]));
    let comments = contribution ? [] : resolveComments(options.comments, dataset.periods).filter((c) => barIndexByLabel.has(dataset.periods[c.periodIndex])).map((c, k) => ({ ...c, n: k + 1 }));
    let layout = computeLayout(width, height, title, true, axis.label, maxTickChars, comments.length, comments.length > 0 ? MARKER_STRIP_H : 0);
    if (comments.length > 0 && layout.plotH < MIN_COMMENT_PLOT) {
      comments = [];
      layout = computeLayout(width, height, title, true, axis.label, maxTickChars, 0, 0);
    }
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
        const color = impactColour(b.impact, mode, options.theme);
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
    }) + texts.join("") + categoryLabels(labels, fakeLayout, options.truncate_labels !== false, options.period_notation) + commentMarkers(comments, (i) => {
      const b = bs[barIndexByLabel.get(dataset.periods[i])];
      return b.x + b.categoryW / 2;
    });
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const chartId = contribution ? "contribution-waterfall" : "waterfall-column";
    const content = titleBlock(layout) + unitLabel(axis, layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>` + commentFootnotes(comments, layout);
    const desc = `hatchmark${options.version ? ` v${options.version}` : ""} ${chartId}`;
    return svgRoot(layout, defs, content, desc, options.theme?.font_family);
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
    let comments = resolveComments(options.comments, dataset.periods);
    let layout = computeLayout(width, height, title, true, axis.label, maxTickChars, comments.length, comments.length > 0 ? MARKER_STRIP_H : 0);
    if (comments.length > 0 && layout.plotH < MIN_COMMENT_PLOT) {
      comments = [];
      layout = computeLayout(width, height, title, true, axis.label, maxTickChars, 0);
    }
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
    const plot = valueAxis(axis, layout, fmt2) + marks.join("") + el("line", { x1: 0, y1: zeroY, x2: layout.plotW, y2: zeroY, stroke: STYLE.axisColor, "stroke-width": STYLE.axisLineW }) + texts.join("") + categoryLabels(dataset.periods, layout, options.truncate_labels !== false, options.period_notation) + commentMarkers(comments, (i) => {
      const b = bs[i];
      return b.x + b.categoryW / 2;
    });
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const chartId = area ? "basic-area" : "basic-line";
    const content = titleBlock(layout) + unitLabel(axis, layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${plot}</g>` + commentFootnotes(comments, layout);
    const desc = `hatchmark${options.version ? ` v${options.version}` : ""} ${chartId}`;
    return svgRoot(layout, defs, content, desc, options.theme?.font_family);
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
    return svgRoot(layout, defs, content, `hatchmark${options.version ? ` v${options.version}` : ""} basic-bar`, options.theme?.font_family);
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
      const color = impactColour(impactFor(v, interpretable, good), mode, options.theme);
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
    return svgRoot(layout, defs, content, `hatchmark${options.version ? ` v${options.version}` : ""} ${chartId}`, options.theme?.font_family);
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
    return svgRoot(layout, "", content, `hatchmark${options.version ? ` v${options.version}` : ""} small-multiples-column`, options.theme?.font_family);
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
    let comments = resolveComments(options.comments, dataset.periods);
    const tickChars = Math.max(0, ...tickValues(axis).map((t) => fmt2.plain(t).length));
    let layout = computeLayout(width, height, title, true, axis.label, tickChars, comments.length, comments.length > 0 ? MARKER_STRIP_H : 0);
    const contentMin = tiers.length * 15 + 25;
    if (comments.length > 0 && layout.plotH < Math.max(45, contentMin)) {
      comments = [];
      layout = computeLayout(width, height, title, true, axis.label, tickChars, 0, 0);
    }
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
        const color = impactColour(impactFor(val, interpretable, good), mode, options.theme);
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
    groups.push(commentMarkers(comments, (i) => {
      const b = bs[i];
      return b.x + b.categoryW / 2;
    }));
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const content = titleBlock(layout) + unitLabel(axis, layout) + `<g transform="translate(${layout.padLeft},${layout.padTop})">${groups.join("")}</g>` + commentFootnotes(comments, layout);
    return svgRoot(layout, defs, content, `hatchmark${options.version ? ` v${options.version}` : ""} column-with-variance`, options.theme?.font_family);
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
    const allValues = rows.flatMap((r) => [r.ac ?? 0, r.pl ?? 0]);
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
        const color = impactColour(impact, mode, options.theme);
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
        const color = impactColour(impact, mode, options.theme);
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
    return svgRoot(layout, "", content, `hatchmark${options.version ? ` v${options.version}` : ""} variance-table`, options.theme?.font_family);
  }

  // node_modules/hatchmark/src/render/dataTable.ts
  var ROW_H2 = 11;
  var HEADER_H2 = 12;
  var CELL_FS = 6.5;
  function renderDataTable(dataset, options = {}, chartId = "time-series-table") {
    const decimals = options.axis?.decimals ?? 0;
    const rows = dataset.series.map((s) => ({
      label: s.label ?? s.scenario,
      scenario: s.label ? null : s.scenario,
      values: s.values
    }));
    const nCols = dataset.periods.length;
    const rowTotal = (r) => r.values.some((v) => v !== null) ? r.values.reduce((a, v) => a + (v ?? 0), 0) : null;
    const oneScenario = new Set(dataset.series.map((s) => s.scenario)).size === 1;
    const showTotalRow = rows.length > 1 && oneScenario;
    const columnTotals = dataset.periods.map(
      (_, c) => rows.some((r) => r.values[c] !== null) ? rows.reduce((a, r) => a + (r.values[c] ?? 0), 0) : null
    );
    const grandTotal = columnTotals.some((v) => v !== null) ? columnTotals.reduce((a, v) => a + (v ?? 0), 0) : null;
    const bodyValues = rows.flatMap((r) => r.values.filter((v) => v !== null));
    const axis = { min: 0, max: 1, ticks: 0, decimals, prefix: options.axis?.prefix ?? "", suffix: options.axis?.suffix ?? "", label: options.axis?.label ?? dataset.unit };
    const fmt2 = makeFormatter(bodyValues, axis, options.axis?.auto_scale !== false);
    const TABLE_CHAR_W = 0.62;
    const chipW = rows.some((r) => r.scenario) ? 7 : 0;
    const wLabel = Math.max(26, chipW + 4 + Math.max(0, ...rows.map((r) => r.label.length)) * CELL_FS * TABLE_CHAR_W);
    const cellTexts = [
      ...rows.flatMap((r) => r.values.map((v) => v === null ? "" : fmt2.plain(v))),
      ...columnTotals.map((v) => v === null ? "" : fmt2.plain(v)),
      grandTotal === null ? "" : fmt2.plain(grandTotal)
    ];
    const wNum = Math.max(
      20,
      Math.max(0, ...cellTexts.map((t) => t.length)) * CELL_FS * TABLE_CHAR_W + 7,
      Math.max(0, ...dataset.periods.map((t) => t.length)) * 7 * TABLE_CHAR_W + 7
    );
    const totalGap = 3;
    const bodyRows = rows.length + (showTotalRow ? 1 : 0);
    const contentW = wLabel + nCols * wNum + totalGap + wNum + 2;
    const contentH = HEADER_H2 + bodyRows * ROW_H2 + 2;
    const width = options.width ?? Math.max(200, contentW + 42);
    const height = options.height ?? Math.max(100, contentH + 66);
    const title = resolveTitle(dataset, options);
    const layout = computeLayout(width, height, title, false, "", 0);
    const tableScale = Math.min(1, layout.plotW / contentW, layout.plotH / contentH);
    const xLabel = 0;
    const xValueRight = (c) => wLabel + (c + 1) * wNum;
    const xTotalRight = wLabel + nCols * wNum + totalGap + wNum;
    const parts = [];
    const headY = HEADER_H2 - 3;
    const th = (x, label, anchor = "end") => text({ x, y: headY, "font-size": 7, "font-weight": 600, fill: COLOR.measuredDark, "text-anchor": anchor }, label);
    dataset.periods.forEach((p, c) => parts.push(th(xValueRight(c), p)));
    parts.push(th(xTotalRight, "\u03A3"));
    parts.push(el("line", { x1: 0, y1: HEADER_H2, x2: layout.plotW, y2: HEADER_H2, stroke: STYLE.axisColor, "stroke-width": 0.75 }));
    const usedHatch = /* @__PURE__ */ new Map();
    const prefix = options.id_prefix ?? `hm-${dataset.id}-dtable`;
    const drawRow = (label, scenario, values, rTotal, rowIdx, isTotal) => {
      const y = HEADER_H2 + rowIdx * ROW_H2;
      const baseY = y + ROW_H2 - 3;
      const weight = isTotal ? 700 : 400;
      if (isTotal) parts.push(el("line", { x1: 0, y1: y, x2: layout.plotW, y2: y, stroke: STYLE.axisColor, "stroke-width": 0.5 }));
      else if (rowIdx > 0) parts.push(el("line", { x1: 0, y1: y, x2: layout.plotW, y2: y, stroke: STYLE.gridlineColor, "stroke-width": 0.25 }));
      let labelX = xLabel;
      if (scenario) {
        const chipY = baseY - 4.6;
        const treatment = scenarioFill(scenario);
        const color = scenarioColor(scenario);
        if (treatment === "hatched") {
          if (!usedHatch.has(color)) usedHatch.set(color, `${prefix}-hatch-${usedHatch.size}`);
          parts.push(el("rect", { x: labelX, y: chipY, width: 5, height: 5, fill: `url(#${usedHatch.get(color)})`, stroke: color, "stroke-width": 0.5 }));
        } else if (treatment === "outlined") {
          parts.push(el("rect", { x: labelX, y: chipY, width: 5, height: 5, fill: COLOR.background, stroke: COLOR.outlineStroke, "stroke-width": 0.6 }));
        } else {
          parts.push(el("rect", { x: labelX, y: chipY, width: 5, height: 5, fill: color }));
        }
        labelX += 7;
      }
      parts.push(text({ x: labelX, y: baseY, "font-size": CELL_FS, "font-weight": weight, fill: COLOR.measuredDark }, label));
      values.forEach((v, c) => {
        if (v === null) return;
        parts.push(text({ x: xValueRight(c), y: baseY, "font-size": CELL_FS, "font-weight": weight, fill: COLOR.measuredDark, "text-anchor": "end" }, fmt2.plain(v)));
      });
      if (rTotal !== null) {
        parts.push(text({ x: xTotalRight, y: baseY, "font-size": CELL_FS, "font-weight": 700, fill: COLOR.measuredDark, "text-anchor": "end" }, fmt2.plain(rTotal)));
      }
    };
    rows.forEach((r, i) => drawRow(r.label, r.scenario, r.values, rowTotal(r), i, false));
    if (showTotalRow) {
      drawRow("\u03A3", null, columnTotals, grandTotal, rows.length, true);
    }
    const closeY = HEADER_H2 + bodyRows * ROW_H2 + 1;
    parts.push(el("line", { x1: 0, y1: closeY, x2: layout.plotW, y2: closeY, stroke: STYLE.axisColor, "stroke-width": 0.75 }));
    const unitNote = text(
      { x: layout.padLeft + layout.plotW, y: layout.titleH + FS.axisUnit, "font-size": FS.axisUnit, fill: STYLE.axisColor, "text-anchor": "end" },
      axis.label + (fmt2.suffix ? ` (${fmt2.suffix})` : "")
    );
    const defs = [...usedHatch.entries()].map(([color, id]) => hatchPattern(id, color)).join("");
    const content = titleBlock(layout) + unitNote + `<g transform="translate(${layout.padLeft},${layout.padTop})${tableScale < 1 ? ` scale(${Number(tableScale.toFixed(4))})` : ""}">${parts.join("")}</g>`;
    const desc = `hatchmark${options.version ? ` v${options.version}` : ""} ${chartId}`;
    return svgRoot(layout, defs, content, desc, options.theme?.font_family);
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
      case "time-series-table":
        return renderDataTable(dataset, options, "time-series-table");
      case "cross-table":
        return renderDataTable(dataset, options, "cross-table");
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
  var REGISTRY_VERSION = "0.4.0";
  var SETTINGS_KEY = "hatchmark-live-charts";
  var THEME_KEY = "hatchmark-theme";
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
  function loadWorkbookTheme() {
    const raw = Office.context.document.settings.get(THEME_KEY);
    return raw && typeof raw === "object" ? raw : null;
  }
  function saveWorkbookTheme(theme) {
    if (theme === null) Office.context.document.settings.remove(THEME_KEY);
    else Office.context.document.settings.set(THEME_KEY, theme);
    return new Promise((resolve, reject) => {
      Office.context.document.settings.saveAsync(
        (res) => res.status === Office.AsyncResultStatus.Succeeded ? resolve() : reject(new Error(res.error?.message ?? "settings save failed"))
      );
    });
  }
  function renderRecordSvg(record, values) {
    const mapped = rangeToDataset(values, record.meta);
    if (!mapped.dataset) return { errors: mapped.errors };
    const workbookTheme = loadWorkbookTheme();
    const svg = renderChart(record.chart, mapped.dataset, {
      ...record.options,
      axis: { auto_scale: record.options.auto_scale !== false },
      theme: workbookTheme ?? void 0,
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
  function protectShape(shape) {
    shape.lockAspectRatio = true;
    try {
      if (Office.context.requirements.isSetSupported("ExcelApi", "1.10")) {
        shape.placement = Excel.Placement.oneCell;
      }
    } catch {
    }
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
  async function readSelectionAddress() {
    try {
      let addr = null;
      await Excel.run(async (ctx) => {
        const sel = ctx.workbook.getSelectedRange();
        sel.load("address");
        await ctx.sync();
        addr = sel.address;
      });
      return addr;
    } catch {
      return null;
    }
  }
  async function refreshRecord(record, force = false, resize) {
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
    const selAddress = await readSelectionAddress();
    await Excel.run(async (ctx) => {
      const sheets = ctx.workbook.worksheets;
      sheets.load("items/id");
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
      const healWidth = resize?.width ?? geometry.width;
      shape.width = healWidth;
      shape.height = resize?.height ?? healWidth * (record.options.height / record.options.width);
      protectShape(shape);
      shape.name = record.shapeName;
      shape.altTextDescription = altText(record);
      shape.altTextTitle = encodeRecord(record);
      if (selAddress && !selAddress.includes(",")) {
        ctx.workbook.worksheets.getActiveWorksheet().getRange(stripSheet(selAddress)).select();
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

  // src/thumbnails.gen.ts
  var CHART_CHOICES = [
    {
      "group": "Time \u2014 level",
      "id": "basic-column",
      "label": "Column \u2014 measure over time (AC/FC)",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark basic-column</desc><defs><pattern id="hm-thumb-basic-column-hatch-0" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#333333" stroke-width="1.5"/></pattern></defs><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="17.240000000000002" y="7.5" font-size="7.5" fill="#333333"><tspan x="17.240000000000002" dy="0">Alpha Corporation</tspan><tspan x="17.240000000000002" dy="10"><tspan font-weight="600">Net sales </tspan>in mEUR</tspan><tspan x="17.240000000000002" dy="10">2026 AC&amp;FC</tspan></text><text x="26" y="43.5" font-size="7.5" fill="#333333" text-anchor="end">mEUR</text><g transform="translate(28,44.5)"><line x1="0" y1="103.5" x2="226" y2="103.5" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="69" x2="226" y2="69" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="34.5" x2="226" y2="34.5" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="226" y2="0" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="0" y2="103.5" stroke="#333333" stroke-width="0.75"/><line x1="-3" y1="103.5" x2="0" y2="103.5" stroke="#333333" stroke-width="0.5"/><text x="-4" y="106" font-size="6.5" fill="#333333" text-anchor="end">0</text><line x1="-3" y1="69" x2="0" y2="69" stroke="#333333" stroke-width="0.5"/><text x="-4" y="71.5" font-size="6.5" fill="#333333" text-anchor="end">30</text><line x1="-3" y1="34.5" x2="0" y2="34.5" stroke="#333333" stroke-width="0.5"/><text x="-4" y="37" font-size="6.5" fill="#333333" text-anchor="end">60</text><line x1="-3" y1="0" x2="0" y2="0" stroke="#333333" stroke-width="0.5"/><rect x="2.83" y="37.95" width="11.33" height="65.55" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="21.83" y="31.05" width="11.33" height="72.45" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="40.83" y="36.8" width="11.33" height="66.7" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="59.83" y="29.9" width="11.33" height="73.6" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="78.83" y="24.15" width="11.33" height="79.35" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="97.83" y="21.85" width="11.33" height="81.65" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="116.83" y="25.3" width="11.33" height="78.2" fill="url(#hm-thumb-basic-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="135.83" y="27.6" width="11.33" height="75.9" fill="url(#hm-thumb-basic-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="154.83" y="20.7" width="11.33" height="82.8" fill="url(#hm-thumb-basic-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="173.83" y="17.25" width="11.33" height="86.25" fill="url(#hm-thumb-basic-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="192.83" y="18.4" width="11.33" height="85.1" fill="url(#hm-thumb-basic-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="211.83" y="10.35" width="11.33" height="93.15" fill="url(#hm-thumb-basic-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="103.5" x2="226" y2="103.5" stroke="#333333" stroke-width="0.75"/><text x="8.5" y="35.95" font-size="6" fill="#333333" text-anchor="middle">57</text><text x="27.5" y="29.05" font-size="6" fill="#333333" text-anchor="middle">63</text><text x="46.5" y="34.8" font-size="6" fill="#333333" text-anchor="middle">58</text><text x="65.5" y="27.9" font-size="6" fill="#333333" text-anchor="middle">64</text><text x="84.5" y="22.15" font-size="6" fill="#333333" text-anchor="middle">69</text><text x="103.5" y="19.85" font-size="6" fill="#333333" text-anchor="middle">71</text><text x="122.5" y="23.3" font-size="6" fill="#333333" text-anchor="middle">68</text><text x="141.5" y="25.6" font-size="6" fill="#333333" text-anchor="middle">66</text><text x="160.5" y="18.7" font-size="6" fill="#333333" text-anchor="middle">72</text><text x="179.5" y="15.25" font-size="6" fill="#333333" text-anchor="middle">75</text><text x="198.5" y="16.4" font-size="6" fill="#333333" text-anchor="middle">74</text><text x="217.5" y="8.35" font-size="6" fill="#333333" text-anchor="middle">81</text><text x="8.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jan</text><text x="27.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Feb</text><text x="46.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Mar</text><text x="65.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Apr</text><text x="84.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">May</text><text x="103.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jun</text><text x="122.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jul</text><text x="141.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Aug</text><text x="160.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Sep</text><text x="179.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Oct</text><text x="198.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Nov</text><text x="217.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Dec</text></g></svg>`
    },
    {
      "group": "Time \u2014 level",
      "id": "basic-line",
      "label": "Line \u2014 many periods",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark basic-line</desc><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="17.240000000000002" y="7.5" font-size="7.5" fill="#333333"><tspan x="17.240000000000002" dy="0">Alpha Corporation</tspan><tspan x="17.240000000000002" dy="10"><tspan font-weight="600">Net sales </tspan>in mEUR</tspan><tspan x="17.240000000000002" dy="10">2026 AC&amp;FC and PL</tspan></text><text x="26" y="43.5" font-size="7.5" fill="#333333" text-anchor="end">mEUR</text><g transform="translate(28,44.5)"><line x1="0" y1="103.5" x2="226" y2="103.5" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="69" x2="226" y2="69" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="34.5" x2="226" y2="34.5" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="226" y2="0" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="0" y2="103.5" stroke="#333333" stroke-width="0.75"/><line x1="-3" y1="103.5" x2="0" y2="103.5" stroke="#333333" stroke-width="0.5"/><text x="-4" y="106" font-size="6.5" fill="#333333" text-anchor="end">0</text><line x1="-3" y1="69" x2="0" y2="69" stroke="#333333" stroke-width="0.5"/><text x="-4" y="71.5" font-size="6.5" fill="#333333" text-anchor="end">30</text><line x1="-3" y1="34.5" x2="0" y2="34.5" stroke="#333333" stroke-width="0.5"/><text x="-4" y="37" font-size="6.5" fill="#333333" text-anchor="end">60</text><line x1="-3" y1="0" x2="0" y2="0" stroke="#333333" stroke-width="0.5"/><line x1="8.5" y1="37.95" x2="27.5" y2="31.05" stroke="#333333" stroke-width="2.4" stroke-linecap="round"/><line x1="27.5" y1="31.05" x2="46.5" y2="36.8" stroke="#333333" stroke-width="2.4" stroke-linecap="round"/><line x1="46.5" y1="36.8" x2="65.5" y2="29.9" stroke="#333333" stroke-width="2.4" stroke-linecap="round"/><line x1="65.5" y1="29.9" x2="84.5" y2="24.15" stroke="#333333" stroke-width="2.4" stroke-linecap="round"/><line x1="84.5" y1="24.15" x2="103.5" y2="21.85" stroke="#333333" stroke-width="2.4" stroke-linecap="round"/><line x1="103.5" y1="21.85" x2="122.5" y2="25.3" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="122.5" y1="25.3" x2="141.5" y2="27.6" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="141.5" y1="27.6" x2="160.5" y2="20.7" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="160.5" y1="20.7" x2="179.5" y2="17.25" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="179.5" y1="17.25" x2="198.5" y2="18.4" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="198.5" y1="18.4" x2="217.5" y2="10.35" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="8.5" y1="34.5" x2="27.5" y2="34.5" stroke="#333333" stroke-width="2.4" stroke-dasharray="6,3" stroke-linecap="round"/><line x1="27.5" y1="34.5" x2="46.5" y2="32.2" stroke="#333333" stroke-width="2.4" stroke-dasharray="6,3" stroke-linecap="round"/><line x1="46.5" y1="32.2" x2="65.5" y2="32.2" stroke="#333333" stroke-width="2.4" stroke-dasharray="6,3" stroke-linecap="round"/><line x1="65.5" y1="32.2" x2="84.5" y2="29.9" stroke="#333333" stroke-width="2.4" stroke-dasharray="6,3" stroke-linecap="round"/><line x1="84.5" y1="29.9" x2="103.5" y2="29.9" stroke="#333333" stroke-width="2.4" stroke-dasharray="6,3" stroke-linecap="round"/><line x1="103.5" y1="29.9" x2="122.5" y2="27.6" stroke="#333333" stroke-width="2.4" stroke-dasharray="6,3" stroke-linecap="round"/><line x1="122.5" y1="27.6" x2="141.5" y2="27.6" stroke="#333333" stroke-width="2.4" stroke-dasharray="6,3" stroke-linecap="round"/><line x1="141.5" y1="27.6" x2="160.5" y2="25.3" stroke="#333333" stroke-width="2.4" stroke-dasharray="6,3" stroke-linecap="round"/><line x1="160.5" y1="25.3" x2="179.5" y2="25.3" stroke="#333333" stroke-width="2.4" stroke-dasharray="6,3" stroke-linecap="round"/><line x1="179.5" y1="25.3" x2="198.5" y2="23" stroke="#333333" stroke-width="2.4" stroke-dasharray="6,3" stroke-linecap="round"/><line x1="198.5" y1="23" x2="217.5" y2="23" stroke="#333333" stroke-width="2.4" stroke-dasharray="6,3" stroke-linecap="round"/><line x1="0" y1="103.5" x2="226" y2="103.5" stroke="#333333" stroke-width="0.75"/><text x="8.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jan</text><text x="27.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Feb</text><text x="46.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Mar</text><text x="65.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Apr</text><text x="84.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">May</text><text x="103.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jun</text><text x="122.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jul</text><text x="141.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Aug</text><text x="160.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Sep</text><text x="179.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Oct</text><text x="198.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Nov</text><text x="217.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Dec</text></g></svg>`
    },
    {
      "group": "Time \u2014 level",
      "id": "basic-area",
      "label": "Area \u2014 solid actuals, hatched forecast",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark basic-area</desc><defs><pattern id="hm-thumb-basic-area-hatch-0" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#333333" stroke-width="1.5"/></pattern></defs><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="17.240000000000002" y="7.5" font-size="7.5" fill="#333333"><tspan x="17.240000000000002" dy="0">Alpha Corporation</tspan><tspan x="17.240000000000002" dy="10"><tspan font-weight="600">Net sales </tspan>in mEUR</tspan><tspan x="17.240000000000002" dy="10">2026 AC&amp;FC</tspan></text><text x="26" y="43.5" font-size="7.5" fill="#333333" text-anchor="end">mEUR</text><g transform="translate(28,44.5)"><line x1="0" y1="103.5" x2="226" y2="103.5" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="69" x2="226" y2="69" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="34.5" x2="226" y2="34.5" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="226" y2="0" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="0" y2="103.5" stroke="#333333" stroke-width="0.75"/><line x1="-3" y1="103.5" x2="0" y2="103.5" stroke="#333333" stroke-width="0.5"/><text x="-4" y="106" font-size="6.5" fill="#333333" text-anchor="end">0</text><line x1="-3" y1="69" x2="0" y2="69" stroke="#333333" stroke-width="0.5"/><text x="-4" y="71.5" font-size="6.5" fill="#333333" text-anchor="end">30</text><line x1="-3" y1="34.5" x2="0" y2="34.5" stroke="#333333" stroke-width="0.5"/><text x="-4" y="37" font-size="6.5" fill="#333333" text-anchor="end">60</text><line x1="-3" y1="0" x2="0" y2="0" stroke="#333333" stroke-width="0.5"/><path d="M 8.5 37.95 L 27.5 31.05000000000001 L 27.5 103.5 L 8.5 103.5 Z" fill="#333333" fill-opacity="0.9" stroke="none"/><path d="M 27.5 31.05000000000001 L 46.5 36.8 L 46.5 103.5 L 27.5 103.5 Z" fill="#333333" fill-opacity="0.9" stroke="none"/><path d="M 46.5 36.8 L 65.5 29.89999999999999 L 65.5 103.5 L 46.5 103.5 Z" fill="#333333" fill-opacity="0.9" stroke="none"/><path d="M 65.5 29.89999999999999 L 84.5 24.14999999999999 L 84.5 103.5 L 65.5 103.5 Z" fill="#333333" fill-opacity="0.9" stroke="none"/><path d="M 84.5 24.14999999999999 L 103.5 21.85000000000001 L 103.5 103.5 L 84.5 103.5 Z" fill="#333333" fill-opacity="0.9" stroke="none"/><path d="M 103.5 21.85000000000001 L 122.5 25.299999999999997 L 122.5 103.5 L 103.5 103.5 Z" fill="url(#hm-thumb-basic-area-hatch-0)" fill-opacity="1" stroke="none"/><path d="M 122.5 25.299999999999997 L 141.5 27.60000000000001 L 141.5 103.5 L 122.5 103.5 Z" fill="url(#hm-thumb-basic-area-hatch-0)" fill-opacity="1" stroke="none"/><path d="M 141.5 27.60000000000001 L 160.5 20.69999999999999 L 160.5 103.5 L 141.5 103.5 Z" fill="url(#hm-thumb-basic-area-hatch-0)" fill-opacity="1" stroke="none"/><path d="M 160.5 20.69999999999999 L 179.5 17.25 L 179.5 103.5 L 160.5 103.5 Z" fill="url(#hm-thumb-basic-area-hatch-0)" fill-opacity="1" stroke="none"/><path d="M 179.5 17.25 L 198.5 18.400000000000006 L 198.5 103.5 L 179.5 103.5 Z" fill="url(#hm-thumb-basic-area-hatch-0)" fill-opacity="1" stroke="none"/><path d="M 198.5 18.400000000000006 L 217.5 10.349999999999994 L 217.5 103.5 L 198.5 103.5 Z" fill="url(#hm-thumb-basic-area-hatch-0)" fill-opacity="1" stroke="none"/><line x1="8.5" y1="37.95" x2="27.5" y2="31.05" stroke="#333333" stroke-width="2.4" stroke-linecap="round"/><line x1="27.5" y1="31.05" x2="46.5" y2="36.8" stroke="#333333" stroke-width="2.4" stroke-linecap="round"/><line x1="46.5" y1="36.8" x2="65.5" y2="29.9" stroke="#333333" stroke-width="2.4" stroke-linecap="round"/><line x1="65.5" y1="29.9" x2="84.5" y2="24.15" stroke="#333333" stroke-width="2.4" stroke-linecap="round"/><line x1="84.5" y1="24.15" x2="103.5" y2="21.85" stroke="#333333" stroke-width="2.4" stroke-linecap="round"/><line x1="103.5" y1="21.85" x2="122.5" y2="25.3" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="122.5" y1="25.3" x2="141.5" y2="27.6" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="141.5" y1="27.6" x2="160.5" y2="20.7" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="160.5" y1="20.7" x2="179.5" y2="17.25" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="179.5" y1="17.25" x2="198.5" y2="18.4" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="198.5" y1="18.4" x2="217.5" y2="10.35" stroke="#333333" stroke-width="2.4" stroke-dasharray="4,2" stroke-linecap="round"/><line x1="0" y1="103.5" x2="226" y2="103.5" stroke="#333333" stroke-width="0.75"/><text x="8.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jan</text><text x="27.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Feb</text><text x="46.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Mar</text><text x="65.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Apr</text><text x="84.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">May</text><text x="103.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jun</text><text x="122.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jul</text><text x="141.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Aug</text><text x="160.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Sep</text><text x="179.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Oct</text><text x="198.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Nov</text><text x="217.5" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Dec</text></g></svg>`
    },
    {
      "group": "Time \u2014 level",
      "id": "waterfall-column",
      "label": "Waterfall \u2014 cumulative build (dark: measure, not variance)",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark waterfall-column</desc><defs><pattern id="hm-thumb-waterfall-column-hatch-0" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#333333" stroke-width="1.5"/></pattern></defs><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="13.86" y="7.5" font-size="7.5" fill="#333333"><tspan x="13.86" dy="0">Alpha Corporation</tspan><tspan x="13.86" dy="10"><tspan font-weight="600">Net sales build </tspan>in mEUR</tspan><tspan x="13.86" dy="10">2026 AC&amp;FC</tspan></text><text x="26" y="43.5" font-size="7.5" fill="#333333" text-anchor="end">mEUR</text><g transform="translate(28,44.5)"><line x1="0" y1="103.5" x2="226" y2="103.5" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="77.63" x2="226" y2="77.63" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="51.75" x2="226" y2="51.75" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="25.88" x2="226" y2="25.88" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="226" y2="0" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="0" y2="103.5" stroke="#333333" stroke-width="0.75"/><line x1="-3" y1="103.5" x2="0" y2="103.5" stroke="#333333" stroke-width="0.5"/><text x="-4" y="106" font-size="6.5" fill="#333333" text-anchor="end">0</text><line x1="-3" y1="77.63" x2="0" y2="77.63" stroke="#333333" stroke-width="0.5"/><text x="-4" y="80.13" font-size="6.5" fill="#333333" text-anchor="end">215</text><line x1="-3" y1="51.75" x2="0" y2="51.75" stroke="#333333" stroke-width="0.5"/><text x="-4" y="54.25" font-size="6.5" fill="#333333" text-anchor="end">429</text><line x1="-3" y1="25.88" x2="0" y2="25.88" stroke="#333333" stroke-width="0.5"/><text x="-4" y="28.38" font-size="6.5" fill="#333333" text-anchor="end">644</text><line x1="-3" y1="0" x2="0" y2="0" stroke="#333333" stroke-width="0.5"/><rect x="2.59" y="96.63" width="10.36" height="6.87" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="12.95" y1="96.63" x2="30.49" y2="96.63" stroke="#333333" stroke-width="0.5"/><rect x="20.13" y="89.04" width="10.36" height="7.59" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="30.49" y1="89.04" x2="48.03" y2="89.04" stroke="#333333" stroke-width="0.5"/><rect x="37.67" y="82.05" width="10.36" height="6.99" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="48.03" y1="82.05" x2="65.56" y2="82.05" stroke="#333333" stroke-width="0.5"/><rect x="55.21" y="74.34" width="10.36" height="7.71" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="65.56" y1="74.34" x2="83.1" y2="74.34" stroke="#333333" stroke-width="0.5"/><rect x="72.74" y="66.02" width="10.36" height="8.31" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="83.1" y1="66.02" x2="100.64" y2="66.02" stroke="#333333" stroke-width="0.5"/><rect x="90.28" y="57.47" width="10.36" height="8.56" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="100.64" y1="57.47" x2="118.18" y2="57.47" stroke="#333333" stroke-width="0.5"/><rect x="107.82" y="49.27" width="10.36" height="8.19" fill="url(#hm-thumb-waterfall-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><line x1="118.18" y1="49.27" x2="135.72" y2="49.27" stroke="#333333" stroke-width="0.5"/><rect x="125.36" y="41.32" width="10.36" height="7.95" fill="url(#hm-thumb-waterfall-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><line x1="135.72" y1="41.32" x2="153.26" y2="41.32" stroke="#333333" stroke-width="0.5"/><rect x="142.9" y="32.64" width="10.36" height="8.68" fill="url(#hm-thumb-waterfall-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><line x1="153.26" y1="32.64" x2="170.79" y2="32.64" stroke="#333333" stroke-width="0.5"/><rect x="160.44" y="23.61" width="10.36" height="9.04" fill="url(#hm-thumb-waterfall-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><line x1="170.79" y1="23.61" x2="188.33" y2="23.61" stroke="#333333" stroke-width="0.5"/><rect x="177.97" y="14.69" width="10.36" height="8.92" fill="url(#hm-thumb-waterfall-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><line x1="188.33" y1="14.69" x2="205.87" y2="14.69" stroke="#333333" stroke-width="0.5"/><rect x="195.51" y="4.93" width="10.36" height="9.76" fill="url(#hm-thumb-waterfall-column-hatch-0)" stroke="#333333" stroke-width="0.5"/><line x1="205.87" y1="4.93" x2="223.41" y2="4.93" stroke="#333333" stroke-width="0.5"/><rect x="213.05" y="4.93" width="10.36" height="98.57" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="103.5" x2="226" y2="103.5" stroke="#333333" stroke-width="0.75"/><text x="7.77" y="94.63" font-size="6" fill="#333333" text-anchor="middle">+57</text><text x="25.31" y="87.04" font-size="6" fill="#333333" text-anchor="middle">+63</text><text x="42.85" y="80.05" font-size="6" fill="#333333" text-anchor="middle">+58</text><text x="60.38" y="72.34" font-size="6" fill="#333333" text-anchor="middle">+64</text><text x="77.92" y="64.02" font-size="6" fill="#333333" text-anchor="middle">+69</text><text x="95.46" y="55.47" font-size="6" fill="#333333" text-anchor="middle">+71</text><text x="113" y="47.27" font-size="6" fill="#333333" text-anchor="middle">+68</text><text x="130.54" y="39.32" font-size="6" fill="#333333" text-anchor="middle">+66</text><text x="148.08" y="30.64" font-size="6" fill="#333333" text-anchor="middle">+72</text><text x="165.62" y="21.61" font-size="6" fill="#333333" text-anchor="middle">+75</text><text x="183.15" y="12.69" font-size="6" fill="#333333" text-anchor="middle">+74</text><text x="200.69" y="2.93" font-size="6" fill="#333333" text-anchor="middle">+81</text><text x="218.23" y="2.93" font-size="6" fill="#333333" text-anchor="middle">818</text><text x="7.77" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jan</text><text x="25.31" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Feb</text><text x="42.85" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Mar</text><text x="60.38" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Apr</text><text x="77.92" y="113" font-size="6.5" fill="#333333" text-anchor="middle">May</text><text x="95.46" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jun</text><text x="113" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jul</text><text x="130.54" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Aug</text><text x="148.08" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Sep</text><text x="165.62" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Oct</text><text x="183.15" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Nov</text><text x="200.69" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Dec</text><text x="218.23" y="113" font-size="6.5" fill="#333333" text-anchor="middle">\u03A3</text></g></svg>`
    },
    {
      "group": "Time \u2014 vs baseline",
      "id": "absolute-variance-column",
      "label": "Absolute variance \u2014 \u0394 columns",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark absolute-variance-column</desc><defs><pattern id="hm-thumb-absolute-variance-column-hatch-desirable" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#89B54A" stroke-width="1.5"/></pattern><pattern id="hm-thumb-absolute-variance-column-hatch-neutral" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#0066CC" stroke-width="1.5"/></pattern></defs><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="0" y="7.5" font-size="7.5" fill="#333333"><tspan x="0" dy="0">Alpha Corporation</tspan><tspan x="0" dy="10"><tspan font-weight="600">Net sales \u0394PL </tspan>in mEUR</tspan><tspan x="0" dy="10">2026 AC&amp;FC and PL</tspan></text><g transform="translate(2,36)"><rect x="3.19" y="56" width="12.78" height="13.75" fill="#E2001A"/><rect x="24.36" y="42.25" width="12.78" height="13.75" fill="#89B54A"/><rect x="45.53" y="56" width="12.78" height="18.33" fill="#E2001A"/><rect x="66.69" y="46.84" width="12.78" height="9.16" fill="#89B54A"/><rect x="87.86" y="33.09" width="12.78" height="22.91" fill="#89B54A"/><rect x="109.03" y="23.93" width="12.78" height="32.07" fill="#89B54A"/><rect x="130.19" y="46.84" width="12.78" height="9.16" fill="url(#hm-thumb-absolute-variance-column-hatch-desirable)" stroke="#89B54A" stroke-width="0.5"/><rect x="151.36" y="56" width="12.78" height="0" fill="url(#hm-thumb-absolute-variance-column-hatch-neutral)" stroke="#0066CC" stroke-width="0.5"/><rect x="172.53" y="37.67" width="12.78" height="18.33" fill="url(#hm-thumb-absolute-variance-column-hatch-desirable)" stroke="#89B54A" stroke-width="0.5"/><rect x="193.69" y="23.93" width="12.78" height="32.07" fill="url(#hm-thumb-absolute-variance-column-hatch-desirable)" stroke="#89B54A" stroke-width="0.5"/><rect x="214.86" y="37.67" width="12.78" height="18.33" fill="url(#hm-thumb-absolute-variance-column-hatch-desirable)" stroke="#89B54A" stroke-width="0.5"/><rect x="236.03" y="5.6" width="12.78" height="50.4" fill="url(#hm-thumb-absolute-variance-column-hatch-desirable)" stroke="#89B54A" stroke-width="0.5"/><line x1="0" y1="55.1" x2="252" y2="55.1" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="56.9" x2="252" y2="56.9" stroke="#333333" stroke-width="0.5"/><text x="9.58" y="76.75" font-size="6" fill="#333333" text-anchor="middle">\u22123</text><text x="30.75" y="40.25" font-size="6" fill="#333333" text-anchor="middle">+3</text><text x="51.92" y="81.33" font-size="6" fill="#333333" text-anchor="middle">\u22124</text><text x="73.08" y="44.84" font-size="6" fill="#333333" text-anchor="middle">+2</text><text x="94.25" y="31.09" font-size="6" fill="#333333" text-anchor="middle">+5</text><text x="115.42" y="21.93" font-size="6" fill="#333333" text-anchor="middle">+7</text><text x="136.58" y="44.84" font-size="6" fill="#333333" text-anchor="middle">+2</text><text x="157.75" y="54" font-size="6" fill="#333333" text-anchor="middle">0</text><text x="178.92" y="35.67" font-size="6" fill="#333333" text-anchor="middle">+4</text><text x="200.08" y="21.93" font-size="6" fill="#333333" text-anchor="middle">+7</text><text x="221.25" y="35.67" font-size="6" fill="#333333" text-anchor="middle">+4</text><text x="242.42" y="3.6" font-size="6" fill="#333333" text-anchor="middle">+11</text><text x="9.58" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Jan</text><text x="30.75" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Feb</text><text x="51.92" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Mar</text><text x="73.08" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Apr</text><text x="94.25" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">May</text><text x="115.42" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Jun</text><text x="136.58" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Jul</text><text x="157.75" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Aug</text><text x="178.92" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Sep</text><text x="200.08" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Oct</text><text x="221.25" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Nov</text><text x="242.42" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Dec</text></g></svg>`
    },
    {
      "group": "Time \u2014 vs baseline",
      "id": "relative-variance-pins",
      "label": "Relative variance \u2014 \u0394% pins",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark relative-variance-pins</desc><defs><pattern id="hm-thumb-relative-variance-pins-hatch-0" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#333333" stroke-width="1.5"/></pattern></defs><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="0" y="7.5" font-size="7.5" fill="#333333"><tspan x="0" dy="0">Alpha Corporation</tspan><tspan x="0" dy="10"><tspan font-weight="600">Net sales \u0394PL%</tspan></tspan><tspan x="0" dy="10">2026 AC&amp;FC and PL</tspan></text><g transform="translate(2,36)"><rect x="9.07" y="56" width="1.02" height="14.69" fill="#E2001A"/><rect x="8.08" y="69.19" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="30.24" y="41.31" width="1.02" height="14.69" fill="#89B54A"/><rect x="29.25" y="39.81" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="51.41" y="56" width="1.02" height="18.96" fill="#E2001A"/><rect x="50.42" y="73.46" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="72.57" y="46.52" width="1.02" height="9.48" fill="#89B54A"/><rect x="71.58" y="45.02" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="93.74" y="33.04" width="1.02" height="22.96" fill="#89B54A"/><rect x="92.75" y="31.54" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="114.91" y="23.86" width="1.02" height="32.14" fill="#89B54A"/><rect x="113.92" y="22.36" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="136.07" y="47.09" width="1.02" height="8.91" fill="#89B54A"/><rect x="135.08" y="45.59" width="3" height="3" fill="url(#hm-thumb-relative-variance-pins-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="156.25" y="54.5" width="3" height="3" fill="url(#hm-thumb-relative-variance-pins-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="178.41" y="38.71" width="1.02" height="17.29" fill="#89B54A"/><rect x="177.42" y="37.21" width="3" height="3" fill="url(#hm-thumb-relative-variance-pins-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="199.57" y="25.75" width="1.02" height="30.25" fill="#89B54A"/><rect x="198.58" y="24.25" width="3" height="3" fill="url(#hm-thumb-relative-variance-pins-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="220.74" y="39.21" width="1.02" height="16.79" fill="#89B54A"/><rect x="219.75" y="37.71" width="3" height="3" fill="url(#hm-thumb-relative-variance-pins-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="241.91" y="9.82" width="1.02" height="46.18" fill="#89B54A"/><rect x="240.92" y="8.32" width="3" height="3" fill="url(#hm-thumb-relative-variance-pins-hatch-0)" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="55.1" x2="252" y2="55.1" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="56.9" x2="252" y2="56.9" stroke="#333333" stroke-width="0.5"/><text x="9.58" y="78.51" font-size="6" fill="#333333" text-anchor="middle">\u22125%</text><text x="30.75" y="37.81" font-size="6" fill="#333333" text-anchor="middle">+5%</text><text x="51.92" y="82.78" font-size="6" fill="#333333" text-anchor="middle">\u22126%</text><text x="73.08" y="43.02" font-size="6" fill="#333333" text-anchor="middle">+3%</text><text x="94.25" y="29.54" font-size="6" fill="#333333" text-anchor="middle">+8%</text><text x="115.42" y="20.36" font-size="6" fill="#333333" text-anchor="middle">+11%</text><text x="136.58" y="43.59" font-size="6" fill="#333333" text-anchor="middle">+3%</text><text x="157.75" y="52.5" font-size="6" fill="#333333" text-anchor="middle">0%</text><text x="178.92" y="35.21" font-size="6" fill="#333333" text-anchor="middle">+6%</text><text x="200.08" y="22.25" font-size="6" fill="#333333" text-anchor="middle">+10%</text><text x="221.25" y="35.71" font-size="6" fill="#333333" text-anchor="middle">+6%</text><text x="242.42" y="6.32" font-size="6" fill="#333333" text-anchor="middle">+16%</text><text x="9.58" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Jan</text><text x="30.75" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Feb</text><text x="51.92" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Mar</text><text x="73.08" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Apr</text><text x="94.25" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">May</text><text x="115.42" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Jun</text><text x="136.58" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Jul</text><text x="157.75" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Aug</text><text x="178.92" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Sep</text><text x="200.08" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Oct</text><text x="221.25" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Nov</text><text x="242.42" y="121.5" font-size="6.5" fill="#333333" text-anchor="middle">Dec</text></g></svg>`
    },
    {
      "group": "Time \u2014 vs baseline",
      "id": "column-with-variance",
      "label": "Report chart \u2014 \u0394% + \u0394 tiers over columns",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark column-with-variance</desc><defs><pattern id="hm-thumb-column-with-variance-hatch-0" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#333333" stroke-width="1.5"/></pattern><pattern id="hm-thumb-column-with-variance-hatch-1" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#89B54A" stroke-width="1.5"/></pattern></defs><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="17.240000000000002" y="7.5" font-size="7.5" fill="#333333"><tspan x="17.240000000000002" dy="0">Alpha Corporation</tspan><tspan x="17.240000000000002" dy="10"><tspan font-weight="600">Net sales </tspan>in mEUR</tspan><tspan x="17.240000000000002" dy="10">2026 AC&amp;FC and PL</tspan></text><text x="26" y="43.5" font-size="7.5" fill="#333333" text-anchor="end">mEUR</text><g transform="translate(28,44.5)"><g transform="translate(0,0)"><text x="-3" y="5.5" font-size="5.5" fill="#333333" text-anchor="end">\u0394PL%</text><rect x="8" y="11.39" width="1" height="2.51" fill="#E2001A"/><rect x="7" y="12.39" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="27" y="8.88" width="1" height="2.51" fill="#89B54A"/><rect x="26" y="7.38" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="46" y="11.39" width="1" height="3.24" fill="#E2001A"/><rect x="45" y="13.12" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="65" y="9.77" width="1" height="1.62" fill="#89B54A"/><rect x="64" y="8.27" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="84" y="7.46" width="1" height="3.92" fill="#89B54A"/><rect x="83" y="5.96" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="103" y="5.9" width="1" height="5.49" fill="#89B54A"/><rect x="102" y="4.4" width="3" height="3" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="122" y="9.86" width="1" height="1.52" fill="#89B54A"/><rect x="121" y="8.36" width="3" height="3" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="140" y="9.89" width="3" height="3" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="160" y="8.43" width="1" height="2.95" fill="#89B54A"/><rect x="159" y="6.93" width="3" height="3" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="179" y="6.22" width="1" height="5.17" fill="#89B54A"/><rect x="178" y="4.72" width="3" height="3" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="198" y="8.52" width="1" height="2.87" fill="#89B54A"/><rect x="197" y="7.02" width="3" height="3" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="217" y="3.5" width="1" height="7.89" fill="#89B54A"/><rect x="216" y="2" width="3" height="3" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="10.49" x2="226" y2="10.49" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="12.29" x2="226" y2="12.29" stroke="#333333" stroke-width="0.5"/></g><g transform="translate(0,27.77)"><text x="-3" y="5.5" font-size="5.5" fill="#333333" text-anchor="end">\u0394PL</text><rect x="2.83" y="11.39" width="11.33" height="1.21" fill="#E2001A"/><text x="8.5" y="18.55" font-size="5.5" fill="#333333" text-anchor="middle">\u22123</text><rect x="21.83" y="10.18" width="11.33" height="1.21" fill="#89B54A"/><text x="27.5" y="8.18" font-size="5.5" fill="#333333" text-anchor="middle">+3</text><rect x="40.83" y="11.39" width="11.33" height="1.61" fill="#E2001A"/><text x="46.5" y="18.95" font-size="5.5" fill="#333333" text-anchor="middle">\u22124</text><rect x="59.83" y="10.58" width="11.33" height="0.8" fill="#89B54A"/><text x="65.5" y="8.58" font-size="5.5" fill="#333333" text-anchor="middle">+2</text><rect x="78.83" y="9.37" width="11.33" height="2.01" fill="#89B54A"/><text x="84.5" y="7.37" font-size="5.5" fill="#333333" text-anchor="middle">+5</text><rect x="97.83" y="8.57" width="11.33" height="2.82" fill="#89B54A"/><text x="103.5" y="6.57" font-size="5.5" fill="#333333" text-anchor="middle">+7</text><rect x="116.83" y="10.58" width="11.33" height="0.8" fill="url(#hm-thumb-column-with-variance-hatch-1)" stroke="#89B54A" stroke-width="0.5"/><text x="122.5" y="8.58" font-size="5.5" fill="#333333" text-anchor="middle">+2</text><text x="141.5" y="9.39" font-size="5.5" fill="#333333" text-anchor="middle">0</text><rect x="154.83" y="9.78" width="11.33" height="1.61" fill="url(#hm-thumb-column-with-variance-hatch-1)" stroke="#89B54A" stroke-width="0.5"/><text x="160.5" y="7.78" font-size="5.5" fill="#333333" text-anchor="middle">+4</text><rect x="173.83" y="8.57" width="11.33" height="2.82" fill="url(#hm-thumb-column-with-variance-hatch-1)" stroke="#89B54A" stroke-width="0.5"/><text x="179.5" y="6.57" font-size="5.5" fill="#333333" text-anchor="middle">+7</text><rect x="192.83" y="9.78" width="11.33" height="1.61" fill="url(#hm-thumb-column-with-variance-hatch-1)" stroke="#89B54A" stroke-width="0.5"/><text x="198.5" y="7.78" font-size="5.5" fill="#333333" text-anchor="middle">+4</text><rect x="211.83" y="6.96" width="11.33" height="4.43" fill="url(#hm-thumb-column-with-variance-hatch-1)" stroke="#89B54A" stroke-width="0.5"/><text x="217.5" y="4.96" font-size="5.5" fill="#333333" text-anchor="middle">+11</text><line x1="0" y1="10.49" x2="226" y2="10.49" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="12.29" x2="226" y2="12.29" stroke="#333333" stroke-width="0.5"/></g><g transform="translate(0,55.54)"><line x1="0" y1="47.96" x2="226" y2="47.96" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="31.97" x2="226" y2="31.97" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="15.99" x2="226" y2="15.99" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="226" y2="0" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="0" y2="47.96" stroke="#333333" stroke-width="0.75"/><line x1="-3" y1="47.96" x2="0" y2="47.96" stroke="#333333" stroke-width="0.5"/><text x="-4" y="50.46" font-size="6.5" fill="#333333" text-anchor="end">0</text><line x1="-3" y1="31.97" x2="0" y2="31.97" stroke="#333333" stroke-width="0.5"/><text x="-4" y="34.47" font-size="6.5" fill="#333333" text-anchor="end">30</text><line x1="-3" y1="15.99" x2="0" y2="15.99" stroke="#333333" stroke-width="0.5"/><text x="-4" y="18.49" font-size="6.5" fill="#333333" text-anchor="end">60</text><line x1="-3" y1="0" x2="0" y2="0" stroke="#333333" stroke-width="0.5"/><rect x="2.83" y="17.59" width="11.33" height="30.37" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="21.83" y="14.39" width="11.33" height="33.57" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="40.83" y="17.05" width="11.33" height="30.91" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="59.83" y="13.86" width="11.33" height="34.1" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="78.83" y="11.19" width="11.33" height="36.77" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="97.83" y="10.12" width="11.33" height="37.84" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="116.83" y="11.72" width="11.33" height="36.24" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="135.83" y="12.79" width="11.33" height="35.17" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="154.83" y="9.59" width="11.33" height="38.37" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="173.83" y="7.99" width="11.33" height="39.97" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="192.83" y="8.53" width="11.33" height="39.43" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><rect x="211.83" y="4.8" width="11.33" height="43.16" fill="url(#hm-thumb-column-with-variance-hatch-0)" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="47.96" x2="226" y2="47.96" stroke="#333333" stroke-width="0.75"/><text x="8.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">Jan</text><text x="27.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">Feb</text><text x="46.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">Mar</text><text x="65.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">Apr</text><text x="84.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">May</text><text x="103.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">Jun</text><text x="122.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">Jul</text><text x="141.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">Aug</text><text x="160.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">Sep</text><text x="179.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">Oct</text><text x="198.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">Nov</text><text x="217.5" y="57.46" font-size="6.5" fill="#333333" text-anchor="middle">Dec</text></g></g></svg>`
    },
    {
      "group": "Time \u2014 vs baseline",
      "id": "contribution-waterfall",
      "label": "Bridge \u2014 baseline to actual (green/red steps)",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark contribution-waterfall</desc><defs><pattern id="hm-thumb-contribution-waterfall-hatch-0" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#89B54A" stroke-width="1.5"/></pattern><pattern id="hm-thumb-contribution-waterfall-hatch-1" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#0066CC" stroke-width="1.5"/></pattern></defs><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="13.86" y="7.5" font-size="7.5" fill="#333333"><tspan x="13.86" dy="0">Alpha Corporation</tspan><tspan x="13.86" dy="10"><tspan font-weight="600">Net sales bridge </tspan>in mEUR</tspan><tspan x="13.86" dy="10">2026 PL to AC&amp;FC</tspan></text><text x="26" y="43.5" font-size="7.5" fill="#333333" text-anchor="end">mEUR</text><g transform="translate(28,44.5)"><line x1="0" y1="103.5" x2="226" y2="103.5" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="77.63" x2="226" y2="77.63" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="51.75" x2="226" y2="51.75" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="25.87" x2="226" y2="25.87" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="226" y2="0" stroke="#E5E7EB" stroke-width="0.25"/><line x1="0" y1="0" x2="0" y2="103.5" stroke="#333333" stroke-width="0.75"/><line x1="-3" y1="103.5" x2="0" y2="103.5" stroke="#333333" stroke-width="0.5"/><text x="-4" y="106" font-size="6.5" fill="#333333" text-anchor="end">759</text><line x1="-3" y1="77.63" x2="0" y2="77.63" stroke="#333333" stroke-width="0.5"/><text x="-4" y="80.13" font-size="6.5" fill="#333333" text-anchor="end">784</text><line x1="-3" y1="51.75" x2="0" y2="51.75" stroke="#333333" stroke-width="0.5"/><text x="-4" y="54.25" font-size="6.5" fill="#333333" text-anchor="end">809</text><line x1="-3" y1="25.87" x2="0" y2="25.87" stroke="#333333" stroke-width="0.5"/><text x="-4" y="28.37" font-size="6.5" fill="#333333" text-anchor="end">834</text><line x1="-3" y1="0" x2="0" y2="0" stroke="#333333" stroke-width="0.5"/><path d="M -4 98.5 l 8 -4" stroke="#FFFFFF" stroke-width="3.5" fill="none"/><path d="M -4 96.5 l 8 -4" stroke="#333333" stroke-width="0.6" fill="none"/><path d="M -4 100.5 l 8 -4" stroke="#333333" stroke-width="0.6" fill="none"/><rect x="2.38" y="81.91" width="9.52" height="21.59" fill="transparent" stroke="#333333" stroke-width="1.5"/><path d="M 0.3809523809523814 98.5 l 13.523809523809524 -4" stroke="#FFFFFF" stroke-width="3.5" fill="none"/><path d="M 0.3809523809523814 96.5 l 13.523809523809524 -4" stroke="#333333" stroke-width="0.6" fill="none"/><path d="M 0.3809523809523814 100.5 l 13.523809523809524 -4" stroke="#333333" stroke-width="0.6" fill="none"/><line x1="11.9" y1="81.91" x2="28.19" y2="81.91" stroke="#333333" stroke-width="0.5"/><rect x="18.67" y="81.91" width="9.52" height="3.11" fill="#E2001A"/><line x1="28.19" y1="85.02" x2="44.48" y2="85.02" stroke="#333333" stroke-width="0.5"/><rect x="34.95" y="81.91" width="9.52" height="3.11" fill="#89B54A"/><line x1="44.48" y1="81.91" x2="60.76" y2="81.91" stroke="#333333" stroke-width="0.5"/><rect x="51.24" y="81.91" width="9.52" height="4.15" fill="#E2001A"/><line x1="60.76" y1="86.06" x2="77.05" y2="86.06" stroke="#333333" stroke-width="0.5"/><rect x="67.52" y="83.98" width="9.52" height="2.08" fill="#89B54A"/><line x1="77.05" y1="83.98" x2="93.33" y2="83.98" stroke="#333333" stroke-width="0.5"/><rect x="83.81" y="78.79" width="9.52" height="5.19" fill="#89B54A"/><line x1="93.33" y1="78.79" x2="109.62" y2="78.79" stroke="#333333" stroke-width="0.5"/><rect x="100.1" y="71.53" width="9.52" height="7.27" fill="#89B54A"/><line x1="109.62" y1="71.53" x2="125.9" y2="71.53" stroke="#333333" stroke-width="0.5"/><rect x="116.38" y="69.45" width="9.52" height="2.08" fill="url(#hm-thumb-contribution-waterfall-hatch-0)" stroke="#89B54A" stroke-width="0.5"/><line x1="125.9" y1="69.45" x2="142.19" y2="69.45" stroke="#333333" stroke-width="0.5"/><rect x="132.67" y="69.45" width="9.52" height="0.5" fill="url(#hm-thumb-contribution-waterfall-hatch-1)" stroke="#0066CC" stroke-width="0.5"/><line x1="142.19" y1="69.45" x2="158.48" y2="69.45" stroke="#333333" stroke-width="0.5"/><rect x="148.95" y="65.3" width="9.52" height="4.15" fill="url(#hm-thumb-contribution-waterfall-hatch-0)" stroke="#89B54A" stroke-width="0.5"/><line x1="158.48" y1="65.3" x2="174.76" y2="65.3" stroke="#333333" stroke-width="0.5"/><rect x="165.24" y="58.03" width="9.52" height="7.27" fill="url(#hm-thumb-contribution-waterfall-hatch-0)" stroke="#89B54A" stroke-width="0.5"/><line x1="174.76" y1="58.03" x2="191.05" y2="58.03" stroke="#333333" stroke-width="0.5"/><rect x="181.52" y="53.88" width="9.52" height="4.15" fill="url(#hm-thumb-contribution-waterfall-hatch-0)" stroke="#89B54A" stroke-width="0.5"/><line x1="191.05" y1="53.88" x2="207.33" y2="53.88" stroke="#333333" stroke-width="0.5"/><rect x="197.81" y="42.46" width="9.52" height="11.42" fill="url(#hm-thumb-contribution-waterfall-hatch-0)" stroke="#89B54A" stroke-width="0.5"/><line x1="207.33" y1="42.46" x2="223.62" y2="42.46" stroke="#333333" stroke-width="0.5"/><rect x="214.1" y="42.46" width="9.52" height="61.04" fill="#333333" stroke="#333333" stroke-width="0.5"/><path d="M 212.09523809523807 98.5 l 13.523809523809524 -4" stroke="#FFFFFF" stroke-width="3.5" fill="none"/><path d="M 212.09523809523807 96.5 l 13.523809523809524 -4" stroke="#333333" stroke-width="0.6" fill="none"/><path d="M 212.09523809523807 100.5 l 13.523809523809524 -4" stroke="#333333" stroke-width="0.6" fill="none"/><line x1="0" y1="103.5" x2="226" y2="103.5" stroke="#333333" stroke-width="0.75"/><text x="7.14" y="79.91" font-size="6" fill="#333333" text-anchor="middle">780</text><text x="23.43" y="92.02" font-size="6" fill="#333333" text-anchor="middle">\u22123</text><text x="39.71" y="79.91" font-size="6" fill="#333333" text-anchor="middle">+3</text><text x="56" y="93.06" font-size="6" fill="#333333" text-anchor="middle">\u22124</text><text x="72.29" y="81.98" font-size="6" fill="#333333" text-anchor="middle">+2</text><text x="88.57" y="76.79" font-size="6" fill="#333333" text-anchor="middle">+5</text><text x="104.86" y="69.53" font-size="6" fill="#333333" text-anchor="middle">+7</text><text x="121.14" y="67.45" font-size="6" fill="#333333" text-anchor="middle">+2</text><text x="137.43" y="67.45" font-size="6" fill="#333333" text-anchor="middle">0</text><text x="153.71" y="63.3" font-size="6" fill="#333333" text-anchor="middle">+4</text><text x="170" y="56.03" font-size="6" fill="#333333" text-anchor="middle">+7</text><text x="186.29" y="51.88" font-size="6" fill="#333333" text-anchor="middle">+4</text><text x="202.57" y="40.46" font-size="6" fill="#333333" text-anchor="middle">+11</text><text x="218.86" y="40.46" font-size="6" fill="#333333" text-anchor="middle">818</text><text x="7.14" y="113" font-size="6.5" fill="#333333" text-anchor="middle">PL</text><text x="23.43" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jan</text><text x="39.71" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Feb</text><text x="56" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Mar</text><text x="72.29" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Apr</text><text x="88.57" y="113" font-size="6.5" fill="#333333" text-anchor="middle">May</text><text x="104.86" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jun</text><text x="121.14" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Jul</text><text x="137.43" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Aug</text><text x="153.71" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Sep</text><text x="170" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Oct</text><text x="186.29" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Nov</text><text x="202.57" y="113" font-size="6.5" fill="#333333" text-anchor="middle">Dec</text><text x="218.86" y="113" font-size="6.5" fill="#333333" text-anchor="middle">AC</text></g></svg>`
    },
    {
      "group": "Structure \u2014 categories",
      "id": "basic-bar",
      "label": "Bars \u2014 measure by category",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark basic-bar</desc><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="0" y="7.5" font-size="7.5" fill="#333333"><tspan x="0" dy="0">Alpha Corporation</tspan><tspan x="0" dy="10"><tspan font-weight="600">Net sales </tspan>in mEUR</tspan><tspan x="0" dy="10">2026 AC and PL</tspan></text><text x="252" y="43.5" font-size="7.5" fill="#333333" text-anchor="end">mEUR</text><g transform="translate(38,36)"><line x1="0" y1="0" x2="0" y2="112" stroke="#333333" stroke-width="0.75"/><rect x="0" y="3.47" width="186.09" height="6.93" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="0" y="10.4" width="173.1" height="6.93" fill="transparent" stroke="#333333" stroke-width="1.5"/><rect x="0" y="26.27" width="138.48" height="6.93" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="0" y="33.2" width="151.47" height="6.93" fill="transparent" stroke="#333333" stroke-width="1.5"/><rect x="0" y="49.07" width="101.7" height="6.93" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="0" y="56" width="97.37" height="6.93" fill="transparent" stroke="#333333" stroke-width="1.5"/><rect x="0" y="71.87" width="153.63" height="6.93" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="0" y="78.8" width="142.81" height="6.93" fill="transparent" stroke="#333333" stroke-width="1.5"/><rect x="0" y="94.67" width="60.59" height="6.93" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="0" y="101.6" width="73.57" height="6.93" fill="transparent" stroke="#333333" stroke-width="1.5"/><text x="189.09" y="8.93" font-size="6" fill="#333333" text-anchor="start">86</text><text x="176.1" y="15.87" font-size="6" fill="#333333" text-anchor="start">80</text><text x="141.48" y="31.73" font-size="6" fill="#333333" text-anchor="start">64</text><text x="154.47" y="38.67" font-size="6" fill="#333333" text-anchor="start">70</text><text x="104.7" y="54.53" font-size="6" fill="#333333" text-anchor="start">47</text><text x="100.37" y="61.47" font-size="6" fill="#333333" text-anchor="start">45</text><text x="156.63" y="77.33" font-size="6" fill="#333333" text-anchor="start">71</text><text x="145.81" y="84.27" font-size="6" fill="#333333" text-anchor="start">66</text><text x="63.59" y="100.13" font-size="6" fill="#333333" text-anchor="start">28</text><text x="76.57" y="107.07" font-size="6" fill="#333333" text-anchor="start">34</text><text x="-4" y="12.57" font-size="6.5" fill="#333333" text-anchor="end">North</text><text x="-4" y="35.37" font-size="6.5" fill="#333333" text-anchor="end">South</text><text x="-4" y="58.17" font-size="6.5" fill="#333333" text-anchor="end">East</text><text x="-4" y="80.97" font-size="6.5" fill="#333333" text-anchor="end">West</text><text x="-4" y="103.77" font-size="6.5" fill="#333333" text-anchor="end">Central</text></g></svg>`
    },
    {
      "group": "Structure \u2014 categories",
      "id": "absolute-variance-bar",
      "label": "\u0394 bars by category",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark absolute-variance-bar</desc><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="0" y="7.5" font-size="7.5" fill="#333333"><tspan x="0" dy="0">Alpha Corporation</tspan><tspan x="0" dy="10"><tspan font-weight="600">Net sales \u0394PL </tspan>in mEUR</tspan><tspan x="0" dy="10">2026 AC and PL</tspan></text><g transform="translate(38,36)"><rect x="107" y="3.47" width="96.3" height="13.87" fill="#89B54A"/><rect x="10.7" y="26.27" width="96.3" height="13.87" fill="#E2001A"/><rect x="107" y="49.07" width="32.1" height="13.87" fill="#89B54A"/><rect x="107" y="71.87" width="80.25" height="13.87" fill="#89B54A"/><rect x="10.7" y="94.67" width="96.3" height="13.87" fill="#E2001A"/><line x1="106.1" y1="0" x2="106.1" y2="112" stroke="#333333" stroke-width="0.5"/><line x1="107.9" y1="0" x2="107.9" y2="112" stroke="#333333" stroke-width="0.5"/><text x="207.3" y="12.4" font-size="6" fill="#333333" text-anchor="start">+6</text><text x="6.7" y="35.2" font-size="6" fill="#333333" text-anchor="end">\u22126</text><text x="143.1" y="58" font-size="6" fill="#333333" text-anchor="start">+2</text><text x="191.25" y="80.8" font-size="6" fill="#333333" text-anchor="start">+5</text><text x="6.7" y="103.6" font-size="6" fill="#333333" text-anchor="end">\u22126</text><text x="-4" y="12.57" font-size="6.5" fill="#333333" text-anchor="end">North</text><text x="-4" y="35.37" font-size="6.5" fill="#333333" text-anchor="end">South</text><text x="-4" y="58.17" font-size="6.5" fill="#333333" text-anchor="end">East</text><text x="-4" y="80.97" font-size="6.5" fill="#333333" text-anchor="end">West</text><text x="-4" y="103.77" font-size="6.5" fill="#333333" text-anchor="end">Central</text></g></svg>`
    },
    {
      "group": "Structure \u2014 categories",
      "id": "relative-variance-pins-bar",
      "label": "\u0394% pins by category",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark relative-variance-pins-bar</desc><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="0" y="7.5" font-size="7.5" fill="#333333"><tspan x="0" dy="0">Alpha Corporation</tspan><tspan x="0" dy="10"><tspan font-weight="600">Net sales \u0394PL%</tspan></tspan><tspan x="0" dy="10">2026 AC and PL</tspan></text><g transform="translate(38,36)"><rect x="107" y="9.85" width="38.2" height="1.11" fill="#89B54A"/><rect x="143.64" y="8.84" width="3.12" height="3.12" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="63.34" y="32.65" width="43.66" height="1.11" fill="#E2001A"/><rect x="61.78" y="31.64" width="3.12" height="3.12" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="107" y="55.45" width="22.64" height="1.11" fill="#89B54A"/><rect x="128.08" y="54.44" width="3.12" height="3.12" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="107" y="78.25" width="38.58" height="1.11" fill="#89B54A"/><rect x="144.02" y="77.24" width="3.12" height="3.12" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="17.12" y="101.05" width="89.88" height="1.11" fill="#E2001A"/><rect x="15.56" y="100.04" width="3.12" height="3.12" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="106.1" y1="0" x2="106.1" y2="112" stroke="#333333" stroke-width="0.5"/><line x1="107.9" y1="0" x2="107.9" y2="112" stroke="#333333" stroke-width="0.5"/><text x="149.2" y="12.4" font-size="6" fill="#333333" text-anchor="start">+8%</text><text x="59.34" y="35.2" font-size="6" fill="#333333" text-anchor="end">\u22129%</text><text x="133.64" y="58" font-size="6" fill="#333333" text-anchor="start">+4%</text><text x="149.58" y="80.8" font-size="6" fill="#333333" text-anchor="start">+8%</text><text x="13.12" y="103.6" font-size="6" fill="#333333" text-anchor="end">\u221218%</text><text x="-4" y="12.57" font-size="6.5" fill="#333333" text-anchor="end">North</text><text x="-4" y="35.37" font-size="6.5" fill="#333333" text-anchor="end">South</text><text x="-4" y="58.17" font-size="6.5" fill="#333333" text-anchor="end">East</text><text x="-4" y="80.97" font-size="6.5" fill="#333333" text-anchor="end">West</text><text x="-4" y="103.77" font-size="6.5" fill="#333333" text-anchor="end">Central</text></g></svg>`
    },
    {
      "group": "Grids & tables (pictures)",
      "id": "small-multiples-column",
      "label": "Small multiples \u2014 one panel per entity",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark small-multiples-column</desc><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="17.240000000000002" y="7.5" font-size="7.5" fill="#333333"><tspan x="17.240000000000002" dy="0">Alpha Corporation</tspan><tspan x="17.240000000000002" dy="10"><tspan font-weight="600">Net sales </tspan>in mEUR</tspan><tspan x="17.240000000000002" dy="10">2026 AC by region</tspan></text><text x="26" y="43.5" font-size="7.5" fill="#333333" text-anchor="end">mEUR</text><g transform="translate(28,44.5)"><g transform="translate(0,0)"><text x="0" y="7" font-size="6" font-weight="600" fill="#333333">North</text><rect x="2.69" y="21.56" width="10.78" height="24.19" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="20.86" y="18.1" width="10.78" height="27.65" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="39.03" y="20.41" width="10.78" height="25.34" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="57.19" y="15.8" width="10.78" height="29.95" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="75.36" y="14.64" width="10.78" height="31.11" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="93.53" y="12.34" width="10.78" height="33.41" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="45.75" x2="107" y2="45.75" stroke="#333333" stroke-width="0.75"/><text x="-3" y="47.75" font-size="5.5" fill="#333333" text-anchor="end">0</text><text x="-3" y="13" font-size="5.5" fill="#333333" text-anchor="end">32</text><text x="8.08" y="52.75" font-size="5.5" fill="#333333" text-anchor="middle">Jan</text><text x="98.92" y="52.75" font-size="5.5" fill="#333333" text-anchor="middle">Jun</text></g><g transform="translate(119,0)"><text x="0" y="7" font-size="6" font-weight="600" fill="#333333">South</text><rect x="2.69" y="29.62" width="10.78" height="16.13" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="20.86" y="30.77" width="10.78" height="14.98" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="39.03" y="28.47" width="10.78" height="17.28" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="57.19" y="29.62" width="10.78" height="16.13" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="75.36" y="27.32" width="10.78" height="18.43" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="93.53" y="28.47" width="10.78" height="17.28" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="45.75" x2="107" y2="45.75" stroke="#333333" stroke-width="0.75"/><text x="8.08" y="52.75" font-size="5.5" fill="#333333" text-anchor="middle">Jan</text><text x="98.92" y="52.75" font-size="5.5" fill="#333333" text-anchor="middle">Jun</text></g><g transform="translate(0,57.75)"><text x="0" y="7" font-size="6" font-weight="600" fill="#333333">East</text><rect x="2.69" y="35.38" width="10.78" height="10.37" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="20.86" y="34.23" width="10.78" height="11.52" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="39.03" y="31.93" width="10.78" height="13.82" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="57.19" y="33.08" width="10.78" height="12.67" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="75.36" y="30.77" width="10.78" height="14.98" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="93.53" y="29.62" width="10.78" height="16.13" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="45.75" x2="107" y2="45.75" stroke="#333333" stroke-width="0.75"/><text x="-3" y="47.75" font-size="5.5" fill="#333333" text-anchor="end">0</text><text x="-3" y="13" font-size="5.5" fill="#333333" text-anchor="end">32</text><text x="8.08" y="52.75" font-size="5.5" fill="#333333" text-anchor="middle">Jan</text><text x="98.92" y="52.75" font-size="5.5" fill="#333333" text-anchor="middle">Jun</text></g><g transform="translate(119,57.75)"><text x="0" y="7" font-size="6" font-weight="600" fill="#333333">West</text><rect x="2.69" y="30.77" width="10.78" height="14.98" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="20.86" y="27.32" width="10.78" height="18.43" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="39.03" y="35.38" width="10.78" height="10.37" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="57.19" y="25.01" width="10.78" height="20.74" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="75.36" y="30.77" width="10.78" height="14.98" fill="#333333" stroke="#333333" stroke-width="0.5"/><rect x="93.53" y="30.77" width="10.78" height="14.98" fill="#333333" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="45.75" x2="107" y2="45.75" stroke="#333333" stroke-width="0.75"/><text x="8.08" y="52.75" font-size="5.5" fill="#333333" text-anchor="middle">Jan</text><text x="98.92" y="52.75" font-size="5.5" fill="#333333" text-anchor="middle">Jun</text></g></g></svg>`
    },
    {
      "group": "Grids & tables (pictures)",
      "id": "variance-table",
      "label": "Variance table \u2014 AC \xB7 PL \xB7 \u0394PL \xB7 \u0394PL%",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark variance-table</desc><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="0" y="7.5" font-size="7.5" fill="#333333"><tspan x="0" dy="0">Alpha Corporation</tspan><tspan x="0" dy="10"><tspan font-weight="600">Net sales \u0394PL </tspan>in mEUR</tspan><tspan x="0" dy="10">2026 AC&amp;FC and PL</tspan></text><text x="254" y="43.5" font-size="7.5" fill="#333333" text-anchor="end">mEUR</text><g transform="translate(2,36)"><text x="65.28" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">AC</text><text x="100.56" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">PL</text><text x="134.63" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">\u0394PL</text><text x="210.35" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">\u0394PL%</text><line x1="0" y1="12" x2="252" y2="12" stroke="#333333" stroke-width="0.75"/><text x="28" y="20" font-size="7" font-weight="400" fill="#333333" text-anchor="end">Jan</text><text x="65.28" y="20" font-size="7" font-weight="400" fill="#333333" text-anchor="end">57</text><text x="100.56" y="20" font-size="7" font-weight="400" fill="#333333" text-anchor="end">60</text><text x="134.63" y="20" font-size="7" font-weight="400" fill="#E2001A" text-anchor="end">\u22123</text><rect x="155.97" y="14.5" width="1.49" height="5" fill="#E2001A"/><line x1="157.46" y1="13" x2="157.46" y2="21" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="20" font-size="7" font-weight="400" fill="#E2001A" text-anchor="end">\u22125%</text><line x1="233.18" y1="16.5" x2="227.19" y2="16.5" stroke="#E2001A" stroke-width="1.6"/><rect x="225.69" y="15" width="3" height="3" fill="#333333"/><line x1="233.18" y1="13" x2="233.18" y2="21" stroke="#333333" stroke-width="0.5"/><text x="28" y="31" font-size="7" font-weight="400" fill="#333333" text-anchor="end">Feb</text><text x="65.28" y="31" font-size="7" font-weight="400" fill="#333333" text-anchor="end">63</text><text x="100.56" y="31" font-size="7" font-weight="400" fill="#333333" text-anchor="end">60</text><text x="134.63" y="31" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+3</text><rect x="157.46" y="25.5" width="1.49" height="5" fill="#89B54A"/><line x1="157.46" y1="24" x2="157.46" y2="32" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="31" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+5%</text><line x1="233.18" y1="27.5" x2="239.17" y2="27.5" stroke="#89B54A" stroke-width="1.6"/><rect x="237.67" y="26" width="3" height="3" fill="#333333"/><line x1="233.18" y1="24" x2="233.18" y2="32" stroke="#333333" stroke-width="0.5"/><text x="28" y="42" font-size="7" font-weight="400" fill="#333333" text-anchor="end">Mar</text><text x="65.28" y="42" font-size="7" font-weight="400" fill="#333333" text-anchor="end">58</text><text x="100.56" y="42" font-size="7" font-weight="400" fill="#333333" text-anchor="end">62</text><text x="134.63" y="42" font-size="7" font-weight="400" fill="#E2001A" text-anchor="end">\u22124</text><rect x="155.48" y="36.5" width="1.98" height="5" fill="#E2001A"/><line x1="157.46" y1="35" x2="157.46" y2="43" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="42" font-size="7" font-weight="400" fill="#E2001A" text-anchor="end">\u22126%</text><line x1="233.18" y1="38.5" x2="225.45" y2="38.5" stroke="#E2001A" stroke-width="1.6"/><rect x="223.95" y="37" width="3" height="3" fill="#333333"/><line x1="233.18" y1="35" x2="233.18" y2="43" stroke="#333333" stroke-width="0.5"/><text x="28" y="53" font-size="7" font-weight="400" fill="#333333" text-anchor="end">Apr</text><text x="65.28" y="53" font-size="7" font-weight="400" fill="#333333" text-anchor="end">64</text><text x="100.56" y="53" font-size="7" font-weight="400" fill="#333333" text-anchor="end">62</text><text x="134.63" y="53" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+2</text><rect x="157.46" y="47.5" width="0.99" height="5" fill="#89B54A"/><line x1="157.46" y1="46" x2="157.46" y2="54" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="53" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+3%</text><line x1="233.18" y1="49.5" x2="237.04" y2="49.5" stroke="#89B54A" stroke-width="1.6"/><rect x="235.54" y="48" width="3" height="3" fill="#333333"/><line x1="233.18" y1="46" x2="233.18" y2="54" stroke="#333333" stroke-width="0.5"/><text x="28" y="64" font-size="7" font-weight="400" fill="#333333" text-anchor="end">May</text><text x="65.28" y="64" font-size="7" font-weight="400" fill="#333333" text-anchor="end">69</text><text x="100.56" y="64" font-size="7" font-weight="400" fill="#333333" text-anchor="end">64</text><text x="134.63" y="64" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+5</text><rect x="157.46" y="58.5" width="2.48" height="5" fill="#89B54A"/><line x1="157.46" y1="57" x2="157.46" y2="65" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="64" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+8%</text><line x1="233.18" y1="60.5" x2="242.54" y2="60.5" stroke="#89B54A" stroke-width="1.6"/><rect x="241.04" y="59" width="3" height="3" fill="#333333"/><line x1="233.18" y1="57" x2="233.18" y2="65" stroke="#333333" stroke-width="0.5"/><text x="28" y="75" font-size="7" font-weight="400" fill="#333333" text-anchor="end">Jun</text><text x="65.28" y="75" font-size="7" font-weight="400" fill="#333333" text-anchor="end">71</text><text x="100.56" y="75" font-size="7" font-weight="400" fill="#333333" text-anchor="end">64</text><text x="134.63" y="75" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+7</text><rect x="157.46" y="69.5" width="3.47" height="5" fill="#89B54A"/><line x1="157.46" y1="68" x2="157.46" y2="76" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="75" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+11%</text><line x1="233.18" y1="71.5" x2="246.28" y2="71.5" stroke="#89B54A" stroke-width="1.6"/><rect x="244.78" y="70" width="3" height="3" fill="#333333"/><line x1="233.18" y1="68" x2="233.18" y2="76" stroke="#333333" stroke-width="0.5"/><text x="28" y="86" font-size="7" font-weight="400" fill="#333333" text-anchor="end">Jul</text><text x="65.28" y="86" font-size="7" font-weight="400" fill="#333333" text-anchor="end">68</text><text x="100.56" y="86" font-size="7" font-weight="400" fill="#333333" text-anchor="end">66</text><text x="134.63" y="86" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+2</text><rect x="157.46" y="80.5" width="0.99" height="5" fill="#89B54A"/><line x1="157.46" y1="79" x2="157.46" y2="87" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="86" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+3%</text><line x1="233.18" y1="82.5" x2="236.81" y2="82.5" stroke="#89B54A" stroke-width="1.6"/><rect x="235.31" y="81" width="3" height="3" fill="#333333"/><line x1="233.18" y1="79" x2="233.18" y2="87" stroke="#333333" stroke-width="0.5"/><text x="28" y="97" font-size="7" font-weight="400" fill="#333333" text-anchor="end">Aug</text><text x="65.28" y="97" font-size="7" font-weight="400" fill="#333333" text-anchor="end">66</text><text x="100.56" y="97" font-size="7" font-weight="400" fill="#333333" text-anchor="end">66</text><text x="134.63" y="97" font-size="7" font-weight="400" fill="#0066CC" text-anchor="end">0</text><rect x="157.46" y="91.5" width="0.5" height="5" fill="#0066CC"/><line x1="157.46" y1="90" x2="157.46" y2="98" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="97" font-size="7" font-weight="400" fill="#0066CC" text-anchor="end">0%</text><line x1="233.18" y1="93.5" x2="233.18" y2="93.5" stroke="#0066CC" stroke-width="1.6"/><rect x="231.68" y="92" width="3" height="3" fill="#333333"/><line x1="233.18" y1="90" x2="233.18" y2="98" stroke="#333333" stroke-width="0.5"/><text x="28" y="108" font-size="7" font-weight="400" fill="#333333" text-anchor="end">Sep</text><text x="65.28" y="108" font-size="7" font-weight="400" fill="#333333" text-anchor="end">72</text><text x="100.56" y="108" font-size="7" font-weight="400" fill="#333333" text-anchor="end">68</text><text x="134.63" y="108" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+4</text><rect x="157.46" y="102.5" width="1.98" height="5" fill="#89B54A"/><line x1="157.46" y1="101" x2="157.46" y2="109" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="108" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+6%</text><line x1="233.18" y1="104.5" x2="240.22" y2="104.5" stroke="#89B54A" stroke-width="1.6"/><rect x="238.72" y="103" width="3" height="3" fill="#333333"/><line x1="233.18" y1="101" x2="233.18" y2="109" stroke="#333333" stroke-width="0.5"/><text x="28" y="119" font-size="7" font-weight="400" fill="#333333" text-anchor="end">Oct</text><text x="65.28" y="119" font-size="7" font-weight="400" fill="#333333" text-anchor="end">75</text><text x="100.56" y="119" font-size="7" font-weight="400" fill="#333333" text-anchor="end">68</text><text x="134.63" y="119" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+7</text><rect x="157.46" y="113.5" width="3.47" height="5" fill="#89B54A"/><line x1="157.46" y1="112" x2="157.46" y2="120" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="119" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+10%</text><line x1="233.18" y1="115.5" x2="245.51" y2="115.5" stroke="#89B54A" stroke-width="1.6"/><rect x="244.01" y="114" width="3" height="3" fill="#333333"/><line x1="233.18" y1="112" x2="233.18" y2="120" stroke="#333333" stroke-width="0.5"/><text x="28" y="130" font-size="7" font-weight="400" fill="#333333" text-anchor="end">Nov</text><text x="65.28" y="130" font-size="7" font-weight="400" fill="#333333" text-anchor="end">74</text><text x="100.56" y="130" font-size="7" font-weight="400" fill="#333333" text-anchor="end">70</text><text x="134.63" y="130" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+4</text><rect x="157.46" y="124.5" width="1.98" height="5" fill="#89B54A"/><line x1="157.46" y1="123" x2="157.46" y2="131" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="130" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+6%</text><line x1="233.18" y1="126.5" x2="240.02" y2="126.5" stroke="#89B54A" stroke-width="1.6"/><rect x="238.52" y="125" width="3" height="3" fill="#333333"/><line x1="233.18" y1="123" x2="233.18" y2="131" stroke="#333333" stroke-width="0.5"/><text x="28" y="141" font-size="7" font-weight="400" fill="#333333" text-anchor="end">Dec</text><text x="65.28" y="141" font-size="7" font-weight="400" fill="#333333" text-anchor="end">81</text><text x="100.56" y="141" font-size="7" font-weight="400" fill="#333333" text-anchor="end">70</text><text x="134.63" y="141" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+11</text><rect x="157.46" y="135.5" width="5.45" height="5" fill="#89B54A"/><line x1="157.46" y1="134" x2="157.46" y2="142" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="141" font-size="7" font-weight="400" fill="#89B54A" text-anchor="end">+16%</text><line x1="233.18" y1="137.5" x2="252" y2="137.5" stroke="#89B54A" stroke-width="1.6"/><rect x="250.5" y="136" width="3" height="3" fill="#333333"/><line x1="233.18" y1="134" x2="233.18" y2="142" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="144" x2="252" y2="144" stroke="#333333" stroke-width="0.5"/><text x="28" y="152" font-size="7" font-weight="600" fill="#333333" text-anchor="end">\u03A3</text><text x="65.28" y="152" font-size="7" font-weight="600" fill="#333333" text-anchor="end">818</text><text x="100.56" y="152" font-size="7" font-weight="600" fill="#333333" text-anchor="end">780</text><text x="134.63" y="152" font-size="7" font-weight="600" fill="#89B54A" text-anchor="end">+38</text><rect x="157.46" y="146.5" width="18.82" height="5" fill="#89B54A"/><line x1="157.46" y1="145" x2="157.46" y2="153" stroke="#333333" stroke-width="0.5"/><text x="210.35" y="152" font-size="7" font-weight="600" fill="#89B54A" text-anchor="end">+5%</text><line x1="233.18" y1="148.5" x2="239.01" y2="148.5" stroke="#89B54A" stroke-width="1.6"/><rect x="237.51" y="147" width="3" height="3" fill="#333333"/><line x1="233.18" y1="145" x2="233.18" y2="153" stroke="#333333" stroke-width="0.5"/><line x1="0" y1="156" x2="252" y2="156" stroke="#333333" stroke-width="0.75"/></g></svg>`
    },
    {
      "group": "Grids & tables (pictures)",
      "id": "time-series-table",
      "label": "Time series table \u2014 periods across, rows down",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark time-series-table</desc><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="0" y="7.5" font-size="7.5" fill="#333333"><tspan x="0" dy="0">Alpha Corporation</tspan><tspan x="0" dy="10"><tspan font-weight="600">Net sales </tspan>in mEUR</tspan><tspan x="0" dy="10">2026 AC</tspan></text><text x="254" y="43.5" font-size="7.5" fill="#333333" text-anchor="end">mEUR</text><g transform="translate(2,36)"><text x="46.02" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">Jan</text><text x="66.04" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">Feb</text><text x="86.06" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">Mar</text><text x="106.08" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">Apr</text><text x="126.1" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">May</text><text x="146.12" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">Jun</text><text x="169.14" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">\u03A3</text><line x1="0" y1="12" x2="252" y2="12" stroke="#333333" stroke-width="0.75"/><text x="0" y="20" font-size="6.5" font-weight="400" fill="#333333">North</text><text x="46.02" y="20" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">21</text><text x="66.04" y="20" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">24</text><text x="86.06" y="20" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">22</text><text x="106.08" y="20" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">26</text><text x="126.1" y="20" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">27</text><text x="146.12" y="20" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">29</text><text x="169.14" y="20" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">149</text><line x1="0" y1="23" x2="252" y2="23" stroke="#E5E7EB" stroke-width="0.25"/><text x="0" y="31" font-size="6.5" font-weight="400" fill="#333333">South</text><text x="46.02" y="31" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">14</text><text x="66.04" y="31" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">13</text><text x="86.06" y="31" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">15</text><text x="106.08" y="31" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">14</text><text x="126.1" y="31" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">16</text><text x="146.12" y="31" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">15</text><text x="169.14" y="31" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">87</text><line x1="0" y1="34" x2="252" y2="34" stroke="#E5E7EB" stroke-width="0.25"/><text x="0" y="42" font-size="6.5" font-weight="400" fill="#333333">East</text><text x="46.02" y="42" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">9</text><text x="66.04" y="42" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">10</text><text x="86.06" y="42" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">12</text><text x="106.08" y="42" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">11</text><text x="126.1" y="42" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">13</text><text x="146.12" y="42" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">14</text><text x="169.14" y="42" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">69</text><line x1="0" y1="45" x2="252" y2="45" stroke="#E5E7EB" stroke-width="0.25"/><text x="0" y="53" font-size="6.5" font-weight="400" fill="#333333">West</text><text x="46.02" y="53" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">13</text><text x="66.04" y="53" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">16</text><text x="86.06" y="53" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">9</text><text x="106.08" y="53" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">18</text><text x="126.1" y="53" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">13</text><text x="146.12" y="53" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">13</text><text x="169.14" y="53" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">82</text><line x1="0" y1="56" x2="252" y2="56" stroke="#333333" stroke-width="0.5"/><text x="0" y="64" font-size="6.5" font-weight="700" fill="#333333">\u03A3</text><text x="46.02" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">57</text><text x="66.04" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">63</text><text x="86.06" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">58</text><text x="106.08" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">69</text><text x="126.1" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">69</text><text x="146.12" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">71</text><text x="169.14" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">387</text><line x1="0" y1="68" x2="252" y2="68" stroke="#333333" stroke-width="0.75"/></g></svg>`
    },
    {
      "group": "Grids & tables (pictures)",
      "id": "cross-table",
      "label": "Cross table \u2014 structure \xD7 structure",
      "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160" font-family="'Barlow', sans-serif"><desc>hatchmark cross-table</desc><rect x="0" y="0" width="260" height="160" fill="#FFFFFF"/><text x="0" y="7.5" font-size="7.5" fill="#333333"><tspan x="0" dy="0">Alpha Corporation</tspan><tspan x="0" dy="10"><tspan font-weight="600">Net sales </tspan>in mEUR</tspan><tspan x="0" dy="10">2026 AC</tspan></text><text x="254" y="43.5" font-size="7.5" fill="#333333" text-anchor="end">mEUR</text><g transform="translate(2,36)"><text x="67.72" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">Espresso</text><text x="109.44" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">Grinders</text><text x="151.16" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">Filter</text><text x="192.88" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">Parts</text><text x="237.6" y="9" font-size="7" font-weight="600" fill="#333333" text-anchor="end">\u03A3</text><line x1="0" y1="12" x2="252" y2="12" stroke="#333333" stroke-width="0.75"/><text x="0" y="20" font-size="6.5" font-weight="400" fill="#333333">North</text><text x="67.72" y="20" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">38</text><text x="109.44" y="20" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">21</text><text x="151.16" y="20" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">14</text><text x="192.88" y="20" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">13</text><text x="237.6" y="20" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">86</text><line x1="0" y1="23" x2="252" y2="23" stroke="#E5E7EB" stroke-width="0.25"/><text x="0" y="31" font-size="6.5" font-weight="400" fill="#333333">South</text><text x="67.72" y="31" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">26</text><text x="109.44" y="31" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">15</text><text x="151.16" y="31" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">12</text><text x="192.88" y="31" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">11</text><text x="237.6" y="31" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">64</text><line x1="0" y1="34" x2="252" y2="34" stroke="#E5E7EB" stroke-width="0.25"/><text x="0" y="42" font-size="6.5" font-weight="400" fill="#333333">East</text><text x="67.72" y="42" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">18</text><text x="109.44" y="42" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">12</text><text x="151.16" y="42" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">9</text><text x="192.88" y="42" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">8</text><text x="237.6" y="42" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">47</text><line x1="0" y1="45" x2="252" y2="45" stroke="#E5E7EB" stroke-width="0.25"/><text x="0" y="53" font-size="6.5" font-weight="400" fill="#333333">West</text><text x="67.72" y="53" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">31</text><text x="109.44" y="53" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">17</text><text x="151.16" y="53" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">12</text><text x="192.88" y="53" font-size="6.5" font-weight="400" fill="#333333" text-anchor="end">11</text><text x="237.6" y="53" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">71</text><line x1="0" y1="56" x2="252" y2="56" stroke="#333333" stroke-width="0.5"/><text x="0" y="64" font-size="6.5" font-weight="700" fill="#333333">\u03A3</text><text x="67.72" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">113</text><text x="109.44" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">65</text><text x="151.16" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">47</text><text x="192.88" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">43</text><text x="237.6" y="64" font-size="6.5" font-weight="700" fill="#333333" text-anchor="end">268</text><line x1="0" y1="68" x2="252" y2="68" stroke="#333333" stroke-width="0.75"/></g></svg>`
    }
  ];

  // src/comments.ts
  function parseCommentLines(raw) {
    const out = [];
    for (const line of raw.split(/\r?\n/)) {
      const idx = line.indexOf(":");
      if (idx <= 0) continue;
      const period = line.slice(0, idx).trim();
      const text2 = line.slice(idx + 1).trim();
      if (period === "" || text2 === "") continue;
      out.push({ period, text: text2 });
    }
    return out;
  }
  function formatCommentLines(comments) {
    return (comments ?? []).map((c) => `${c.period}: ${c.text}`).join("\n");
  }

  // src/themeIO.ts
  var HEX = /^#[0-9A-Fa-f]{6}$/;
  var DEFAULT_THEME = {
    desirable: "#89B54A",
    undesirable: "#E2001A"
  };
  function sanitizeTheme(raw) {
    if (raw === null || typeof raw !== "object") return null;
    const r = raw;
    const theme = {};
    for (const key of ["desirable", "undesirable", "neutral"]) {
      if (typeof r[key] === "string" && HEX.test(r[key])) theme[key] = r[key];
    }
    if (typeof r["font_family"] === "string" && r["font_family"].trim() !== "" && r["font_family"].length <= 120) {
      theme.font_family = r["font_family"].trim();
    }
    return Object.keys(theme).length > 0 ? theme : null;
  }
  function parseThemeJson(raw) {
    try {
      return sanitizeTheme(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  function themeToJson(theme) {
    return JSON.stringify(theme, null, 2);
  }
  function themeWarning(theme) {
    const good = theme.desirable ?? DEFAULT_THEME.desirable;
    const bad = theme.undesirable ?? DEFAULT_THEME.undesirable;
    return good.toLowerCase() === bad.toLowerCase() ? "Desirable and undesirable are the same colour \u2014 variance impact becomes unreadable." : null;
  }

  // src/templates.ts
  var COMPANY = "Fioretti Espresso Systems";
  var TEMPLATES = [
    {
      id: "monthly-report",
      name: "Monthly performance report",
      sheetName: "Monthly report",
      description: "Net sales vs plan and last year \u2014 actuals turn into forecast partway through the year.",
      measure: "Net sales",
      unit: "k\u20AC",
      good_direction: "up",
      reporting_unit: COMPANY,
      grid: [
        ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        ["AC", 760, 805, 910, 815, 690, 940, 795, 655, "", "", "", ""],
        ["FC", "", "", "", "", "", "", "", "", 860, 900, 955, 1e3],
        ["PL", 780, 790, 820, 830, 850, 860, 800, 700, 870, 890, 940, 980],
        ["PY", 720, 735, 760, 775, 800, 810, 750, 640, 810, 830, 875, 905]
      ],
      charts: [
        { chart: "column-with-variance", baseline: "PL" },
        { chart: "basic-line" }
      ],
      story: "Kaffeehaus Nord pulled a 40-store rollout forward into March (+90 beat); a boiler-component delay pushed ~160 of May shipments into June \u2014 the sharpest miss, then the sharpest catch-up. Forecast months run slightly ahead of plan on Nimbus grinder pre-orders, pulling the year back to within 1% of PL."
    },
    {
      id: "regional-pl",
      name: "Regional P&L breakdown",
      sheetName: "Regional P&L",
      description: "EBIT actual vs plan across seven European regions \u2014 one region tells the story.",
      measure: "EBIT",
      unit: "k\u20AC",
      good_direction: "up",
      reporting_unit: COMPANY,
      grid: [
        ["", "Italy", "Germany", "France", "Iberia", "Benelux", "Nordics", "UK & Ireland"],
        ["AC", 420, 310, 180, 95, 130, 150, -40],
        ["PL", 380, 320, 175, 100, 120, 140, 90]
      ],
      charts: [
        { chart: "absolute-variance-bar", baseline: "PL" },
        { chart: "basic-bar" }
      ],
      story: "Most regions closed at or ahead of plan. The story is UK & Ireland: a planned 90 EBIT swung to a 40 loss after distributor Brew Partners entered administration in Q2 \u2014 a bad-debt write-off plus two months without shipments. The variance bars isolate that single 130 collapse as what drags the group below plan."
    },
    {
      id: "forecast-bridge",
      name: "Forecast bridge",
      sheetName: "Forecast bridge",
      description: "Bridge the full-year plan to the actual-plus-forecast outturn, month by month.",
      measure: "Net sales",
      unit: "k\u20AC",
      good_direction: "up",
      reporting_unit: COMPANY,
      grid: [
        ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        ["AC", 785, 830, 800, 855, 900, 905, "", "", "", "", "", ""],
        ["FC", "", "", "", "", "", "", 795, 640, 910, 930, 995, 1035],
        ["PL", 800, 810, 830, 840, 860, 870, 810, 710, 880, 900, 950, 990]
      ],
      charts: [
        { chart: "contribution-waterfall", baseline: "PL" },
        { chart: "waterfall-column" }
      ],
      story: "The year ends ~130 (1.3%) ahead of plan, but not smoothly: March slips as a large order moves to Q3 (feeding the Sept/Oct upside), and August drops when \xCEle Caf\xE9 churns to a rival. May\u2013June volume, a September price increase and strong Q4 Nimbus volume more than offset it. The bridge names each step; the waterfall shows the same months simply accumulating."
    }
  ];

  // src/taskpane.ts
  var state = { dataset: null, sideways: false, source: null, editing: null };
  var CHART_LABEL = new Map(CHART_CHOICES.map((c) => [c.id, c.label.split(" \u2014 ")[0]]));
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
    const comments = parseCommentLines($("comments-input").value);
    const autoScale = $("auto-scale").checked;
    const options = {
      width: 320,
      height: chart === "variance-table" ? void 0 : chartHeights[chart] ?? 200,
      show_data_labels: showLabels,
      colour_mode: colourMode,
      baseline,
      compare: ["AC", "FC"],
      version: REGISTRY_VERSION,
      theme: loadWorkbookTheme() ?? void 0,
      comments: comments.length > 0 ? comments : void 0,
      axis: { auto_scale: autoScale }
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
    renderChartList();
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
    if (state.editing) cancelEdit();
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
    if (state.editing) cancelEdit();
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
    if (state.editing) cancelEdit();
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
      let dataset = null;
      let freshErrors = [];
      await Excel.run(async (ctx) => {
        const sheet = ctx.workbook.worksheets.getItemOrNullObject(state.source.worksheetId);
        await ctx.sync();
        if (sheet.isNullObject) {
          freshErrors = ["The source worksheet no longer exists \u2014 reload a selection first."];
          return;
        }
        const range = sheet.getRange(state.source.address.split("!").pop());
        range.load("values");
        await ctx.sync();
        const fresh = rangeToDataset(range.values, meta);
        if (fresh.dataset) dataset = fresh.dataset;
        else freshErrors = fresh.errors;
      });
      if (!dataset) {
        setStatus(`The source data changed and no longer loads: ${freshErrors.join(" ")}`, true);
        return;
      }
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
          height,
          comments: options.comments,
          auto_scale: options.axis?.auto_scale !== false
        },
        registry_version: REGISTRY_VERSION,
        updated: (/* @__PURE__ */ new Date()).toISOString()
      };
      let anchor = { left: 400, top: 24 };
      try {
        await Excel.run(async (ctx) => {
          const sel = ctx.workbook.getSelectedRange();
          sel.load(["left", "top", "width"]);
          await ctx.sync();
          anchor = { left: sel.left + sel.width + 12, top: sel.top };
        });
      } catch {
      }
      await Excel.run(async (ctx) => {
        const sheet = ctx.workbook.worksheets.getActiveWorksheet();
        sheet.load("id");
        await ctx.sync();
        record.hostSheetId = sheet.id;
        const shape = sheet.shapes.addImage(png);
        shape.left = anchor.left;
        shape.top = anchor.top;
        shape.width = width;
        shape.height = height;
        protectShape(shape);
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
  function buildPicker() {
    const select = $("chart-type");
    select.innerHTML = "";
    const groups = /* @__PURE__ */ new Map();
    for (const c of CHART_CHOICES) {
      if (!groups.has(c.group)) {
        const og = document.createElement("optgroup");
        og.label = c.group;
        groups.set(c.group, og);
        select.appendChild(og);
      }
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.label;
      groups.get(c.group).appendChild(opt);
    }
    const grid = $("chart-grid");
    grid.innerHTML = "";
    let lastGroup = "";
    for (const c of CHART_CHOICES) {
      if (c.group !== lastGroup) {
        const h = document.createElement("div");
        h.className = "grid-group";
        h.textContent = c.group;
        grid.appendChild(h);
        lastGroup = c.group;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "thumb";
      btn.dataset["chart"] = c.id;
      btn.title = c.label;
      btn.innerHTML = `<span class="thumb-svg">${c.svg}</span><span class="thumb-label">${c.label.split(" \u2014 ")[0]}</span>`;
      btn.addEventListener("click", () => {
        select.value = c.id;
        select.dispatchEvent(new Event("change"));
      });
      grid.appendChild(btn);
    }
    select.addEventListener("change", highlightThumb);
    highlightThumb();
  }
  function highlightThumb() {
    const current = $("chart-type").value;
    document.querySelectorAll("#chart-grid .thumb").forEach((el2) => {
      el2.classList.toggle("selected", el2.dataset["chart"] === current);
    });
  }
  function chartListLabel(r) {
    return `${CHART_LABEL.get(r.chart) ?? r.chart} \xB7 ${r.sourceAddress}`;
  }
  function renderChartList() {
    const host = $("chart-list");
    const records = loadRecords();
    host.innerHTML = "";
    for (const r of records) {
      const row = document.createElement("div");
      row.className = "chart-row" + (state.editing?.id === r.id ? " editing" : "");
      const label = document.createElement("span");
      label.textContent = chartListLabel(r);
      const edit = document.createElement("button");
      edit.className = "secondary small";
      edit.textContent = state.editing?.id === r.id ? "Editing\u2026" : "Edit";
      edit.addEventListener("click", () => startEdit(r.id));
      const src = document.createElement("button");
      src.className = "secondary small";
      src.textContent = "Source";
      src.title = "Select this chart\u2019s source range";
      src.addEventListener("click", () => showSource(r));
      row.append(label, edit, src);
      host.appendChild(row);
    }
    $("charts-section").style.display = records.length > 0 ? "" : "none";
  }
  async function showSource(r) {
    try {
      await Excel.run(async (ctx) => {
        const sheet = ctx.workbook.worksheets.getItemOrNullObject(r.worksheetId);
        await ctx.sync();
        if (sheet.isNullObject) throw new Error("The source worksheet no longer exists.");
        sheet.activate();
        const bang = r.sourceAddress.lastIndexOf("!");
        sheet.getRange(bang >= 0 ? r.sourceAddress.slice(bang + 1) : r.sourceAddress).select();
        await ctx.sync();
      });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
    }
  }
  async function startEdit(recordId) {
    const record = loadRecords().find((r) => r.id === recordId);
    if (!record) return;
    state.editing = record;
    $("chart-type").value = record.chart;
    $("baseline").value = record.options.baseline;
    $("colour-mode").value = record.options.colour_mode;
    $("show-labels").checked = record.options.show_data_labels;
    $("measure").value = record.meta.measure;
    $("unit").value = record.meta.unit;
    $("reporting-unit").value = record.meta.reporting_unit ?? "";
    $("good-direction").value = record.meta.good_direction;
    $("comments-input").value = formatCommentLines(record.options.comments);
    $("auto-scale").checked = record.options.auto_scale !== false;
    highlightThumb();
    try {
      await Excel.run(async (ctx) => {
        const sheet = ctx.workbook.worksheets.getItemOrNullObject(record.worksheetId);
        await ctx.sync();
        if (sheet.isNullObject) throw new Error("The source worksheet no longer exists.");
        const bang = record.sourceAddress.lastIndexOf("!");
        const range = sheet.getRange(bang >= 0 ? record.sourceAddress.slice(bang + 1) : record.sourceAddress);
        range.load(["values", "address"]);
        await ctx.sync();
        const mapped = rangeToDataset(range.values, record.meta);
        if (mapped.dataset) {
          state.dataset = mapped.dataset;
          state.sideways = mapped.orientation === "scenarios-in-columns";
          state.source = { worksheetId: record.worksheetId, address: record.sourceAddress, values: range.values, orientation: mapped.orientation };
        }
      });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
    }
    $("insert").textContent = "Apply changes to this chart";
    $("insert").disabled = false;
    $("edit-what").textContent = chartListLabel(record);
    $("edit-banner").style.display = "";
    renderChartList();
    refreshPreview();
  }
  function cancelEdit() {
    state.editing = null;
    $("insert").textContent = "Insert chart";
    $("edit-banner").style.display = "none";
    renderChartList();
  }
  async function applyEdit() {
    const record = state.editing;
    if (!record) return;
    const { chart, options } = readOptions();
    const meta = readMeta();
    const chartChanged = chart !== record.chart;
    record.chart = chart;
    record.meta = { ...meta };
    record.options = {
      ...record.options,
      baseline: options.baseline,
      colour_mode: options.colour_mode ?? "colour",
      show_data_labels: options.show_data_labels ?? false,
      comments: options.comments,
      auto_scale: options.axis?.auto_scale !== false
    };
    if (chartChanged) {
      try {
        const probe = renderChart(chart, state.dataset ?? { id: "probe", measure: meta.measure, unit: meta.unit, granularity: "monthly", periods: ["-"], series: [{ scenario: "AC", values: [0] }] }, { ...options });
        const size = probe.match(/width="(\d+(?:\.\d+)?)" height="(\d+(?:\.\d+)?)"/);
        record.options.width = size ? Number(size[1]) : options.width ?? record.options.width;
        record.options.height = size ? Number(size[2]) : options.height ?? record.options.height;
      } catch {
        record.options.width = options.width ?? record.options.width;
        record.options.height = options.height ?? record.options.height;
      }
    }
    record.updated = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await upsertRecord(record);
      const res = await refreshRecord(record, true, chartChanged ? { width: record.options.width, height: record.options.height } : void 0);
      setStatus(res.ok ? `Updated in place: ${chartListLabel(record)}` : res.message, !res.ok);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
    }
    cancelEdit();
    updateLiveCount();
  }
  function themeInputs() {
    return {
      desirable: $("theme-good").value,
      undesirable: $("theme-bad").value,
      font: $("theme-font").value.trim()
    };
  }
  function showTheme(theme) {
    $("theme-good").value = theme?.desirable ?? DEFAULT_THEME.desirable;
    $("theme-bad").value = theme?.undesirable ?? DEFAULT_THEME.undesirable;
    $("theme-font").value = theme?.font_family ?? "";
  }
  async function applyTheme() {
    const t = themeInputs();
    const theme = sanitizeTheme({
      desirable: t.desirable.toLowerCase() !== DEFAULT_THEME.desirable.toLowerCase() ? t.desirable : void 0,
      undesirable: t.undesirable.toLowerCase() !== DEFAULT_THEME.undesirable.toLowerCase() ? t.undesirable : void 0,
      font_family: t.font || void 0
    });
    try {
      await saveWorkbookTheme(theme);
      const warn = theme ? themeWarning(theme) : null;
      setStatus(warn ? `Theme applied \u2014 but: ${warn}` : "Theme applied to this workbook. Re-rendering charts\u2026", !!warn);
      refreshPreview();
      setStatus(await refreshAll());
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
    }
  }
  async function resetTheme() {
    await saveWorkbookTheme(null);
    showTheme(null);
    refreshPreview();
    setStatus(await refreshAll());
  }
  async function insertTemplate(t) {
    if (state.editing) cancelEdit();
    try {
      $("comments-input").value = "";
      $("measure").value = t.measure;
      $("unit").value = t.unit;
      $("reporting-unit").value = t.reporting_unit;
      $("good-direction").value = t.good_direction;
      const rows = t.grid.length;
      const cols = t.grid[0].length;
      await Excel.run(async (ctx) => {
        const sheets = ctx.workbook.worksheets;
        sheets.load("items/name");
        await ctx.sync();
        const names = new Set(sheets.items.map((w) => w.name));
        let name = t.sheetName;
        for (let i = 2; names.has(name); i++) name = `${t.sheetName} (${i})`;
        const sheet = sheets.add(name);
        const block = sheet.getRangeByIndexes(1, 1, rows, cols);
        block.values = t.grid.map((r) => r.map((c) => c));
        sheet.getRangeByIndexes(1, 1, 1, cols).format.font.bold = true;
        const storyCell = sheet.getRangeByIndexes(rows + 2, 1, 1, 1);
        storyCell.values = [[t.story]];
        storyCell.format.font.italic = true;
        block.format.autofitColumns();
        sheet.activate();
        block.select();
        await ctx.sync();
      });
      await loadSelection();
      if (!state.source) return;
      let anchorRow = 1;
      for (const spec of t.charts) {
        $("chart-type").value = spec.chart;
        if (spec.baseline) $("baseline").value = spec.baseline;
        highlightThumb();
        await Excel.run(async (ctx) => {
          const sheet = ctx.workbook.worksheets.getActiveWorksheet();
          sheet.getRangeByIndexes(anchorRow, cols + 2, 1, 1).select();
          await ctx.sync();
        });
        await insertChart();
        anchorRow += 14;
      }
      refreshPreview();
      setStatus(`Template "${t.name}" inserted \u2014 data, story and ${t.charts.length} live charts. Edit any cell and watch them update.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
    }
  }
  function buildTemplates() {
    const host = $("template-list");
    host.innerHTML = "";
    for (const t of TEMPLATES) {
      const row = document.createElement("div");
      row.className = "template-row";
      const button = document.createElement("button");
      button.className = "secondary";
      button.textContent = t.name;
      button.addEventListener("click", () => insertTemplate(t));
      const desc = document.createElement("div");
      desc.className = "template-desc";
      desc.textContent = t.description;
      row.append(button, desc);
      host.appendChild(row);
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
      $("live-toggle-label").textContent = "Update charts automatically while the workbook is open";
    }
    const AUTO_OPEN_KEY = "hatchmark-auto-open";
    const autoOpenStored = Office.context.document.settings.get(AUTO_OPEN_KEY);
    const autoOpen = autoOpenStored === null || autoOpenStored === void 0 ? true : autoOpenStored === true;
    $("auto-open").checked = autoOpen;
    function applyAutoOpen(on) {
      try {
        void Office.addin.setStartupBehavior(on ? Office.StartupBehavior.load : Office.StartupBehavior.none);
      } catch {
      }
      Office.context.document.settings.set(AUTO_OPEN_KEY, on);
      Office.context.document.settings.saveAsync(() => {
      });
    }
    applyAutoOpen(autoOpen);
    if (autoOpen) {
      try {
        void Office.addin.showAsTaskpane();
      } catch {
      }
    }
    $("auto-open").addEventListener("change", () => {
      const on = $("auto-open").checked;
      applyAutoOpen(on);
      setStatus(on ? "This pane will reopen automatically with this workbook (after you save it)." : "This pane will no longer open automatically with this workbook.");
    });
    buildPicker();
    buildTemplates();
    showTheme(loadWorkbookTheme());
    $("load").addEventListener("click", loadSelection);
    $("insert").addEventListener("click", () => state.editing ? applyEdit() : insertChart());
    $("edit-cancel").addEventListener("click", cancelEdit);
    $("comments-input").addEventListener("input", refreshPreview);
    $("theme-apply").addEventListener("click", applyTheme);
    $("theme-reset").addEventListener("click", resetTheme);
    $("theme-export").addEventListener("click", () => {
      const theme = loadWorkbookTheme();
      $("theme-json").value = theme ? themeToJson(theme) : "";
      setStatus(theme ? "Theme JSON exported below \u2014 copy it into another workbook\u2019s Import box." : "No theme applied yet \u2014 Apply one first.", !theme);
    });
    $("theme-import").addEventListener("click", async () => {
      const parsed = parseThemeJson($("theme-json").value);
      if (!parsed) {
        setStatus("That JSON has no valid theme fields (desirable/undesirable/neutral hex, font_family).", true);
        return;
      }
      await saveWorkbookTheme(parsed);
      showTheme(parsed);
      refreshPreview();
      setStatus(await refreshAll());
    });
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
    for (const id of ["chart-type", "baseline", "colour-mode", "show-labels", "auto-scale", "measure", "unit", "reporting-unit", "good-direction"]) {
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
