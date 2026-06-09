"use client";

import { useState } from "react";
import { ensureYears, option } from "../constants";
import { DataTable, IconButton, Panel, PersonCell, PrimaryButton, SelectInput, TextInput } from "../ui";
import type { AssignmentForm, FormHandler, NewSubjectForm, NewYearForm, SchoolData } from "../types";

export function SubjectsView({
  data,
  subjects,
  years,
  newYear,
  setNewYear,
  createYear,
  assignment,
  setAssignment,
  newSubject,
  setNewSubject,
  createSubject,
  assignTeacherSubject,
  updateTeacherAssignment,
  deleteTeacherAssignment,
  deleteSubject,
  deleteYear,
}: {
  data: SchoolData;
  subjects: SchoolData["subjects"];
  years: string[];
  newYear: NewYearForm;
  setNewYear: (form: NewYearForm) => void;
  createYear: FormHandler;
  assignment: AssignmentForm;
  setAssignment: (form: AssignmentForm) => void;
  newSubject: NewSubjectForm;
  setNewSubject: (form: NewSubjectForm) => void;
  createSubject: FormHandler;
  assignTeacherSubject: FormHandler;
  updateTeacherAssignment: (event: React.FormEvent<HTMLFormElement>, assignment: AssignmentForm) => void;
  deleteTeacherAssignment: (id: string) => void;
  deleteSubject: (id: string) => void;
  deleteYear: (name: string) => void;
}) {
  const teachers = data.users.filter((user) => user.role === "teacher" && user.status === "active");
  const [editingAssignment, setEditingAssignment] = useState<AssignmentForm | null>(null);
  const sortedTeacherAssignments = [...data.teacherSubjects].sort((first, second) => {
    const firstTeacher = data.users.find((user) => user.id === first.teacherId);
    const secondTeacher = data.users.find((user) => user.id === second.teacherId);
    const firstSubject = data.subjects.find((subject) => subject.id === first.subjectId);
    const secondSubject = data.subjects.find((subject) => subject.id === second.subjectId);

    return (
      compareAcademicYear(first.year, second.year) ||
      compareText(stripNameTitle(firstTeacher?.name ?? ""), stripNameTitle(secondTeacher?.name ?? "")) ||
      compareText(firstSubject?.name ?? "", secondSubject?.name ?? "")
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Add Year" subtitle="Create academic years used across students and subjects">
          <form onSubmit={createYear} className="grid gap-3">
            <TextInput label="Year name" value={newYear.name} onChange={(value) => setNewYear({ name: value })} required />
            <PrimaryButton label="Add year" />
          </form>
        </Panel>

        <Panel title="Add Subject" subtitle="Create reusable subject names">
          <form onSubmit={createSubject} className="grid gap-3">
            <TextInput label="Subject name" value={newSubject.name} onChange={(value) => setNewSubject({ ...newSubject, name: value })} required />
            <PrimaryButton label="Add subject" />
          </form>
        </Panel>

        <Panel title="Assign Teacher" subtitle="Select year and subject from database records">
          <form onSubmit={assignTeacherSubject} className="grid gap-3">
            <SelectInput label="Teacher" value={assignment.teacherId} options={teachers.map((teacher) => option(teacher.id, teacher.name))} onChange={(value) => setAssignment({ ...assignment, teacherId: value })} />
            <SelectInput label="Year" value={assignment.year} options={ensureYears(years)} onChange={(value) => setAssignment({ ...assignment, year: value, subjectId: "" })} />
            <SelectInput label="Subject" value={assignment.subjectId} options={subjects.map((subject) => option(subject.id, subject.name))} onChange={(value) => setAssignment({ ...assignment, subjectId: value })} />
            <PrimaryButton label="Assign teacher" />
          </form>
        </Panel>
      </div>

      {editingAssignment ? (
        <Panel title="Edit Teacher Assignment" subtitle="Update teacher, year, or subject assignment">
          <form onSubmit={(event) => updateTeacherAssignment(event, editingAssignment)} className="grid gap-3 md:grid-cols-4 md:items-end">
            <SelectInput label="Teacher" value={editingAssignment.teacherId} options={teachers.map((teacher) => option(teacher.id, teacher.name))} onChange={(value) => setEditingAssignment({ ...editingAssignment, teacherId: value })} />
            <SelectInput label="Year" value={editingAssignment.year} options={ensureYears(years)} onChange={(value) => setEditingAssignment({ ...editingAssignment, year: value, subjectId: "" })} />
            <SelectInput label="Subject" value={editingAssignment.subjectId} options={subjects.map((subject) => option(subject.id, subject.name))} onChange={(value) => setEditingAssignment({ ...editingAssignment, subjectId: value })} />
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton label="Save" />
              <button type="button" onClick={() => setEditingAssignment(null)} className="mt-2 h-11 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700">
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Academic Years" subtitle={`${years.length} years`}>
          <DataTable
            headers={["Year", "Students", "Actions"]}
            rows={ensureYears(years).map((year) => {
              const studentsInYear = data.students.filter((student) => student.year === year).length;
              return [
                year,
                `${studentsInYear} students`,
                <IconButton key="delete" label="Delete year" onClick={() => deleteYear(year)} />,
              ];
            })}
          />
        </Panel>

        <Panel title="Subjects" subtitle={`${subjects.length} subjects`}>
          <DataTable
            headers={["Subject", "Assigned teachers", "Actions"]}
            rows={subjects.map((subject) => {
              const assignedTeachers = data.teacherSubjects.filter((item) => item.subjectId === subject.id).length;
              return [
                subject.name,
                `${assignedTeachers} assignments`,
                <IconButton key="delete" label="Delete subject" onClick={() => deleteSubject(subject.id)} />,
              ];
            })}
          />
        </Panel>

        <Panel title="Teacher Assignments" subtitle={`${data.teacherSubjects.length} assignments`}>
          <DataTable
            headers={["Teacher", "Year", "Subject", "Actions"]}
            rows={sortedTeacherAssignments.map((item) => {
              const teacher = data.users.find((user) => user.id === item.teacherId);
              const subject = data.subjects.find((subjectItem) => subjectItem.id === item.subjectId);
              return [
                <PersonCell key="teacher" title={teacher?.name ?? "Teacher"} subtitle={teacher?.email ?? item.teacherId} />,
                item.year,
                subject?.name ?? "Subject",
                <div key="actions" className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAssignment({ id: item.id, teacherId: item.teacherId, subjectId: item.subjectId, year: item.year, studentId: "" })}
                    className="inline-flex h-9 items-center rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700"
                  >
                    Edit
                  </button>
                  <IconButton label="Delete assignment" onClick={() => deleteTeacherAssignment(item.id)} />
                </div>,
              ];
            })}
          />
        </Panel>
      </div>
    </div>
  );
}

function compareAcademicYear(first: string, second: string) {
  const parsedFirst = parseAcademicYear(first);
  const parsedSecond = parseAcademicYear(second);

  if (parsedFirst.rank !== parsedSecond.rank) return parsedFirst.rank - parsedSecond.rank;
  if (parsedFirst.number !== parsedSecond.number) return parsedFirst.number - parsedSecond.number;
  return compareText(parsedFirst.section, parsedSecond.section) || compareText(first, second);
}

function parseAcademicYear(year: string) {
  const normalized = year.trim();
  if (/^reception$/i.test(normalized)) {
    return { rank: 0, number: 0, section: "" };
  }

  const match = normalized.match(/^(?:year|yera)?\s*0*(\d+)\s*([a-z]*)$/i);
  if (match) {
    return {
      rank: 1,
      number: Number(match[1]),
      section: match[2].toUpperCase(),
    };
  }

  return { rank: 2, number: Number.MAX_SAFE_INTEGER, section: normalized.toUpperCase() };
}

function stripNameTitle(name: string) {
  return name.replace(/^(mr|ms)\.?\s+/i, "").trim();
}

function compareText(first: string, second: string) {
  return first.localeCompare(second, undefined, { numeric: true, sensitivity: "base" });
}
