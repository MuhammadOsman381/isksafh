"use client";

import { option } from "../constants";
import { DataTable, Panel, PersonCell, PrimaryButton, SelectInput, TextInput } from "../ui";
import type { FormHandler, NewAttendanceForm, SchoolData } from "../types";

export function AttendanceView({
  data,
  newAttendance,
  setNewAttendance,
  createAttendance,
}: {
  data: SchoolData;
  newAttendance: NewAttendanceForm;
  setNewAttendance: (form: NewAttendanceForm) => void;
  createAttendance: FormHandler;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Panel title="Registrar Entry" subtitle="Enter the attendance totals used in student reports">
        <form onSubmit={createAttendance} className="grid gap-3">
          <SelectInput label="Student" value={newAttendance.studentId} options={data.students.map((student) => option(student.id, `${student.name} · ${student.studentId}`))} onChange={(value) => setNewAttendance({ ...newAttendance, studentId: value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Number of sessions" value={newAttendance.sessions} onChange={(value) => setNewAttendance({ ...newAttendance, sessions: value })} required type="number" min={0} />
            <TextInput label="Number of attendances" value={newAttendance.attendances} onChange={(value) => setNewAttendance({ ...newAttendance, attendances: value })} required type="number" min={0} />
            <TextInput label="Number of authorised absences" value={newAttendance.authorisedAbsence} onChange={(value) => setNewAttendance({ ...newAttendance, authorisedAbsence: value })} required type="number" min={0} />
            <TextInput label="Number of unauthorised absences" value={newAttendance.unauthorisedAbsence} onChange={(value) => setNewAttendance({ ...newAttendance, unauthorisedAbsence: value })} required type="number" min={0} />
          </div>
          <PrimaryButton label="Save registrar entry" />
        </form>
      </Panel>

      <Panel title="Registrar Log" subtitle={`${data.attendance.length} records`}>
        <DataTable
          headers={["Student", "Sessions", "Attendances", "Authorised", "Unauthorised"]}
          rows={data.attendance.map((record) => {
            const student = data.students.find((item) => item.id === record.studentId);
            return [
              <PersonCell key="student" title={student?.name ?? "Unknown"} subtitle={student?.studentId ?? record.studentId} />,
              record.sessions,
              record.attendances,
              record.authorisedAbsence,
              record.unauthorisedAbsence,
            ];
          })}
        />
      </Panel>
    </div>
  );
}
