import { getActiveOrdersWithItems } from "@/lib/supabase/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function isOverdue(dueDate: string) {
  return new Date(dueDate).getTime() < Date.now();
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ManagerOrdersPage() {
  const orders = await getActiveOrdersWithItems();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-lg font-semibold">Active checkouts ({orders.length})</h1>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing checked out right now.</p>
      ) : (
        orders.map((order) => {
          const overdue = isOverdue(order.due_date);
          const pendingItems = order.items.filter((item) => !item.returned_at);
          const checkedOutByName = order.profiles?.name ?? "unknown";
          return (
            <Card key={order.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{order.project_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.renter_name} · checked out by {checkedOutByName} on {formatDate(order.checked_out_at)}
                  </p>
                </div>
                <Badge variant={overdue ? "destructive" : "secondary"}>
                  {overdue ? "Overdue" : "Due"} {formatDate(order.due_date)}
                </Badge>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {pendingItems.map((item) => (
                  <li key={item.id} className="rounded-full bg-secondary/60 px-2 py-1 text-xs text-secondary-foreground">
                    {item.equipment?.name}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })
      )}
    </div>
  );
}
