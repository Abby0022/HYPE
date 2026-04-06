"use client";

import { MoreHorizontal } from "lucide-react";
import { Order } from "../types";
import {
  formatOrderId,
  formatCurrency,
  formatDate,
  getCustomerInitial,
} from "../utils/formatters";

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
              Order
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">
              Total
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {orders.map((order) => (
            <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <span className="text-sm font-semibold text-slate-900">
                  {formatOrderId(order.order_id)}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-slate-600 truncate max-w-xs">
                  {order.product_name}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                    {getCustomerInitial(order.ship_to)}
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {order.ship_to || "Unassigned"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                  Logged
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                {formatCurrency(order.order_value)}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                {formatDate(order.order_date)}
              </td>
              <td className="px-6 py-4 text-center">
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
