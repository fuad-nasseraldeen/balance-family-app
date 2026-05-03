import { HOUSEHOLD_ID } from "../constants/household";
import { supabase } from "../lib/supabaseClient";

function mapHistoryRow(row) {
  return {
    id: row.id,
    householdId: row.household_id,
    month: row.month,
    totalBudget: Number(row.total_budget || 0),
    totalExpenses: Number(row.total_expenses || 0),
    byOwner: row.by_owner || {},
    byCategory: row.by_category || {},
    createdAt: row.created_at
  };
}

export async function getMonthlyHistory() {
  const { data, error } = await supabase
    .from("monthly_history")
    .select("*")
    .eq("household_id", HOUSEHOLD_ID)
    .order("month", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapHistoryRow);
}

export async function saveMonthlySummary(payload) {
  const { data, error } = await supabase
    .from("monthly_history")
    .insert({
      household_id: HOUSEHOLD_ID,
      month: payload.month,
      total_budget: Number(payload.totalBudget || 0),
      total_expenses: Number(payload.totalExpenses || 0),
      by_owner: payload.byOwner || {},
      by_category: payload.byCategory || {}
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapHistoryRow(data);
}

export function mapMonthlyHistoryRealtime(row) {
  return mapHistoryRow(row);
}
