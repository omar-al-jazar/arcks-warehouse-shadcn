import CheckoutFlow from "@/components/checkout-flow";
import OverdueBanner from "@/components/overdue-banner";

export default async function CheckoutPage() {
  return (
    <div className="flex flex-col gap-6">
      <OverdueBanner />
      <CheckoutFlow />
    </div>
  );
}
