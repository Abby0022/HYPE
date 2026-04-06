"use client";

import { useCallback } from "react";
import { exportToCSV, exportToExcel, prepareDataForExport } from "@/lib/exportUtils";

export interface UseExportOptions {
  filename: string;
  sheetName?: string;
  formatters?: Record<string, (value: unknown) => string>;
}

export const useExport = () => {
  const handleExport = useCallback(
    (
      data: Record<string, unknown>[],
      format: "csv" | "excel",
      options: UseExportOptions
    ) => {
      try {
        if (!data || data.length === 0) {
          alert("No data to export");
          return;
        }

        // Prepare data with formatters
        const formattedData = prepareDataForExport(data, options.formatters);
        const columns = Object.keys(formattedData[0]);

        if (format === "csv") {
          exportToCSV({
            filename: options.filename,
            data: formattedData,
            columns,
          });
        } else if (format === "excel") {
          exportToExcel({
            filename: options.filename,
            sheetName: options.sheetName || "Data",
            data: formattedData,
            columns,
          });
        }
      } catch (error) {
        console.error("Export failed:", error);
        alert("Failed to export data");
      }
    },
    []
  );

  return { handleExport };
};
