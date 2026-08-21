import { t } from "../data/strings";
import { chartColors, CELL_GLYPH } from "../data/themes";
import { heatmap } from "../lib/stats";

// D — the full-program heatmap: weeks down, days across. Every cell carries a
// glyph as well as a colour step, so the states are readable without colour.
export default function Heatmap({ state, todayStr, th, themeId, lang, onOpenDay }) {
  const c = chartColors(themeId, th);
  const { weeks, weekdayOrder } = heatmap(state, todayStr);
  const wdShort = t(lang, "weekdaysShort");
  if (weeks.length === 0) return null;

  const fill = cell => {
    if (cell.isBeforeStart) return c.cellRest;
    if (cell.status === "rest") return c.cellRest;
    if (cell.isFuture) return c.cellOpen;
    return { done: c.cellDone, assumed: c.cellAssumed, partial: c.cellPartial, skipped: c.cellSkipped, open: c.cellOpen }[cell.status] || c.cellOpen;
  };
  const light = themeId === "light" || themeId === "blossom";
  const glyphColor = cell =>
    cell.status === "done" ? (light ? "#fff" : th.bg)
    : cell.status === "skipped" ? th.card
    : cell.status === "partial" ? th.text
    : th.textMuted;

  const legend = [
    ["done", t(lang, "dayDone")],
    ["partial", t(lang, "dayPartial")],
    ["assumed", t(lang, "dayAssumed")],
    ["skipped", t(lang, "daySkipped")],
    ["open", t(lang, "dayOpen")],
  ];

  return (
    <div>
      {/* weekday header */}
      <div style={{ display: "grid", gridTemplateColumns: `28px repeat(7, 1fr)`, gap: 3, marginBottom: 4, direction: "ltr" }}>
        <span/>
        {weekdayOrder.map(wd => (
          <span key={wd} style={{ fontSize: 9, color: th.textFaint, textAlign: "center", overflow: "hidden", textOverflow: "clip", whiteSpace: "nowrap" }}>{lang === "ar" ? wdShort[wd] : wdShort[wd].slice(0, 2)}</span>
        ))}
      </div>
      {weeks.map(w => (
        <div key={w.week} style={{ display: "grid", gridTemplateColumns: `28px repeat(7, 1fr)`, gap: 3, marginBottom: 3, alignItems: "center", direction: "ltr" }}>
          <span style={{ fontSize: 9, color: w.isDeload ? c.deload : th.textFaint, fontWeight: w.isDeload ? 700 : 400, textAlign: "center" }}>
            {w.week}{w.isDeload ? "•" : ""}
          </span>
          {w.cells.map(cell => (
            <button key={cell.date} onClick={() => !cell.isBeforeStart && cell.status !== "rest" && onOpenDay(cell.date)}
              title={cell.isBeforeStart ? `${cell.date} · ${t(lang, "beforeStartLegend")}` : `${cell.date} · ${cell.workoutKey} · ${cell.status}`}
              style={{
                aspectRatio: "1", minHeight: 26, borderRadius: 6, cursor: cell.status === "rest" ? "default" : "pointer",
                background: fill(cell),
                border: cell.isToday ? `2px solid ${c.accent}` : cell.isBeforeStart ? `1px dashed ${th.border}` : cell.status === "assumed" ? `1px dashed ${c.cellDone}80` : `1px solid ${th.border}`,
                color: glyphColor(cell), fontSize: cell.status === "partial" ? 12 : 11, fontWeight: 700, padding: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: cell.isFuture || cell.isBeforeStart ? 0.4 : 1,
              }}>
              {cell.isFuture || cell.isBeforeStart ? "" : CELL_GLYPH[cell.status] || ""}
            </button>
          ))}
        </div>
      ))}
      {/* labelled legend — required: colour alone never carries a state */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        {legend.map(([k, label]) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: th.textMuted }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700,
              background: { done: c.cellDone, partial: c.cellPartial, assumed: c.cellAssumed, skipped: c.cellSkipped, open: c.cellOpen }[k],
              border: k === "assumed" ? `1px dashed ${c.cellDone}80` : `1px solid ${th.border}`,
              color: k === "done" ? th.bg : k === "skipped" ? th.card : th.textMuted }}>{CELL_GLYPH[k]}</span>
            {label}
          </span>
        ))}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: th.textFaint }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: c.cellRest, border: `1px dashed ${th.border}`, opacity: 0.4 }}/>
          {t(lang, "beforeStartLegend")}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: c.deload }}>• {t(lang, "deloadWeek")}</span>
      </div>
    </div>
  );
}
