"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getEquipmentByBarcode } from "@/lib/supabase/queries";
import { identifyEquipmentPhoto, type EquipmentPhotoSuggestion } from "@/lib/vision";
import { findStockImage } from "@/lib/image-search";
import type { EquipmentCategory } from "@/lib/supabase/types";

export type EquipmentFormState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const CATEGORIES = ["camera", "lighting", "grip"] as const;

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 100;

function isStaff(role: string | undefined) {
  return role === "owner" || role === "manager";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function addEquipment(
  _prevState: EquipmentFormState,
  formData: FormData
): Promise<EquipmentFormState> {
  const profile = await getCurrentProfile();
  if (!profile || !isStaff(profile.role)) {
    return { error: "Only staff can add equipment." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "camera");
  const description = String(formData.get("description") ?? "").trim();
  const serialNumber = String(formData.get("serialNumber") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const barcode = String(formData.get("barcode") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const quantity = quantityRaw === "" ? 1 : Number.parseInt(quantityRaw, 10);

  if (!name) {
    return { error: "Name is required." };
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Pick a valid category." };
  }
  if (!Number.isFinite(quantity) || quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
    return { error: `Quantity must be a whole number between ${MIN_QUANTITY} and ${MAX_QUANTITY}.` };
  }

  const supabase = await createClient();
  const extraFields = { description: description || null, serial_number: serialNumber || null, image_url: imageUrl || null };

  // No barcode given: mint one from the per-category sequence (the photo-add
  // flow always takes this path, one item at a time).
  if (!barcode) {
    const { data: generated, error: barcodeError } = await supabase.rpc("next_equipment_barcode", {
      p_category: category as EquipmentCategory,
    });
    if (barcodeError) return { error: barcodeError.message };

    const { error } = await supabase.from("equipment").insert({
      barcode: generated as string,
      name,
      category: category as EquipmentCategory,
      ...extraFields,
    });
    if (error) return { error: error.message };

    revalidatePath("/owner/inventory");
    return { success: true };
  }

  // Quantity 1: `barcode` is the literal, full barcode with an exact
  // uniqueness check and a single insert.
  if (quantity === 1) {
    const existing = await getEquipmentByBarcode(barcode);
    if (existing) {
      return { error: `Barcode ${barcode} is already assigned to "${existing.name}".` };
    }

    const { error } = await supabase.from("equipment").insert({
      barcode,
      name,
      category: category as EquipmentCategory,
      ...extraFields,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/owner/inventory");
    return { success: true };
  }

  // Bulk path: `barcode` is treated as a prefix (e.g. "GRP"), not a literal
  // barcode. Find existing barcodes matching `prefix-%`, parse the numeric
  // suffixes, and continue numbering from max + 1.
  const prefix = barcode.replace(/-+$/, "");
  const { data: existingRows, error: lookupError } = await supabase
    .from("equipment")
    .select("barcode")
    .ilike("barcode", `${prefix}-%`);

  if (lookupError) {
    return { error: lookupError.message };
  }

  const suffixPattern = new RegExp(`^${escapeRegExp(prefix)}-(\\d+)$`, "i");
  let maxSuffix = 0;
  for (const row of existingRows ?? []) {
    const match = row.barcode.match(suffixPattern);
    if (match) {
      const num = Number.parseInt(match[1], 10);
      if (num > maxSuffix) maxSuffix = num;
    }
  }

  const start = maxSuffix + 1;
  const newBarcodes = Array.from({ length: quantity }, (_, i) => `${prefix}-${String(start + i).padStart(4, "0")}`);

  const rows = newBarcodes.map((code) => ({
    barcode: code,
    name,
    category: category as EquipmentCategory,
    ...extraFields,
  }));

  const { error: insertError } = await supabase.from("equipment").insert(rows);

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/owner/inventory");
  return {
    success: true,
    message: `Added ${quantity} items: ${newBarcodes[0]} through ${newBarcodes[newBarcodes.length - 1]}.`,
  };
}

export async function updateEquipment(
  _prevState: EquipmentFormState,
  formData: FormData
): Promise<EquipmentFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "owner") {
    return { error: "Only the owner can edit equipment." };
  }

  const equipmentId = Number(formData.get("equipmentId"));
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const serialNumber = String(formData.get("serialNumber") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (!Number.isInteger(equipmentId)) {
    return { error: "Invalid equipment." };
  }
  if (!name) {
    return { error: "Name is required." };
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Pick a valid category." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("equipment")
    .update({
      name,
      category: category as EquipmentCategory,
      serial_number: serialNumber || null,
      image_url: imageUrl || null,
    })
    .eq("id", equipmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/owner/inventory");
  return { success: true };
}

export async function setEquipmentStatus(equipmentId: number, status: "available" | "maintenance") {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "owner") {
    throw new Error("Only the owner can update equipment status.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("equipment").update({ status }).eq("id", equipmentId);
  if (error) throw error;

  revalidatePath("/owner/inventory");
  revalidatePath("/owner");
}

export async function lookupBarcode(barcode: string) {
  return getEquipmentByBarcode(barcode.trim());
}

// ---------------------------------------------------------------------------
// Photo-based intake: identify a phone photo, then suggest a stock image and
// the next barcode for the category the model picked. Three separate actions
// so the review form can re-run any one step (e.g. "search again for a
// better photo") without re-uploading or re-identifying.
// ---------------------------------------------------------------------------

export type PhotoIdentifyResult =
  | { success: true; suggestion: EquipmentPhotoSuggestion; stockImageUrl: string | null }
  | { error: string };

export async function identifyPhoto(formData: FormData): Promise<PhotoIdentifyResult> {
  const profile = await getCurrentProfile();
  if (!profile || !isStaff(profile.role)) {
    return { error: "Only staff can add equipment." };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No photo was uploaded." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "That file isn't an image." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  let suggestion: EquipmentPhotoSuggestion;
  try {
    suggestion = await identifyEquipmentPhoto(base64, file.type);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Couldn't identify the photo." };
  }

  const stockImageUrl = await findStockImage(suggestion.name).catch(() => null);

  return { success: true, suggestion, stockImageUrl };
}

export async function searchStockImage(name: string): Promise<{ imageUrl: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || !isStaff(profile.role)) {
    throw new Error("Only staff can add equipment.");
  }
  const imageUrl = await findStockImage(name).catch(() => null);
  return { imageUrl };
}

export async function previewNextBarcode(category: EquipmentCategory): Promise<{ barcode: string }> {
  const profile = await getCurrentProfile();
  if (!profile || !isStaff(profile.role)) {
    throw new Error("Only staff can add equipment.");
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("next_equipment_barcode", { p_category: category });
  if (error) throw error;
  return { barcode: data as string };
}
