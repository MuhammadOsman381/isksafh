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
  deleteAllStudents,
  importStudents,
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
  deleteAllStudents: () => void;
  importStudents: (event: React.FormEvent<HTMLFormElement>, year: string, file: File | null) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<NewStudentForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [importYear, setImportYear] = useState(years[0] ?? "");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const selectedImportYear = years.includes(importYear) ? importYear : years[0] ?? "";

  async function handleUpdateStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    const saved = await updateStudent(event, editing);
    setSavingEdit(false);
    if (saved) setEditing(null);
  }

  async function handleImportStudents(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImporting(true);
    const imported = await importStudents(event, selectedImportYear, importFile);
    setImporting(false);
    if (imported) setImportFile(null);
  }

  function handleDeleteAllStudents() {
    const confirmed = window.confirm(
      "Delete all students and their marks, attendance, and subject assignments? This cannot be undone.",
    );
    if (confirmed) deleteAllStudents();
  }

  function downloadStudentsExcel() {
    const rows = [
      ["Student ID", "Name", "Year"],
      ...students.map((student) => [student.studentId, student.name, student.year]),
    ];
    const content = rows
      .map((row) => row.map((cell) => String(cell).replace(/\t|\r?\n/g, " ")).join("\t"))
      .join("\n");
    const blob = new Blob([content], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "students.xls";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
          <Panel title="Import Students" subtitle="Choose a year and upload Excel. Only first sheet Student# and Name are used">
            <form onSubmit={handleImportStudents} className="grid gap-3">
              <SelectInput label="Year" value={selectedImportYear} options={ensureYears(years)} onChange={setImportYear} />
              <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
                Excel file
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  required
                  onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-950 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </label>
              <PrimaryButton label={importing ? "Importing..." : "Import students"} disabled={importing} />
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="md:min-w-[320px] md:flex-1">
            <SearchBox value={query} onChange={setQuery} placeholder="Search by name, ID, or year" />
          </div>
          {role === "admin" ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={downloadStudentsExcel}
                disabled={students.length === 0}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download Excel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllStudents}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100"
              >
                Delete all students
              </button>
            </div>
          ) : null}
        </div>
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
