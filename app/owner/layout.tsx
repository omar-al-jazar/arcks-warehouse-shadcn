import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/queries";
import NavBar from "@/components/nav-bar";

export default async function OwnerLayout({ children }: LayoutProps<"/owner">) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "owner") redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar
        title="Owner"
        name={profile.name}
        links={[
          { href: "/owner", label: "Dashboard" },
          { href: "/owner/inventory", label: "Inventory" },
          { href: "/owner/orders", label: "Orders" },
          { href: "/owner/staff", label: "Staff" },
          { href: "/owner/settings", label: "Settings" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
