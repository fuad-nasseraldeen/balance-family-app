import { HOUSEHOLD_ID } from "../constants/household";
import { ownerDbToUi, ownerUiToDb } from "../constants/owners";
import { supabase } from "../lib/supabaseClient";

function mapCategoryRow(row) {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    parentName: row.parent_name || null,
    owner: ownerDbToUi(row.owner),
    target: Number(row.monthly_target || 0),
    isAuto: !!row.is_automatic,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toCategoryInsert(data) {
  return {
    household_id: HOUSEHOLD_ID,
    name: data.name,
    parent_name: data.parentName || data.name,
    owner: ownerUiToDb(data.owner),
    monthly_target: Number(data.target || 0),
    is_automatic: !!data.isAuto
  };
}

function toCategoryUpdate(data) {
  const out = {};
  if (data.name !== undefined) out.name = data.name;
  if (data.parentName !== undefined) out.parent_name = data.parentName;
  if (data.owner !== undefined) out.owner = ownerUiToDb(data.owner);
  if (data.target !== undefined) out.monthly_target = Number(data.target || 0);
  if (data.isAuto !== undefined) out.is_automatic = !!data.isAuto;
  return out;
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", HOUSEHOLD_ID)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapCategoryRow);
}

export async function createCategory(payload) {
  const { data, error } = await supabase
    .from("categories")
    .insert(toCategoryInsert(payload))
    .select("*")
    .single();
  if (error) throw error;
  return mapCategoryRow(data);
}

export async function updateCategory(id, payload) {
  const { data, error } = await supabase
    .from("categories")
    .update(toCategoryUpdate(payload))
    .eq("id", id)
    .eq("household_id", HOUSEHOLD_ID)
    .select("*")
    .single();
  if (error) throw error;
  return mapCategoryRow(data);
}

export async function deleteCategory(id) {
  const { data: category, error: fetchError } = await supabase
    .from("categories")
    .select("id, name, parent_name")
    .eq("id", id)
    .eq("household_id", HOUSEHOLD_ID)
    .single();

  if (fetchError) throw fetchError;

  const isParentCategory = category.parent_name === category.name;
  const idsToDelete = isParentCategory
    ? [id]
    : [id];

  if (isParentCategory) {
    const { data: children, error: childrenError } = await supabase
      .from("categories")
      .select("id")
      .eq("household_id", HOUSEHOLD_ID)
      .eq("parent_name", category.name);

    if (childrenError) throw childrenError;
    idsToDelete.push(...(children || []).map((item) => item.id));
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .in("id", idsToDelete)
    .eq("household_id", HOUSEHOLD_ID);

  if (error) throw error;
  return id;
}

export function mapCategoryRealtime(row) {
  return mapCategoryRow(row);
}
