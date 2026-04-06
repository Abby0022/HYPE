"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { deleteOrder, fetchOrders } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Order, OrderStatus } from "../types";

export function useOrders() {
  const { session, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [search, setSearch] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetch once auth is confirmed — prevents 401 on page load/refresh
  useEffect(() => {
    if (authLoading || !session) return;
    loadOrders();
  }, [authLoading, session, loadOrders]);

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return orders.filter((order) => {
      const normalizedStatus = (order.status || "pending").toLowerCase();
      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      return [
        order.order_id,
        order.product_name,
        order.ship_to || "",
        order.status || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchValue);
    });
  }, [orders, search, statusFilter]);

  const handleStatusChange = useCallback((tab: string) => {
    setStatusFilter((tab === "All" ? "all" : tab.toLowerCase()) as OrderStatus);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const remove = useCallback(async (orderId: string) => {
    try {
      setSubmitting(true);
      await deleteOrder(orderId);
      await loadOrders();
      return true;
    } catch (error) {
      console.error("Failed to delete order:", error);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [loadOrders]);

  return {
    orders: filteredOrders,
    loading,
    submitting,
    statusFilter,
    search,
    setStatusFilter: handleStatusChange,
    setSearch: handleSearchChange,
    loadOrders,
    remove,
  };
}
