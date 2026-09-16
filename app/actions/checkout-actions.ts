"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateCheckoutInput = {
  projectName: string;
  renterName: string;
  dueDate: string;
  equipmentIds: number[];
};

export async function createCheckout(input: CreateCheckoutInput) {
  if (!input.projectName.trim() || !input.renterName.trim() || !input.dueDate) {
    return { error: "Project, renter, and due date are required." };
  }
  if (input.equipmentIds.length === 0) {
    return { error: "Scan at least one item before checking out." };
  }

  const dueDate = new Date(input.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return { error: "Due date is invalid." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_checkout", {
    p_project_name: input.projectName.trim(),
    p_renter_name: input.renterName.trim(),
    p_due_date: dueDate.toISOString(),
    p_equipment_ids: input.equipmentIds,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/manager");
  revalidatePath("/manager/orders");
  revalidatePath("/owner");
  revalidatePath("/owner/inventory");
  revalidatePath("/owner/orders");

  return { success: true, orderId: data as number };
}

export async function returnByBarcode(barcode: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("return_by_barcode", { p_barcode: barcode.trim() })
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/manager");
  revalidatePath("/manager/orders");
  revalidatePath("/owner");
  revalidatePath("/owner/inventory");
  revalidatePath("/owner/orders");

  const result = data as { item_name: string; project_name: string };
  return { success: true, itemName: result.item_name, projectName: result.project_name };
}
