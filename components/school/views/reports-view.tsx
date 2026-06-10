"use client";

import Image from "next/image";
import { Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { buildReportStudents, type ReportStudent } from "@/lib/reports";
import type { SchoolData } from "../types";

export function ReportsView({ data }: { data: SchoolData }) {
  const students = useMemo(() => buildReportStudents(data), [data]);
  const [reportTitle, setReportTitle] = useState("Student Report Card");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [downloading, setDownloading] = useState(false);
  const matchingStudents = students.filter((student) => {
    const normalized = studentSearch.toLowerCase().trim();
    if (!normalized) return true;
    return [student.name, student.studentID, student.year]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  });
  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const visibleStudents = selectedStudent ? [selectedStudent] : matchingStudents;

  async function downloadReports() {
    if (!visibleStudents.length || downloading) return;

    setDownloading(true);
    try {
      const response = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportTitle: reportTitle || "Student Report Card",
          studentIds: visibleStudents.map((student) => student.id),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail || error?.error || "Unable to generate reports PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = selectedStudent ? `${selectedStudent.studentID}-report.pdf` : "student-reports.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to generate reports PDF");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70 print:hidden">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Student Report Cards</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Print-ready reports using the official school layout.
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <label className="grid flex-1 gap-1.5 text-sm font-medium text-zinc-700">
            Report title
            <input
              value={reportTitle}
              onChange={(event) => setReportTitle(event.target.value)}
              className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-zinc-950 outline-none transition focus:border-zinc-950 focus:bg-white"
              placeholder="Enter report title"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
            Search student
            <input
              value={studentSearch}
              onChange={(event) => {
                setStudentSearch(event.target.value);
                setSelectedStudentId("");
              }}
              className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-zinc-950 outline-none transition focus:border-zinc-950 focus:bg-white"
              placeholder="Name or student ID"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
            Select single report
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-zinc-950 outline-none transition focus:border-zinc-950 focus:bg-white"
            >
              <option value="">All matching students</option>
              {matchingStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.studentID}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={downloadReports}
            disabled={visibleStudents.length === 0 || downloading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Printer size={17} />
            {downloading ? "Preparing..." : selectedStudent ? "Download Single" : "Download"}
          </button>
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          {selectedStudent
            ? `Ready to download ${selectedStudent.name}'s report.`
            : `${visibleStudents.length} report${visibleStudents.length === 1 ? "" : "s"} selected.`}
        </p>
      </div>

      {/* Report preview rendering is disabled. PDFs are generated server-side when Download is clicked. */}
      {!visibleStudents.length ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
          No reports found.
        </div>
      ) : null}
    </div>
  );
}

export function ReportCards({
  reportTitle,
  students,
}: {
  reportTitle: string;
  students: ReportStudent[];
}) {
  return (
    <div className="w-auto space-y-8 p-3 print:space-y-0">
      {students.map((student) => (
        <article key={student.id} className="p-4   print:p-[3mm] print:[break-after:page]">
          <div className="mx-auto min-h-[290mm] max-w-[210mm] border-[5px] border-black bg-white p-5 text-black shadow-sm print:shadow-none">
            <ReportHeader />

            <div className="mb-2 mt-2 text-center">
              <h2 className="text-xl font-bold">{reportTitle}</h2>
            </div>

            <section className="mb-4">
              <div className="mb-2 flex flex-col justify-between">
                <div className="mb-1 border border-gray-500 p-1">
                  <p>
                    <strong>Name:</strong> {student.name}
                  </p>
                </div>
                <div className="flex justify-between gap-1">
                  <div className="flex-1 border border-gray-500 p-1">
                    <p>
                      <strong>Year:</strong> {student.year}
                    </p>
                  </div>
                  <div className="w-[34%] border border-gray-500 p-1">
                    <p>
                      <strong>Student No:</strong> {student.studentID}
                    </p>
                  </div>
                </div>
              </div>

              <table className="w-full border-collapse border border-black text-center text-sm">
                <thead>
                  <tr>
                    <th className="border border-black p-2">Subjects</th>
                    <th className="border border-black p-2">Percentage (%)</th>
                    <th className="border border-black p-2">Grade</th>
                    <th className="border border-black p-2">Teachers</th>
                  </tr>
                </thead>
                <tbody>
                  {student.subjects.length ? (
                    student.subjects.map((row) => (
                      <tr key={`${student.id}-${row.subject}-${row.teacher}`}>
                        <td className="border border-black p-1 text-left">{row.subject}</td>
                        <td className="border border-black p-1">{row.percentage}</td>
                        <td className="border border-black p-1">{row.grade}</td>
                        <td className="border border-black p-1 text-left">{row.teacher}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="border border-black p-2 text-center" colSpan={4}>
                        No subjects assigned.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <AttendanceTable attendance={student.attendance} />
            <Signatures />
          </div>
        </article>
      ))}
    </div>
  );
}

function ReportHeader() {
  return (
    <header className="flex items-center justify-start gap-3 p-0">
      <div className="flex w-[95px] shrink-0 items-center justify-center">
        <Image src="/school-logo.jpeg" alt="School Logo" width={95} height={95} className="h-auto w-full " />
      </div>
      <div className="flex-1 text-center">
        <h1 className="text-xl font-bold">
          King Salman Armed Forces Hospital in Northwestern Region
        </h1>
        <p className="text-lg font-bold text-green-600">
          The International School of KSAFH in Northwestern Region Tabuk
        </p>
        <p className="text-sm font-bold">Formerly: The British International School of Tabuk</p>
        <p className="text-md">P.O. Box 100 Tabuk, Kingdom of Saudi Arabia</p>
        <p className="text-md">
          Tel: +966 (14) 4411088 x 83103 Email: admin@bis-tabuk.org
        </p>
      </div>
    </header>
  );
}

function AttendanceTable({ attendance }: { attendance: ReportStudent["attendance"] }) {
  return (
    <section className="mb-4">
      <table className="w-full border-collapse border border-black text-sm">
        <thead>
          <tr>
            <th className="border border-black p-2">Attendance</th>
            <th className="border border-black p-2">Days</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-1 font-bold">Number of sessions</td>
            <td className="border border-black p-1 text-center">{attendance.sessions}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold">Number of attendances</td>
            <td className="border border-black p-1 text-center">{attendance.attendence}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold">Number of authorised absences</td>
            <td className="border border-black p-1 text-center">{attendance.authoriseAbsence}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold">Number of unauthorised absences</td>
            <td className="border border-black p-1 text-center">{attendance.unAuthoriseAbsence}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function Signatures() {
  return (
    <>
      <section className="mt-5 flex flex-row items-center justify-between">
        <div className="mt-5 text-center">
          <div className="mx-auto w-[250px] border-t border-black" />
          <p className="font-bold">Dr. Khaled Khader Abudhaim</p>
          <p>Director General</p>
        </div>
        <div className="mt-5 text-center">
          <div className="mx-auto w-[220px] border-t border-black" />
          <p className="font-bold">Dr. Areej Faraj Al Atawi</p>
          <p>School Principal</p>
        </div>
      </section>
      <footer className="mt-2 gap-1 flex flex-row justify-center text-center">
        <p>School Stamp</p>
        &
        <p>Date</p>
      </footer>
    </>
  );
}
