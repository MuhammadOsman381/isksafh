"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ensureYears } from "../constants";
import { Badge, DataTable, Panel, PersonCell, SelectInput } from "../ui";
import type { SchoolData, User } from "../types";

const initialData: SchoolData = {
  users: [],
  students: [],
  subjects: [],
  years: [],
  teacherSubjects: [],
  studentSubjects: [],
  reports: [],
  attendance: [],
  meta: { source: "demo", generatedAt: new Date().toISOString() },
};

type StudentSubjectForm = {
  id?: string;
  studentId: string;
  subjectId: string;
  year: string;
};

export function StudentSubjectsDetail({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [data, setData] = useState<SchoolData>(initialData);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<StudentSubjectForm>({
    studentId,
    subjectId: "",
    year: "",
  });
  const [editing, setEditing] = useState<StudentSubjectForm | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/system", { cache: "no-store" }).then(
        (response) => response.json() as Promise<SchoolData>,
      ),
      fetch("/api/auth", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { user: User | null };
      }),
    ])
      .then(([schoolData, session]) => {
        if (!active) return;
        setData(schoolData);
        const loadedStudent = schoolData.students.find((item) => item.id === studentId);
        if (loadedStudent) {
          setForm((current) => ({
            ...current,
            studentId,
            year: current.year || loadedStudent.year,
          }));
        }
        setCurrentUser(session?.user ?? null);
        if (!session?.user) {
          router.replace("/");
          return;
        }
        if (session.user.role !== "admin") {
          router.replace(session.user.role === "teacher" ? "/teacher" : "/attendee");
        }
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router, studentId]);

  const student = data.students.find((item) => item.id === studentId);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const assignments = useMemo(
    () => data.studentSubjects.filter((item) => item.studentId === studentId),
    [data.studentSubjects, studentId],
  );

  const assignedSubjectIds = new Set(assignments.map((item) => item.subjectId));
  const availableSubjects = data.subjects.filter((subject) => !assignedSubjectIds.has(subject.id));
  const yearOptions = ensureYears(data.years.length ? data.years : student ? [student.year] : []);
  const availableSubjectOptions = availableSubjects.map((subject) => ({ value: subject.id, label: subject.name }));
  const subjectOptionsForEdit = (current: StudentSubjectForm) =>
    data.subjects
      .filter((subject) => subject.id === current.subjectId || !assignedSubjectIds.has(subject.id))
      .map((subject) => ({ value: subject.id, label: subject.name }));

  async function mutate(action: string, payload: Record<string, unknown>) {
    setSaving(true);
    const response = await fetch("/api/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
      setNotice("Action failed");
      setSaving(false);
      return;
    }

    const payloadData = (await response.json()) as SchoolData;
    setData(payloadData);
    setSaving(false);
    setNotice(payloadData.meta.source === "demo" ? "Demo mode preview updated" : "Saved to Supabase");
  }

  function assignSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.subjectId || !form.year) return;
    void mutate("assign-student-subject", form);
    setForm({ studentId, subjectId: "", year: student?.year ?? "" });
  }

  function updateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    void mutate("update-student-subject", editing as unknown as Record<string, unknown>);
    setEditing(null);
  }

  function deleteAssignment(id: string) {
    void mutate("delete-student-subject", { id });
  }

  if (loading || !currentUser || currentUser.role !== "admin") {
    return (
      <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
        <div className="mx-auto flex min-h-[55vh] max-w-5xl items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-700 shadow-sm">
            <Loader2 className="animate-spin" size={18} />
            Loading student subjects
          </div>
        </div>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
        <div className="mx-auto max-w-5xl">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <ArrowLeft size={17} />
            Back to admin
          </Link>
          <Panel title="Student not found" subtitle="This student record is no longer available.">
            <p className="text-sm text-zinc-600">Open Student Directory and select another student.</p>
          </Panel>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-4 text-zinc-950 sm:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <ArrowLeft size={17} />
            Back to admin
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            {saving ? <Loader2 className="animate-spin" size={16} /> : null}
            {notice || (saving ? "Saving" : data.meta.source === "demo" ? "Demo mode" : "Supabase connected")}
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <PersonCell title={student.name} subtitle={student.studentId} />
            <div className="flex flex-wrap gap-2">
              <Badge label={student.year} />
              <Badge label={student.status} />
              <Badge label={`${assignments.length} subjects allotted`} />
            </div>
          </div>
        </motion.section>

        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <Panel title="Assign Subject" subtitle="Allot a subject to this student for a class/year">
            <form onSubmit={assignSubject} className="grid gap-3">
              <SelectInput
                label="Subject"
                value={form.subjectId}
                options={availableSubjectOptions}
                onChange={(value) => setForm({ ...form, subjectId: value })}
              />
              <SelectInput
                label="Year"
                value={form.year}
                options={yearOptions}
                onChange={(value) => setForm({ ...form, year: value })}
              />
              <button
                type="submit"
                disabled={!availableSubjects.length || saving}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                Assign subject
              </button>
              {!availableSubjects.length ? (
                <p className="text-sm text-zinc-500">All available subjects are already allotted to this student.</p>
              ) : null}
            </form>
          </Panel>

          <Panel title="Allotted Subjects" subtitle="Edit or remove subjects for this student">
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <DataTable
                headers={["Subject", "Class", "Actions"]}
                rows={assignments.map((assignment) => {
                  const subject = data.subjects.find((item) => item.id === assignment.subjectId);
                  return [
                    subject?.name ?? "Unknown subject",
                    assignment.year,
                    <div key="actions" className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing({ ...assignment })}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAssignment(assignment.id)}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>,
                  ];
                })}
              />
            </div>
          </Panel>
        </div>

        {editing ? (
          <Panel title="Edit Allotted Subject" subtitle="Update the subject or class/year for this student">
            <form onSubmit={updateAssignment} className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
              <SelectInput
                label="Subject"
                value={editing.subjectId}
                options={subjectOptionsForEdit(editing)}
                onChange={(value) => setEditing({ ...editing, subjectId: value })}
              />
              <SelectInput
                label="Year"
                value={editing.year}
                options={yearOptions}
                onChange={(value) => setEditing({ ...editing, year: value })}
              />
              <button disabled={saving} className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300">
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
            </form>
          </Panel>
        ) : null}
      </div>
    </main>
  );
}
