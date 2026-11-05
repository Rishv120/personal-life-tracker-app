export const STORAGE_KEY = "personal-life-os-v1";
export const DEFAULT_HABITS = ["Exercise", "Read", "Deep work", "Mobility", "Sleep on time"];
export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.tasks) && Array.isArray(saved.habits)) {
      return { tasks: saved.tasks, habits: saved.habits, journal: saved.journal || {}, checks: saved.checks || {} };
    }
  } catch (error) { console.warn("Could not load saved data:", error); }
  return { tasks: [], habits: [...DEFAULT_HABITS], journal: {}, checks: {} };
}
export function saveState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
export function exportBackup(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `personal-life-os-backup-${localDate()}.json`; link.click();
  URL.revokeObjectURL(url);
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}