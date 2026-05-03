export const USERS = ["פואד", "חיסן"];

export const DEFAULT_CATEGORIES = [
  { id: "cat-food", name: "אוכל", target: 2000, owner: "חיסן" },
  { id: "cat-meat", name: "בשר", target: 1200, owner: "חיסן" },
  { id: "cat-veg", name: "ירקות", target: 900, owner: "חיסן" },
  { id: "cat-electricity", name: "חשמל", target: 450, owner: "פואד" },
  { id: "cat-water", name: "מים", target: 220, owner: "פואד" },
  { id: "cat-arnona", name: "ארנונה", target: 700, owner: "פואד" },
  { id: "cat-non-monthly", name: "הוצאות לא חודשיות", target: 1000, owner: "פואד" },
  { id: "cat-kids", name: "גנים", target: 3000, owner: "חיסן" },
  { id: "cat-fuel", name: "דלק", target: 900, owner: "פואד" },
  { id: "cat-health", name: "קופת חולים", target: 350, owner: "פואד" },
  { id: "cat-insurance", name: "ביטוח לאומי", target: 600, owner: "חיסן" }
];

export const STORAGE_KEYS = {
  expenses: "balance_expenses_v1",
  categories: "balance_categories_v1",
  history: "balance_monthly_history_v1"
};

export function formatCurrency(value) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function monthKey(dateString = new Date().toISOString()) {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
}

export function loadLocalStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
