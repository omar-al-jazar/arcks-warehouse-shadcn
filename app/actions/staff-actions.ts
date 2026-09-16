"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/queries";
import type { StaffRole } from "@/lib/supabase/types";

export type StaffFormState = {
  error?: string;
  success?: boolean;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

export async function createStaff(
  _prevState: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "owner") {
    return { error: "Only the owner can add staff." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!name) return { error: "Name is required." };
  if (role !== "manager" && role !== "owner") return { error: "Pick a valid role." };
  if (!/^\d{6}$/.test(pin)) return { error: "PIN must be exactly 6 digits." };

  const admin = createAdminClient();

  const slug = slugify(name) || "staff";
  let email = `${slug}@arcks-warehouse.local`;
  let attempt = 1;
  while (true) {
    const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!existing) break;
    attempt += 1;
    email = `${slug}${attempt}@arcks-warehouse.local`;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    app_metadata: { role },
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Failed to create the account." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: created.user.id, name, role: role as StaffRole, email });

  if (profileError) {
    // Clean up the orphaned auth user rather than leaving an account with no profile.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/owner/staff");
  return { success: true };
}
