import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Loader2, ReceiptText, Wallet } from "lucide-react";
import CategoryManager from "./components/CategoryManager";
import Dashboard from "./components/Dashboard";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseManager from "./components/ExpenseManager";
import RecurringAutoCard from "./components/RecurringAutoCard";
import { USERS, formatCurrency, monthKey, monthLabel } from "./utils";
import { useSupabaseRealtime } from "./hooks/useSupabaseRealtime";
import { migrateLocalStorageToSupabase } from "./utils/migrateLocalStorageToSupabase";
import { createCategory, deleteCategory, getCategories, updateCategory } from "./services/categoriesService";
import {
  createAutomaticExpenseIfMissing,
  createExpense,
  deleteExpense,
  deleteExpensesByMonth,
  getExpenses,
  updateExpense
} from "./services/expensesService";
import { getMonthlyHistory, saveMonthlySummary } from "./services/monthlyHistoryService";

function mergeById(list, item) {
  const index = list.findIndex((x) => x.id === item.id);
  if (index === -1) return [item, ...list];
  const next = [...list];
  next[index] = item;
  return next;
}

function removeById(list, id) {
  return list.filter((x) => x.id !== id);
}

export default function App() {
  const [activeView, setActiveView] = useState("כללי");
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const notify = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  const currentMonth = monthKey();
  const monthExpenses = useMemo(() => expenses.filter((e) => monthKey(e.expenseDate) === currentMonth), [expenses, currentMonth]);
  const categoriesById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const ensureAutomaticMonthlyExpenses = useCallback(async (cats) => {
    const month = monthKey();
    const firstDay = `${month}-01`;
    const automaticCategories = cats.filter((c) => c.isAuto);

    await Promise.all(
      automaticCategories.map(async (cat) => {
        await createAutomaticExpenseIfMissing({
          categoryId: cat.id,
          owner: cat.owner,
          paidBy: cat.owner,
          amount: Number(cat.target || 0),
          note: "הוצאה אוטומטית חודשית",
          expenseDate: firstDay,
          isAutomatic: true,
          automaticMonth: month
        });
      })
    );
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await migrateLocalStorageToSupabase();
      const [cats, exps, hist] = await Promise.all([getCategories(), getExpenses(), getMonthlyHistory()]);
      setCategories(cats);
      setExpenses(exps);
      setHistory(hist);
      await ensureAutomaticMonthlyExpenses(cats);
    } catch (e) {
      console.error(e);
      setError("שגיאה בטעינת הנתונים מ-Supabase");
    } finally {
      setLoading(false);
    }
  }, [ensureAutomaticMonthlyExpenses]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useSupabaseRealtime({
    onCategoryEvent: useCallback(({ eventType, row, old }) => {
      if (!row && !old) return;
      setCategories((prev) => {
        if (eventType === "DELETE") return removeById(prev, old.id);
        return mergeById(prev, row);
      });
    }, []),
    onExpenseEvent: useCallback(({ eventType, row, old }) => {
      if (!row && !old) return;
      setExpenses((prev) => {
        if (eventType === "DELETE") return removeById(prev, old.id);
        return mergeById(prev, row);
      });
    }, []),
    onHistoryEvent: useCallback(({ eventType, row, old }) => {
      if (!row && !old) return;
      setHistory((prev) => {
        if (eventType === "DELETE") return removeById(prev, old.id);
        return mergeById(prev, row).sort((a, b) => b.month.localeCompare(a.month));
      });
    }, [])
  });

  async function handleAddExpense({ amount, categoryId }) {
    try {
      const category = categoriesById[categoryId];
      if (!category) return;
      await createExpense({
        categoryId,
        owner: category.owner,
        paidBy: category.owner,
        amount: Number(amount || 0),
        note: "",
        expenseDate: new Date().toISOString().slice(0, 10),
        isAutomatic: false,
        automaticMonth: null
      });
      notify("הוצאה נוספה");
    } catch (e) {
      console.error(e);
      notify("שמירת הוצאה נכשלה");
    }
  }

  async function handleUpdateExpense(id, patch) {
    try {
      const existing = expenses.find((x) => x.id === id);
      if (!existing) return;
      const nextCategoryId = patch.categoryId || existing.categoryId;
      const nextCategory = categoriesById[nextCategoryId];
      await updateExpense(id, {
        categoryId: nextCategoryId,
        amount: patch.amount !== undefined ? Number(patch.amount || 0) : existing.amount,
        owner: nextCategory?.owner || existing.owner,
        paidBy: nextCategory?.owner || existing.paidBy,
        note: existing.note,
        expenseDate: existing.expenseDate,
        isAutomatic: existing.isAutomatic,
        automaticMonth: existing.automaticMonth
      });
      notify("הוצאה עודכנה");
    } catch (e) {
      console.error(e);
      notify("עדכון הוצאה נכשל");
    }
  }

  async function handleDeleteExpense(id) {
    if (!window.confirm("למחוק את ההוצאה הזו?")) return;
    try {
      await deleteExpense(id);
      notify("הוצאה נמחקה");
    } catch (e) {
      console.error(e);
      notify("מחיקת הוצאה נכשלה");
    }
  }

  async function handleAddCategory({ name, target, owner }) {
    try {
      await createCategory({ name, target, owner, isAuto: false });
      notify("קטגוריה נוספה");
    } catch (e) {
      console.error(e);
      notify("שמירת קטגוריה נכשלה");
    }
  }

  async function handleDeleteCategory(id) {
    if (!window.confirm("מחיקת קטגוריה תסיר גם הוצאות שקשורות אליה. להמשיך?")) return;
    try {
      await deleteCategory(id);
      notify("קטגוריה נמחקה");
    } catch (e) {
      console.error(e);
      notify("מחיקת קטגוריה נכשלה");
    }
  }

  async function handleUpdateCategory(id, patch) {
    try {
      await updateCategory(id, patch);
      notify("קטגוריה עודכנה");
    } catch (e) {
      console.error(e);
      notify("עדכון קטגוריה נכשל");
    }
  }

  async function closeMonth() {
    try {
      if (!monthExpenses.length) return;
      const byOwner = USERS.reduce((acc, u) => {
        acc[u] = monthExpenses.filter((e) => e.owner === u).reduce((s, e) => s + e.amount, 0);
        return acc;
      }, {});
      const byCategory = categories.reduce((acc, cat) => {
        acc[cat.name] = monthExpenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
        return acc;
      }, {});

      await saveMonthlySummary({
        month: currentMonth,
        totalBudget,
        totalExpenses: totalSpent,
        byOwner,
        byCategory
      });
      await deleteExpensesByMonth(currentMonth);

      notify("סיכום חודשי נשמר");
    } catch (e) {
      console.error(e);
      notify("שמירת סיכום חודשי נכשלה");
    }
  }

  const ownerViews = USERS.map((user) => {
    const ownedCategories = categories.filter((c) => c.owner === user);
    const ownedIds = new Set(ownedCategories.map((c) => c.id));
    const ownedExpenses = monthExpenses.filter((e) => ownedIds.has(e.categoryId));
    const ownedAutoExpenses = ownedExpenses.filter((e) => e.isAutomatic);
    return { user, ownedCategories, ownedExpenses, ownedAutoExpenses };
  });

  const activeOwner = ownerViews.find((x) => x.user === activeView);
  const scopeCategories = activeView === "כללי" ? categories : activeOwner?.ownedCategories || [];
  const scopeExpenses = activeView === "כללי" ? monthExpenses : activeOwner?.ownedExpenses || [];

  const totalSpent = scopeExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalBudget = scopeCategories.reduce((acc, c) => acc + Number(c.target || 0), 0);
  const remaining = totalBudget - totalSpent;

  const householdStatus = useMemo(() => {
    if (totalBudget <= 0) return "תקין";
    const ratio = totalSpent / totalBudget;
    if (ratio >= 1) return "חריגה";
    if (ratio >= 0.8) return "מתקרבים ליעד";
    return "תקין";
  }, [totalBudget, totalSpent]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-600">
        <div className="inline-flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> טוען נתונים...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <div className="bg-white border border-rose-200 text-rose-700 rounded-2xl p-6 max-w-md w-full text-center space-y-3">
          <p className="font-semibold">{error}</p>
          <button className="rounded-xl bg-slate-900 text-white px-4 py-2" onClick={loadAll}>נסה שוב</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm shadow-soft">{toast}</div>
      )}

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white">
                <ReceiptText className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-semibold tracking-tight">Balance</h1>
            </div>
            <p className="text-sm text-slate-500">ניהול הוצאות משפחתי</p>
          </div>
          <button onClick={closeMonth} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 text-sm">
            <Archive className="w-4 h-4" /> סיכום חודשי
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <Stat title="תקציב חודשי" value={formatCurrency(totalBudget)} />
          <Stat title="הוצאה חודשית" value={formatCurrency(totalSpent)} />
          <Stat title="נותר" value={formatCurrency(remaining)} color={remaining < 0 ? "text-rose-600" : "text-emerald-600"} />
          <Stat title="סטטוס" value={householdStatus} />
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6 pb-24">
        {activeView === "כללי" ? (
          <>
            <ExpenseForm categories={categories} onAddExpense={handleAddExpense} />
            <Dashboard categories={categories} expenses={monthExpenses} />

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
              <CategoryManager
                categories={categories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onUpdateTarget={(id, target) => handleUpdateCategory(id, { target })}
                onUpdateCategoryName={(id, name) => handleUpdateCategory(id, { name })}
                onUpdateCategoryOwner={(id, owner) => handleUpdateCategory(id, { owner })}
                onUpdateCategoryAutoConfig={(id, patch) => handleUpdateCategory(id, patch)}
              />
            </div>

            <ExpenseManager
              expenses={[...monthExpenses].sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))}
              categories={categories}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </>
        ) : (
          <>
            <ExpenseForm categories={activeOwner?.ownedCategories || []} onAddExpense={handleAddExpense} />
            <Dashboard categories={activeOwner?.ownedCategories || []} expenses={activeOwner?.ownedExpenses || []} />
            <RecurringAutoCard
              owner={activeOwner?.user || ""}
              autoExpenses={activeOwner?.ownedAutoExpenses || []}
              categories={categories}
              onUpdateAutoExpense={handleUpdateExpense}
            />
            <ExpenseManager
              expenses={activeOwner?.ownedExpenses || []}
              categories={activeOwner?.ownedCategories || []}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </>
        )}

        <section className="bg-white rounded-2xl shadow-soft border border-slate-100 p-5">
          <h2 className="font-semibold mb-3">היסטוריה חודשית</h2>
          <div className="space-y-2 max-h-56 overflow-auto">
            {history.length === 0 && <p className="text-sm text-slate-500">אין היסטוריה עדיין.</p>}
            {history.map((h) => (
              <div key={h.id} className="rounded-xl border border-slate-100 p-3 bg-slate-50 flex justify-between items-center">
                <p className="font-medium">{monthLabel(h.month)}</p>
                <p className="text-sm text-slate-600">{formatCurrency(h.totalExpenses)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-2 grid grid-cols-3 gap-2">
          {["כללי", "פואד", "חיסן"].map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`rounded-xl py-3 text-sm font-medium ${activeView === v ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </nav>

      <footer className="border-t border-slate-200 bg-white mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-slate-500 text-sm"><Wallet className="w-4 h-4" /> יתרה לחודש {monthLabel(currentMonth)}</div>
          <p className={`text-lg font-semibold ${remaining < 0 ? "text-rose-600" : "text-slate-900"}`}>{formatCurrency(remaining)}</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ title, value, color = "text-slate-900" }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 shadow-soft">
      <p className="text-xs text-slate-500">{title}</p>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}
