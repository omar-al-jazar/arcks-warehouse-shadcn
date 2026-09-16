"use client";

import { useActionState, useState } from "react";
import { updateEquipment, type EquipmentFormState } from "@/app/actions/equipment-actions";
import type { EquipmentCategory } from "@/lib/supabase/types";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

const initialState: EquipmentFormState = {};

export default function EditEquipmentButton({
  equipmentId,
  name,
  category,
  serialNumber,
  imageUrl,
}: {
  equipmentId: number;
  name: string;
  category: EquipmentCategory;
  serialNumber: string | null;
  imageUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: EquipmentFormState, formData: FormData) => {
    const result = await updateEquipment(prev, formData);
    if (result.success) setOpen(false);
    return result;
  }, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-muted-foreground underline">
        Edit
      </button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit equipment</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="equipmentId" value={equipmentId} />
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="edit-name">Name</FieldLabel>
              <Input id="edit-name" name="name" defaultValue={name} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-category">Category</FieldLabel>
              <NativeSelect id="edit-category" name="category" defaultValue={category} className="w-full">
                {EQUIPMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-serial">Serial number</FieldLabel>
              <Input id="edit-serial" name="serialNumber" defaultValue={serialNumber ?? ""} />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-image">Image URL</FieldLabel>
              <Input id="edit-image" name="imageUrl" defaultValue={imageUrl ?? ""} placeholder="/equipment/name.jpg or https://..." />
            </Field>
          </FieldGroup>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <DialogFooter className="-mx-0 -mb-0 border-t-0 bg-transparent p-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
