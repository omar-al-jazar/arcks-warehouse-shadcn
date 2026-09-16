"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
  success?: boolean;
  hasPasskey?: boolean;
  destination?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const role = formData.get("role");
  const pin = formData.get("pin");
  const next = formData.get("next");

  if (
    (role !== "manager" && role !== "owner") ||
    typeof pin !== "string" ||
    pin.length < 6
  ) {
    return { error: "Enter your 6-digit PIN to continue." };
  }

  // The lock screen only shows one "Manager" / "Owner" tile, but multiple
  // named accounts can share a role (e.g. several managers on a growing
  // team) — try each account for that role with the entered PIN until one
  // matches, rather than assuming a single hardcoded email per role.
  const admin = createAdminClient();
  const { data: candidates } = await admin.from("profiles").select("email").eq("role", role);

  const supabase = await createClient();
  let loggedIn = false;
  for (const candidate of candidates ?? []) {
    const { error } = await supabase.auth.signInWithPassword({
      email: candidate.email,
      password: pin,
    });
    if (!error) {
      loggedIn = true;
      break;
    }
  }

  if (!loggedIn) {
    return { error: "That PIN wasn't recognized." };
  }

  const destination =
    typeof next === "string" && next.startsWith("/")
      ? next
      : role === "owner"
        ? "/owner"
        : "/manager";

  // Checked server-side via Supabase (a SECURITY DEFINER RPC scoped to
  // auth.uid(), see migration 0005) rather than trusted from the client —
  // only the server can know what's actually enrolled for this account.
  // The login form uses this to decide whether to offer a one-time "set up
  // Face ID / Touch ID" prompt; device capability is still detected
  // client-side, same as the existing biometric sign-in button.
  const { data: hasPasskey } = await supabase.rpc("user_has_passkey");

  // No server-side redirect() here (unlike logout()) — the form needs this
  // state back to decide whether to show the passkey-enrollment prompt
  // before navigating, the same way signInWithBiometric() already navigates
  // from the client instead of a server redirect.
  return { success: true, hasPasskey: hasPasskey ?? false, destination };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ChangePinState = {
  error?: string;
  success?: boolean;
};

const PIN_PATTERN = /^\d{6}$/;

export async function changePin(
  _prevState: ChangePinState,
  formData: FormData
): Promise<ChangePinState> {
  const currentPin = formData.get("currentPin");
  const newPin = formData.get("newPin");
  const confirmPin = formData.get("confirmPin");

  if (
    typeof currentPin !== "string" ||
    typeof newPin !== "string" ||
    typeof confirmPin !== "string" ||
    !PIN_PATTERN.test(currentPin) ||
    !PIN_PATTERN.test(newPin) ||
    !PIN_PATTERN.test(confirmPin)
  ) {
    return { error: "Enter a 6-digit PIN at each step." };
  }
  if (newPin !== confirmPin) {
    return { error: "New PINs didn't match. Try again." };
  }
  if (newPin === currentPin) {
    return { error: "New PIN must be different from your current one." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "Your session expired. Log in again." };
  }

  // Re-authenticating with the current PIN is the verification step —
  // there's no separate "check password" API, so this doubles as the proof
  // the caller actually knows the current PIN before we accept a new one.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPin,
  });
  if (verifyError) {
    return { error: "Current PIN wasn't correct." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPin });
  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}
