import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  XCircle,
  Wallet
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { createCategory, deleteCategory, getCategories, updateCategory } from "./services/categoriesService";
import { createCancellation, deleteCancellation, getCancellations } from "./services/cancellationsService";
import { createAutomaticExpenseIfMissing, createExpense, deleteExpense, getExpenses } from "./services/expensesService";
import { createIncome, getIncomes } from "./services/incomesService";
import { useSupabaseRealtime } from "./hooks/useSupabaseRealtime";
import HebrewDateInput from "./components/HebrewDateInput";

const OWNER_TABS = ["פואד", "חיסן"];
const OWNERS = ["פואד", "חיסן"];
const INCOME_PAYMENT_METHODS = ["מזומן", "העברה בנקאית", "חוב"];
const CHILDREN = ["גוד", "אדם"];
const APP_PAGES = [
  { id: "settings", label: "הגדרות", icon: Settings }
];
const CHART_COLORS = [
  "#2FBFAD",
  "#FB923C",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#EAB308",
  "#EF4444",
  "#22C55E",
  "#6366F1",
  "#F43F5E"
];

const CATEGORY_TREE = [];

const CATEGORY_PARENT_BY_CHILD = CATEGORY_TREE.reduce((acc, group) => {
  acc[group.name] = group.name;
  group.children.forEach((child) => {
    acc[child] = group.name;
  });
  return acc;
}, {});

