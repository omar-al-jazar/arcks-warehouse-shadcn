"use client";

import { useEffect, useRef, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "@/components/ui/input-group";
import { ScanLineIcon } from "lucide-react";

type BarcodeScannerInputProps = {
  onScan: (code: string) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

// USB/Bluetooth HID barcode scanners act as a keyboard — they "type" the
// barcode and hit Enter. This is a plain text input listening for that,
// so any standard scanner works with no drivers or special pairing.
export default function BarcodeScannerInput({
  onScan,
  placeholder = "Scan or type a barcode, then press Enter",
  disabled = false,
  autoFocus = true,
}: BarcodeScannerInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  async function submit() {
    const code = value.trim();
    if (!code || disabled) return;
    setValue("");
    await onScan(code);
    inputRef.current?.focus();
  }

  return (
    <InputGroup>
      <InputGroupAddon>
        <ScanLineIcon />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton disabled={disabled || !value.trim()} onClick={() => void submit()}>
          Add
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
