import { getAllStaff } from "@/lib/supabase/queries";
import AddStaffForm from "@/components/add-staff-form";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function StaffPage() {
  const staff = await getAllStaff();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Add staff member</h2>
        <AddStaffForm />
        <p className="mt-3 text-xs text-muted-foreground">
          Everyone with the &quot;Manager&quot; role can log in from the same Manager tile on the
          lock screen — each just enters their own PIN.
        </p>
      </Card>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Login email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((person) => (
              <TableRow key={person.id}>
                <TableCell className="font-medium">{person.name}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{person.role}</TableCell>
                <TableCell className="text-muted-foreground">{person.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
