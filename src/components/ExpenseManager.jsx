import { Trash2 } from "lucide-react";
import { formatCurrency } from "../utils";

export default function ExpenseManager({ expenses, categories, onUpdateExpense, onDeleteExpense }) {
  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));

  return (
    <section className="bg-white rounded-2xl shadow-soft border border-slate-100 p-5 md:p-6">
      <h2 className="font-semibold text-lg mb-4">ניהול הוצאות</h2>
      <div className="space-y-3 max-h-80 overflow-auto">
        {expenses.length === 0 && <p className="text-sm text-slate-500">אין הוצאות להצגה.</p>}
        {expenses.map((exp) => (
          <div key={exp.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 grid grid-cols-12 gap-2 items-center">
            <div className="col-span-12 md:col-span-3 text-sm font-medium">{categoryById[exp.categoryId]?.name || "קטגוריה"}</div>

            <div className="col-span-6 md:col-span-3">
              <input
                type="number"
                min="0"
                value={exp.amount}
                onChange={(e) => onUpdateExpense(exp.id, { amount: Number(e.target.value || 0) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="col-span-6 md:col-span-4">
              <select
                value={exp.categoryId}
                onChange={(e) => onUpdateExpense(exp.id, { categoryId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => onDeleteExpense(exp.id)}
              className="col-span-12 md:col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-slate-200 h-10 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs">מחיקה</span>
            </button>

            <div className="col-span-12 text-xs text-slate-500 flex items-center justify-between">
              <span>{new Date(exp.createdAt).toLocaleDateString("he-IL")}</span>
              <span>{formatCurrency(exp.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
