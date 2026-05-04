import { PlusCircle, Trash2 } from "lucide-react";
import { formatCurrency } from "../utils";

const PAYMENT_METHODS = ["מזומן", "העברה בנקאית"];

export default function IncomeManager({ incomes, onAddIncome, onUpdateIncome, onDeleteIncome, owner, isGeneralView }) {
  function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const amount = Number(form.get("amount"));
    const depositDate = form.get("depositDate");
    const paymentMethod = form.get("paymentMethod");
    const selectedOwner = isGeneralView ? form.get("owner") : owner;

    if (!amount || amount <= 0 || !depositDate || !selectedOwner || !paymentMethod) return;

    onAddIncome({
      amount,
      depositDate,
      paymentMethod,
      owner: selectedOwner
    });

    e.currentTarget.reset();
  }

  const cashTotal = incomes.filter((income) => income.paymentMethod === "מזומן").reduce((sum, income) => sum + income.amount, 0);
  const transferTotal = incomes
    .filter((income) => income.paymentMethod === "העברה בנקאית")
    .reduce((sum, income) => sum + income.amount, 0);

  return (
    <section className="bg-white rounded-2xl shadow-soft border border-slate-100 p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-slate-900" />
        <h2 className="font-semibold text-lg">ניהול הכנסות</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input name="amount" type="number" min="0" step="1" required placeholder="סכום" className="rounded-xl border border-slate-200 px-4 py-3" />

        <input name="depositDate" type="date" required className="rounded-xl border border-slate-200 px-4 py-3" />

        <select name="paymentMethod" required defaultValue="" className="rounded-xl border border-slate-200 px-4 py-3">
          <option value="" disabled>
            סוג הפקדה
          </option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>

        {isGeneralView ? (
          <select name="owner" required defaultValue="" className="rounded-xl border border-slate-200 px-4 py-3">
            <option value="" disabled>
              פרופיל
            </option>
            <option value="פואד">פואד</option>
            <option value="חיסן">חיסן</option>
          </select>
        ) : (
          <input readOnly value={owner} className="rounded-xl border border-slate-200 px-4 py-3 bg-slate-50" />
        )}

        <button type="submit" className="rounded-xl bg-slate-900 text-white px-4 py-3 hover:bg-slate-800 transition">
          שמירה
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SummaryCard title="מזומן" value={cashTotal} />
        <SummaryCard title="העברה בנקאית" value={transferTotal} />
      </div>

      <div className="space-y-3 max-h-80 overflow-auto">
        {incomes.length === 0 && <p className="text-sm text-slate-500">אין הכנסות להצגה.</p>}
        {incomes.map((income) => (
          <div key={income.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 grid grid-cols-12 gap-2 items-center">
            <div className="col-span-12 md:col-span-2 text-sm font-medium">{income.owner}</div>

            <div className="col-span-6 md:col-span-2">
              <input
                type="number"
                min="0"
                value={income.amount}
                onChange={(e) => onUpdateIncome(income.id, { amount: Number(e.target.value || 0) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="col-span-6 md:col-span-3">
              <input
                type="date"
                value={income.depositDate}
                onChange={(e) => onUpdateIncome(income.id, { depositDate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="col-span-6 md:col-span-3">
              <select
                value={income.paymentMethod}
                onChange={(e) => onUpdateIncome(income.id, { paymentMethod: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => onDeleteIncome(income.id)}
              className="col-span-6 md:col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-slate-200 h-10 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs">מחיקה</span>
            </button>

            <div className="col-span-12 text-xs text-slate-500 flex items-center justify-between">
              <span>{new Date(income.createdAt).toLocaleDateString("he-IL")}</span>
              <span>{formatCurrency(income.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-lg font-semibold text-slate-900">{formatCurrency(value)}</p>
    </div>
  );
}
