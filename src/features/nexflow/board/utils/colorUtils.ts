const DEFAULT_COLOR_MAP = {
  header: "bg-blue-600",
  body: "bg-blue-50/50",
  border: "border-blue-100",
} as const;

const colorMap: Record<string, { header: string; body: string; border: string }> = {
  "#2563eb": { ...DEFAULT_COLOR_MAP },
  "#0ea5e9": { header: "bg-sky-600", body: "bg-sky-50/50", border: "border-sky-100" },
  "#14b8a6": { header: "bg-teal-500", body: "bg-teal-50/50", border: "border-teal-100" },
  "#f97316": { header: "bg-orange-500", body: "bg-orange-50/50", border: "border-orange-100" },
  "#ec4899": { header: "bg-pink-500", body: "bg-pink-50/50", border: "border-pink-100" },
  "#8b5cf6": { header: "bg-purple-600", body: "bg-purple-50/50", border: "border-purple-100" },
  "#22c55e": { header: "bg-green-500", body: "bg-green-50/50", border: "border-green-100" },
  "#f59e0b": { header: "bg-amber-500", body: "bg-amber-50/50", border: "border-amber-100" },
  "#ef4444": { header: "bg-red-500", body: "bg-red-50/50", border: "border-red-100" },
  "#6366f1": { header: "bg-indigo-600", body: "bg-indigo-50/50", border: "border-indigo-100" },
};

/** Retorna classes Tailwind para header/body/border. Se a cor não estiver no mapa, header vem vazio para usar backgroundColor inline. */
export function getColorClasses(hexColor: string): { header: string; body: string; border: string } {
  const normalized = hexColor.toLowerCase().startsWith("#") ? hexColor.toLowerCase() : `#${hexColor.toLowerCase()}`;
  if (colorMap[normalized]) {
    return colorMap[normalized];
  }
  // Cor customizada: header vazio para o KanbanColumn usar style.backgroundColor com a hex
  return { header: "", body: DEFAULT_COLOR_MAP.body, border: DEFAULT_COLOR_MAP.border };
}

