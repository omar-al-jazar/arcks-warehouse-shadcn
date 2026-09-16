"use client";

import { useRef, useState, useTransition } from "react";
import {
  identifyPhoto,
  searchStockImage,
  previewNextBarcode,
  addEquipment,
  type EquipmentFormState,
} from "@/app/actions/equipment-actions";
import type { EquipmentCategory } from "@/lib/supabase/types";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { CameraIcon } from "lucide-react";

type Stage = "capture" | "identifying" | "review" | "submitting" | "done";

export default function PhotoAddEquipment() {
  const [stage, setStage] = useState<Stage>("capture");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EquipmentCategory>("camera");
  const [serialNumber, setSerialNumber] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [isSearchingImage, startImageSearch] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStage("capture");
    setError(null);
    setName("");
    setCategory("camera");
    setSerialNumber("");
    setImageUrl(null);
    setBarcode(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePhoto(file: File) {
    setError(null);
    setStage("identifying");

    const formData = new FormData();
    formData.set("photo", file);
    const result = await identifyPhoto(formData);

    if ("error" in result) {
      setError(result.error);
      setStage("capture");
      return;
    }

    setName(result.suggestion.name);
    setCategory(result.suggestion.category);
    setSerialNumber(result.suggestion.serialNumber ?? "");
    setImageUrl(result.stockImageUrl);

    try {
      const { barcode: nextBarcode } = await previewNextBarcode(result.suggestion.category);
      setBarcode(nextBarcode);
    } catch {
      setError("Identified the item, but couldn't reserve a barcode. Try confirming again.");
    }

    setStage("review");
  }

  function handleCategoryChange(next: EquipmentCategory) {
    setCategory(next);
    startImageSearch(async () => {
      try {
        const { barcode: nextBarcode } = await previewNextBarcode(next);
        setBarcode(nextBarcode);
      } catch {
        // Keep the old barcode preview rather than blocking the form.
      }
    });
  }

  function searchAgain() {
    if (!name.trim()) return;
    startImageSearch(async () => {
      const { imageUrl: found } = await searchStockImage(name.trim());
      setImageUrl(found);
    });
  }

  async function confirm() {
    if (!name.trim() || !barcode) return;
    setStage("submitting");
    setError(null);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("category", category);
    formData.set("serialNumber", serialNumber.trim());
    formData.set("imageUrl", imageUrl ?? "");
    formData.set("barcode", barcode);

    const result: EquipmentFormState = await addEquipment({}, formData);
    if (result.error) {
      setError(result.error);
      setStage("review");
      return;
    }

    setStage("done");
  }

  if (stage === "done") {
    return (
      <Card className="items-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">Added — print or write this on a label:</p>
        <p className="font-mono text-3xl font-bold tracking-wide">{barcode}</p>
        <p className="text-sm">{name}</p>
        <Button type="button" onClick={reset} className="mt-2">
          Add another
        </Button>
      </Card>
    );
  }

  if (stage === "capture" || stage === "identifying") {
    return (
      <Card className="items-center gap-3 p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handlePhoto(file);
          }}
        />
        <Button
          type="button"
          disabled={stage === "identifying"}
          onClick={() => fileInputRef.current?.click()}
        >
          <CameraIcon data-icon="inline-start" />
          {stage === "identifying" ? "Identifying..." : "Take photo"}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </Card>
    );
  }

  return (
    <Card className="gap-3 p-5">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable source
        <img src={imageUrl} alt={name} className="h-40 w-full rounded-lg bg-muted object-contain" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
          No image found
        </div>
      )}
      <button
        type="button"
        onClick={searchAgain}
        disabled={isSearchingImage}
        className="self-start text-xs text-muted-foreground underline disabled:opacity-50"
      >
        {isSearchingImage ? "Searching..." : "Search again for a photo"}
      </button>

      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="photo-name">Name</FieldLabel>
          <Input id="photo-name" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="photo-category">Category</FieldLabel>
          <NativeSelect
            id="photo-category"
            value={category}
            onChange={(event) => handleCategoryChange(event.target.value as EquipmentCategory)}
            className="w-full"
          >
            {EQUIPMENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="photo-serial">Serial number (optional)</FieldLabel>
          <Input id="photo-serial" value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} />
        </Field>
      </FieldGroup>

      <p className="text-xs text-muted-foreground">
        Barcode: <span className="font-mono font-medium text-foreground">{barcode ?? "generating..."}</span>
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={reset} className="flex-1">
          Retake
        </Button>
        <Button
          type="button"
          onClick={confirm}
          disabled={stage === "submitting" || !barcode || !name.trim()}
          className="flex-1"
        >
          {stage === "submitting" ? "Adding..." : "Confirm & add"}
        </Button>
      </div>
    </Card>
  );
}
