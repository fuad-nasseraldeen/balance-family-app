import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../utils";

export default function RecurringAutoCard({ owner, autoExpenses, categories, onUpdateAutoExpense }) {
  const ownerCategories = categories.filter((c) => c.owner === owner);

  return (
    <section className="bg-white rounded-2xl shadow-soft border border-slate-100 p-5 md:p-6">
      <h2 className="font-semibold text-lg mb-1">הוצאות אוטומטיות - {owner}</h2>
      <p className="text-xs text-slate-500 mb-4">נכנס לתוקף אוטומטית בתחילת כל חודש.</p>

      <div className="space-y-3">
        {autoExpenses.length === 0 && <p className="text-sm text-slate-500">אין הוצאות אוטומטיות לחודש זה.</p>}
        {autoExpenses.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 grid grid-cols-12 gap-2 items-center">
            <div className="col-span-12 md:col-span-3 font-medium text-sm">{item.templateName || "הוצאה אוטומטית"}</div>

            <div className="col-span-6 md:col-span-3">
              <input
                type="number"
                min="0"
                value={item.amount}
                onChange={(e) => onUpdateAutoExpense(item.id, { amount: Number(e.target.value || 0) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="col-span-6 md:col-span-4">
              <select
                value={item.categoryId}
                onChange={(e) => onUpdateAutoExpense(item.id, { categoryId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {ownerCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-12 md:col-span-2 inline-flex items-center justify-center gap-1 rounded-lg h-10 border border-emerald-600 bg-emerald-600 text-white">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs">פעיל</span>
            </div>

            <div className="col-span-12 text-xs text-slate-500 text-left">{formatCurrency(item.amount)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
