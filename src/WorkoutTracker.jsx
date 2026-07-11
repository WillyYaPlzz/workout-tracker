import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const THEMES = {
  dark: {
    id: "dark", label: "Dark", labelAr: "داكن",
    bg: "#0d1117", card: "#161b22", border: "#21262d", borderLight: "#30363d",
    text: "#e6edf3", textMuted: "#7d8590", textFaint: "#484f58",
    accent: null,
  },
  blue: {
    id: "blue", label: "Ocean", labelAr: "أزرق",
    bg: "#0a1628", card: "#0f1f3d", border: "#1a2d52", borderLight: "#254170",
    text: "#e0eaff", textMuted: "#8aa4cf", textFaint: "#4d6a99",
    accent: null,
  },
  pink: {
    id: "pink", label: "Rose", labelAr: "وردي",
    bg: "#1a0a14", card: "#261220", border: "#3d1a30", borderLight: "#5c2848",
    text: "#fce4ec", textMuted: "#c48b9f", textFaint: "#7a4d60",
    accent: "#ff4081",
  },
  light: {
    id: "light", label: "Light", labelAr: "فاتح",
    bg: "#f6f1f4", card: "#ffffff", border: "#e8dce3", borderLight: "#d4c4ce",
    text: "#1a1a2e", textMuted: "#6b5c65", textFaint: "#9a8a93",
    accent: "#e91e7a",
  },
  blossom: {
    id: "blossom", label: "Blossom", labelAr: "زهري",
    bg: "#fff0f5", card: "#ffffff", border: "#ffd6e7", borderLight: "#ffb3d1",
    text: "#2d1a24", textMuted: "#8c6278", textFaint: "#b8929f",
    accent: "#ff1493",
  },
};

const LANG = {
  en: {
    title: "Workout Program", workout: "Workout", dashboard: "Dashboard",
    setsReps: "2-4 sets · 8-12 reps", completeToday: "Complete Today", reset: "Reset",
    pickWorkout: "Pick a workout to view progress", sessions: "sessions",
    best: "Best", personalBest: "Personal Best",
    noData: "No data yet — complete a workout to start tracking",
    all: "All", notes: "Notes...", video: "Video", theme: "Theme", dir: "ltr",
  },
  ar: {
    title: "برنامج التمارين", workout: "التمرين", dashboard: "لوحة التحكم",
    setsReps: "2-4 جولات · 8-12 تكرار", completeToday: "إكمال اليوم", reset: "إعادة تعيين",
    pickWorkout: "اختر تمرين لعرض التقدم", sessions: "جلسات",
    best: "أفضل", personalBest: "أفضل رقم شخصي",
    noData: "لا توجد بيانات — أكمل تمريناً لبدء التتبع",
    all: "الكل", notes: "ملاحظات...", video: "فيديو", theme: "المظهر", dir: "rtl",
  },
};

