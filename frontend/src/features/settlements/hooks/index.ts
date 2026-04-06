"use client";

import { useState, useEffect } from "react";
import { fetchSettlements, markSettlementPaid } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Settlement } from "../types";

export function useSettlements() {
  const { session, loading: authLoading } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "failed">("all");

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const data = await fetchSettlements();
      setSettlements(data || []);
    } catch (error) {
      console.error("Failed to fetch settlements:", error);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch once auth is confirmed — prevents 401 and uses authenticated api client
  useEffect(() => {
    if (authLoading || !session) return;
    loadSettlements();
  }, [authLoading, session]);

  const markPaid = async (id: string) => {
    try {
      await markSettlementPaid(id);
      await loadSettlements();
      return true;
    } catch (error) {
      console.error("Failed to mark settlement as paid:", error);
      return false;
    }
  };

  const filteredSettlements = settlements.filter((settlement) => {
    const matchesSearch =
      search === "" ||
      settlement.id.toLowerCase().includes(search.toLowerCase()) ||
      settlement.campaign_id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      settlement.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return {
    settlements: filteredSettlements,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    markPaid,
    loadSettlements,
  };
}
