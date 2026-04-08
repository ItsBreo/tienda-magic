import React from "react";
import { Category, SortMode } from "./types";

export const C = {
  bg:            "#09090b",
  surface:       "#18181b",
  surface2:      "#27272a",
  border:        "#3f3f46",
  border2:       "#52525b",
  textPrimary:   "#f4f4f5",
  textSecondary: "#a1a1aa",
  textMuted:     "#71717a",
  accent:        "#3b82f6",
  accentHover:   "#2563eb",
  red:           "#ef4444",
  green:         "#22c55e",
} as const;

export const FONT = "system-ui, -apple-system, sans-serif";

export const RULES = [
  "Sé respetuoso con la comunidad",
  "Usa las etiquetas correctas al postear",
  "No spam ni autopromoción",
  "Marca spoilers con la etiqueta #spoiler",
];

export const CAT_LABELS: Record<Category, string> = {
  noticias: "Noticias", estrategia: "Estrategia", torneos: "Torneos", general: "General",
};

export const CAT_STYLE: Record<Category, React.CSSProperties> = {
  noticias:   { background: "rgba(59,130,246,.15)",  color: "#5b96f7", border: "1px solid rgba(59,130,246,.3)"   },
  estrategia: { background: "rgba(74,222,128,.12)",  color: "#4ade80", border: "1px solid rgba(74,222,128,.3)"   },
  torneos:    { background: "rgba(248,113,113,.12)", color: "#f87171", border: "1px solid rgba(248,113,113,.3)"  },
  general:    { background: "rgba(137,137,137,.15)", color: "#b0b4b8", border: "1px solid rgba(137,137,137,.3)"  },
};

export const SORT_LABELS: Record<SortMode, string> = {
  hot:"⚡ Hot", nuevo:"🆕 Nuevo", top:"📈 Top", comentado:"💬 Comentado",
};
