import { PlusCircle } from "lucide-react";
import { formatCurrency } from "../utils";

export default function ExpenseForm({ categories, onAddExpense }) {
  function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const amount = Number(form.get("amount"));
    const categoryId = form.get("categoryId");
    if (!amount || amount <= 0 || !categoryId) return;

    onAddExpense({ amount, categoryId });
    e.currentTarget.reset();
  }

  return (
    <section className="bg-white rounded-2xl shadow-soft border border-slate-100 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <PlusCircle className="w-5 h-5 text-slate-900" />
        <h2 className="font-semibold text-lg">הוספת הוצאה</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          name="amount"
          type="number"
          min="0"
          step="1"
          required
          placeholder="סכום"
          className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
        />

        <select
          name="categoryId"
          required
          defaultValue=""
          className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
        >
          <option value="" disabled>
            קטגוריה
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({formatCurrency(cat.target)})
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-xl bg-slate-900 text-white px-4 py-3 hover:bg-slate-800 transition"
        >
          שמירה
        </button>
      </form>
    </section>
  );
}
