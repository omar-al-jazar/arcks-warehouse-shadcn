import Link from "next/link";
import { getAllEquipment } from "@/lib/supabase/queries";
import BarcodeLabelSheet from "@/components/barcode-label-sheet";
import PrintButton from "@/components/print-button";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function BarcodeLabelsPage() {
  const items = await getAllEquipment();

  return (
    <div className="flex flex-col gap-6">
      <Card className="no-print flex-row flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h1 className="font-heading text-lg font-semibold">Print barcode labels</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} label{items.length === 1 ? "" : "s"} — one per equipment item.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/owner/inventory" className={buttonVariants({ variant: "outline" })}>
            Back to inventory
          </Link>
          <PrintButton />
        </div>
      </Card>

      {items.length === 0 ? (
        <p className="no-print text-sm text-muted-foreground">No equipment to print labels for.</p>
      ) : (
        <BarcodeLabelSheet
          items={items.map((item) => ({
            id: item.id,
            barcode: item.barcode,
            name: item.name,
            category: item.category,
          }))}
        />
      )}
    </div>
  );
}