const WORKOUTS = {
  UB1: {
    name: { en: "Upper Body 1", ar: "الجزء العلوي" },
    subtitle: { en: "Chest · Shoulders · Triceps", ar: "صدر · اكتاف · تراي" },
    color: "#00e5ff",
    exercises: [
      { id: "ub1-1", name: { en: "Flat Chest Press", ar: "صدر مستوي" }, options: { en: ["Bar", "Dumbbells", "Machine"], ar: ["بار", "دمبلز", "جهاز"] }, links: ["https://youtu.be/j7sCaOJv70g", "https://youtu.be/t90Vb6IBi0E", "https://youtu.be/5t7V28ouaZM"], target: { en: "Mid chest", ar: "منتصف الصدر" } },
      { id: "ub1-2", name: { en: "Chest Fly", ar: "تفتيح" }, options: { en: ["Machine", "Dumbbells"], ar: ["جهاز", "دمبلز"] }, links: ["https://youtube.com/shorts/bmzOhtBNNe0", "https://youtube.com/shorts/qTXCC-DxTn0"], target: { en: "Full chest", ar: "كامل الصدر" } },
      { id: "ub1-3", name: { en: "Incline Chest Press", ar: "صدر علوي" }, options: { en: ["Dumbbells", "Smith", "Machine"], ar: ["دمبلز", "سميث", "جهاز"] }, links: ["https://youtu.be/IP4oeKh1Sd4", "https://youtube.com/shorts/V97zLZ_21jQ", "https://youtu.be/rVh0tKDnYvs"], target: { en: "Upper chest", ar: "أعلى الصدر" } },
      { id: "ub1-4", name: { en: "Shoulder Press", ar: "تجميع كتف" }, options: { en: ["Dumbbells", "Machine", "Smith"], ar: ["دمبلز", "جهاز", "سميث"] }, links: ["https://youtube.com/shorts/0PNciMQXgBo", "https://youtu.be/GcY6TZxfS0k", "https://youtube.com/shorts/DcyCS15CB5A"], target: { en: "Front delt 70%, side 30%", ar: "الكتف الأمامي 70% والجانبي 30%" } },
      { id: "ub1-5", name: { en: "Lateral Raise", ar: "رفرفة جانبي" }, options: { en: ["Cable", "Dumbbells"], ar: ["كيبل", "دمبلز"] }, links: ["https://youtube.com/shorts/TbWTtxG6Iuw", "https://youtube.com/shorts/qYkRsGiUyrQ"], target: { en: "Side deltoid", ar: "الكتف الجانبي" } },
      { id: "ub1-6", name: { en: "Triceps (Long Head)", ar: "ترايسبس (رأس طويل)" }, options: { en: ["Cable", "Dumbbells"], ar: ["كيبل", "دمبلز"] }, links: ["https://youtube.com/shorts/92q_fdxLyp8", "https://youtube.com/shorts/T3e390Dl3XU"], target: { en: "Triceps long head", ar: "الرأس الطويل من التراي" } },
      { id: "ub1-7", name: { en: "Triceps (Lateral Head)", ar: "ترايسبس (رأس جانبي)" }, options: { en: ["Rope", "Bar", "Cable"], ar: ["روب", "مسطرة", "كيبل"] }, links: ["https://youtube.com/shorts/ZAXkv_sWFww", "https://youtube.com/shorts/L9mJCdhWBnY", "https://youtube.com/shorts/KweUYETA8RU"], target: { en: "Triceps lateral head", ar: "الرأس الجانبي من التراي" } },
    ],
  },
  LB1: {
    name: { en: "Legs 1", ar: "الأرجل" },
    subtitle: { en: "Quads · Glutes · Abs", ar: "أفخاذ · قلوتس · بطن" },
    color: "#ff5252",
    exercises: [
      { id: "lb1-1", name: { en: "Squat", ar: "سكوات" }, options: { en: ["Squat", "Hack Squat"], ar: ["سكوات", "هاك سكوات"] }, links: ["https://youtube.com/shorts/Lq9bf_QUSns", "https://youtu.be/u_1a0nWG7vQ"], target: { en: "Front quads", ar: "الأفخاذ الأمامية" } },
      { id: "lb1-2", name: { en: "Leg Curls", ar: "Leg Curls" }, options: { en: ["Laying", "Seated", "Standing"], ar: ["Laying", "Seated", "Standing"] }, links: ["https://youtube.com/shorts/I3MdbhUBZ1Q", "https://youtube.com/shorts/OzD4NLn2W6c", "https://youtube.com/shorts/i6zmbXp4Ico"], target: { en: "Hamstrings & glutes", ar: "الأفخاذ الخلفية والقلوتس" } },
      { id: "lb1-3", name: { en: "Leg Extensions", ar: "Leg Extensions" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtu.be/4ZDm5EbiFI8"], target: { en: "Front quads", ar: "الأفخاذ الأمامية" } },
      { id: "lb1-4", name: { en: "Hip Adduction", ar: "Hip Adduction" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtu.be/CjAVezAggkI"], target: { en: "Inner thigh", ar: "العضلات الداخلية للفخذ" } },
      { id: "lb1-5", name: { en: "Hip Abduction", ar: "Hip Abduction" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtu.be/G_8LItOiZ0Q"], target: { en: "Glutes", ar: "القلوتس" } },
      { id: "lb1-6", name: { en: "Abs", ar: "بطن" }, options: { en: ["Bodyweight", "Machine"], ar: ["وزن الجسم", "جهاز"] }, links: ["https://youtu.be/XcK3ptDLyqg", "https://youtube.com/shorts/p4ZLXSKXZec"], target: { en: "Abdominals", ar: "عضلات البطن" } },
    ],
  },
  UB2: {
    name: { en: "Upper Body 2", ar: "الجزء العلوي 2" },
    subtitle: { en: "Back · Rear Delts · Biceps", ar: "ظهر · اكتاف خلفية · باي" },
    color: "#ffab40",
    exercises: [
      { id: "ub2-1", name: { en: "Lat Pulldown", ar: "Lat Pulldown" }, options: { en: ["Lat Pulldown", "Pull-ups"], ar: ["Lat Pulldown", "عقلة"] }, links: ["https://youtube.com/shorts/CC45F_iEvdU", "https://youtube.com/shorts/HCWxQ3FAuy8"], target: { en: "Upper back & lats", ar: "الجزء العلوي من الظهر واللاتس" } },
      { id: "ub2-2", name: { en: "Seated Row", ar: "سحب أرضي" }, options: { en: ["Machine", "Dumbbell"], ar: ["جهاز", "دمبل"] }, links: ["https://youtube.com/shorts/3cR8rElT5sY", "https://youtu.be/9vgyN3PCX1c"], target: { en: "Lats & mid back", ar: "اللاتس ومنتصف الظهر" } },
      { id: "ub2-3", name: { en: "Rear Delts", ar: "اكتاف خلفية" }, options: { en: ["Cable", "Rope", "Machine"], ar: ["كيبل", "روب", "جهاز"] }, links: ["https://youtube.com/shorts/iidcl0mf_4c", "https://youtube.com/shorts/-SGMVsvtry4", "https://youtube.com/shorts/duX8kVQDpPg"], target: { en: "Rear deltoids", ar: "الجزء الخلفي من الأكتاف" } },
      { id: "ub2-4", name: { en: "Lower Back", ar: "اسفل الظهر" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtube.com/shorts/peFhyj7hZ6U"], target: { en: "Lower back", ar: "اسفل الظهر" } },
      { id: "ub2-5", name: { en: "Biceps (Short Head)", ar: "بايسبس (رأس قصير)" }, options: { en: ["Machine", "Dumbbells"], ar: ["جهاز", "دمبلز"] }, links: ["https://youtube.com/shorts/Q3_ETmzRUvA", "https://youtube.com/shorts/oHHNXMLvs1c"], target: { en: "Biceps short head", ar: "الرأس القصير للباي" } },
      { id: "ub2-6", name: { en: "Biceps (Long Head)", ar: "بايسبس (رأس طويل)" }, options: { en: ["Cable", "Dumbbells"], ar: ["كيبل", "دمبلز"] }, links: ["https://youtube.com/shorts/frXyhWJm0zQ", "https://youtube.com/shorts/4yFONULU_Oo"], target: { en: "Biceps long head", ar: "الرأس الطويل للباي" } },
    ],
  },
  LB2: {
    name: { en: "Legs 2", ar: "الأرجل 2" },
    subtitle: { en: "Quads · Glutes · Calves", ar: "أفخاذ · أرداف · بطات" },
    color: "#b388ff",
    exercises: [
      { id: "lb2-1", name: { en: "Leg Press", ar: "Leg Press" }, options: { en: ["Leg Press", "Leg Press Machine"], ar: ["Leg Press", "Leg Press Machine"] }, links: ["https://youtube.com/shorts/BKbL-mD53Bs", "https://youtube.com/shorts/KwDFg-BuqlE"], target: { en: "Front quads & glutes", ar: "الأفخاذ الأمامية والقلوتس" } },
      { id: "lb2-2", name: { en: "Leg Curls", ar: "Leg Curls" }, options: { en: ["Laying", "Seated", "Standing"], ar: ["Laying", "Seated", "Standing"] }, links: ["https://youtube.com/shorts/I3MdbhUBZ1Q", "https://youtube.com/shorts/OzD4NLn2W6c", "https://youtube.com/shorts/i6zmbXp4Ico"], target: { en: "Hamstrings & glutes", ar: "الأفخاذ الخلفية والقلوتس" } },
      { id: "lb2-3", name: { en: "Leg Extension", ar: "Leg Extension" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtube.com/shorts/nKfLrPQD_-I"], target: { en: "Front quads", ar: "الأفخاذ الأمامية" } },
      { id: "lb2-4", name: { en: "Glute Kickbacks", ar: "Glute Kickbacks" }, options: { en: ["Machine", "Cable"], ar: ["جهاز", "كيبل"] }, links: ["https://youtu.be/pnTksSV9ldc", "https://youtu.be/SqO-VUEak2M"], target: { en: "Glutes", ar: "الأرداف" } },
      { id: "lb2-5", name: { en: "Hip Thrust", ar: "Hip Thrust" }, options: { en: ["Machine", "Barbell"], ar: ["Machine", "Barbell"] }, links: ["https://youtube.com/shorts/V74XWj9FXAc", "https://youtu.be/aweBS7K71l8"], target: { en: "Glutes", ar: "الأرداف" } },
      { id: "lb2-6", name: { en: "Calves", ar: "بطات" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtube.com/shorts/ikbFbq-7cmk"], target: { en: "Calves", ar: "البطات" } },
    ],
  },
};

const TABS = ["UB1", "LB1", "UB2", "LB2"];
const TIME_RANGES = [
  { label: "1W", days: 7 }, { label: "1M", days: 30 },
  { label: "3M", days: 90 }, { label: { en: "All", ar: "الكل" }, days: 9999 },
];

function getToday() { return new Date().toISOString().split("T")[0]; }
function loadJSON(key, fb) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; } }
function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function initExerciseData() {
  const data = {};
  for (const [key, workout] of Object.entries(WORKOUTS)) {
    data[key] = {};
    for (const ex of workout.exercises) {
      data[key][ex.id] = { equipment: 0, sets: 3, setData: [{ weight: "", reps: "" }, { weight: "", reps: "" }, { weight: "", reps: "" }], notes: "", completed: false };
    }
  }
  return data;
}

function CustomTooltip({ active, payload, label, color, maxWeight, lang }) {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0].value;
  const isMax = val === maxWeight;
  return (
    <div style={{ background: "rgba(0,0,0,0.85)", border: `1px solid ${isMax ? "#ffd700" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: isMax ? "#ffd700" : color }}>{val} kg</div>
      {isMax && <div style={{ fontSize: 10, color: "#ffd700", fontWeight: 600, marginTop: 2 }}>⭐ {LANG[lang].personalBest}</div>}
    </div>
  );
}

function VideoBtn({ link, lang, color }) {
  if (!link) return null;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: 4, background: color + "15", color, border: `1px solid ${color}30`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z"/></svg>
      {LANG[lang].video}
    </a>
  );
}

export default function WorkoutTracker() {
  const [themeId, setThemeId] = useState(() => loadJSON("wt-theme", "dark"));
  const [lang, setLang] = useState(() => loadJSON("wt-lang", "en"));
  const [activeTab, setActiveTab] = useState("UB1");
  const [exerciseData, setExerciseData] = useState(() => {
    const saved = loadJSON("wt-exercises", null);
    if (!saved) return initExerciseData();
    const defaults = initExerciseData();
    for (const wk of TABS) { if (!saved[wk]) saved[wk] = defaults[wk]; for (const e of WORKOUTS[wk].exercises) { if (!saved[wk][e.id]) saved[wk][e.id] = defaults[wk][e.id]; } }
    return saved;
  });
  const [history, setHistory] = useState(() => loadJSON("wt-history", {}));
  const [view, setView] = useState("workout");
  const [dashWorkout, setDashWorkout] = useState(null);
  const [dashExercise, setDashExercise] = useState(null);
  const [timeRange, setTimeRange] = useState(90);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const th = THEMES[themeId] || THEMES.dark;
  const t = LANG[lang];
  const isRtl = lang === "ar";
  const isLight = themeId === "light" || themeId === "blossom";

  function toggleLang() { const n = lang === "en" ? "ar" : "en"; setLang(n); saveJSON("wt-lang", n); }
  function setTheme(id) { setThemeId(id); saveJSON("wt-theme", id); setShowThemePicker(false); }
  function L(obj) { return typeof obj === "string" ? obj : obj[lang] || obj.en; }

  function wkColor(key) {
    if (!th.accent) return WORKOUTS[key].color;
    if (themeId === "blossom") {
      const pinks = { UB1: "#ff1493", LB1: "#ff69b4", UB2: "#e91e7a", LB2: "#c71585" };
      return pinks[key];
    }
    if (themeId === "light") {
      const mapped = { UB1: "#0097a7", LB1: "#e91e7a", UB2: "#f57c00", LB2: "#7b1fa2" };
      return mapped[key];
    }
    return WORKOUTS[key].color;
  }

  function updateExercise(workoutKey, exId, field, value) {
    setExerciseData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const ex = next[workoutKey][exId];
      if (field === "sets") { const n = parseInt(value); ex.sets = n; while (ex.setData.length < n) ex.setData.push({ weight: "", reps: "" }); ex.setData = ex.setData.slice(0, n); }
      else if (field === "equipment") ex.equipment = parseInt(value);
      else if (field === "notes") ex.notes = value;
      else if (field === "completed") ex.completed = value;
      else if (field.startsWith("set-")) { const [, idx, prop] = field.split("-"); ex.setData[parseInt(idx)][prop] = value; }
      saveJSON("wt-exercises", next);
      return next;
    });
  }

  function completeToday() {
    const today = getToday();
    const snapshot = {};
    for (const ex of WORKOUTS[activeTab].exercises) {
      const d = exerciseData[activeTab][ex.id];
      if (d.completed) {
        const maxW = Math.max(...d.setData.map((s) => parseFloat(s.weight) || 0));
        snapshot[ex.id] = { equipment: d.equipment, sets: d.sets, setData: JSON.parse(JSON.stringify(d.setData)), maxWeight: maxW, notes: d.notes };
      }
    }
    setHistory((prev) => { const next = { ...JSON.parse(JSON.stringify(prev)) }; if (!next[activeTab]) next[activeTab] = {}; next[activeTab][today] = snapshot; saveJSON("wt-history", next); return next; });
  }

  function resetDay() {
    setExerciseData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const defaults = initExerciseData();
      for (const ex of WORKOUTS[activeTab].exercises) { next[activeTab][ex.id] = { ...defaults[activeTab][ex.id], equipment: next[activeTab][ex.id].equipment }; }
      saveJSON("wt-exercises", next);
      return next;
    });
  }

  function getChartData(workoutKey, exId) {
    const wkHist = history[workoutKey]; if (!wkHist) return [];
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - timeRange);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return Object.keys(wkHist).sort().filter(d => timeRange >= 9999 || d >= cutoffStr).map(date => {
      const entry = wkHist[date][exId];
      return entry && entry.maxWeight > 0 ? { date: date.slice(5), weight: entry.maxWeight } : null;
    }).filter(Boolean);
  }

  const workout = WORKOUTS[activeTab];
  const exercises = workout.exercises;
  const color = wkColor(activeTab);
  const completedCount = exercises.filter((e) => exerciseData[activeTab][e.id].completed).length;
  const progress = Math.round((completedCount / exercises.length) * 100);

  const inputBg = isLight ? "#f0e8ed" : th.bg;
  const inputBorder = th.borderLight;
  const inputColor = th.text;
  const btnBg = isLight ? "#f0e8ed" : th.border;

  return (
    <div dir={t.dir} style={{ background: th.bg, color: th.text, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))", position: "relative" }}>
      {/* iOS safe area spacer */}
      <div style={{ height: "env(safe-area-inset-top, 0px)", minHeight: 20 }} />

      <div style={{ padding: "16px 16px 0", maxWidth: 600, margin: "0 auto" }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{t.title}</h1>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setShowThemePicker(!showThemePicker)}
              style={{ background: btnBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "6px 8px", fontSize: 14, cursor: "pointer", lineHeight: 1 }}>
              🎨
            </button>
            <button onClick={toggleLang}
              style={{ background: btnBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
              {lang === "en" ? "عربي" : "EN"}
            </button>
            {["workout", "dashboard"].map((v) => (
              <button key={v} onClick={() => { setView(v); if (v === "dashboard") setDashWorkout(null); }}
                style={{
                  background: view === v ? btnBg : "transparent", color: view === v ? th.text : th.textMuted,
                  border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500,
                }}>
                {v === "workout" ? t.workout : t.dashboard}
              </button>
            ))}
          </div>
        </div>

        {/* Theme picker */}
        {showThemePicker && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {Object.values(THEMES).map((tm) => (
              <button key={tm.id} onClick={() => setTheme(tm.id)}
                style={{
                  flex: 1, minWidth: 60, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                  background: themeId === tm.id ? (tm.accent || "#00e5ff") + "20" : tm.card,
                  border: themeId === tm.id ? `2px solid ${tm.accent || "#00e5ff"}` : `1px solid ${tm.border}`,
                  color: themeId === tm.id ? (tm.accent || "#00e5ff") : tm.text,
                  fontSize: 12, fontWeight: 600,
                }}>
                {lang === "ar" ? tm.labelAr : tm.label}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {TABS.map((tb) => {
            const isActive = view === "workout" ? activeTab === tb : dashWorkout === tb;
            const c = wkColor(tb);
            return (
              <button key={tb} onClick={() => { setActiveTab(tb); if (view === "dashboard") { setDashWorkout(tb); setDashExercise(null); } }}
                style={{
                  flex: 1, padding: "10px 0",
                  background: isActive ? c + "18" : th.card,
                  color: isActive ? c : th.textMuted,
                  border: isActive ? `1.5px solid ${c}40` : `1px solid ${th.border}`,
                  borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}>{tb}</button>
            );
          })}
        </div>
      </div>

      {view === "workout" ? (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
          {/* Header card */}
          <div style={{ background: th.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${th.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color }}>{L(workout.name)}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: th.textMuted }}>{L(workout.subtitle)}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: th.textFaint }}>{t.setsReps}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color }}>{progress}%</div>
                <div style={{ fontSize: 11, color: th.textFaint }}>{completedCount}/{exercises.length}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, background: th.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
            </div>
          </div>

          {/* Exercises */}
          {exercises.map((ex, i) => {
            const data = exerciseData[activeTab][ex.id];
            const opts = L(ex.options);
            const currentLink = ex.links[data.equipment] || ex.links[0];
            return (
              <div key={ex.id} style={{
                background: data.completed ? th.card + "80" : th.card, borderRadius: 12, padding: 14, marginBottom: 8,
                border: data.completed ? `1px solid ${color}30` : `1px solid ${th.border}`, opacity: data.completed ? 0.7 : 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <button onClick={() => updateExercise(activeTab, ex.id, "completed", !data.completed)}
                    style={{
                      width: 28, height: 28, borderRadius: 8, border: `2px solid ${data.completed ? color : th.borderLight}`,
                      background: data.completed ? color : "transparent", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                    {data.completed && <span style={{ color: isLight ? "#fff" : th.bg, fontSize: 14, fontWeight: 700 }}>✓</span>}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: data.completed ? th.textMuted : th.text, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ color: th.textFaint, fontSize: 12 }}>{i + 1}.</span>
                      <span>{L(ex.name)}</span>
                      <VideoBtn link={currentLink} lang={lang} color={color} />
                    </div>
                    <div style={{ fontSize: 11, color: th.textFaint, marginTop: 2 }}>{L(ex.target)}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <select value={data.equipment} onChange={(e) => updateExercise(activeTab, ex.id, "equipment", e.target.value)}
                    style={{ flex: 1, minWidth: 120, background: inputBg, color: inputColor, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, outline: "none", direction: "ltr" }}>
                    {opts.map((o, oi) => <option key={oi} value={oi}>{o}</option>)}
                  </select>
                  <div style={{ display: "flex", background: inputBg, borderRadius: 8, border: `1px solid ${inputBorder}`, overflow: "hidden" }}>
                    {[2, 3, 4].map((n) => (
                      <button key={n} onClick={() => updateExercise(activeTab, ex.id, "sets", n)}
                        style={{
                          width: 36, height: 34, border: "none",
                          background: data.sets === n ? color + "30" : "transparent",
                          color: data.sets === n ? color : th.textMuted,
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                          borderRight: n < 4 ? `1px solid ${inputBorder}` : "none",
                        }}>{n}s</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {data.setData.map((s, si) => (
                    <div key={si} style={{ display: "flex", gap: 6, alignItems: "center", direction: "ltr" }}>
                      <span style={{ fontSize: 11, color: th.textFaint, width: 20, textAlign: "center", flexShrink: 0 }}>S{si + 1}</span>
                      <div style={{ position: "relative", flex: 1 }}>
                        <input type="number" inputMode="decimal" placeholder="kg" value={s.weight}
                          onChange={(e) => updateExercise(activeTab, ex.id, `set-${si}-weight`, e.target.value)}
                          style={{ width: "100%", background: inputBg, color: inputColor, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "7px 30px 7px 10px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: th.textFaint, pointerEvents: "none" }}>kg</span>
                      </div>
                      <div style={{ position: "relative", flex: 1 }}>
                        <input type="number" inputMode="numeric" placeholder="reps" value={s.reps}
                          onChange={(e) => updateExercise(activeTab, ex.id, `set-${si}-reps`, e.target.value)}
                          style={{ width: "100%", background: inputBg, color: inputColor, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "7px 38px 7px 10px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: th.textFaint, pointerEvents: "none" }}>reps</span>
                      </div>
                    </div>
                  ))}
                </div>

                <input type="text" placeholder={t.notes} value={data.notes}
                  onChange={(e) => updateExercise(activeTab, ex.id, "notes", e.target.value)}
                  style={{ width: "100%", background: inputBg, color: inputColor, border: `1px solid ${th.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none", marginTop: 8, boxSizing: "border-box" }} />
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={completeToday} disabled={completedCount === 0}
              style={{ flex: 1, padding: "14px 0", background: color, color: isLight ? "#fff" : th.bg, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: completedCount === 0 ? 0.4 : 1 }}>
              {t.completeToday}
            </button>
            <button onClick={resetDay}
              style={{ padding: "14px 18px", background: btnBg, color: th.textMuted, border: `1px solid ${th.borderLight}`, borderRadius: 12, fontSize: 13, cursor: "pointer" }}>
              {t.reset}
            </button>
          </div>
        </div>
      ) : (
        /* DASHBOARD */
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
          {!dashWorkout ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 14, color: th.textMuted, margin: "0 0 4px" }}>{t.pickWorkout}</p>
              {TABS.map((tb) => {
                const wk = WORKOUTS[tb]; const c = wkColor(tb);
                const totalSessions = history[tb] ? Object.keys(history[tb]).length : 0;
                return (
                  <button key={tb} onClick={() => { setDashWorkout(tb); setDashExercise(null); }}
                    style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 12, padding: "18px 16px", cursor: "pointer", textAlign: isRtl ? "right" : "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: c }}>{tb} — {L(wk.name)}</div>
                      <div style={{ fontSize: 12, color: th.textMuted, marginTop: 4 }}>{L(wk.subtitle)}</div>
                    </div>
                    <div style={{ textAlign: isRtl ? "left" : "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: th.text }}>{totalSessions}</div>
                      <div style={{ fontSize: 10, color: th.textFaint }}>{t.sessions}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <button onClick={() => { setDashWorkout(null); setDashExercise(null); }}
                  style={{ background: "none", border: "none", color: th.textMuted, fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>{isRtl ? "→" : "←"}</button>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: wkColor(dashWorkout) }}>
                  {dashWorkout} — {L(WORKOUTS[dashWorkout].name)}
                </h2>
              </div>

              <div style={{ display: "flex", gap: 4, marginBottom: 16, background: th.card, borderRadius: 8, padding: 3, border: `1px solid ${th.border}` }}>
                {TIME_RANGES.map((tr) => (
                  <button key={tr.days} onClick={() => setTimeRange(tr.days)}
                    style={{
                      flex: 1, padding: "7px 0", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: timeRange === tr.days ? wkColor(dashWorkout) + "25" : "transparent",
                      color: timeRange === tr.days ? wkColor(dashWorkout) : th.textMuted,
                    }}>{typeof tr.label === "string" ? tr.label : L(tr.label)}</button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                <button onClick={() => setDashExercise(null)}
                  style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${th.borderLight}`, fontSize: 12, cursor: "pointer", fontWeight: 500,
                    background: !dashExercise ? wkColor(dashWorkout) + "20" : th.card, color: !dashExercise ? wkColor(dashWorkout) : th.textMuted }}>{t.all}</button>
                {WORKOUTS[dashWorkout].exercises.map((ex) => (
                  <button key={ex.id} onClick={() => setDashExercise(ex.id)}
                    style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${th.borderLight}`, fontSize: 12, cursor: "pointer", fontWeight: 500,
                      background: dashExercise === ex.id ? wkColor(dashWorkout) + "20" : th.card, color: dashExercise === ex.id ? wkColor(dashWorkout) : th.textMuted }}>{L(ex.name)}</button>
                ))}
              </div>

              {WORKOUTS[dashWorkout].exercises.filter((ex) => !dashExercise || dashExercise === ex.id).map((ex) => {
                const chartData = getChartData(dashWorkout, ex.id);
                const maxWeight = chartData.length > 0 ? Math.max(...chartData.map((d) => d.weight)) : 0;
                const c = wkColor(dashWorkout);
                return (
                  <div key={ex.id} style={{ background: th.card, borderRadius: 12, padding: 16, marginBottom: 10, border: `1px solid ${th.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: th.text }}>{L(ex.name)}</div>
                        <div style={{ fontSize: 11, color: th.textFaint, marginTop: 2 }}>{L(ex.target)}</div>
                      </div>
                      {maxWeight > 0 && (
                        <div style={{ textAlign: isRtl ? "left" : "right" }}>
                          <div style={{ fontSize: 10, color: th.textMuted }}>{t.best}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#ffd700" }}>{maxWeight}<span style={{ fontSize: 11, fontWeight: 400, color: th.textMuted }}> kg</span></div>
                        </div>
                      )}
                    </div>
                    {chartData.length > 0 ? (
                      <div dir="ltr">
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: th.textFaint }} axisLine={{ stroke: th.border }} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: th.textFaint }} axisLine={false} tickLine={false} domain={["dataMin - 5", "dataMax + 5"]} />
                            <Tooltip content={<CustomTooltip color={c} maxWeight={maxWeight} lang={lang} />} cursor={{ stroke: th.borderLight, strokeDasharray: "4 4" }} />
                            <ReferenceLine y={maxWeight} stroke="#ffd70040" strokeDasharray="3 3" />
                            <Line type="monotone" dataKey="weight" stroke={c} strokeWidth={2.5} dot={{ fill: c, r: 4, strokeWidth: 0 }} activeDot={{ fill: th.text, stroke: c, strokeWidth: 2, r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ fontSize: 12, color: th.textFaint }}>{t.noData}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: "center", padding: "40px 16px 20px",
        maxWidth: 600, margin: "0 auto",
      }}>
        <p style={{ fontSize: 13, color: th.textFaint, fontWeight: 500, letterSpacing: "0.02em" }}>
          For my LOVLY Leen❤️ @ 2026
        </p>
      </div>
    </div>
  );
}
