import * as XLSX from "xlsx-js-style";

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  data: Record<string, unknown>[];
  columns?: string[];
}

// Custom modern colors
export const ExcelColors = {
  header: "0F172A", // Slate 900
  headerText: "F8FAFC", // Slate 50
  evenRow: "FFFFFF", // White
  oddRow: "F8FAFC", // Slate 50
  border: "E2E8F0", // Slate 200
  text: "334155", // Slate 700
};

/**
 * Export data as CSV
 */
export const exportToCSV = (options: ExportOptions) => {
  const { filename, data, columns } = options;

  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get columns from first row if not provided
  const exportColumns = columns || Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    exportColumns.join(","),
    ...data.map((row) =>
      exportColumns.map((col) => {
        const value = row[col];
        if (typeof value === "string" && value.includes(",")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || "";
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data as Excel with awesome styling
 */
export const exportToExcel = (options: ExportOptions) => {
  const { filename, sheetName = "Sheet1", data, columns } = options;

  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const exportColumns = columns || Object.keys(data[0]);

  // Transform data
  const exportData = [
    exportColumns,
    ...data.map((row) =>
      exportColumns.map((col) => row[col] === null || row[col] === undefined ? "" : row[col])
    ),
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(exportData);

  // Set nice column widths
  const columnWidths = exportColumns.map((col) => {
    let maxWidth = col.length;
    data.forEach((row) => {
      const val = row[col] ? row[col].toString() : "";
      if (val.length > maxWidth) maxWidth = val.length;
    });
    return { wch: Math.min(Math.max(maxWidth + 4, 15), 50) };
  });
  worksheet["!cols"] = columnWidths;

  const headerStyle = {
    font: { bold: true, color: { rgb: ExcelColors.headerText }, sz: 12, name: "Calibri" },
    fill: { fgColor: { rgb: ExcelColors.header } },
    alignment: { vertical: "center", horizontal: "center", wrapText: true },
    border: {
      top: { style: "medium", color: { rgb: ExcelColors.header } },
      bottom: { style: "medium", color: { rgb: ExcelColors.header } },
      left: { style: "medium", color: { rgb: ExcelColors.header } },
      right: { style: "medium", color: { rgb: ExcelColors.header } }
    }
  };

  const getRowStyle = (isEven: boolean) => ({
    font: { color: { rgb: ExcelColors.text }, sz: 11, name: "Calibri" },
    fill: { fgColor: { rgb: isEven ? ExcelColors.evenRow : ExcelColors.oddRow } },
    alignment: { vertical: "center", horizontal: "left", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: ExcelColors.border } },
      bottom: { style: "thin", color: { rgb: ExcelColors.border } },
      left: { style: "thin", color: { rgb: ExcelColors.border } },
      right: { style: "thin", color: { rgb: ExcelColors.border } }
    }
  });

  // Apply styling
  for (let R = 0; R < exportData.length; ++R) {
    for (let C = 0; C < exportData[R].length; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;

      if (R === 0) {
        worksheet[cellAddress].s = headerStyle;
      } else {
        worksheet[cellAddress].s = getRowStyle(R % 2 === 0);
      }
    }
  }

  // Define row heights
  worksheet["!rows"] = exportData.map((_, i) => ({ hpt: i === 0 ? 30 : 25 }));

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const formatCurrencyForExport = (value: number): string => {
  if (value === null || value === undefined) return "₹0";
  return `₹${value.toLocaleString("en-IN")}`;
};

export const formatDateForExport = (date: string | Date): string => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const prepareDataForExport = (
  data: Record<string, unknown>[],
  formatters?: Record<string, (value: unknown) => string>
): Record<string, unknown>[] => {
  return data.map((row) => {
    const formattedRow: Record<string, unknown> = {};
    for (const key in row) {
      if (formatters && formatters[key]) {
        formattedRow[key] = formatters[key](row[key]);
      } else {
        formattedRow[key] = row[key];
      }
    }
    return formattedRow;
  });
};
