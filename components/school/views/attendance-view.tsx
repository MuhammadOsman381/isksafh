"use client";

import { option } from "../constants";
import { Badge, DataTable, Panel, PersonCell, PrimaryButton, SelectInput, TextInput } from "../ui";
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
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Record Attendance" subtitle="Daily register for authorised and unauthorised absence">
        <form onSubmit={createAttendance} className="grid gap-3">
          <SelectInput label="Student" value={newAttendance.studentId} options={data.students.map((student) => option(student.id, `${student.name} · ${student.studentId}`))} onChange={(value) => setNewAttendance({ ...newAttendance, studentId: value })} />
          <TextInput label="Date" value={newAttendance.date} onChange={(value) => setNewAttendance({ ...newAttendance, date: value })} required type="date" />
          <SelectInput label="Status" value={newAttendance.status} options={["present", "absent", "authorised"]} onChange={(value) => setNewAttendance({ ...newAttendance, status: value as NewAttendanceForm["status"] })} />
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Authorised absence" value={newAttendance.authorisedAbsence} onChange={(value) => setNewAttendance({ ...newAttendance, authorisedAbsence: value })} required type="number" min={0} />
            <TextInput label="Unauthorised absence" value={newAttendance.unauthorisedAbsence} onChange={(value) => setNewAttendance({ ...newAttendance, unauthorisedAbsence: value })} required type="number" min={0} />
          </div>
          <PrimaryButton label="Save attendance" />
        </form>
      </Panel>

      <Panel title="Attendance Log" subtitle={`${data.attendance.length} records`}>
        <DataTable
          headers={["Student", "Date", "Status", "Authorised", "Unauthorised"]}
          rows={data.attendance.map((record) => {
            const student = data.students.find((item) => item.id === record.studentId);
            return [
              <PersonCell key="student" title={student?.name ?? "Unknown"} subtitle={student?.studentId ?? record.studentId} />,
              record.date,
              <Badge key="status" label={record.status} />,
              record.authorisedAbsence,
              record.unauthorisedAbsence,
            ];
          })}
        />
      </Panel>
    </div>
  );
}
