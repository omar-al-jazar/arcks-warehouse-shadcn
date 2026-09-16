"use client";

import { useActionState, useRef } from "react";
import { createStaff, type StaffFormState } from "@/app/actions/staff-actions";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

const initialState: StaffFormState = {};

export default function AddStaffForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: StaffFormState, formData: FormData) => {
    const result = await createStaff(prev, formData);
    if (result.success) {
      formRef.current?.reset();
    }
    return result;
  }, initialState);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <FieldGroup className="gap-3 md:flex-row md:flex-wrap md:items-end">
        <Field className="md:w-auto md:min-w-[180px]">
          <FieldLabel htmlFor="staff-name">Name</FieldLabel>
          <Input id="staff-name" name="name" required placeholder="e.g. Jordan Lee" />
        </Field>
        <Field className="md:w-auto">
          <FieldLabel htmlFor="staff-role">Role</FieldLabel>
          <NativeSelect id="staff-role" name="role" defaultValue="manager" className="w-full">
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </NativeSelect>
        </Field>
        <Field className="md:w-auto">
          <FieldLabel htmlFor="staff-pin">6-digit PIN</FieldLabel>
          <Input
            id="staff-pin"
            name="pin"
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="e.g. 482913"
          />
        </Field>
        <Button type="submit" disabled={pending} className="md:self-end">
          {pending ? "Adding..." : "Add staff member"}
        </Button>
      </FieldGroup>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}
