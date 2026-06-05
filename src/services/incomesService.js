import { HOUSEHOLD_ID } from "../constants/household";
import { ownerDbToUi, ownerUiToDb } from "../constants/owners";
import { supabase } from "../lib/supabaseClient";

function paymentDbToUi(value) {
  if (value === "cash") return "מזומן";
  if (value === "bank_transfer") return "העברה בנקאית";
  return "מזומן";
}

function paymentUiToDb(value) {
  if (value === "העברה בנקאית") return "bank_transfer";
  return "cash";
}

function mapIncomeRow(row) {
  return {
    id: row.id,
    householdId: row.household_id,
    owner: ownerDbToUi(row.owner),
    amount: Number(row.amount || 0),
    source: row.source || "משכורת",
    note: row.note || "",
    depositDate: row.income_date || row.deposit_date,
    paymentMethod: paymentDbToUi(row.payment_method),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toInsert(data) {
  return {
    household_id: HOUSEHOLD_ID,
    owner: ownerUiToDb(data.owner),
    amount: Number(data.amount || 0),
    source: data.source || "משכורת",
    note: data.note || null,
    income_date: data.incomeDate || data.depositDate || new Date().toISOString().slice(0, 10),
    deposit_date: data.incomeDate || data.depositDate || new Date().toISOString().slice(0, 10),
    payment_method: paymentUiToDb(data.paymentMethod || "מזומן")
  };
}

function toUpdate(data) {
  const out = {};
  if (data.owner !== undefined) out.owner = ownerUiToDb(data.owner);
  if (data.amount !== undefined) out.amount = Number(data.amount || 0);
  if (data.source !== undefined) out.source = data.source;
  if (data.note !== undefined) out.note = data.note || null;
  if (data.incomeDate !== undefined || data.depositDate !== undefined) {
    const incomeDate = data.incomeDate || data.depositDate;
    out.income_date = incomeDate;
    out.deposit_date = incomeDate;
  }
  if (data.paymentMethod !== undefined) out.payment_method = paymentUiToDb(data.paymentMethod);
  return out;
}

export async function getIncomes() {
  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("household_id", HOUSEHOLD_ID)
    .order("deposit_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapIncomeRow);
}

export async function createIncome(payload) {
  const { data, error } = await supabase.from("incomes").insert(toInsert(payload)).select("*").single();
  if (error) throw error;
  return mapIncomeRow(data);
}

export async function updateIncome(id, payload) {
  const { data, error } = await supabase
    .from("incomes")
    .update(toUpdate(payload))
    .eq("id", id)
    .eq("household_id", HOUSEHOLD_ID)
    .select("*")
    .single();

  if (error) throw error;
  return mapIncomeRow(data);
}

export async function deleteIncome(id) {
  const { error } = await supabase.from("incomes").delete().eq("id", id).eq("household_id", HOUSEHOLD_ID);
  if (error) throw error;
  return id;
}

export function mapIncomeRealtime(row) {
  return mapIncomeRow(row);
}
