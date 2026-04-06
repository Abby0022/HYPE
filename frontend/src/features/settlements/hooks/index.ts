"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Settlement } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function useSettlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "failed">("all");

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/settlements`);
        setSettlements(response.data || []);
      } catch (error) {
        console.error("Failed to fetch settlements:", error);
        setSettlements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSettlements();
  }, []);

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
  };
}
