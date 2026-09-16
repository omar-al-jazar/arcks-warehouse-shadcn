import Link from "next/link";
import { getEquipmentStats } from "@/lib/supabase/queries";
import OverdueBanner from "@/components/overdue-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EquipmentCategory } from "@/lib/supabase/types";

const SECTIONS: { category: EquipmentCategory; label: string }[] = [
  { category: "camera", label: "Camera" },
  { category: "lighting", label: "Light" },
  { category: "grip", label: "Grip" },
];

export default async function OwnerDashboard() {
  const stats = await getEquipmentStats();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total gear" value={stats.total} />
        <StatCard label="Available" value={stats.available} tone="good" />
        <StatCard label="Checked out" value={stats.checkedOut} tone="warn" />
        <StatCard label="In maintenance" value={stats.maintenance} />
      </div>

      <OverdueBanner />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Availability by category</CardTitle>
          <Link href="/owner/inventory" className="text-sm text-muted-foreground underline underline-offset-4">
            View inventory
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {SECTIONS.map(({ category, label }) => {
            const counts = stats.byCategory[category] ?? {
              total: 0,
              available: 0,
              checkedOut: 0,
              maintenance: 0,
            };
            return (
              <div key={category} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-sm font-medium">{label}</span>
                <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  {counts.total > 0 ? (
                    <>
                      <div className="h-full bg-good" style={{ width: `${(counts.available / counts.total) * 100}%` }} />
                      <div className="h-full bg-warn" style={{ width: `${(counts.checkedOut / counts.total) * 100}%` }} />
                      <div className="h-full bg-muted-foreground" style={{ width: `${(counts.maintenance / counts.total) * 100}%` }} />
                    </>
                  ) : null}
                </div>
                <span className="w-28 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
                  {counts.available}/{counts.total} available
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "good" | "warn";
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={`font-mono text-2xl font-medium tabular-nums ${
            tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : ""
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