const money = (v) => `₪ ${Number(v || 0).toLocaleString("he-IL")}`;
const dateText = (iso) => new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "long", year: "numeric" });
const timeText = (iso) => (iso ? new Date(iso).toLocaleString("he-IL", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }) : "");
const monthKeyFromDate = (iso) => (iso ? iso.slice(0, 7) : "");
const currentDateKey = () => new Date().toISOString().slice(0, 10);
const truncateText = (text, max = 18) => (text.length > max ? `${text.slice(0, max)}...` : text);
const categoryParent = (category) => category?.parentName || CATEGORY_PARENT_BY_CHILD[category?.name] || category?.name || "ללא קטגוריה";
const categoryChildLabel = (category) => (category?.name === categoryParent(category) ? "כללי" : category?.name || "ללא תת קטגוריה");
const monthLabel = (monthKey) => new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
const currentMonthKey = () => new Date().toISOString().slice(0, 7);
const currentYear = () => new Date().getFullYear();
const monthOptions = Array.from({ length: 24 }, (_, index) => {
  const date = new Date();
  date.setMonth(date.getMonth() - index);
  return { value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, label: monthLabel(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`) };
}).reverse();

export default function App() {
  const [activePage, setActivePage] = useState("settings");
  const [activeTab, setActiveTab] = useState("כללי");
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [selectedYear, setSelectedYear] = useState(currentYear());
  const [showMonthDetails, setShowMonthDetails] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: "", categoryGroup: "", categoryId: "", description: "", owner: "פואד", expenseDate: currentDateKey() });
  const [incomeForm, setIncomeForm] = useState({ amount: "", source: "", owner: "פואד", paymentMethod: "מזומן", description: "", incomeDate: currentDateKey() });
  const [cancellationForm, setCancellationForm] = useState({ amount: "", clientName: "", note: "", cancellationDate: currentDateKey(), owner: "חיסן" });
  const [isExpenseSectionOpen, setIsExpenseSectionOpen] = useState(false);
  const [isIncomeSectionOpen, setIsIncomeSectionOpen] = useState(false);
  const [isCancellationSectionOpen, setIsCancellationSectionOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ parentName: "", name: "", target: "" });
  const [mainCategoryForm, setMainCategoryForm] = useState({ name: "", target: "", owner: "פואד" });
  const [childActivityForm, setChildActivityForm] = useState({ name: "", child: CHILDREN[0], target: "" });

  useEffect(() => {
    if (activeTab !== "כללי") {
      setExpenseForm((prev) => ({ ...prev, owner: activeTab }));
      setIncomeForm((prev) => ({ ...prev, owner: activeTab }));
      setCancellationForm((prev) => ({ ...prev, owner: activeTab }));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activePage !== "settings") {
      setIsExpenseSectionOpen(false);
      setIsIncomeSectionOpen(false);
      setIsCancellationSectionOpen(false);
    }
  }, [activePage]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [categoriesData, expensesData, incomesData, cancellationsData] = await Promise.all([getCategories(), getExpenses(), getIncomes(), getCancellations()]);
        if (!active) return;
        setCategories(categoriesData);
        setExpenses(expensesData);
        setIncomes(incomesData);
        setCancellations(cancellationsData);
      } catch (err) {
        if (!active) return;
        setError("שגיאה בטעינת נתונים מהדאטהבייס");
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleCategoryEvent = useCallback(({ eventType, row }) => {
    if (!row) return;
    setCategories((prev) => {
      if (eventType === "INSERT") {
        if (prev.some((item) => item.id === row.id)) return prev;
        return [...prev, row];
      }
      if (eventType === "UPDATE") return prev.map((item) => (item.id === row.id ? row : item));
      if (eventType === "DELETE") return prev.filter((item) => item.id !== row.id);
      return prev;
    });
  }, []);

  const handleExpenseEvent = useCallback(({ eventType, row }) => {
    if (!row) return;
    setExpenses((prev) => {
      if (eventType === "INSERT") {
        if (prev.some((item) => item.id === row.id)) return prev;
        return [row, ...prev];
      }
      if (eventType === "UPDATE") return prev.map((item) => (item.id === row.id ? row : item));
      if (eventType === "DELETE") return prev.filter((item) => item.id !== row.id);
      return prev;
    });
  }, []);

  const handleIncomeEvent = useCallback(({ eventType, row }) => {
    if (!row) return;
    setIncomes((prev) => {
      if (eventType === "INSERT") {
        if (prev.some((item) => item.id === row.id)) return prev;
        return [row, ...prev];
      }
      if (eventType === "UPDATE") return prev.map((item) => (item.id === row.id ? row : item));
      if (eventType === "DELETE") return prev.filter((item) => item.id !== row.id);
      return prev;
    });
  }, []);

  const handleCancellationEvent = useCallback(({ eventType, row }) => {
    if (!row) return;
    setCancellations((prev) => {
      if (eventType === "INSERT") {
        if (prev.some((item) => item.id === row.id)) return prev;
        return [row, ...prev];
      }
      if (eventType === "UPDATE") return prev.map((item) => (item.id === row.id ? row : item));
      if (eventType === "DELETE") return prev.filter((item) => item.id !== row.id);
      return prev;
    });
  }, []);

  useSupabaseRealtime({
    onCategoryEvent: handleCategoryEvent,
    onExpenseEvent: handleExpenseEvent,
    onIncomeEvent: handleIncomeEvent,
    onCancellationEvent: handleCancellationEvent
  });

  useEffect(() => {
    if (!categories.length || loading) return;

    let cancelled = false;

    const generateAutomaticExpenses = async () => {
      const autoCategories = categories.filter((category) => category.isAuto);
      if (!autoCategories.length) return;

      const created = await Promise.all(
        autoCategories.map((category) =>
          createAutomaticExpenseIfMissing({
            categoryId: category.id,
            owner: category.owner || "פואד",
            paidBy: category.owner || "פואד",
            amount: Number(category.target || 0),
            note: "הוצאה אוטומטית חודשית",
            expenseDate: `${selectedMonth}-01`,
            isAutomatic: true,
            automaticMonth: selectedMonth
          })
        )
      );

      if (cancelled) return;

      const flat = created.flat();
      setExpenses((prev) => {
        const map = new Map(prev.map((item) => [item.id, item]));
        flat.forEach((item) => map.set(item.id, item));
        return [...map.values()].sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
      });
    };

    generateAutomaticExpenses().catch((err) => {
      console.error(err);
      setError("יצירת הוצאות אוטומטיות נכשלה");
    });

    return () => {
      cancelled = true;
    };
  }, [categories, loading, selectedMonth]);

  const categoryGroups = useMemo(() => {
    const groups = new Set();
    categories.forEach((category) => groups.add(categoryParent(category)));
    return [...groups].sort((a, b) => a.localeCompare(b, "he"));
  }, [categories]);

  const subcategoriesForSelectedGroup = useMemo(() => {
    if (!expenseForm.categoryGroup) return [];
    const byName = new Map();
    categories
      .filter((category) => categoryParent(category) === expenseForm.categoryGroup)
      .sort((a, b) => categoryChildLabel(a).localeCompare(categoryChildLabel(b), "he"))
      .forEach((category) => {
        const key = categoryChildLabel(category);
        if (!byName.has(key)) byName.set(key, category);
      });
    return [...byName.values()];
  }, [categories, expenseForm.categoryGroup]);

  const categoryById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const filteredExpenses = useMemo(() => {
    const monthExpenses = expenses.filter((item) => monthKeyFromDate(item.expenseDate) === selectedMonth);
    return activeTab === "כללי" ? monthExpenses : monthExpenses.filter((item) => item.owner === activeTab);
  }, [expenses, activeTab, selectedMonth]);

  const filteredIncomes = useMemo(() => {
    const monthIncomes = incomes.filter((item) => monthKeyFromDate(item.depositDate) === selectedMonth);
    return activeTab === "כללי" ? monthIncomes : monthIncomes.filter((item) => item.owner === activeTab);
  }, [incomes, activeTab, selectedMonth]);

  const filteredCancellations = useMemo(() => {
    const monthCancellations = cancellations.filter((item) => monthKeyFromDate(item.cancellationDate) === selectedMonth);
    return activeTab === "כללי" ? monthCancellations : monthCancellations.filter((item) => item.owner === activeTab);
  }, [cancellations, activeTab, selectedMonth]);

  const totalBudget = useMemo(() => filteredIncomes.reduce((acc, item) => acc + item.amount, 0), [filteredIncomes]);
  const totalSpent = useMemo(() => filteredExpenses.reduce((acc, item) => acc + item.amount, 0), [filteredExpenses]);
  const totalCancelled = useMemo(() => filteredCancellations.reduce((acc, item) => acc + item.amount, 0), [filteredCancellations]);
  const balance = totalBudget - totalSpent;

  const expensesByCategory = useMemo(() => {
    const map = new Map();
    filteredExpenses.forEach((e) => {
      const name = categoryParent(categoryById[e.categoryId]);
      map.set(name, (map.get(name) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses, categoryById]);

  const compareData = useMemo(() => {
    if (activeTab !== "כללי") {
      return [{ name: activeTab, amount: filteredExpenses.reduce((acc, item) => acc + item.amount, 0) }];
    }

    return OWNERS.map((owner) => ({
      name: owner,
      amount: filteredExpenses.filter((item) => item.owner === owner).reduce((acc, item) => acc + item.amount, 0)
    }));
  }, [activeTab, filteredExpenses]);

  const monthlySummary = useMemo(() => {
    const scopeExpenses = activeTab === "כללי" ? expenses : expenses.filter((item) => item.owner === activeTab);
    const scopeIncomes = activeTab === "כללי" ? incomes : incomes.filter((item) => item.owner === activeTab);
    const scopeCancellations = activeTab === "כללי" ? cancellations : cancellations.filter((item) => item.owner === activeTab);

    const income = scopeIncomes.filter((item) => monthKeyFromDate(item.depositDate) === selectedMonth).reduce((acc, item) => acc + item.amount, 0);
    const expense = scopeExpenses.filter((item) => monthKeyFromDate(item.expenseDate) === selectedMonth).reduce((acc, item) => acc + item.amount, 0);
    const cancelled = scopeCancellations.filter((item) => monthKeyFromDate(item.cancellationDate) === selectedMonth).reduce((acc, item) => acc + item.amount, 0);

    return { income, expense, cancelled, balance: income - expense };
  }, [activeTab, cancellations, expenses, incomes, selectedMonth]);

  const monthlyIncomeTotal = monthlySummary.income;
  const monthlyExpenseTotal = monthlySummary.expense;
  const monthlyCancelledTotal = monthlySummary.cancelled;
  const topCategory = useMemo(() => {
    const totals = new Map();
    filteredExpenses.forEach((item) => {
      const name = categoryParent(categoryById[item.categoryId]);
      totals.set(name, (totals.get(name) || 0) + item.amount);
    });
    return [...totals.entries()].sort((a, b) => b[1] - a[1])[0] || ["אין נתונים", 0];
  }, [filteredExpenses, categoryById]);

  const trackerData = useMemo(() => {
    return categoryGroups.map((groupName) => {
      const groupCategories = categories.filter((category) => categoryParent(category) === groupName);
      const categoryIds = new Set(groupCategories.map((category) => category.id));
      const target = groupCategories.reduce((acc, category) => acc + Number(category.target || 0), 0);
      const spent = filteredExpenses.filter((expense) => categoryIds.has(expense.categoryId)).reduce((acc, expense) => acc + expense.amount, 0);
      const remaining = target - spent;
      const progress = target > 0 ? Math.min((spent / target) * 100, 100) : 0;
      return { id: groupName, name: groupName, spent, remaining, progress, overBudget: remaining < 0, budget_target: target };
    });
  }, [categories, categoryGroups, filteredExpenses]);

  const handleAddExpense = async (event) => {
    event.preventDefault();
    if (!expenseForm.amount || !expenseForm.categoryId) return;

    try {
      const saved = await createExpense({
        amount: Number(expenseForm.amount),
        categoryId: expenseForm.categoryId,
        owner: expenseForm.owner,
        paidBy: expenseForm.owner,
        note: expenseForm.description || null,
        expenseDate: expenseForm.expenseDate || currentDateKey(),
        isAutomatic: false
      });
      setExpenses((prev) => [saved, ...prev]);
      setExpenseForm((prev) => ({ ...prev, amount: "", categoryId: "", description: "", expenseDate: currentDateKey() }));
    } catch (err) {
      console.error(err);
      setError("שמירת הוצאה נכשלה");
    }
  };

  const handleAddIncome = async (event) => {
    event.preventDefault();
    if (!incomeForm.amount) return;

    try {
      const saved = await createIncome({
        amount: Number(incomeForm.amount),
        owner: incomeForm.owner,
        source: incomeForm.source || "משכורת",
        note: incomeForm.description || null,
        depositDate: incomeForm.incomeDate || currentDateKey(),
        paymentMethod: incomeForm.paymentMethod || "מזומן"
      });
      setIncomes((prev) => [saved, ...prev]);
      setIncomeForm((prev) => ({ ...prev, amount: "", source: "", description: "", incomeDate: currentDateKey(), paymentMethod: "מזומן" }));
    } catch (err) {
      console.error(err);
      setError("שמירת הכנסה נכשלה");
    }
  };

  const handleAddCancellation = async (event) => {
    event.preventDefault();
    if (!cancellationForm.amount) return;

    try {
      const saved = await createCancellation({
        amount: Number(cancellationForm.amount),
        owner: cancellationForm.owner || "חיסן",
        clientName: cancellationForm.clientName || null,
        note: cancellationForm.note || null,
        cancellationDate: cancellationForm.cancellationDate || `${selectedMonth}-01`
      });
      setCancellations((prev) => [saved, ...prev]);
      setCancellationForm((prev) => ({ ...prev, amount: "", clientName: "", note: "", cancellationDate: `${selectedMonth}-01` }));
    } catch (err) {
      console.error(err);
      setError("שמירת ביטול נכשלה");
    }
  };

  const handleDeleteExpense = async (id) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    try {
      await deleteExpense(id);
    } catch (err) {
      console.error(err);
      setError("מחיקת הוצאה נכשלה");
      getExpenses().then(setExpenses).catch(console.error);
    }
  };

  const handleDeleteCancellation = async (id) => {
    setCancellations((prev) => prev.filter((cancellation) => cancellation.id !== id));
    try {
      await deleteCancellation(id);
    } catch (err) {
      console.error(err);
      setError("מחיקת ביטול נכשלה");
      getCancellations().then(setCancellations).catch(console.error);
    }
  };

  const handleAddMainCategory = async (event) => {
    event.preventDefault();
    const name = mainCategoryForm.name.trim();
    if (!name) return;

    try {
      const saved = await createCategory({
        parentName: name,
        name,
        owner: mainCategoryForm.owner || "פואד",
        target: Number(mainCategoryForm.target || 0),
        isAuto: false
      });
      setCategories((prev) => [...prev, saved]);
      setMainCategoryForm({ name: "", target: "", owner: "פואד" });
    } catch (err) {
      console.error(err);
      setError("שמירת קטגוריה ראשית נכשלה");
    }
  };

  const handleAddCategory = async (event) => {
    event.preventDefault();
    const parentName = categoryForm.parentName.trim();
    const name = categoryForm.name.trim();
    if (!parentName || !name) return;

    try {
      const saved = await createCategory({
        parentName,
        name,
        owner: "פואד",
        target: Number(categoryForm.target || 0),
        isAuto: false
      });
      setCategories((prev) => [...prev, saved]);
      setCategoryForm({ parentName: "", name: "", target: "" });
    } catch (err) {
      console.error(err);
      setError("שמירת תת קטגוריה נכשלה");
    }
  };

  const handleAddChildActivity = async (event) => {
    event.preventDefault();
    const name = childActivityForm.name.trim();
    if (!name || !childActivityForm.child) return;

    try {
      const saved = await createCategory({
        parentName: "ילדים וחינוך",
        name: `${name} - ${childActivityForm.child}`,
        owner: "פואד",
        target: Number(childActivityForm.target || 0),
        isAuto: false
      });
      setCategories((prev) => [...prev, saved]);
      setChildActivityForm({ name: "", child: CHILDREN[0], target: "" });
    } catch (err) {
      console.error(err);
      setError("שמירת טיפול / חוג נכשלה");
    }
  };

  const handleUpdateCategory = async (id, patch) => {
    const previous = categories;
    setCategories((prev) => prev.map((category) => (category.id === id ? { ...category, ...patch } : category)));
    try {
      const saved = await updateCategory(id, patch);
      setCategories((prev) => prev.map((category) => (category.id === id ? saved : category)));
    } catch (err) {
      console.error(err);
      setError("עדכון קטגוריה נכשל");
      setCategories(previous);
    }
  };

  const handleDeleteCategory = async (id) => {
    const previous = categories;
    setCategories((prev) => prev.filter((category) => category.id !== id));
    try {
      await deleteCategory(id);
    } catch (err) {
      console.error(err);
      setError("מחיקת קטגוריה נכשלה");
      setCategories(previous);
    }
  };

  const handleOwnerTabClick = (tab) => {
    setActiveTab(tab);
    setActivePage("dashboard");
  };

  const handleLogoNavigation = () => {
    setActiveTab("כללי");
    setActivePage("dashboard");
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-500">טוען נתונים...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      <header className="bg-primary rounded-b-[2rem] text-white pb-8 pt-6 px-4 shadow-lg">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLogoNavigation}
              className="flex items-center gap-3 text-right transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40 rounded-xl"
            >
              <div className="h-11 w-11 rounded-xl bg-white/15 grid place-items-center">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Balance</h1>
                <p className="text-sm text-white/80">ניהול הוצאות למשפחתי</p>
              </div>
            </button>
            <div className="flex items-stretch gap-2">
              {APP_PAGES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActivePage(id)}
                  className={`min-h-11 rounded-xl px-3 text-sm font-medium transition inline-flex items-center justify-center gap-2 ${
                    activePage === id ? "bg-teal text-white" : "bg-white/10 text-white/70"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-stretch gap-2">
            {OWNER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleOwnerTabClick(tab)}
                className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-medium transition ${
                  activeTab === tab ? "bg-white text-primary" : "bg-white/10 text-white/70"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 -mt-6 pb-8 space-y-4">
        {error && <div className="card p-3 text-red-600 text-sm">{error}</div>}
        {activePage === "settings" ? (
          <CategorySettingsPage
            categories={categories}
            categoryGroups={categoryGroups}
            mainCategoryForm={mainCategoryForm}
            setMainCategoryForm={setMainCategoryForm}
            categoryForm={categoryForm}
            setCategoryForm={setCategoryForm}
            childActivityForm={childActivityForm}
            setChildActivityForm={setChildActivityForm}
            onAddMainCategory={handleAddMainCategory}
            onAddCategory={handleAddCategory}
            onAddChildActivity={handleAddChildActivity}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        ) : (
          <>
        <section className="card p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">חודש</p>
              <h2 className="text-lg font-bold text-primary">{monthLabel(selectedMonth)}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-slate-200 bg-white p-2" onClick={() => setSelectedMonth(monthOptions[Math.max(0, monthOptions.findIndex((item) => item.value === selectedMonth) - 1)]?.value || selectedMonth)}><ChevronRight className="h-4 w-4" /></button>
              <button className="rounded-xl border border-slate-200 bg-white p-2" onClick={() => setSelectedMonth(monthOptions[Math.min(monthOptions.length - 1, monthOptions.findIndex((item) => item.value === selectedMonth) + 1)]?.value || selectedMonth)}><ChevronLeft className="h-4 w-4" /></button>
            </div>
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-slate-50 p-3 text-sm font-semibold text-primary"
            onClick={() => setShowMonthDetails((value) => !value)}
          >
            נשאר: <span dir="ltr">{money(balance)}</span> · פירוט
          </button>
          {showMonthDetails && (
            <div className="grid gap-2 md:grid-cols-3">
              <label className="text-sm text-slate-600">חודש
                <select className="field mt-1" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>{monthOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
              </label>
              <label className="text-sm text-slate-600">שנה
                <select className="field mt-1" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>{Array.from({ length: 5 }, (_, i) => currentYear() - i).map((year) => <option key={year} value={year}>{year}</option>)}</select>
              </label>
              <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">הכנסות: {money(totalBudget)} · הוצאות: {money(totalSpent)} · ביטולים: {money(totalCancelled)}</div>
            </div>
          )}
        </section>
        <SummaryCards totalBudget={totalBudget} totalSpent={totalSpent} totalCancelled={totalCancelled} balance={balance} />

        <Card title="+ פעולות הכנסה / הוצאה / ביטול">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700"
                onClick={() => {
                  const next = !isExpenseSectionOpen;
                  setIsExpenseSectionOpen(next);
                  setIsIncomeSectionOpen(false);
                  setIsCancellationSectionOpen(false);
                }}
              >
                <span>הוספת הוצאה</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpenseSectionOpen ? "rotate-180" : ""}`} />
              </button>
              {isExpenseSectionOpen && (
                <div className="border-t border-slate-200 p-4">
                  <form onSubmit={handleAddExpense} className="grid grid-cols-2 gap-2 md:grid-cols-6">
                    <input className="field" type="number" min="0" dir="ltr" placeholder="סכום" value={expenseForm.amount} onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))} />
                    <select className="field" value={expenseForm.categoryGroup} onChange={(e) => setExpenseForm((prev) => ({ ...prev, categoryGroup: e.target.value, categoryId: "" }))}>
                      <option value="">בחר קטגוריה</option>
                      {categoryGroups.map((groupName) => (
                        <option key={groupName} value={groupName}>
                          {truncateText(groupName, 24)}
                        </option>
                      ))}
                    </select>
                    <select className="field col-span-2 md:col-span-2" value={expenseForm.categoryId} onChange={(e) => setExpenseForm((prev) => ({ ...prev, categoryId: e.target.value }))} disabled={!expenseForm.categoryGroup}>
                      <option value="">בחר תת קטגוריה</option>
                      {subcategoriesForSelectedGroup.map((category) => (
                        <option key={category.id} value={category.id}>
                          {truncateText(categoryChildLabel(category), 24)} ({money(category.target)})
                        </option>
                      ))}
                    </select>
                    <HebrewDateInput
                      name="expenseDate"
                      value={expenseForm.expenseDate}
                      onChange={(value) => setExpenseForm((prev) => ({ ...prev, expenseDate: value }))}
                      placeholder="תאריך"
                      className="w-full"
                      inputClassName="field"
                      required
                    />
                    <select className="field" value={expenseForm.owner} onChange={(e) => setExpenseForm((prev) => ({ ...prev, owner: e.target.value }))}>
                      {OWNERS.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
                    </select>
                    <button className="min-h-11 rounded-xl bg-primary text-white font-medium" type="submit">שמירה</button>
                    <input className="field md:col-span-6" placeholder="תיעוד / הערה" value={expenseForm.description} onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))} />
                  </form>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700"
                onClick={() => {
                  const next = !isIncomeSectionOpen;
                  setIsIncomeSectionOpen(next);
                  setIsExpenseSectionOpen(false);
                  setIsCancellationSectionOpen(false);
                }}
              >
                <span>הוספת הכנסה</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isIncomeSectionOpen ? "rotate-180" : ""}`} />
              </button>
              {isIncomeSectionOpen && (
                <div className="border-t border-slate-200 p-4">
                  <form onSubmit={handleAddIncome} className="grid grid-cols-2 gap-2 md:grid-cols-6">
                    <input className="field" type="number" min="0" dir="ltr" placeholder="סכום" value={incomeForm.amount} onChange={(e) => setIncomeForm((prev) => ({ ...prev, amount: e.target.value }))} />
                    <input className="field" placeholder="מקור הכנסה" value={incomeForm.source} onChange={(e) => setIncomeForm((prev) => ({ ...prev, source: e.target.value }))} />
                    <HebrewDateInput
                      name="incomeDate"
                      value={incomeForm.incomeDate}
                      onChange={(value) => setIncomeForm((prev) => ({ ...prev, incomeDate: value }))}
                      placeholder="תאריך"
                      className="w-full"
                      inputClassName="field"
                      required
                    />
                    <select className="field" value={incomeForm.owner} onChange={(e) => setIncomeForm((prev) => ({ ...prev, owner: e.target.value }))}>
                      {OWNERS.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
                    </select>
                    <select className="field" value={incomeForm.paymentMethod} onChange={(e) => setIncomeForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}>
                      {INCOME_PAYMENT_METHODS.map((paymentMethod) => (<option key={paymentMethod} value={paymentMethod}>{paymentMethod}</option>))}
                    </select>
                    <button className="min-h-11 rounded-xl bg-teal text-white font-medium" type="submit">שמירת הכנסה</button>
                    <input className="field md:col-span-6" placeholder="תיעוד / הערה" value={incomeForm.description} onChange={(e) => setIncomeForm((prev) => ({ ...prev, description: e.target.value }))} />
                  </form>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700"
                onClick={() => {
                  const next = !isCancellationSectionOpen;
                  setIsCancellationSectionOpen(next);
                  setIsExpenseSectionOpen(false);
                  setIsIncomeSectionOpen(false);
                }}
              >
                <span>ביטול תור של חיסן</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isCancellationSectionOpen ? "rotate-180" : ""}`} />
              </button>
              {isCancellationSectionOpen && (
                <div className="border-t border-slate-200 p-4">
                  <form onSubmit={handleAddCancellation} className="grid gap-2 md:grid-cols-6">
                    <input className="field" type="number" min="0" dir="ltr" placeholder="סכום שלא נגבה" value={cancellationForm.amount} onChange={(e) => setCancellationForm((prev) => ({ ...prev, amount: e.target.value }))} />
                    <input className="field" placeholder="שם לקוח / תור" value={cancellationForm.clientName} onChange={(e) => setCancellationForm((prev) => ({ ...prev, clientName: e.target.value }))} />
                    <HebrewDateInput
                      name="cancellationDate"
                      value={cancellationForm.cancellationDate}
                      onChange={(value) => setCancellationForm((prev) => ({ ...prev, cancellationDate: value }))}
                      placeholder="תאריך"
                      className="w-full"
                      inputClassName="field"
                      required
                    />
                    <input className="field" value={activeTab !== "כללי" ? activeTab : "חיסן"} readOnly />
                    <button className="min-h-11 rounded-xl bg-red text-white font-medium" type="submit">שמירת ביטול</button>
                    <input className="field md:col-span-6" placeholder="תיעוד / סיבת ביטול" value={cancellationForm.note} onChange={(e) => setCancellationForm((prev) => ({ ...prev, note: e.target.value }))} />
                  </form>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card title="תקציב מול הוצאה">
            <div className="space-y-2">
              <div className="h-40">
                <ResponsiveContainer>
                <PieChart>
                  <Pie data={[{ name: "הוצאה", value: totalSpent }, { name: "נותר", value: Math.max(balance, 0) }]} dataKey="value" innerRadius={55} outerRadius={80}>
                    <Cell fill="#16213B" />
                    <Cell fill="#E5E7EB" />
                  </Pie>
                </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl bg-slate-50 p-2 text-center">
                <p className="font-semibold leading-tight" dir="ltr">{money(totalSpent)}</p>
                <p className="text-xs text-slate-500" dir="ltr">מתוך {money(totalBudget)}</p>
              </div>
            </div>
          </Card>

          <Card title="פילוח לפי קטגוריה">
            <div className="space-y-2">
              <div className="h-40">
                <ResponsiveContainer>
                <PieChart>
                  <Pie data={expensesByCategory} dataKey="value" innerRadius={45} outerRadius={75}>
                    {expensesByCategory.map((entry, idx) => <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => money(value)} />
                </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] leading-tight">
                {expensesByCategory.slice(0, 6).map((item, idx) => (
                  <div key={item.name} className="flex min-w-0 items-center gap-1">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span className="truncate">{item.name}</span>
                    <span className="shrink-0 text-slate-500" dir="ltr">{money(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="השוואה בין פואד לחיסן">
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₪${Number(value).toLocaleString("he-IL")}`} />
                  <Tooltip formatter={(value) => money(value)} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    <Cell fill="#16213B" />
                    <Cell fill="#2FBFAD" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card title="סקירה חודשית">
            <div className="space-y-2 text-sm text-slate-600">
              <p>סה"כ הכנסות לחודש: <span dir="ltr" className="font-semibold text-primary">{money(monthlyIncomeTotal)}</span></p>
              <p>סה"כ הוצאות לחודש: <span dir="ltr" className="font-semibold text-red">{money(monthlyExpenseTotal)}</span></p>
              <p>סה"כ ביטולים לחודש: <span dir="ltr" className="font-semibold text-red">{money(monthlyCancelledTotal)}</span></p>
              <p>מאזן חודש: <span dir="ltr" className={`font-semibold ${monthlySummary.balance >= 0 ? "text-teal" : "text-red"}`}>{money(monthlySummary.balance)}</span></p>
              <p className="text-xs text-slate-500">הנתונים מתעדכנים לפי החודש הנבחר.</p>
            </div>
          </Card>
          <Card title="דוח קטגוריות לחודש">
            <div className="space-y-2 text-sm text-slate-600">
              {Object.entries(
                filteredExpenses.reduce((acc, item) => {
                  const name = categoryParent(categoryById[item.categoryId]);
                  acc[name] = (acc[name] || 0) + item.amount;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-2">
                    <span>{name}</span>
                    <span dir="ltr" className="font-semibold text-primary">{money(value)}</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">          <Card title="מעקב תקציבי לפי קטגוריה">
            <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
              {trackerData.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    {item.overBudget ? (
                      <span className="font-bold text-red">חריגה: {money(Math.abs(item.remaining))}</span>
                    ) : (
                      <span className="text-slate-500">נותר: {money(item.remaining)}</span>
                    )}
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full ${item.overBudget ? "bg-red" : "bg-teal"}`} style={{ width: `${item.progress}%` }} />
                  </div>
                  <p className="text-xs text-slate-500" dir="ltr">הוצאה: {money(item.spent)} / יעד: {money(item.budget_target)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="הוצאות אחרונות">
            <div className="max-h-[400px] space-y-2 overflow-auto">
              {filteredExpenses.length === 0 && <p className="py-12 text-center text-slate-500">אין הוצאות עדיין</p>}
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="flex items-start justify-between rounded-xl border border-slate-100 p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary text-white grid place-items-center text-sm font-medium">{expense.owner[0]}</div>
                    <div>
                      <p className="font-semibold">{categoryParent(categoryById[expense.categoryId])}</p>
                      <p className="text-xs text-slate-500">תת קטגוריה: {categoryChildLabel(categoryById[expense.categoryId])}</p>
                      <p className="text-xs text-slate-500">{dateText(expense.expenseDate)} {expense.note ? `• ${expense.note}` : ""}</p>
                      <p className="text-xs text-slate-400">עודכן: {timeText(expense.updatedAt || expense.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" dir="ltr">{money(expense.amount)}</span>
                    <button className="min-h-11 min-w-11 rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => handleDeleteExpense(expense.id)}>
                      <Trash2 className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card title="הכנסות אחרונות">
            <div className="max-h-[400px] space-y-2 overflow-auto">
              {filteredIncomes.length === 0 && <p className="py-12 text-center text-slate-500">אין הכנסות עדיין</p>}
              {filteredIncomes.map((income) => (
                <div key={income.id} className="flex items-start justify-between rounded-xl border border-slate-100 p-3">
                  <div>
                    <p className="font-semibold">{income.source || "הכנסה"} · {income.owner}</p>
                    <p className="text-xs text-slate-500">{dateText(income.depositDate)} {income.note ? `• ${income.note}` : ""}</p>
                    <p className="text-xs text-slate-400">עודכן: {timeText(income.updatedAt || income.createdAt)}</p>
                  </div>
                  <span className="font-semibold text-teal" dir="ltr">{money(income.amount)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="ביטולים החודש">
            <div className="mb-3 rounded-xl bg-red/10 p-3 text-sm text-red">סה"כ ביטולים: <span dir="ltr" className="font-bold">{money(totalCancelled)}</span></div>
            <div className="max-h-[400px] space-y-2 overflow-auto">
              {filteredCancellations.length === 0 && <p className="py-12 text-center text-slate-500">אין ביטולים עדיין</p>}
              {filteredCancellations.map((cancellation) => (
                <div key={cancellation.id} className="flex items-start justify-between rounded-xl border border-slate-100 p-3">
                  <div>
                    <p className="font-semibold">{cancellation.clientName || "ביטול תור"} · {cancellation.owner}</p>
                    <p className="text-xs text-slate-500">{dateText(cancellation.cancellationDate)} {cancellation.note ? `• ${cancellation.note}` : ""}</p>
                    <p className="text-xs text-slate-400">עודכן: {timeText(cancellation.updatedAt || cancellation.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-red" dir="ltr">{money(cancellation.amount)}</span>
                    <button className="min-h-11 min-w-11 rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => handleDeleteCancellation(cancellation.id)}>
                      <Trash2 className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
          </>
        )}
      </main>
    </div>
  );
}

function GoalsPage({ categories, expenses, onUpdateCategory }) {
  const sortedCategories = [...categories].sort((a, b) => {
    const parentCompare = categoryParent(a).localeCompare(categoryParent(b), "he");
    if (parentCompare !== 0) return parentCompare;
    return categoryChildLabel(a).localeCompare(categoryChildLabel(b), "he");
  });

  return (
    <Card title="יעדים לפי תת קטגוריה">
      <div className="space-y-3">
        {sortedCategories.length === 0 && <p className="py-10 text-center text-slate-500">אין קטגוריות להצגה</p>}
        {sortedCategories.map((category) => {
          const spent = expenses.filter((expense) => expense.categoryId === category.id).reduce((sum, expense) => sum + expense.amount, 0);
          const target = Number(category.target || 0);
          const remaining = target - spent;
          const progress = target > 0 ? Math.min((spent / target) * 100, 100) : 0;

          return (
            <div key={category.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{categoryParent(category)}</p>
                  <p className="text-sm text-slate-500">{categoryChildLabel(category)}</p>
                </div>
                <label className="w-32 text-xs text-slate-500">
                  יעד חודשי
                  <input
                    className="field mt-1"
                    type="number"
                    min="0"
                    dir="ltr"
                    defaultValue={target}
                    onBlur={(event) => onUpdateCategory(category.id, { target: Number(event.target.value || 0) })}
                  />
                </label>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className={remaining < 0 ? "h-full bg-red" : "h-full bg-teal"} style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>נוצל: <span dir="ltr">{money(spent)}</span></span>
                <span className={remaining < 0 ? "text-red" : "text-teal"}>נשאר: <span dir="ltr">{money(remaining)}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CategorySettingsPage({
  categories,
  categoryGroups,
  mainCategoryForm,
  setMainCategoryForm,
  categoryForm,
  setCategoryForm,
  childActivityForm,
  setChildActivityForm,
  onAddMainCategory,
  onAddCategory,
  onAddChildActivity,
  onUpdateCategory,
  onDeleteCategory
}) {
  const [openGroups, setOpenGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const sortedCategories = [...categories].sort((a, b) => {
    const parentCompare = categoryParent(a).localeCompare(categoryParent(b), "he");
    if (parentCompare !== 0) return parentCompare;
    return categoryChildLabel(a).localeCompare(categoryChildLabel(b), "he");
  });

  const filteredCategories = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return sortedCategories;

    return sortedCategories.filter((category) => {
      const haystack = `${categoryParent(category)} ${categoryChildLabel(category)} ${category.name}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [searchTerm, sortedCategories]);

  const groupedCategories = useMemo(() => {
    const map = new Map();
    filteredCategories.forEach((category) => {
      const group = categoryParent(category);
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(category);
    });

    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "he"));
  }, [filteredCategories]);

  return (
    <div className="space-y-4">
      <Card title="טיפולים וחוגים לילדים">
        <form onSubmit={onAddChildActivity} className="grid gap-2 md:grid-cols-4">
          <input
            className="field"
            placeholder="שם טיפול / חוג"
            value={childActivityForm.name}
            onChange={(event) => setChildActivityForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <select
            className="field"
            value={childActivityForm.child}
            onChange={(event) => setChildActivityForm((prev) => ({ ...prev, child: event.target.value }))}
          >
            {CHILDREN.map((child) => (
              <option key={child} value={child}>{child}</option>
            ))}
          </select>
          <input
            className="field"
            type="number"
            min="0"
            dir="ltr"
            placeholder="יעד חודשי"
            value={childActivityForm.target}
            onChange={(event) => setChildActivityForm((prev) => ({ ...prev, target: event.target.value }))}
          />
          <button className="min-h-11 rounded-xl bg-teal text-white font-medium" type="submit">הוספה</button>
        </form>
        <div className="mt-3 grid gap-2">
          {sortedCategories
            .filter((category) => categoryParent(category) === "ילדים וחינוך" && CHILDREN.some((child) => category.name.endsWith(` - ${child}`)))
            .map((category) => (
              <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                <span>{category.name}</span>
                <span className="text-slate-500" dir="ltr">{money(category.target)}</span>
              </div>
            ))}
        </div>
      </Card>

      <Card title="ניהול קטגוריות ותתי קטגוריות">
        <div className="mb-3 rounded-2xl border border-slate-100 bg-white p-3 space-y-3">
          <p className="text-xs text-slate-500">הוספה מהירה בתוך האקורדיון</p>
          <form onSubmit={onAddMainCategory} className="grid gap-2 md:grid-cols-4">
            <input
              className="field"
              placeholder="שם קטגוריה ראשית"
              value={mainCategoryForm.name}
              onChange={(event) => setMainCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              className="field"
              type="number"
              min="0"
              dir="ltr"
              placeholder="יעד חודשי"
              value={mainCategoryForm.target}
              onChange={(event) => setMainCategoryForm((prev) => ({ ...prev, target: event.target.value }))}
            />
            <select
              className="field"
              value={mainCategoryForm.owner}
              onChange={(event) => setMainCategoryForm((prev) => ({ ...prev, owner: event.target.value }))}
            >
              {OWNERS.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
            </select>
            <button className="min-h-11 rounded-xl bg-primary text-white font-medium" type="submit">הוספת קטגוריה</button>
          </form>

          <form onSubmit={onAddCategory} className="grid gap-2 md:grid-cols-4">
            <input
              className="field"
              list="category-groups"
              placeholder="קטגוריה ראשית"
              value={categoryForm.parentName}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, parentName: event.target.value }))}
            />
            <input
              className="field"
              placeholder="תת קטגוריה"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              className="field"
              type="number"
              min="0"
              dir="ltr"
              placeholder="יעד חודשי"
              value={categoryForm.target}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, target: event.target.value }))}
            />
            <button className="min-h-11 rounded-xl bg-primary text-white font-medium" type="submit">הוספת תת קטגוריה</button>
            <datalist id="category-groups">
              {categoryGroups.map((groupName) => <option key={groupName} value={groupName} />)}
            </datalist>
          </form>
        </div>

        <input
          className="field mb-3"
          placeholder="חיפוש קטגוריה / תת קטגוריה"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <div className="space-y-2">
          {groupedCategories.length === 0 && <p className="py-10 text-center text-slate-500">אין קטגוריות להצגה</p>}
          {groupedCategories.map(([groupName, items]) => {
            const isOpen = openGroups[groupName] ?? false;
            return (
              <section key={groupName} className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }))}
                  className="w-full flex items-center justify-between gap-3 px-3 py-3 text-right hover:bg-white/70"
                >
                  <div>
                    <p className="font-semibold text-sm">{groupName}</p>
                    <p className="text-xs text-slate-500">{items.length} קטגוריות · כולל תתי קטגוריות</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 p-3 space-y-3">
                    {items.map((category) => (
                      <article key={category.id} className="rounded-xl border border-slate-100 bg-white p-3 space-y-2">
                        <div className="grid gap-2 md:grid-cols-12">
                          <input
                            className="field md:col-span-3"
                            list="category-groups"
                            defaultValue={categoryParent(category)}
                            onBlur={(event) => {
                              const value = event.target.value.trim();
                              if (value && value !== categoryParent(category)) onUpdateCategory(category.id, { parentName: value });
                            }}
                          />
                          <input
                            className="field md:col-span-4"
                            defaultValue={categoryChildLabel(category)}
                            onBlur={(event) => {
                              const value = event.target.value.trim();
                              if (value && value !== category.name) onUpdateCategory(category.id, { name: value });
                            }}
                          />
                          <label className="md:col-span-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600 flex flex-col gap-1">
                            <span>יעד חודשי</span>
                            <input
                              className="field"
                              type="number"
                              min="0"
                              dir="ltr"
                              defaultValue={category.target}
                              onBlur={(event) => onUpdateCategory(category.id, { target: Number(event.target.value || 0) })}
                            />
                          </label>
                          <label className="md:col-span-2 flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={!!category.isAuto}
                              onChange={(event) => onUpdateCategory(category.id, { isAuto: event.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-teal focus:ring-teal"
                            />
                            אוטומטית
                          </label>
                          <button
                            type="button"
                            className="min-h-11 rounded-xl border border-slate-200 bg-white text-red hover:bg-red/10 md:col-span-1"
                            onClick={() => onDeleteCategory(category.id)}
                          >
                            <Trash2 className="mx-auto h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">עודכן: {timeText(category.updatedAt || category.createdAt)}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function SummaryCards({ totalBudget, totalSpent, totalCancelled, balance }) {
  const over = balance < 0;
  return (
    <div className="grid grid-cols-4 gap-1.5 md:gap-2">
      <StatCard label="תקציב" value={money(totalBudget)} tone="primary" icon={<Wallet className="h-3.5 w-3.5" />} />
      <StatCard label="הוצאה" value={money(totalSpent)} tone="red" icon={<TrendingDown className="h-3.5 w-3.5" />} />
      <StatCard label="יתרה" value={money(balance)} tone={over ? "red" : "teal"} icon={<TrendingUp className="h-3.5 w-3.5" />} />
      <StatCard label="ביטולים" value={money(totalCancelled)} tone="red" icon={<XCircle className="h-3.5 w-3.5" />} />
    </div>
  );
}

function StatCard({ label, value, icon, tone = "primary" }) {
  const styles = {
    primary: "border-slate-100 bg-white text-primary",
    teal: "border-teal/20 bg-teal/10 text-teal",
    red: "border-red/20 bg-red/10 text-red"
  };

  return (
    <div className={`rounded-xl border p-2 shadow-sm ${styles[tone]}`}>
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className="text-[10px] font-medium text-slate-500">{label}</span>
        <span className="text-slate-500">{icon}</span>
      </div>
      <p className="truncate text-[13px] font-extrabold leading-tight sm:text-base" dir="ltr" title={String(value)}>{value}</p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="card p-4">
      <h2 className="mb-3 flex items-center gap-2 font-semibold"><BarChart3 className="h-4 w-4 text-slate-500" /> {title}</h2>
      {children}
    </section>
  );
}
