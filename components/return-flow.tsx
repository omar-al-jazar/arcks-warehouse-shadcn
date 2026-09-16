"use client";

import { useState } from "react";
import BarcodeScannerInput from "@/components/barcode-scanner-input";
import { returnByBarcode } from "@/app/actions/checkout-actions";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LogEntry = {
  id: number;
  type: "error" | "success";
  text: string;
};

export default function ReturnFlow() {
  const [log, setLog] = useState<LogEntry[]>([]);

  async function handleScan(code: string) {
    const result = await returnByBarcode(code);
    const entry: LogEntry = result.error
      ? { id: Date.now(), type: "error", text: result.error }
      : {
          id: Date.now(),
          type: "success",
          text: `Returned "${result.itemName}" (${result.projectName}).`,
        };
    setLog((current) => [entry, ...current].slice(0, 20));
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Scan returning items</h2>
        <BarcodeScannerInput onScan={handleScan} placeholder="Scan a barcode being returned" />
      </Card>

      <div className="flex flex-col gap-2">
        {log.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Scanned returns will show up here.</p>
        ) : (
          log.map((entry) => (
            <Card
              key={entry.id}
              className={cn(
                "px-3 py-2 text-sm",
                entry.type === "error"
                  ? "border border-destructive/35 bg-destructive-bg text-destructive"
                  : "border border-good/35 bg-good-bg text-good"
              )}
            >
              {entry.text}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
