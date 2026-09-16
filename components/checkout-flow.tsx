"use client";

import { useState, useTransition } from "react";
import BarcodeScannerInput from "@/components/barcode-scanner-input";
import { lookupBarcode } from "@/app/actions/equipment-actions";
import { createCheckout } from "@/app/actions/checkout-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

type CartItem = { id: number; name: string; barcode: string; category: string };

const CATEGORY_ORDER = [
  { category: "camera", label: "Camera" },
  { category: "lighting", label: "Light" },
  { category: "grip", label: "Grip" },
];

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

export default function CheckoutFlow() {
  const [projectName, setProjectName] = useState("");
  const [renterName, setRenterName] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleScan(code: string) {
    setMessage(null);
    const item = await lookupBarcode(code);
    if (!item) {
      setMessage({ type: "error", text: `No equipment found for barcode "${code}".` });
      return;
    }
    if (item.status === "checked_out") {
      setMessage({ type: "error", text: `"${item.name}" is already checked out.` });
      return;
    }
    if (item.status === "maintenance") {
      setMessage({ type: "error", text: `"${item.name}" is flagged for maintenance.` });
      return;
    }
    if (cart.some((entry) => entry.id === item.id)) {
      setMessage({ type: "error", text: `"${item.name}" is already in the cart.` });
      return;
    }
    setCart((current) => [...current, { id: item.id, name: item.name, barcode: item.barcode, category: item.category }]);
  }

  function removeItem(id: number) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await createCheckout({ projectName, renterName, dueDate, equipmentIds: cart.map((i) => i.id) });
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: `Checked out ${cart.length} item(s) to ${renterName}.` });
      setCart([]);
      setProjectName("");
      setRenterName("");
      setDueDate(defaultDueDate());
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Order details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project">Project / production</FieldLabel>
              <Input
                id="project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Riverside commercial shoot"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="renter">Renter / crew contact</FieldLabel>
              <Input id="renter" value={renterName} onChange={(e) => setRenterName(e.target.value)} placeholder="e.g. Jordan Lee" />
            </Field>
            <Field>
              <FieldLabel htmlFor="due">Due back</FieldLabel>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Scan items</p>
            <BarcodeScannerInput onScan={handleScan} />
          </div>

          {message ? (
            <p className={`text-sm ${message.type === "error" ? "text-destructive" : "text-good"}`}>{message.text}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cart ({cart.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items scanned yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {CATEGORY_ORDER.map(({ category, label }) => {
                const items = cart.filter((i) => i.category === category);
                if (items.length === 0) return null;
                return (
                  <div key={category}>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">
                      {label} ({items.length})
                    </p>
                    <ul className="flex flex-col gap-2">
                      {items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">{item.barcode}</p>
                          </div>
                          <Button variant="ghost" size="icon-sm" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                            <XIcon />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          <Button className="mt-auto" disabled={isPending || cart.length === 0} onClick={submit}>
            {isPending ? "Checking out..." : `Check out ${cart.length} item(s)`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
