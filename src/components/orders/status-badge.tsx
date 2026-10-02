import type { OrderStatus } from "@/db/schema";

/*
  DESIGN.md section 5: a pill at 12px, weight 600. Colours are the section 5
  table. Shipped is not listed there, so it shares the success treatment with
  Confirmed and Delivered.
*/
const LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  awaiting_quote: "Awaiting shipping quote",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STYLES: Record<OrderStatus, string> = {
  placed: "bg-mist text-onyx",
  awaiting_quote: "bg-highlight text-onyx",
  confirmed: "bg-success/12 text-success",
  shipped: "bg-success/12 text-success",
  delivered: "bg-success/12 text-success",
  cancelled: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}