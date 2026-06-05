"use client";

import { useState } from "react";
import { Badge, DataTable, IconButton, Panel, PersonCell, PrimaryButton, SelectInput, TextInput } from "../ui";
import type { FormHandler, NewUserForm, Role, SchoolData } from "../types";

export function UsersView({
  users,
  newUser,
  setNewUser,
  createUser,
  updateUser,
  deleteUser,
}: {
  users: SchoolData["users"];
  newUser: NewUserForm;
  setNewUser: (form: NewUserForm) => void;
  createUser: FormHandler;
  updateUser: (event: React.FormEvent<HTMLFormElement>, user: NewUserForm) => void;
  deleteUser: (id: string) => void;
}) {
  const [editing, setEditing] = useState<NewUserForm | null>(null);
  const roleOptions = [
    { value: "admin", label: "admin" },
    { value: "teacher", label: "teacher" },
    { value: "attendent", label: "Registrar" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 ">
        <Panel title="Create User" subtitle="Add admin, teacher, or registrar staff">
          <form onSubmit={createUser} className="grid gap-3">
            <TextInput label="Name" value={newUser.name} onChange={(value) => setNewUser({ ...newUser, name: value })} required />
            <TextInput label="Email" value={newUser.email} onChange={(value) => setNewUser({ ...newUser, email: value })} required type="email" />
            <TextInput label="Password" value={newUser.password} onChange={(value) => setNewUser({ ...newUser, password: value })} required />
            <SelectInput label="Role" value={newUser.role} options={roleOptions} onChange={(value) => setNewUser({ ...newUser, role: value as Role })} />
            <SelectInput label="Status" value={newUser.status} options={["active", "blocked"]} onChange={(value) => setNewUser({ ...newUser, status: value as NewUserForm["status"] })} />
            <PrimaryButton label="Create user" />
          </form>
        </Panel>
        {editing ? (
          <Panel title="Edit User" subtitle="Update account fields and access status">
            <form onSubmit={(event) => updateUser(event, editing)} className="grid gap-3">
              <TextInput label="Name" value={editing.name} onChange={(value) => setEditing({ ...editing, name: value })} required />
              <TextInput label="Email" value={editing.email} onChange={(value) => setEditing({ ...editing, email: value })} required type="email" />
              <TextInput label="Password" value={editing.password} onChange={(value) => setEditing({ ...editing, password: value })} required />
              <SelectInput label="Role" value={editing.role} options={roleOptions} onChange={(value) => setEditing({ ...editing, role: value as Role })} />
              <SelectInput label="Status" value={editing.status} options={["active", "blocked"]} onChange={(value) => setEditing({ ...editing, status: value as NewUserForm["status"] })} />
              <div className="grid gap-2 md:grid-cols-2">
                <PrimaryButton label="Save user" />
                <button type="button" onClick={() => setEditing(null)} className="mt-2 h-11 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700">
                  Cancel
                </button>
              </div>
            </form>
          </Panel>
        ) : null}
      </div>

      <Panel title="System Users" subtitle={`${users.length} accounts`}>
        <DataTable
          headers={["Name", "Role", "Email", "Password", "Status", "Actions"]}
          rows={users.map((user) => [
            <PersonCell key="name" title={user.name} subtitle={user.id} />,
            <Badge key="role" label={user.role === "attendent" ? "Registrar" : user.role} />,
            user.email,
            user.password,
            <Badge key="status" label={user.status} />,
            <div key="actions" className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing({ id: user.id, name: user.name, email: user.email, password: user.password, role: user.role, status: user.status })}
                className="inline-flex h-9 items-center rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700"
              >
                Edit
              </button>
              <IconButton label="Delete user" onClick={() => deleteUser(user.id)} />
            </div>,
          ])}
        />
      </Panel>
    </div>
  );
}
