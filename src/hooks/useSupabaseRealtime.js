import { useEffect } from "react";
import { HOUSEHOLD_ID } from "../constants/household";
import { supabase } from "../lib/supabaseClient";
import { mapCategoryRealtime } from "../services/categoriesService";
import { mapExpenseRealtime } from "../services/expensesService";
import { mapMonthlyHistoryRealtime } from "../services/monthlyHistoryService";

export function useSupabaseRealtime({ onCategoryEvent, onExpenseEvent, onHistoryEvent }) {
  useEffect(() => {
    const channel = supabase.channel(`balance-household-${HOUSEHOLD_ID}`);

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "categories", filter: `household_id=eq.${HOUSEHOLD_ID}` },
      (payload) => {
        const mapped = payload.new ? mapCategoryRealtime(payload.new) : payload.old ? mapCategoryRealtime(payload.old) : null;
        onCategoryEvent?.({ eventType: payload.eventType, row: mapped, old: payload.old || null });
      }
    );

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "expenses", filter: `household_id=eq.${HOUSEHOLD_ID}` },
      (payload) => {
        const mapped = payload.new ? mapExpenseRealtime(payload.new) : payload.old ? mapExpenseRealtime(payload.old) : null;
        onExpenseEvent?.({ eventType: payload.eventType, row: mapped, old: payload.old || null });
      }
    );

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "monthly_history", filter: `household_id=eq.${HOUSEHOLD_ID}` },
      (payload) => {
        const mapped = payload.new ? mapMonthlyHistoryRealtime(payload.new) : payload.old ? mapMonthlyHistoryRealtime(payload.old) : null;
        onHistoryEvent?.({ eventType: payload.eventType, row: mapped, old: payload.old || null });
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onCategoryEvent, onExpenseEvent, onHistoryEvent]);
}
