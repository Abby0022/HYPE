export interface Order {
  order_id: string;
  created_at: string;
  order_date: string | null;
  order_value: number;
  product_name: string;
  ship_to: string | null;
  status?: string;
}

export type OrderStatus = "all" | "pending" | "logged" | "shipped" | "delivered";
