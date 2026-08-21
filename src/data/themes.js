export const THEMES = {
  dark: { id: "dark", label: "Dark", labelAr: "داكن", bg: "#0d1117", card: "#161b22", border: "#21262d", borderLight: "#30363d", text: "#e6edf3", textMuted: "#7d8590", textFaint: "#484f58" },
  blue: { id: "blue", label: "Ocean", labelAr: "أزرق", bg: "#0a1628", card: "#0f1f3d", border: "#1a2d52", borderLight: "#254170", text: "#e0eaff", textMuted: "#8aa4cf", textFaint: "#4d6a99" },
  pink: { id: "pink", label: "Rose", labelAr: "وردي", bg: "#1a0a14", card: "#261220", border: "#3d1a30", borderLight: "#5c2848", text: "#fce4ec", textMuted: "#c48b9f", textFaint: "#7a4d60", accent: "#ff4081" },
  light: { id: "light", label: "Light", labelAr: "فاتح", bg: "#f6f1f4", card: "#ffffff", border: "#e8dce3", borderLight: "#d4c4ce", text: "#1a1a2e", textMuted: "#6b5c65", textFaint: "#9a8a93", accent: "#e91e7a" },
  blossom: { id: "blossom", label: "Blossom", labelAr: "زهري", bg: "#fff0f5", card: "#ffffff", border: "#ffd6e7", borderLight: "#ffb3d1", text: "#2d1a24", textMuted: "#8c6278", textFaint: "#b8929f", accent: "#ff1493" },
};

import { WORKOUTS } from "./workouts";

export function wkColor(themeId, key) {
  if (key === "REST") return themeId === "light" || themeId === "blossom" ? "#9a8a93" : "#7d8590";
  if (themeId === "blossom") return ({ UB1: "#ff1493", LB1: "#ff69b4", UB2: "#e91e7a", LB2: "#c71585" })[key];
  if (themeId === "light") return ({ UB1: "#0097a7", LB1: "#e91e7a", UB2: "#f57c00", LB2: "#7b1fa2" })[key];
  return WORKOUTS[key]?.color || "#7d8590";
}

export function isLightTheme(themeId) {
  return themeId === "light" || themeId === "blossom";
}
