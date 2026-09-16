import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/queries";
import NavBar from "@/components/nav-bar";

export default async function ManagerLayout({ children }: LayoutProps<"/manager">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar
        title="Warehouse desk"
        name={profile.name}
        links={[
          { href: "/manager/checkout", label: "Check out" },
          { href: "/manager/return", label: "Return" },
          { href: "/manager/orders", label: "Active orders" },
          { href: "/manager/add-equipment", label: "Add equipment" },
          { href: "/manager/settings", label: "Settings" },
        ]}
      />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
