"use client";

import { ensureYears, option } from "../constants";
import { AssignmentList, DataTable, IconButton, Panel, PersonCell, PrimaryButton, SelectInput, TextInput } from "../ui";
import type { AssignmentForm, FormHandler, NewSubjectForm, SchoolData } from "../types";

export function SubjectsView({
  data,
  subjects,
  years,
  assignment,
  setAssignment,
  newSubject,
  setNewSubject,
  createSubject,
  assignTeacherSubject,
  assignStudentSubject,
  deleteSubject,
}: {
  data: SchoolData;
  subjects: SchoolData["subjects"];
  years: string[];
  assignment: AssignmentForm;
  setAssignment: (form: AssignmentForm) => void;
  newSubject: NewSubjectForm;
  setNewSubject: (form: NewSubjectForm) => void;
  createSubject: FormHandler;
  assignTeacherSubject: FormHandler;
  assignStudentSubject: FormHandler;
  deleteSubject: (id: string) => void;
}) {
  const teachers = data.users.filter((user) => user.role === "teacher");

  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-5">
        <Panel title="Create Subject" subtitle="Attach subject to an academic year">
          <form onSubmit={createSubject} className="grid gap-3">
            <TextInput label="Subject name" value={newSubject.name} onChange={(value) => setNewSubject({ ...newSubject, name: value })} required />
            <SelectInput label="Year" value={newSubject.year} options={ensureYears(years)} onChange={(value) => setNewSubject({ ...newSubject, year: value })} />
            <PrimaryButton label="Add subject" />
          </form>
        </Panel>

        <Panel title="Assign Subjects" subtitle="Connect teachers and students to subject records">
          <form onSubmit={assignTeacherSubject} className="grid gap-3">
            <SelectInput label="Teacher" value={assignment.teacherId} options={teachers.map((teacher) => option(teacher.id, teacher.name))} onChange={(value) => setAssignment({ ...assignment, teacherId: value })} />
            <SelectInput label="Subject" value={assignment.subjectId} options={subjects.map((subject) => option(subject.id, `${subject.name} · ${subject.year}`))} onChange={(value) => setAssignment({ ...assignment, subjectId: value, year: subjects.find((subject) => subject.id === value)?.year ?? assignment.year })} />
            <PrimaryButton label="Assign teacher" />
          </form>
          <form onSubmit={assignStudentSubject} className="mt-5 grid gap-3 border-t border-zinc-200 pt-5">
            <SelectInput label="Student" value={assignment.studentId} options={data.students.map((student) => option(student.id, `${student.name} · ${student.year}`))} onChange={(value) => setAssignment({ ...assignment, studentId: value })} />
            <SelectInput label="Subject" value={assignment.subjectId} options={subjects.map((subject) => option(subject.id, `${subject.name} · ${subject.year}`))} onChange={(value) => setAssignment({ ...assignment, subjectId: value, year: subjects.find((subject) => subject.id === value)?.year ?? assignment.year })} />
            <PrimaryButton label="Assign student" />
          </form>
        </Panel>
      </div>

      <Panel title="Subject Catalogue" subtitle={`${subjects.length} subjects`}>
        <DataTable
          headers={["Subject", "Year", "Action"]}
          rows={subjects.map((subject) => [
            <PersonCell key="subject" title={subject.name} subtitle={subject.id} />,
            subject.year,
            <IconButton key="delete" label="Delete subject" onClick={() => deleteSubject(subject.id)} />,
          ])}
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <AssignmentList
            title="Teacher assignments"
            items={data.teacherSubjects.map((item) => {
              const teacher = data.users.find((user) => user.id === item.teacherId);
              const subject = data.subjects.find((subjectItem) => subjectItem.id === item.subjectId);
              return `${teacher?.name ?? "Teacher"} → ${subject?.name ?? "Subject"} (${item.year})`;
            })}
          />
          <AssignmentList
            title="Student assignments"
            items={data.studentSubjects.map((item) => {
              const student = data.students.find((studentItem) => studentItem.id === item.studentId);
              const subject = data.subjects.find((subjectItem) => subjectItem.id === item.subjectId);
              return `${student?.name ?? "Student"} → ${subject?.name ?? "Subject"} (${item.year})`;
            })}
          />
        </div>
      </Panel>
    </div>
  );
}
