"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchCampaigns, createCampaign, deleteCampaign, api } from "@/lib/api";
import { Campaign, CampaignStatus } from "../types";

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus>("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const create = async (payload: { product_name: string; expected_refund: number; assigned_to?: string }) => {
    setSubmitting(true);
    try {
      await createCampaign(payload);
      await load();
      return true;
    } catch (err) {
      console.error("Failed to create campaign:", err);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const update = async (id: string, data: Partial<{ product_name: string; expected_refund: number; assigned_to: string; status: string }>) => {
    setSubmitting(true);
    try {
      await api.patch(`/campaigns/${id}`, data);
      await load();
      return true;
    } catch (err) {
      console.error("Failed to update campaign:", err);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
     try {
       await api.patch(`/campaigns/${id}`, { status });
       await load();
       return true;
     } catch (err) {
       console.error("Failed to update status:", err);
       return false;
     }
  }

  const remove = async (id: string) => {
    try {
      await deleteCampaign(id);
      await load();
      return true;
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      return false;
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch = c.product_name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status.toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  return {
    campaigns,
    filteredCampaigns,
    loading,
    submitting,
    load,
    create,
    update,
    updateStatus,
    remove,
    search,
    setSearch,
    statusFilter,
    setStatusFilter
  };
}
