import Link from "next/link";
import { getAllEquipment } from "@/lib/supabase/queries";
import AddEquipmentForm from "@/components/add-equipment-form";
import PhotoAddEquipment from "@/components/photo-add-equipment";
import EquipmentRowActions from "@/components/equipment-row-actions";
import EditEquipmentButton from "@/components/edit-equipment-button";
import CollapsibleSection from "@/components/collapsible-section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { NativeSelect } from "@/components/ui/native-select";
import { PrinterIcon } from "lucide-react";
import type { EquipmentCategory } from "@/lib/supabase/types";

const STATUS_VARIANT: Record<string, "good" | "warn" | "secondary"> = {
  available: "good",
  checked_out: "warn",
  maintenance: "secondary",
};

const SECTIONS: { category: EquipmentCategory; label: string }[] = [
  { category: "camera", label: "Camera" },
  { category: "lighting", label: "Light" },
  { category: "grip", label: "Grip" },
];

export default async function InventoryPage({
  searchParams,
}: PageProps<"/owner/inventory">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const search = typeof params.search === "string" ? params.search : "";

  const items = await getAllEquipment({ status, search });

  return (
    <div className="flex flex-col gap-6">
      <CollapsibleSection title="Add equipment">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Add from a photo</h3>
            <PhotoAddEquipment />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Add manually</h3>
            <AddEquipmentForm />
          </div>
        </div>
      </CollapsibleSection>

      <Card className="flex-row flex-wrap items-center gap-3 p-5">
        <form className="flex flex-1 flex-wrap items-center gap-3">
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search name or barcode"
            className="min-w-[180px] flex-1"
          />
          <NativeSelect name="status" defaultValue={status}>
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="checked_out">Checked out</option>
            <option value="maintenance">Maintenance</option>
          </NativeSelect>
          <Button type="submit">Filter</Button>
        </form>
        <Link
          href="/owner/inventory/labels"
          aria-label="Print barcode labels"
          title="Print barcode labels"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <PrinterIcon />
        </Link>
      </Card>

      {SECTIONS.map((section) => (
        <EquipmentSection
          key={section.category}
          label={section.label}
          items={items.filter((item) => item.category === section.category)}
        />
      ))}
    </div>
  );
}

function EquipmentSection({
  label,
  items,
}: {
  label: string;
  items: Awaited<ReturnType<typeof getAllEquipment>>;
}) {
  return (
    <Card className="overflow-hidden py-0">
      <h2 className="border-b px-4 py-3 text-sm font-semibold text-muted-foreground">
        {label} <span className="text-muted-foreground/60">({items.length})</span>
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Serial #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                No {label.toLowerCase()} equipment matches these filters.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable source
                    <img src={item.image_url} alt="" className="size-8 rounded object-cover" />
                  ) : (
                    <div className="size-8 rounded bg-muted" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{item.barcode}</TableCell>
                <TableCell className="text-muted-foreground">{item.serial_number ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[item.status]}>{item.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <EditEquipmentButton
                      equipmentId={item.id}
                      name={item.name}
                      category={item.category}
                      serialNumber={item.serial_number}
                      imageUrl={item.image_url}
                    />
                    <EquipmentRowActions equipmentId={item.id} status={item.status} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
