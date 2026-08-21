import { useState } from "react";
import { GUIDE } from "../data/guide";
import { t } from "../data/strings";

// A full screen of explanations, opened from Settings. Sections are collapsed by
// default so it reads as a contents page you can dip into.
export default function Guide({ lang, th, themeId, onBack }) {
  const [open, setOpen] = useState({});
  const sections = GUIDE[lang] || GUIDE.en;
  const accent = th.accent || "#00e5ff";
  const isRtl = lang === "ar";

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: accent, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "4px 0 12px", minHeight: 44 }}>
        <span style={{ fontSize: 18 }}>{isRtl ? "→" : "←"}</span> {t(lang, "settings")}
      </button>

      <p style={{ fontSize: 13, color: th.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>{t(lang, "guideIntro")}</p>

      {sections.map(sec => {
        const isOpen = open[sec.id] ?? false;
        return (
          <div key={sec.id} style={{ marginBottom: 8 }}>
            <button onClick={() => setOpen(p => ({ ...p, [sec.id]: !isOpen }))}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: th.card, border: `1px solid ${th.border}`, borderRadius: 12, padding: "14px 14px", cursor: "pointer", textAlign: "start", minHeight: 52 }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: th.text }}>{sec.title}</span>
              <span style={{ color: th.textMuted, fontSize: 12, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>▼</span>
            </button>

            {isOpen && (
              <div style={{ background: th.card, border: `1px solid ${th.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "4px 14px 14px", marginTop: -6 }}>
                {sec.body.map((para, i) => (
                  <p key={i} style={{ fontSize: 13, color: th.text, lineHeight: 1.6, margin: "10px 0" }}>{para}</p>
                ))}
                <div style={{ background: accent + "10", border: `1px solid ${accent}30`, borderRadius: 10, padding: "10px 12px", marginTop: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: accent, marginBottom: 4, letterSpacing: 0.3 }}>{t(lang, "howToChoose")}</div>
                  <div style={{ fontSize: 12.5, color: th.text, lineHeight: 1.55 }}>{sec.howToChoose}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
