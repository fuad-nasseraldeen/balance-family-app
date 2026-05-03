import { HOUSEHOLD_ID } from "../constants/household";
import { ownerDbToUi, ownerUiToDb } from "../constants/owners";
import { supabase } from "../lib/supabaseClient";

function mapExpenseRow(row) {
  return {
    id: row.id,
    householdId: row.household_id,
    categoryId: row.category_id,
    owner: ownerDbToUi(row.owner),
    paidBy: ownerDbToUi(row.paid_by),
    amount: Number(row.amount || 0),
    note: row.note || "",
    expenseDate: row.expense_date,
    isAutomatic: !!row.is_automatic,
    automaticMonth: row.automatic_month,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toInsert(data) {
  return {
    household_id: HOUSEHOLD_ID,
    category_id: data.categoryId,
    owner: ownerUiToDb(data.owner),
    paid_by: ownerUiToDb(data.paidBy),
    amount: Number(data.amount || 0),
    note: data.note || null,
    expense_date: data.expenseDate,
    is_automatic: !!data.isAutomatic,
    automatic_month: data.automaticMonth || null
  };
}

function toUpdate(data) {
  const out = {};
  if (data.categoryId !== undefined) out.category_id = data.categoryId;
  if (data.owner !== undefined) out.owner = ownerUiToDb(data.owner);
  if (data.paidBy !== undefined) out.paid_by = ownerUiToDb(data.paidBy);
  if (data.amount !== undefined) out.amount = Number(data.amount || 0);
  if (data.note !== undefined) out.note = data.note || null;
  if (data.expenseDate !== undefined) out.expense_date = data.expenseDate;
  if (data.isAutomatic !== undefined) out.is_automatic = !!data.isAutomatic;
  if (data.automaticMonth !== undefined) out.automatic_month = data.automaticMonth;
  return out;
}

export async function getExpenses() {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("household_id", HOUSEHOLD_ID)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapExpenseRow);
}

export async function createExpense(payload) {
  const { data, error } = await supabase.from("expenses").insert(toInsert(payload)).select("*").single();
  if (error) throw error;
  return mapExpenseRow(data);
}

export async function updateExpense(id, payload) {
  const { data, error } = await supabase
    .from("expenses")
    .update(toUpdate(payload))
    .eq("id", id)
    .eq("household_id", HOUSEHOLD_ID)
    .select("*")
    .single();
  if (error) throw error;
  return mapExpenseRow(data);
}

export async function deleteExpense(id) {
  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("household_id", HOUSEHOLD_ID);
  if (error) throw error;
  return id;
}

export async function deleteExpensesByMonth(month) {
  const from = `${month}-01`;
  const to = `${month}-31`;
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("household_id", HOUSEHOLD_ID)
    .gte("expense_date", from)
    .lte("expense_date", to);
  if (error) throw error;
}

export async function createAutomaticExpenseIfMissing(payload) {
  const insertPayload = toInsert(payload);
  const { data, error } = await supabase
    .from("expenses")
    .upsert(insertPayload, {
      onConflict: "household_id,category_id,automatic_month,is_automatic",
      ignoreDuplicates: true
    })
    .select("*");
  if (error) throw error;
  return (data || []).map(mapExpenseRow);
}

export function mapExpenseRealtime(row) {
  return mapExpenseRow(row);
}
