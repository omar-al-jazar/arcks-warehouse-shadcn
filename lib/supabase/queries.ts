import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EquipmentCategory, EquipmentStatus } from "@/lib/supabase/types";

export async function getAllStaff() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, role, email, created_at")
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", user.id)
    .single();

  return profile;
}

export type EquipmentFilters = {
  category?: string;
  status?: string;
  search?: string;
};

// PostgREST's .or() takes a raw filter string (e.g.
// "name.ilike.%foo%,barcode.ilike.%bar%"), so interpolating user input into
// it directly is filter-syntax injection: characters like `,` `(` `)` `%`
// `.` let a search term inject extra conditions or break the filter's
// structure. Real equipment names/barcodes in this system (see seed data)
// are plain text — letters, digits, spaces, hyphens — so stripping
// everything else from the search term before interpolating removes the
// injection vectors without breaking legitimate searches.
function sanitizeSearchTerm(term: string) {
  return term.replace(/[^a-zA-Z0-9 -]/g, "");
}

export async function getAllEquipment(filters: EquipmentFilters = {}) {
  const supabase = await createClient();
  let query = supabase.from("equipment").select("*").order("name");

  if (filters.category) {
    query = query.eq("category", filters.category as EquipmentCategory);
  }
  if (filters.status) {
    query = query.eq("status", filters.status as EquipmentStatus);
  }
  if (filters.search) {
    const term = sanitizeSearchTerm(filters.search);
    if (term) {
      query = query.or(`name.ilike.%${term}%,barcode.ilike.%${term}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getEquipmentByBarcode(barcode: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipment")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle();
  return data;
}

export async function getEquipmentStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("equipment").select("category, status");
  if (error) throw error;

  const byCategory: Record<
    string,
    { total: number; available: number; checkedOut: number; maintenance: number }
  > = {};

  for (const item of data) {
    if (!byCategory[item.category]) {
      byCategory[item.category] = { total: 0, available: 0, checkedOut: 0, maintenance: 0 };
    }
    byCategory[item.category].total += 1;
    if (item.status === "available") byCategory[item.category].available += 1;
    if (item.status === "checked_out") byCategory[item.category].checkedOut += 1;
    if (item.status === "maintenance") byCategory[item.category].maintenance += 1;
  }

  return {
    total: data.length,
    available: data.filter((e) => e.status === "available").length,
    checkedOut: data.filter((e) => e.status === "checked_out").length,
    maintenance: data.filter((e) => e.status === "maintenance").length,
    byCategory,
  };
}

export async function getActiveOrdersWithItems() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("checkout_orders")
    .select(
      "*, profiles!checkout_orders_checked_out_by_fkey(name), checkout_items(id, equipment_id, returned_at, equipment(name, barcode, category))"
    )
    .eq("status", "active")
    .order("due_date");
  if (error) throw error;

  return orders.map(({ checkout_items, ...order }) => ({
    ...order,
    items: checkout_items ?? [],
  }));
}

export async function getOverdueOrders() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("checkout_orders")
    .select(
      "*, profiles!checkout_orders_checked_out_by_fkey(name), checkout_items(id, equipment_id, returned_at, equipment(name, barcode, category))"
    )
    .eq("status", "active")
    .lt("due_date", new Date().toISOString())
    .order("due_date");
  if (error) throw error;

  return orders.map(({ checkout_items, ...order }) => ({
    ...order,
    items: checkout_items ?? [],
  }));
}

export async function getOrderHistory() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("checkout_orders")
    .select("*, checkout_items(id, equipment_id, returned_at, equipment(name, barcode))")
    .order("checked_out_at", { ascending: false });
  if (error) throw error;

  return orders.map(({ checkout_items, ...order }) => ({
    ...order,
    items: checkout_items ?? [],
  }));
}

export async function findActiveCheckoutItemForEquipment(equipmentId: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("checkout_items")
    .select("*")
    .eq("equipment_id", equipmentId)
    .is("returned_at", null)
    .maybeSingle();
  return data;
}
