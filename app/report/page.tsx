"use client";

import { Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildReportStudents, ReportCards } from "@/components/school/views/reports-view";
import type { SchoolData, User } from "@/components/school/types";

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

function normalizeSchoolData(data: Partial<SchoolData> | null | undefined): SchoolData {
  return {
    users: Array.isArray(data?.users) ? data.users : [],
    students: Array.isArray(data?.students) ? data.students : [],
    subjects: Array.isArray(data?.subjects) ? data.subjects : [],
    years: Array.isArray(data?.years) ? data.years : [],
    teacherSubjects: Array.isArray(data?.teacherSubjects) ? data.teacherSubjects : [],
    studentSubjects: Array.isArray(data?.studentSubjects) ? data.studentSubjects : [],
    reports: Array.isArray(data?.reports) ? data.reports : [],
    attendance: Array.isArray(data?.attendance) ? data.attendance : [],
    meta: data?.meta ?? initialData.meta,
  };
}

export default function ReportPage() {
  const router = useRouter();
  const [data, setData] = useState<SchoolData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const students = useMemo(() => buildReportStudents(data), [data]);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        const sessionResponse = await fetch("/api/auth", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const session = sessionResponse.ok
          ? ((await sessionResponse.json()) as { user: User | null })
          : null;

        if (!session?.user) {
          router.replace("/");
          return;
        }
        if (session.user.role !== "admin") {
          router.replace(`/${session.user.role === "attendent" ? "attendee" : session.user.role}`);
          return;
        }

        const systemResponse = await fetch("/api/system", { cache: "no-store" });
        const payload = await systemResponse.json().catch(() => null) as
          | (Partial<SchoolData> & { error?: string; detail?: string })
          | null;

        if (!active) return;
        if (!systemResponse.ok) {
          setError(payload?.detail ?? payload?.error ?? "Unable to load reports");
          return;
        }

        setData(normalizeSchoolData(payload));
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load reports");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 text-zinc-600">
        Loading reports...
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-5 text-center text-rose-700 shadow-sm">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-5 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Student Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {students.length} report{students.length === 1 ? "" : "s"} loaded.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Printer size={17} />
          Print
        </button>
      </div>

      {students.length ? (
        <ReportCards reportTitle="Student Report Card" students={students} />
      ) : (
        <div className="mx-auto max-w-[210mm] rounded-2xl border border-zinc-200 bg-white p-6 text-center text-zinc-500">
          No students found.
        </div>
      )}
    </main>
  );
}
