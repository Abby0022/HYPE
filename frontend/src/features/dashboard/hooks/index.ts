"use client";

import { useState, useEffect } from "react";
import { fetchCampaigns, fetchBankCredits, fetchSettlements } from "@/lib/api";
import { DashboardMetrics } from "../types";

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);

        // Fetch all required data
        const [campaignsRes, bankCreditsRes, settlementsRes] = await Promise.all([
          fetchCampaigns(),
          fetchBankCredits(),
          fetchSettlements(),
        ]);

        const campaigns = campaignsRes || [];
        const bankCredits = bankCreditsRes || [];
        const settlements = settlementsRes || [];

        // Calculate metrics
        const matchedCount = campaigns.filter(
          (c: { status?: string }) => c.status?.toLowerCase() === "matched"
        ).length;
        const pendingCount = campaigns.filter(
          (c: { status?: string }) => c.status?.toLowerCase() === "pending"
        ).length;
        const failedCount = campaigns.filter(
          (c: { status?: string }) => c.status?.toLowerCase() === "failed"
        ).length;

        const totalRefund = campaigns.reduce(
          (sum: number, c: { expected_refund?: number }) => sum + (c.expected_refund || 0),
          0
        );

        const totalCredits = bankCredits.reduce(
          (sum: number, bc: { amount?: number }) => sum + (bc.amount || 0),
          0
        );

        const pendingSettlements = settlements.filter(
          (s: { status?: string }) => s.status?.toLowerCase() === "pending"
        ).length;
        const completedSettlements = settlements.filter(
          (s: { status?: string }) => s.status?.toLowerCase() === "paid"
        ).length;
        const failedSettlements = settlements.filter(
          (s: { status?: string }) => s.status?.toLowerCase() === "failed"
        ).length;

        setMetrics({
          totalCampaigns: campaigns.length,
          matchedCampaigns: matchedCount,
          pendingCampaigns: pendingCount,
          failedCampaigns: failedCount,
          totalExpectedRefund: totalRefund,
          totalBankCredits: totalCredits,
          pendingSettlements,
          completedSettlements,
          failedSettlements,
        });

        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard metrics:", err);
        setError("Failed to load dashboard metrics");
        // Set default metrics for demo
        setMetrics({
          totalCampaigns: 0,
          matchedCampaigns: 0,
          pendingCampaigns: 0,
          failedCampaigns: 0,
          totalExpectedRefund: 0,
          totalBankCredits: 0,
          pendingSettlements: 0,
          completedSettlements: 0,
          failedSettlements: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return {
    metrics,
    loading,
    error,
  };
}
