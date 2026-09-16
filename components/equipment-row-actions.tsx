"use client";

import { useTransition } from "react";
import { setEquipmentStatus } from "@/app/actions/equipment-actions";

export default function EquipmentRowActions({
  equipmentId,
  status,
}: {
  equipmentId: number;
  status: "available" | "checked_out" | "maintenance";
}) {
  const [isPending, startTransition] = useTransition();

  if (status === "checked_out") {
    return <span className="text-xs text-muted-foreground">Out on order</span>;
  }

  function toggle() {
    startTransition(() => {
      void setEquipmentStatus(equipmentId, status === "maintenance" ? "available" : "maintenance");
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className="text-xs text-muted-foreground underline disabled:opacity-40"
    >
      {status === "maintenance" ? "Mark available" : "Send to maintenance"}
    </button>
  );
}
