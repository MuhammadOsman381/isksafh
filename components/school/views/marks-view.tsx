"use client";

import { useState } from "react";
import { attainmentOptions, effortOptions, option } from "../constants";
import { Panel, PrimaryButton, ReportMini, SearchBox, SelectInput, TextInput } from "../ui";
import type { FormHandler, NewReportForm, SchoolData, User } from "../types";

export function MarksView({
  data,
  currentUser,
  newReport,
  setNewReport,
  createReport,
}: {
  data: SchoolData;
  currentUser: User | null;
  newReport: NewReportForm;
  setNewReport: (form: NewReportForm) => void;
  createReport: FormHandler;
}) {
  const [studentSearch, setStudentSearch] = useState("");
  const teachers = data.users.filter((user) => user.role === "teacher");
  const isTeacher = currentUser?.role === "teacher";
  const assignedSubjectIds = new Set(
    isTeacher
      ? data.teacherSubjects
          .filter((item) => item.teacherId === currentUser.id)
          .map((item) => item.subjectId)
      : data.subjects.map((subject) => subject.id),
  );
  const availableSubjects = data.subjects.filter((subject) => assignedSubjectIds.has(subject.id));
  const visibleStudents = data.students.filter((student) => {
    const normalized = studentSearch.toLowerCase().trim();
    const matchesSearch =
      !normalized ||
      student.name.toLowerCase().includes(normalized) ||
      student.studentId.toLowerCase().includes(normalized);
    if (!matchesSearch) return false;
    if (!isTeacher) return true;
    return data.studentSubjects.some(
      (item) => item.studentId === student.id && assignedSubjectIds.has(item.subjectId),
    );
  });
  const selectedStudent = data.students.find((student) => student.id === newReport.studentId);
  const visibleReports = isTeacher
    ? data.reports.filter(
        (report) => report.teacherId === currentUser.id && assignedSubjectIds.has(report.subjectId),
      )
    : data.reports;

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title="Add Marks" subtitle={isTeacher ? "Only assigned subjects are available" : "Record attainment and effort"}>
        <form onSubmit={createReport} className="grid gap-3">
          <SearchBox value={studentSearch} onChange={setStudentSearch} placeholder="Search student by name or ID" />
          <SelectInput label="Student" value={newReport.studentId} options={visibleStudents.map((student) => option(student.id, `${student.name} · ${student.year}`))} onChange={(value) => setNewReport({ ...newReport, studentId: value })} />
          {selectedStudent ? (
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              Selected: {selectedStudent.name} · {selectedStudent.studentId} · {selectedStudent.year}
            </p>
          ) : null}
          <SelectInput label="Subject" value={newReport.subjectId} options={availableSubjects.map((subject) => option(subject.id, `${subject.name} · ${subject.year}`))} onChange={(value) => setNewReport({ ...newReport, subjectId: value })} />
          {!isTeacher ? (
            <SelectInput label="Teacher" value={newReport.teacherId} options={teachers.map((teacher) => option(teacher.id, teacher.name))} onChange={(value) => setNewReport({ ...newReport, teacherId: value })} />
          ) : (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Marks will be saved as {currentUser.name}.
            </p>
          )}
          <TextInput label="Percentage" value={newReport.percentage} onChange={(value) => setNewReport({ ...newReport, percentage: value })} required type="number" min={0} max={100} />
          <div className="grid gap-3 md:grid-cols-2">
            <SelectInput label="Effort" value={newReport.effort} options={effortOptions} onChange={(value) => setNewReport({ ...newReport, effort: value })} />
            <SelectInput label="Attainment" value={newReport.attainment} options={attainmentOptions} onChange={(value) => setNewReport({ ...newReport, attainment: value })} />
          </div>
          <PrimaryButton label="Save marks" />
        </form>
      </Panel>

      <Panel title="Marks Register" subtitle={`${visibleReports.length} submitted reports`}>
        <div className="space-y-3">
          {visibleReports.map((report) => (
            <ReportMini key={report.id} report={report} data={data} />
          ))}
          {!visibleReports.length ? (
            <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              No marks submitted for your assigned subjects yet.
            </p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
