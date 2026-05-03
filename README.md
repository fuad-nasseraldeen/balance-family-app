# Balance - Supabase Realtime Version

אפליקציית ניהול הוצאות משפחתית בעברית (RTL), עם סנכרון בזמן אמת בין מכשירים דרך Supabase.

## Stack
- React + Vite
- Tailwind CSS
- amCharts 5
- Lucide React
- Supabase (DB + Realtime)

## דפים באפליקציה
1. `כללי`
2. `פואד`
3. `חיסן`

## ללא התחברות
בהתאם לדרישה:
- אין Auth
- אין Login
- אין PIN
- אין Family Code

האפליקציה עובדת עם `HOUSEHOLD_ID` קבוע פנימי.

---

## הגדרת Supabase

### 1) יצירת פרויקט
צור פרויקט חדש ב-Supabase.

### 2) הרצת סכימה
הרץ את הקובץ:
- `supabase/schema.sql`

הקובץ יוצר:
- `households`
- `categories`
- `expenses`
- `monthly_history`
- אינדקס ייחודי להוצאות אוטומטיות חודשיות:
  - `unique(household_id, category_id, automatic_month) where is_automatic = true`

### 3) יצירת household קבוע
צור שורה בטבלת `households` עם UUID קבוע (או דרך SQL).

לאחר מכן שים את ה-UUID ב:
- `src/constants/household.js`

```js
export const HOUSEHOLD_ID = "PUT-YOUR-HOUSEHOLD-UUID-HERE";
```

### 4) משתני סביבה
צור קובץ `.env` בשורש הפרויקט:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## הרצה

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

---

## Realtime - איך זה עובד

Hook:
- `src/hooks/useSupabaseRealtime.js`

Subscribe לטבלאות:
- `categories`
- `expenses`
- `monthly_history`

כל האירועים מסוננים לפי `household_id`.
כל INSERT/UPDATE/DELETE מעדכן את ה-state המקומי, לכן שני מכשירים רואים שינוי מיידי.

---

## שירותי DB (Service Layer)

- `src/services/categoriesService.js`
  - `getCategories`
  - `createCategory`
  - `updateCategory`
  - `deleteCategory`

- `src/services/expensesService.js`
  - `getExpenses`
  - `createExpense`
  - `updateExpense`
  - `deleteExpense`
  - `deleteExpensesByMonth`
  - `createAutomaticExpenseIfMissing`

- `src/services/monthlyHistoryService.js`
  - `getMonthlyHistory`
  - `saveMonthlySummary`

---

## מיגרציה חד-פעמית מ-localStorage

Helper:
- `src/utils/migrateLocalStorageToSupabase.js`

קורא:
- `balance_categories_v1`
- `balance_expenses_v1`
- `balance_monthly_history_v1`

התנהגות:
- אם ב-Supabase כבר יש נתונים לבית הזה -> לא מייבא
- אם ריק -> מייבא קטגוריות/הוצאות/היסטוריה
- מסמן דגל:
  - `balance_migrated_to_supabase_v1 = true`
- לא מוחק localStorage ישן

תוצאות המיגרציה נרשמות ב-console.

---

## הוצאות אוטומטיות

בתחילת כל חודש:
- לכל קטגוריה עם `is_automatic = true` נוצרת הוצאה חודשית אוטומטית
- הסכום = `monthly_target`
- `owner = paid_by = owner של הקטגוריה`
- `automatic_month = YYYY-MM`

הגנת כפילויות:
- enforced ע"י unique index + upsert

---

## מיפוי בעלים

ב-DB נשמר:
- `fuad`
- `hisan`

ב-UI מוצג:
- `פואד`
- `חיסן`

---

## מצב נוכחי

- מקור אמת: Supabase בלבד
- localStorage משמש רק למיגרציה חד-פעמית
- כל הגרפים עובדים לפי נתוני Supabase
- מחיקה/עדכון/הוספה מסתנכרנים בזמן אמת בין מכשירים
