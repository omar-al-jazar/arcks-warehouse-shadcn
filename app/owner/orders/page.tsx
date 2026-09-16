import { getOrderHistory } from "@/lib/supabase/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function OwnerOrdersPage() {
  const orders = await getOrderHistory();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-lg font-semibold">Order history ({orders.length})</h1>
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Renter</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Checked out</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Returned</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.project_name}</TableCell>
                  <TableCell className="text-muted-foreground">{order.renter_name}</TableCell>
                  <TableCell className="text-muted-foreground">{order.items.length}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.checked_out_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.due_date)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.returned_at)}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "active" ? "warn" : "good"}>{order.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
