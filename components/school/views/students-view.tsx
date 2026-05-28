"use client";

import Link from "next/link";
import { useState } from "react";
import { ensureYears } from "../constants";
import { Badge, DataTable, IconButton, Panel, PersonCell, PrimaryButton, SearchBox, SelectInput, TextInput } from "../ui";
import type { FormHandler, NewStudentForm, Role, Student } from "../types";

export function StudentsView({
  role,
  years,
  students,
  query,
  setQuery,
  newStudent,
  setNewStudent,
  createStudent,
  updateStudent,
  deleteStudent,
}: {
  role: Role;
  years: string[];
  students: Student[];
  query: string;
  setQuery: (query: string) => void;
  newStudent: NewStudentForm;
  setNewStudent: (form: NewStudentForm) => void;
  createStudent: FormHandler;
  updateStudent: (event: React.FormEvent<HTMLFormElement>, student: NewStudentForm) => Promise<boolean>;
  deleteStudent: (id: string) => void;
}) {
  const [editing, setEditing] = useState<NewStudentForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  async function handleUpdateStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    const saved = await updateStudent(event, editing);
    setSavingEdit(false);
    if (saved) setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {role === "admin" ? (
        <div className="flex flex-col gap-5 ">
          <Panel  title="Create Student" subtitle="Register a learner profile">
            <form onSubmit={createStudent} className="grid gap-3">
              <TextInput label="Student ID" value={newStudent.studentId} onChange={(value) => setNewStudent({ ...newStudent, studentId: value })} required />
              <TextInput label="Full name" value={newStudent.name} onChange={(value) => setNewStudent({ ...newStudent, name: value })} required />
              <SelectInput label="Year" value={newStudent.year} options={ensureYears(years)} onChange={(value) => setNewStudent({ ...newStudent, year: value })} />
              <PrimaryButton label="Add student" />
            </form>
          </Panel>
          {editing ? (
            <Panel title="Edit Student" subtitle="Update student details">
              <form onSubmit={handleUpdateStudent} className="grid gap-3">
                <TextInput label="Student ID" value={editing.studentId} onChange={(value) => setEditing({ ...editing, studentId: value })} required />
                <TextInput label="Full name" value={editing.name} onChange={(value) => setEditing({ ...editing, name: value })} required />
                <SelectInput label="Year" value={editing.year} options={ensureYears(years)} onChange={(value) => setEditing({ ...editing, year: value })} />
                <SelectInput label="Status" value={editing.status} options={["active", "watch", "inactive"]} onChange={(value) => setEditing({ ...editing, status: value as NewStudentForm["status"] })} />
                <div className="grid gap-2 md:grid-cols-2">
                  <PrimaryButton label={savingEdit ? "Saving..." : "Save student"} disabled={savingEdit} />
                  <button type="button" onClick={() => setEditing(null)} className="mt-2 h-11 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700">
                    Cancel
                  </button>
                </div>
              </form>
            </Panel>
          ) : null}
        </div>
      ) : (
        <Panel title="Student Directory" subtitle="Read-only access for this role">
          <p className="text-sm leading-6 text-zinc-600">
            Search learners and use the teacher or attendance workspaces for role-specific updates.
          </p>
        </Panel>
      )}

      <Panel title="All Students" subtitle={`${students.length} matching records`}>
        <SearchBox value={query} onChange={setQuery} placeholder="Search by name, ID, or year" />
        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
          <DataTable
            headers={["Student", "Year", role === "admin" ? "Actions" : "Status"]}
            rows={students.map((student) => [
              <PersonCell key="person" title={student.name} subtitle={student.studentId} />,
              student.year,
              role === "admin" ? (
                <div key="actions" className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/students/${student.id}`}
                    className="inline-flex h-9 items-center rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Show more
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditing({ id: student.id, studentId: student.studentId, name: student.name, year: student.year, status: student.status })}
                    className="inline-flex h-9 items-center rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700"
                  >
                    Edit
                  </button>
                  <IconButton label="Delete student" onClick={() => deleteStudent(student.id)} />
                </div>
              ) : (
                <Badge key="status" label={student.status} />
              ),
            ])}
          />
        </div>
      </Panel>
    </div>
  );
}
