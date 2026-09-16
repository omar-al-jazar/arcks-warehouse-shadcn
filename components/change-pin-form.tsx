"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { changePin, type ChangePinState } from "@/app/actions/auth-actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { buttonVariants } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";

const initialState: ChangePinState = {};
const PIN_LENGTH = 6;

type Stage = "current" | "new" | "confirm" | "done";

const STAGE_COPY: Record<Exclude<Stage, "done">, { heading: string; sub: string }> = {
  current: { heading: "Enter current PIN", sub: "Confirm it's you before changing your PIN." },
  new: { heading: "Choose new PIN", sub: "Pick a 6-digit PIN you haven't used before." },
  confirm: { heading: "Confirm new PIN", sub: "Enter it once more to make sure." },
};

export default function ChangePinForm({ dashboardHref }: { dashboardHref: string }) {
  const [stage, setStage] = useState<Stage>("current");
  const [pin, setPin] = useState("");
  const [storedCurrent, setStoredCurrent] = useState("");
  const [storedNew, setStoredNew] = useState("");
  const [state, formAction, pending] = useActionState(changePin, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Submitting the form (stage "confirm" reaching PIN_LENGTH) still needs an
  // effect: requestSubmit() must run after the hidden `confirmPin` input has
  // re-rendered with the final digit.
  useEffect(() => {
    if (pin.length === PIN_LENGTH && stage === "confirm" && !pending) {
      formRef.current?.requestSubmit();
    }
  }, [pin, stage, pending]);

  useEffect(() => {
    if (state.success) setStage("done");
  }, [state.success]);

  useEffect(() => {
    if (state.error) {
      // Wrong current PIN or a mismatched confirmation — start the whole
      // 3-step flow over, same as an iOS "Passcodes didn't match".
      setPin("");
      setStoredCurrent("");
      setStoredNew("");
      setStage("current");
    }
  }, [state.error]);

  function handleChange(value: string) {
    setPin(value);
    if (value.length !== PIN_LENGTH) return;
    if (stage === "current") {
      setStoredCurrent(value);
      setStage("new");
      setPin("");
    } else if (stage === "new") {
      setStoredNew(value);
      setStage("confirm");
      setPin("");
    }
  }

  if (stage === "done") {
    return (
      <Card className="items-center gap-4 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-good-bg">
          <CheckIcon className="size-8 text-good" />
        </div>
        <p className="text-base font-semibold">PIN changed</p>
        <p className="text-sm text-muted-foreground">Use your new PIN next time you log in.</p>
        <Link href={dashboardHref} className={buttonVariants({ className: "mt-2" })}>
          Back to dashboard
        </Link>
      </Card>
    );
  }

  const copy = STAGE_COPY[stage];

  return (
    <Card className="min-h-[420px] justify-center gap-4 p-8">
      <CardHeader className="items-center px-0 text-center">
        <CardTitle>{copy.heading}</CardTitle>
        <CardDescription>{copy.sub}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 px-0">
        <form ref={formRef} action={formAction} className="contents">
          <input type="hidden" name="currentPin" value={storedCurrent} />
          <input type="hidden" name="newPin" value={storedNew} />
          <input type="hidden" name="confirmPin" value={stage === "confirm" ? pin : ""} />

          <InputOTP maxLength={PIN_LENGTH} value={pin} onChange={handleChange} disabled={pending} inputMode="numeric">
            <InputOTPGroup>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <InputOTPSlot key={i} index={i} aria-invalid={!!state.error} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <button type="submit" className="sr-only" disabled={pending}>
            Change PIN
          </button>
        </form>

        <div className="h-4 text-center text-sm text-destructive">{state.error}</div>
      </CardContent>

      <Link href={dashboardHref} className="self-center text-xs font-medium text-muted-foreground hover:text-foreground hover:underline">
        Cancel
      </Link>
    </Card>
  );
}
