import PhotoAddEquipment from "@/components/photo-add-equipment";

export default function ManagerAddEquipmentPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Photograph a new piece of gear — camera, lighting, or grip — and it&apos;ll be identified,
        given a barcode, and added to inventory.
      </p>
      <PhotoAddEquipment />
    </div>
  );
}
