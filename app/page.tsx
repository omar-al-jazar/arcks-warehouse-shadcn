import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CameraIcon, LightbulbIcon, WrenchIcon, ArrowRightIcon } from "lucide-react";

export default async function Home() {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(profile.role === "owner" ? "/owner" : "/manager");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-good" />
          All gear accounted for
        </span>
        <h1 className="font-heading mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Arck&rsquo;s Warehouse
        </h1>
        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          Every camera, light, and cable — tracked, not lost. Scan it out, scan it back, know exactly where it
          went.
        </p>
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Enter warehouse
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </div>

      <div className="mt-16 grid w-full max-w-3xl gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        <Card className="rounded-none border-0">
          <CardContent className="flex flex-col gap-3">
            <CameraIcon className="size-6" />
            <div>
              <p className="font-heading font-bold">Camera</p>
              <p className="text-sm text-muted-foreground">Bodies, lenses, monitors, wireless video.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-0">
          <CardContent className="flex flex-col gap-3">
            <LightbulbIcon className="size-6" />
            <div>
              <p className="font-heading font-bold">Light</p>
              <p className="text-sm text-muted-foreground">Fixtures, softboxes, tube lights, effects.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-0">
          <CardContent className="flex flex-col gap-3">
            <WrenchIcon className="size-6" />
            <div>
              <p className="font-heading font-bold">Grip</p>
              <p className="text-sm text-muted-foreground">Stands, flags, apple boxes, the odds and ends.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
