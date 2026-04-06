"use client";

import React from "react";
import { MetricCard } from "./MetricCard";
import { DashboardMetrics } from "../types";
import { METRIC_CARDS_CONFIG } from "../constants";

interface MetricsGridProps {
  metrics: DashboardMetrics | null;
  loading?: boolean;
}

export function MetricsGrid({ metrics, loading = false }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {METRIC_CARDS_CONFIG.map((config) => {
        const Icon = config.icon;
        const value = metrics
          ? metrics[config.key as keyof DashboardMetrics] as number
          : 0;

        return (
          <MetricCard
            key={config.id}
            title={config.title}
            value={value}
            icon={Icon && <Icon />}
            loading={loading}
            isCurrency={'isCurrency' in config ? config.isCurrency : false}
          />
        );
      })}
    </div>
  );
}
