import { Category, SortMode } from "./types";

export const RULES = [
  "Sé respetuoso con la comunidad",
  "Usa las etiquetas correctas al postear",
  "No spam ni autopromoción",
  "Marca spoilers con la etiqueta #spoiler",
];

export const CAT_LABELS: Record<Category, string> = {
  noticias: "Noticias",
  estrategia: "Estrategia",
  torneos: "Torneos",
  general: "General",
};

export const SORT_LABELS: Record<SortMode, string> = {
  hot:"⚡ Hot",
  nuevo:"🆕 Nuevo",
  top:"📈 Top"
};
