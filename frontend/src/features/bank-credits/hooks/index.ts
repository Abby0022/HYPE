"use client";

import { useState, useEffect } from "react";
import { BankCredit } from "../types";
import { fetchBankCredits } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function useBankCredits() {
  const { session, loading: authLoading } = useAuth();
  const [bankCredits, setBankCredits] = useState<BankCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "matched" | "unmatched" | "partial">("all");

  const refreshBankCredits = async () => {
    try {
      setLoading(true);
      const data = await fetchBankCredits();
      setBankCredits(data || []);
    } catch (error) {
      console.error("Failed to fetch bank credits:", error);
      setBankCredits([]);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch once auth is confirmed — prevents 401 on page load/refresh
  useEffect(() => {
    if (authLoading || !session) return;
    refreshBankCredits();
  }, [authLoading, session]);

  const filteredCredits = bankCredits.filter((credit) => {
    const matchesSearch =
      search === "" ||
      credit.neft_ref.toLowerCase().includes(search.toLowerCase()) ||
      credit.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      credit.match_status.toLowerCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return {
    bankCredits: filteredCredits,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refreshBankCredits,
  };
}
