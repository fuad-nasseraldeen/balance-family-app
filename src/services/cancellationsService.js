import { HOUSEHOLD_ID } from "../constants/household";
import { ownerDbToUi, ownerUiToDb } from "../constants/owners";
import { supabase } from "../lib/supabaseClient";

function mapCancellationRow(row) {
  return {
    id: row.id,
    householdId: row.household_id,
    owner: ownerDbToUi(row.owner),
    amount: Number(row.amount || 0),
    clientName: row.client_name || "",
    note: row.note || "",
    cancellationDate: row.cancellation_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toInsert(data) {
  return {
    household_id: HOUSEHOLD_ID,
    owner: ownerUiToDb(data.owner || "חיסן"),
    amount: Number(data.amount || 0),
    client_name: data.clientName || null,
    note: data.note || null,
    cancellation_date: data.cancellationDate || new Date().toISOString().slice(0, 10)
  };
}

export async function getCancellations() {
  const { data, error } = await supabase
    .from("cancellations")
    .select("*")
    .eq("household_id", HOUSEHOLD_ID)
    .order("cancellation_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapCancellationRow);
}

export async function createCancellation(payload) {
  const { data, error } = await supabase.from("cancellations").insert(toInsert(payload)).select("*").single();
  if (error) throw error;
  return mapCancellationRow(data);
}

export async function deleteCancellation(id) {
  const { error } = await supabase.from("cancellations").delete().eq("id", id).eq("household_id", HOUSEHOLD_ID);
  if (error) throw error;
  return id;
}

export function mapCancellationRealtime(row) {
  return mapCancellationRow(row);
}
