export function getColorClasses(hexColor: string) {
  const colorMap: Record<string, { header: string; body: string; border: string }> = {
    "#2563eb": { header: "bg-blue-600 dark:bg-blue-700", body: "bg-blue-50/50 dark:bg-slate-900/50", border: "border-blue-100 dark:border-slate-800" },
    "#0ea5e9": { header: "bg-sky-600 dark:bg-sky-700", body: "bg-sky-50/50 dark:bg-slate-900/50", border: "border-sky-100 dark:border-slate-800" },
    "#14b8a6": { header: "bg-teal-500 dark:bg-teal-600", body: "bg-teal-50/50 dark:bg-slate-900/50", border: "border-teal-100 dark:border-slate-800" },
    "#f97316": { header: "bg-orange-500 dark:bg-orange-600", body: "bg-orange-50/50 dark:bg-slate-900/50", border: "border-orange-100 dark:border-slate-800" },
    "#ec4899": { header: "bg-pink-500 dark:bg-pink-600", body: "bg-pink-50/50 dark:bg-slate-900/50", border: "border-pink-100 dark:border-slate-800" },
    "#8b5cf6": { header: "bg-purple-600 dark:bg-purple-700", body: "bg-purple-50/50 dark:bg-slate-900/50", border: "border-purple-100 dark:border-slate-800" },
    "#22c55e": { header: "bg-green-500 dark:bg-green-600", body: "bg-green-50/50 dark:bg-slate-900/50", border: "border-green-100 dark:border-slate-800" },
    "#f59e0b": { header: "bg-amber-500 dark:bg-amber-600", body: "bg-amber-50/50 dark:bg-slate-900/50", border: "border-amber-100 dark:border-slate-800" },
    "#ef4444": { header: "bg-red-500 dark:bg-red-600", body: "bg-red-50/50 dark:bg-slate-900/50", border: "border-red-100 dark:border-slate-800" },
    "#6366f1": { header: "bg-indigo-600 dark:bg-indigo-700", body: "bg-indigo-50/50 dark:bg-slate-900/50", border: "border-indigo-100 dark:border-slate-800" },
  };
  
  const normalized = hexColor.toLowerCase();
  return colorMap[normalized] || colorMap["#2563eb"];
}

