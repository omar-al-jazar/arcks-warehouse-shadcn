"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth-actions";
import { createClient } from "@/lib/supabase/client";
import { getBiometricLabel, isPasskeyAvailable } from "@/lib/webauthn-device";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FingerprintIcon } from "lucide-react";

const initialState: LoginState = {};
const PIN_LENGTH = 6;
const ROLE_LABEL = { owner: "Owner", manager: "Warehouse Manager" } as const;

export default function LoginForm({ next }: { next?: string }) {
  const [role, setRole] = useState<"owner" | "manager">("manager");
  const [pin, setPin] = useState("");
  const [state, formAction, pending] = useActionState(login, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const [biometricPending, setBiometricPending] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [passkeyPromptOpen, setPasskeyPromptOpen] = useState(false);
  const [settingUpPasskey, setSettingUpPasskey] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isPasskeyAvailable().then((available) => {
      if (cancelled || !available) return;
      setBiometricLabel(getBiometricLabel());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-submit the moment all 6 digits are in — no separate "Log in" tap.
  useEffect(() => {
    if (pin.length === PIN_LENGTH && !pending) {
      formRef.current?.requestSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function navigateToDestination() {
    const destination = state.destination && state.destination.startsWith("/") ? state.destination : "/";
    window.location.assign(destination);
  }

  useEffect(() => {
    if (!state.success) return;
    let cancelled = false;
    const dismissKey = `passkey-prompt-dismissed:${role}`;
    (async () => {
      const alreadyDismissed = window.localStorage.getItem(dismissKey) === "1";
      const offerEnrollment = !state.hasPasskey && !alreadyDismissed && (await isPasskeyAvailable());
      if (cancelled) return;
      if (offerEnrollment) {
        setPasskeyPromptOpen(true);
      } else {
        navigateToDestination();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (state.error) setPin("");
  }, [state.error]);

  async function signInWithBiometric() {
    setBiometricPending(true);
    setBiometricError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPasskey();
    if (error) {
      setBiometricPending(false);
      setBiometricError(error.message);
      return;
    }
    window.location.assign(next && next.startsWith("/") ? next : "/");
  }

  async function setupPasskey() {
    setSettingUpPasskey(true);
    const supabase = createClient();
    await supabase.auth.registerPasskey();
    navigateToDestination();
  }

  function dismissPasskeyPrompt() {
    window.localStorage.setItem(`passkey-prompt-dismissed:${role}`, "1");
    navigateToDestination();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-xl">Arck&rsquo;s Warehouse</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <ToggleGroup
            value={[role]}
            onValueChange={(value) => {
              const next = value[0];
              if (next === "owner" || next === "manager") {
                setRole(next);
                setPin("");
              }
            }}
            className="w-full"
          >
            <ToggleGroupItem value="manager" className="flex-1">
              Manager
            </ToggleGroupItem>
            <ToggleGroupItem value="owner" className="flex-1">
              Owner
            </ToggleGroupItem>
          </ToggleGroup>

          <form ref={formRef} action={formAction} className="flex flex-col items-center gap-2">
            <input type="hidden" name="role" value={role} />
            <input type="hidden" name="pin" value={pin} />
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <p className="text-sm text-muted-foreground">Enter the 6-digit PIN for {ROLE_LABEL[role]}</p>
            <InputOTP
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={setPin}
              disabled={pending}
              inputMode="numeric"
            >
              <InputOTPGroup>
                {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} aria-invalid={!!state.error} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <button type="submit" className="sr-only" disabled={pending || pin.length < PIN_LENGTH}>
              Log in
            </button>
          </form>

          <div className="h-4 text-center text-sm text-destructive">{state.error}</div>

          {biometricLabel ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={biometricPending}
              onClick={signInWithBiometric}
            >
              <FingerprintIcon data-icon="inline-start" />
              {biometricPending ? "Checking..." : `Use ${biometricLabel} instead`}
            </Button>
          ) : null}
          {biometricError ? <p className="text-xs text-destructive">{biometricError}</p> : null}
        </CardContent>
      </Card>

      <Dialog open={passkeyPromptOpen} onOpenChange={(open) => !open && dismissPasskeyPrompt()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set up faster sign-in?</DialogTitle>
            <DialogDescription>
              Register this device so you can sign in with Face ID, Touch ID, or your fingerprint next time,
              instead of typing your PIN.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={dismissPasskeyPrompt} disabled={settingUpPasskey}>
              Not now
            </Button>
            <Button onClick={setupPasskey} disabled={settingUpPasskey}>
              {settingUpPasskey ? "Setting up..." : "Set it up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
