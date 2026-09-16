"use client";

import { useActionState, useRef, useState } from "react";
import { addEquipment, type EquipmentFormState } from "@/app/actions/equipment-actions";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

const initialState: EquipmentFormState = {};

export default function AddEquipmentForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [quantity, setQuantity] = useState("1");
  const isBulk = Number.parseInt(quantity, 10) > 1;
  const [state, formAction, pending] = useActionState(async (prev: EquipmentFormState, formData: FormData) => {
    const result = await addEquipment(prev, formData);
    if (result.success) {
      formRef.current?.reset();
      setQuantity("1");
    }
    return result;
  }, initialState);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="barcode">{isBulk ? "Barcode prefix" : "Barcode (optional)"}</FieldLabel>
          <Input
            id="barcode"
            name="barcode"
            placeholder={isBulk ? "e.g. GRP" : "leave blank to auto-generate"}
          />
          {isBulk ? (
            <FieldDescription>e.g. GRP — items will be numbered GRP-0004, GRP-0005, ...</FieldDescription>
          ) : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" name="name" required placeholder="e.g. Arri Alexa Mini" />
        </Field>
        <div className="flex gap-3">
          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <NativeSelect id="category" name="category" defaultValue="camera" className="w-full">
              {EQUIPMENT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field className="max-w-24">
            <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="serialNumber">Serial number (optional)</FieldLabel>
          <Input id="serialNumber" name="serialNumber" placeholder="if a single item" />
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Notes (optional)</FieldLabel>
          <Input id="description" name="description" placeholder="Accessories, condition, etc." />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Adding..." : "Add item"}
      </Button>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success && state.message ? <p className="text-sm text-good">{state.message}</p> : null}
    </form>
  );
}
