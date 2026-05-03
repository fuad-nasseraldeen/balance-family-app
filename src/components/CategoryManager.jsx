import { useEffect, useState } from "react";
import { PencilLine, Trash2, Tags } from "lucide-react";
import { USERS, formatCurrency } from "../utils";

export default function CategoryManager({
  categories,
  onAddCategory,
  onDeleteCategory,
  onUpdateTarget,
  onUpdateCategoryName,
  onUpdateCategoryOwner,
  onUpdateCategoryAutoConfig
}) {
  const [draftNames, setDraftNames] = useState({});

  useEffect(() => {
    const nextDrafts = {};
    categories.forEach((cat) => {
      nextDrafts[cat.id] = cat.name;
    });
    setDraftNames(nextDrafts);
  }, [categories]);

  function submitNewCategory(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const target = Number(form.get("target") || 0);
    const owner = String(form.get("owner") || USERS[0]);
    if (!name) return;
    onAddCategory({ name, target, owner });
    e.currentTarget.reset();
  }

  return (
    <section className="bg-white rounded-2xl shadow-soft border border-slate-100 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Tags className="w-5 h-5 text-slate-900" />
        <h2 className="font-semibold text-lg">ניהול קטגוריות ויעדים</h2>
      </div>

      <form onSubmit={submitNewCategory} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <input
          name="name"
          placeholder="שם קטגוריה"
          className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
        />
        <input
          name="target"
          type="number"
          min="0"
          step="1"
          placeholder="יעד חודשי"
          className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
        />
        <select
          name="owner"
          defaultValue={USERS[0]}
          className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
        >
          {USERS.map((u) => (
            <option key={u} value={u}>
              שייך ל: {u}
            </option>
          ))}
        </select>
        <button className="rounded-xl bg-slate-900 text-white px-4 py-3 hover:bg-slate-800">הוספת קטגוריה</button>
      </form>

      <div className="space-y-3 max-h-72 overflow-auto pr-1">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 grid grid-cols-12 gap-2 items-center">
            <div className="col-span-12 md:col-span-5">
              <input
                type="text"
                value={draftNames[cat.id] ?? cat.name}
                onChange={(e) => setDraftNames((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-12 md:col-span-4">
              <input
                type="number"
                min="0"
                value={cat.target}
                onChange={(e) => onUpdateTarget(cat.id, Number(e.target.value || 0))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <p className="text-xs text-slate-500">יעד: {formatCurrency(cat.target)}</p>
                <select
                  value={cat.owner || USERS[0]}
                  onChange={(e) => onUpdateCategoryOwner(cat.id, e.target.value)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                >
                  {USERS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-1 gap-2">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!cat.isAuto}
                    onChange={(e) => onUpdateCategoryAutoConfig(cat.id, { isAuto: e.target.checked })}
                  />
                  הוצאה אוטומטית (סכום = יעד חודשי)
                </label>
              </div>
            </div>
            <div className="col-span-12 md:col-span-3 flex gap-2">
              <button
                type="button"
                onClick={() => onUpdateCategoryName(cat.id, String(draftNames[cat.id] || "").trim())}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-slate-200 h-10 hover:bg-slate-100"
                title="עדכון שם"
              >
                <PencilLine className="w-4 h-4" />
                <span className="text-xs">עדכון</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteCategory(cat.id)}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-slate-200 h-10 hover:bg-rose-50 hover:text-rose-700"
                title="מחיקה"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-xs">הסרה</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
