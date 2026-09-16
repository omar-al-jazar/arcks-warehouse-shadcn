import ChangePinForm from "@/components/change-pin-form";
import RegisterPasskeyButton from "@/components/register-passkey-button";
import { Card } from "@/components/ui/card";

export default function ManagerSettingsPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <h1 className="text-center font-heading text-lg font-semibold">Settings</h1>
      <ChangePinForm dashboardHref="/manager" />
      <Card className="items-center gap-2 p-5 text-center">
        <h2 className="text-sm font-semibold text-muted-foreground">Biometric sign-in</h2>
        <RegisterPasskeyButton />
      </Card>
    </div>
  );
}
