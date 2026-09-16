import type { EquipmentCategory } from "@/lib/supabase/types";

export const EQUIPMENT_CATEGORIES: { value: EquipmentCategory; label: string }[] = [
  { value: "camera", label: "Camera" },
  { value: "lighting", label: "Lighting" },
  { value: "grip", label: "Grip" },
];
