// Hand-written to match supabase/migrations/0001-0004. If the schema
// changes, regenerate with the Supabase CLI instead of editing by hand:
//   npx supabase gen types typescript --local > lib/supabase/types.ts

export type StaffRole = "manager" | "owner";
export type EquipmentCategory = "camera" | "lighting" | "grip";
export type EquipmentStatus = "available" | "checked_out" | "maintenance";
export type OrderStatus = "active" | "completed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; name: string; role: StaffRole; email: string; created_at: string };
        Insert: { id: string; name: string; role: StaffRole; email: string; created_at?: string };
        Update: Partial<{ id: string; name: string; role: StaffRole; email: string; created_at: string }>;
        Relationships: [];
      };
      equipment: {
        Row: {
          id: number;
          barcode: string;
          name: string;
          category: EquipmentCategory;
          description: string | null;
          status: EquipmentStatus;
          notes: string | null;
          serial_number: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          barcode: string;
          name: string;
          category?: EquipmentCategory;
          description?: string | null;
          status?: EquipmentStatus;
          notes?: string | null;
          serial_number?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: number;
          barcode: string;
          name: string;
          category: EquipmentCategory;
          description: string | null;
          status: EquipmentStatus;
          notes: string | null;
          serial_number: string | null;
          image_url: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      checkout_orders: {
        Row: {
          id: number;
          project_name: string;
          renter_name: string;
          checked_out_by: string;
          due_date: string;
          checked_out_at: string;
          returned_at: string | null;
          status: OrderStatus;
        };
        Insert: {
          id?: number;
          project_name: string;
          renter_name: string;
          checked_out_by: string;
          due_date: string;
          checked_out_at?: string;
          returned_at?: string | null;
          status?: OrderStatus;
        };
        Update: Partial<{
          id: number;
          project_name: string;
          renter_name: string;
          checked_out_by: string;
          due_date: string;
          checked_out_at: string;
          returned_at: string | null;
          status: OrderStatus;
        }>;
        Relationships: [
          {
            foreignKeyName: "checkout_orders_checked_out_by_fkey";
            columns: ["checked_out_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      checkout_items: {
        Row: {
          id: number;
          order_id: number;
          equipment_id: number;
          checked_out_at: string;
          returned_at: string | null;
          returned_by: string | null;
        };
        Insert: {
          id?: number;
          order_id: number;
          equipment_id: number;
          checked_out_at?: string;
          returned_at?: string | null;
          returned_by?: string | null;
        };
        Update: Partial<{
          id: number;
          order_id: number;
          equipment_id: number;
          checked_out_at: string;
          returned_at: string | null;
          returned_by: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "checkout_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "checkout_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkout_items_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkout_items_returned_by_fkey";
            columns: ["returned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_checkout: {
        Args: {
          p_project_name: string;
          p_renter_name: string;
          p_due_date: string;
          p_equipment_ids: number[];
        };
        Returns: number;
      };
      return_by_barcode: {
        Args: { p_barcode: string };
        Returns: { item_name: string; project_name: string }[];
      };
      is_owner: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      user_has_passkey: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      next_equipment_barcode: {
        Args: { p_category: EquipmentCategory };
        Returns: string;
      };
    };
    Enums: {
      staff_role: StaffRole;
      equipment_category: EquipmentCategory;
      equipment_status: EquipmentStatus;
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
