"use client";

import { useState } from "react";
import { gradeOptions, option } from "../constants";
import { Badge, Panel, PersonCell, PrimaryButton, ReportMini, SearchBox, SelectInput, TextInput } from "../ui";
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
  const teacherAssignments = isTeacher
    ? data.teacherSubjects.filter((item) => item.teacherId === currentUser.id)
    : data.teacherSubjects;
  const assignedSubjectIds = new Set(
    isTeacher
      ? teacherAssignments.map((item) => item.subjectId)
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
    const studentSubjectIds = new Set(
      data.studentSubjects
      .filter((item) => item.studentId === student.id)
      .map((item) => item.subjectId),
    );
    return teacherAssignments.some(
      (assignment) => assignment.year === student.year && studentSubjectIds.has(assignment.subjectId),
    );
  });
  const selectedStudent = data.students.find((student) => student.id === newReport.studentId);
  const selectedStudentSubjectIds = new Set(
    data.studentSubjects
      .filter((item) => item.studentId === selectedStudent?.id)
      .map((item) => item.subjectId),
  );
  const subjectOptions = isTeacher && selectedStudent
    ? availableSubjects.filter((subject) =>
        teacherAssignments.some(
          (assignment) =>
            assignment.subjectId === subject.id &&
            assignment.year === selectedStudent.year &&
            selectedStudentSubjectIds.has(subject.id),
        ),
      )
    : availableSubjects;
  const visibleReports = isTeacher
    ? data.reports.filter(
        (report) => report.teacherId === currentUser.id && assignedSubjectIds.has(report.subjectId),
      )
    : data.reports;

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Add Marks" subtitle={isTeacher ? "Enter grades for your assigned students only" : "Record student grade"}>
        <form onSubmit={createReport} className="grid gap-3">
          <SearchBox value={studentSearch} onChange={setStudentSearch} placeholder="Search student by name or ID" />
          <SelectInput label="Student" value={newReport.studentId} options={visibleStudents.map((student) => option(student.id, `${student.name} · ${student.year}`))} onChange={(value) => setNewReport({ ...newReport, studentId: value, subjectId: "" })} />
          {selectedStudent ? (
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              Selected: {selectedStudent.name} · {selectedStudent.studentId} · {selectedStudent.year}
            </p>
          ) : null}
          <SelectInput label="Subject" value={newReport.subjectId} options={subjectOptions.map((subject) => {
            const assignmentYear = teacherAssignments.find((item) => item.subjectId === subject.id)?.year;
            return option(subject.id, assignmentYear ? `${subject.name} · ${assignmentYear}` : subject.name);
          })} onChange={(value) => setNewReport({ ...newReport, subjectId: value })} />
          {!isTeacher ? (
            <SelectInput label="Teacher" value={newReport.teacherId} options={teachers.map((teacher) => option(teacher.id, teacher.name))} onChange={(value) => setNewReport({ ...newReport, teacherId: value })} />
          ) : (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Marks will be saved as {currentUser.name}.
            </p>
          )}
          <TextInput
            label="Percentage"
            value={newReport.percentage}
            onChange={(value) => setNewReport({ ...newReport, percentage: value })}
            required
            type="number"
            min={0}
            max={100}
          />
          <SelectInput
            label="Grade"
            value={newReport.attainment}
            options={gradeOptions}
            onChange={(value) => setNewReport({
              ...newReport,
              effort: value,
              attainment: value,
            })}
          />
          <PrimaryButton label="Save marks" />
        </form>
      </Panel>

      <Panel title="Marks Register" subtitle={`${visibleReports.length} submitted reports`}>
        <div className="space-y-3">
          {visibleReports.map((report) => {
            if (!isTeacher) return <ReportMini key={report.id} report={report} data={data} />;
            const student = data.students.find((item) => item.id === report.studentId);
            const subject = data.subjects.find((item) => item.id === report.subjectId);
            return (
              <div key={report.id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <PersonCell
                    title={`${subject?.name ?? "Subject"} · ${report.percentage}%`}
                    subtitle={`${student?.name ?? "Student"} · ${student?.year ?? "Year"}`}
                  />
                  <Badge label={`Grade ${report.attainment}`} />
                </div>
              </div>
            );
          })}
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
