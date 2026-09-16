"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBiometricLabel, isPasskeyAvailable } from "@/lib/webauthn-device";
import { Button } from "@/components/ui/button";

type Status = "checking" | "unavailable" | "ready" | "registering" | "done" | "error";

export default function RegisterPasskeyButton() {
  const [status, setStatus] = useState<Status>("checking");
  const [label, setLabel] = useState("biometric sign-in");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    isPasskeyAvailable().then((available) => {
      if (cancelled) return;
      setLabel(getBiometricLabel());
      setStatus(available ? "ready" : "unavailable");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function register() {
    setStatus("registering");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.registerPasskey();
    if (error) {
      setError(error.message);
      setStatus("ready");
      return;
    }
    setStatus("done");
  }

  if (status === "checking") return null;

  if (status === "unavailable") {
    return (
      <p className="text-xs text-muted-foreground">
        This device doesn&apos;t support Face ID / Touch ID sign-in.
      </p>
    );
  }

  if (status === "done") {
    return <p className="text-sm text-good">{label} is set up on this device.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button type="button" variant="outline" onClick={register} disabled={status === "registering"}>
        {status === "registering" ? "Setting up..." : `Set up ${label}`}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
