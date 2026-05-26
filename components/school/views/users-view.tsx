"use client";

import { Badge, DataTable, IconButton, Panel, PersonCell, PrimaryButton, SelectInput, TextInput } from "../ui";
import type { FormHandler, NewUserForm, Role, SchoolData } from "../types";

export function UsersView({
  users,
  newUser,
  setNewUser,
  createUser,
  deleteUser,
}: {
  users: SchoolData["users"];
  newUser: NewUserForm;
  setNewUser: (form: NewUserForm) => void;
  createUser: FormHandler;
  deleteUser: (id: string) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Create User" subtitle="Add admin, teacher, or attendance staff">
        <form onSubmit={createUser} className="grid gap-3">
          <TextInput label="Name" value={newUser.name} onChange={(value) => setNewUser({ ...newUser, name: value })} required />
          <TextInput label="Email" value={newUser.email} onChange={(value) => setNewUser({ ...newUser, email: value })} required type="email" />
          <TextInput label="Password" value={newUser.password} onChange={(value) => setNewUser({ ...newUser, password: value })} required type="password" />
          <SelectInput
            label="Role"
            value={newUser.role}
            options={["admin", "teacher", "attendent"]}
            onChange={(value) => setNewUser({ ...newUser, role: value as Role })}
          />
          <PrimaryButton label="Create user" />
        </form>
      </Panel>

      <Panel title="System Users" subtitle={`${users.length} accounts`}>
        <DataTable
          headers={["Name", "Role", "Email", "Status", "Action"]}
          rows={users.map((user) => [
            <PersonCell key="name" title={user.name} subtitle={user.id} />,
            <Badge key="role" label={user.role} />,
            user.email,
            <Badge key="status" label={user.status} />,
            <IconButton key="delete" label="Delete user" onClick={() => deleteUser(user.id)} />,
          ])}
        />
      </Panel>
    </div>
  );
}
