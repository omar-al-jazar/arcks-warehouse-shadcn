import { differenceInDays } from "date-fns";
import { getOverdueOrders } from "@/lib/supabase/queries";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TriangleAlertIcon } from "lucide-react";

export default async function OverdueBanner() {
  const overdueOrders = await getOverdueOrders();
  if (overdueOrders.length === 0) return null;

  return (
    <Alert variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>
        {overdueOrders.length} order{overdueOrders.length === 1 ? "" : "s"} overdue
      </AlertTitle>
      <AlertDescription>
        <ul className="flex flex-col gap-0.5">
          {overdueOrders.map((order) => {
            const daysOverdue = Math.max(1, differenceInDays(new Date(), new Date(order.due_date)));
            return (
              <li key={order.id}>
                {order.project_name} — {order.renter_name} — {daysOverdue} day{daysOverdue === 1 ? "" : "s"}{" "}
                overdue
              </li>
            );
          })}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
