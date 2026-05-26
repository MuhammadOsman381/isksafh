"use client";

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
  deleteStudent: (id: string) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      {role === "admin" ? (
        <Panel title="Create Student" subtitle="Register a learner profile">
          <form onSubmit={createStudent} className="grid gap-3">
            <TextInput label="Student ID" value={newStudent.studentId} onChange={(value) => setNewStudent({ ...newStudent, studentId: value })} required />
            <TextInput label="Full name" value={newStudent.name} onChange={(value) => setNewStudent({ ...newStudent, name: value })} required />
            <SelectInput label="Year" value={newStudent.year} options={ensureYears(years)} onChange={(value) => setNewStudent({ ...newStudent, year: value })} />
            <TextInput label="Guardian" value={newStudent.guardian} onChange={(value) => setNewStudent({ ...newStudent, guardian: value })} required />
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Subjects from the selected year will be assigned automatically.
            </p>
            <PrimaryButton label="Add student" />
          </form>
        </Panel>
      ) : (
        <Panel title="Student Directory" subtitle="Read-only access for this role">
          <p className="text-sm leading-6 text-zinc-600">
            Search learners and use the teacher or attendance workspaces for role-specific updates.
          </p>
        </Panel>
      )}

      <Panel title="All Students" subtitle={`${students.length} matching records`}>
        <SearchBox value={query} onChange={setQuery} placeholder="Search by name, ID, guardian or year" />
        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
          <DataTable
            headers={["Student", "Year", "Guardian", role === "admin" ? "Action" : "Status"]}
            rows={students.map((student) => [
              <PersonCell key="person" title={student.name} subtitle={student.studentId} />,
              student.year,
              student.guardian,
              role === "admin" ? (
                <IconButton key="delete" label="Delete student" onClick={() => deleteStudent(student.id)} />
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
