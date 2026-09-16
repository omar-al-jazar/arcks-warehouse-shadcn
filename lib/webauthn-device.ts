// Client-only helpers for the passkey UI: what to call the biometric prompt
// on this device, and whether this browser/device can even show one. The
// actual WebAuthn ceremony behaves identically everywhere — this is purely
// about picking the right label/icon ("Face ID" vs "Touch ID" vs generic)
// and hiding the option entirely on devices with no platform authenticator,
// rather than offering something that would just fail.

export type BiometricKind = "face-id" | "touch-id" | "windows-hello" | "biometric";

export function getBiometricLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "Face ID";
  if (/Macintosh/.test(ua)) return "Touch ID";
  if (/Windows/.test(ua)) return "Windows Hello";
  if (/Android/.test(ua)) return "fingerprint or face unlock";
  return "biometric sign-in";
}

export function getBiometricKind(): BiometricKind {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "face-id";
  if (/Macintosh/.test(ua)) return "touch-id";
  if (/Windows/.test(ua)) return "windows-hello";
  return "biometric";
}

// True on phones/tablets, false on laptops/desktops — used only to decide
// whether the PIN keypad stays visible alongside the biometric option (both,
// like a Mac) or the biometric prompt takes over more of the screen (phones
// mostly rely on it). The biometric capability check below is what actually
// gates whether the option appears at all, on either kind of device.
export function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/.test(navigator.userAgent);
}

export async function isPasskeyAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    const [platformAvailable, conditionalAvailable] = await Promise.all([
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
      PublicKeyCredential.isConditionalMediationAvailable?.() ?? Promise.resolve(false),
    ]);
    return platformAvailable || conditionalAvailable;
  } catch {
    return false;
  }
}
