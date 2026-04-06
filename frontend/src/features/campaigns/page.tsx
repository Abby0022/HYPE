"use client";

import { createPortal } from "react-dom";
import { useState } from "react";
import { Plus, Package, Filter, DownloadCloud, FileText, FileSpreadsheet, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  PageHeader,
  FilterBar,
  DataTable,
  EmptyState,
  LoadingState,
  Modal,
  StatusBadge,
  type ColumnDef,
} from "@/components";
import { CampaignModal } from "./components";
import { useCampaigns } from "./hooks";
import { useExport } from "@/hooks/useExport";
import { Campaign } from "./types";
import { CAMPAIGN_TABS } from "./constants";
import { formatCurrency, getAssigneeInitial, formatDate } from "./utils";

function ActionMenu({
  campaign,
  onView,
  onEdit,
  onDelete,
}: {
  campaign: Campaign;
  onView: (c: Campaign) => void;
  onEdit: (c: Campaign) => void;
  onDelete: (c: Campaign) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (!menuRef.current) {
      return;
    }

    const rect = menuRef.current.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = 132;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.right - menuWidth;
    let top = rect.bottom + 8;

    if (left < 8) {
      left = rect.left;
    }

    if (left + menuWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - menuWidth - 8);
    }

    if (top + menuHeight > viewportHeight - 8) {
      top = rect.top - menuHeight - 8;
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    requestAnimationFrame(updatePosition);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuPanelRef.current &&
        !menuPanelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleWindowChange = () => {
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => {
          setOpen((current) => {
            if (!current) {
              requestAnimationFrame(updatePosition);
            }
            return !current;
          });
        }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-[#0a0a0a] hover:bg-gray-100 transition-colors z-10 relative"
      >
        <MoreHorizontal className="w-5 h-5 cursor-pointer" />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuPanelRef}
          className="fixed w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-[1000] py-1 flex flex-col overflow-visible"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <button
            onClick={() => {
              setOpen(false);
              onView(campaign);
            }}
            className="w-full flex items-center justify-start gap-3 px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50 transition-colors text-left"
          >
            <Eye className="w-4 h-4 flex-shrink-0" /> View
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onEdit(campaign);
            }}
            className="w-full flex items-center justify-start gap-3 px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50 transition-colors text-left"
          >
            <Edit className="w-4 h-4 flex-shrink-0" /> Edit
          </button>
          <div className="h-px w-full bg-gray-100 my-1" />
          <button
            onClick={() => {
              setOpen(false);
              onDelete(campaign);
            }}
            className="w-full flex items-center justify-start gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" /> Delete
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default function CampaignsPage() {
  const {
    filteredCampaigns,
    loading,
    submitting,
    create,
    update,
    remove,
    search,
    setSearch,
    statusFilter,
    setStatusFilter
  } = useCampaigns();

  const { handleExport } = useExport();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | undefined>(undefined);
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleOpenModal = (mode: "create" | "edit" | "view", campaign?: Campaign) => {
    setModalMode(mode);
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: { product_name: string; expected_refund: number; assigned_to?: string; status?: string }) => {
    if (modalMode === 'edit' && selectedCampaign) {
      const success = await update(selectedCampaign.id, data);
      if (success) setIsModalOpen(false);
    } else {
      const success = await create(data);
      if (success) setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCampaign) {
      return;
    }

    const success = await remove(deleteCampaign.id);
    if (success) {
      setDeleteCampaign(null);
    }
  };

  const handleStatusChange = (tab: string) => {
    setStatusFilter((tab === "All" ? "all" : tab.toLowerCase()) as "all" | "pending" | "matched" | "failed");
  };

  const handleExportData = (format: "csv" | "excel") => {
    const exportData = filteredCampaigns.map((campaign) => ({
      "Product Name": campaign.product_name,
      "Order ID": campaign.order_id || campaign.id.slice(0, 8),
      "Status": campaign.status,
      "Expected Refund (₹)": campaign.expected_refund,
      "Campaign Fee (₹)": ('campaign_fee' in campaign ? campaign.campaign_fee as number : '') ?? '',
      "Partner": campaign.assigned_to || "—",
      "Created": formatDate(campaign.created_at ? new Date(campaign.created_at).toISOString() : null),
    }));

    handleExport(exportData, format, {
      filename: `campaigns_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Campaigns",
    });
    setShowExportMenu(false);
  };

  // DataTable columns configuration
  const columns: ColumnDef[] = [
    {
      key: "product_name",
      label: "Product",
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 font-bold text-sm">
            {value.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-normal text-slate-900">{value}</span>
        </div>
      ),
    },
    {
      key: "id",
      label: "Order ID",
      render: (value: string) => (
        <span className="text-sm text-slate-600">{value.slice(0, 8)}...</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => {
        const variantMap: Record<string, "pending" | "success" | "error" | "info"> = {
          pending: "pending",
          matched: "success",
          failed: "error",
        };
        return (
          <StatusBadge
            status={value}
            variant={variantMap[value.toLowerCase()] || "info"}
            size="md"
          />
        );
      },
    },
    {
      key: "expected_refund",
      label: "Expected Refund",
      render: (value: number) => (
        <span className="text-sm font-semibold text-slate-900 text-right">{formatCurrency(value)}</span>
      ),
    },
    {
      key: "assigned_to",
      label: "Partner",
      render: (value: string | null) =>
        value ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
              {getAssigneeInitial(value)}
            </div>
            <span className="text-sm font-normal text-slate-700">{value}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        ),
    },
    {
      key: "id",
      label: "Actions",
      render: (value: string, row: Campaign) => (
        <ActionMenu
          campaign={row}
          onView={(c) => handleOpenModal("view", c)}
          onEdit={(c) => handleOpenModal("edit", c)}
          onDelete={(c) => setDeleteCampaign(c)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col p-6 lg:p-8 text-[#0a0a0a] w-full bg-white min-h-screen">
      
      {/* Header */}
      <PageHeader
        title="Campaign"
        subtitle="Manage and track all financial records"
        action={{
          label: "New Campaign",
          onClick: () => handleOpenModal("create"),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {/* Filters */}
      <FilterBar
        tabs={Array.from(CAMPAIGN_TABS)}
        activeTab={
          statusFilter === "all" 
            ? "All" 
            : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
        }
        onTabChange={handleStatusChange}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search records..."
        loading={loading}
        rightContent={
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <DownloadCloud className="w-4 h-4 text-sky-600" />
              Export
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-48 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl shadow-black/5">
                <button
                  onClick={() => handleExportData("csv")}
                  className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4" />
                  CSV Export
                </button>
                <button
                  onClick={() => handleExportData("excel")}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel Export
                </button>
              </div>
            )}
          </div>
        }
        actions={[
          {
            label: "Filter",
            icon: <Filter className="w-4 h-4" />,
            onClick: () => {},
            variant: "secondary",
          },
        ]}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-[600px] bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingState count={5} type="rows" />
        ) : filteredCampaigns.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="No records found"
            description="Start tracking financial data by creating your first record."
            action={{
              label: "Create First Record",
              onClick: () => handleOpenModal("create"),
            }}
            hasSearch={search.length > 0}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredCampaigns}
            keyField="id"
          />
        )}
      </div>

      {/* Modal */}
      <CampaignModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit} 
        submitting={submitting} 
        mode={modalMode}
        initialData={selectedCampaign}
      />

      <Modal
        isOpen={!!deleteCampaign}
        onClose={() => setDeleteCampaign(null)}
        title="Delete campaign"
        subtitle={deleteCampaign ? `Remove ${deleteCampaign.product_name} from the list?` : undefined}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteCampaign(null)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-6">
          This action cannot be undone. The campaign will be removed permanently.
        </p>
      </Modal>
    </div>
  );
}
