"use client";

import { option } from "../constants";
import { DataTable, IconButton, Panel, PersonCell, PrimaryButton, SelectInput, TextInput } from "../ui";
import type { FormHandler, NewAttendanceForm, SchoolData } from "../types";

export function AttendanceView({
  data,
  newAttendance,
  setNewAttendance,
  createAttendance,
  deleteAttendance,
}: {
  data: SchoolData;
  newAttendance: NewAttendanceForm;
  setNewAttendance: (form: NewAttendanceForm) => void;
  createAttendance: FormHandler;
  deleteAttendance: (id: string, studentId: string) => void;
}) {
  const selectedRecord = data.attendance.find((record) => record.studentId === newAttendance.studentId);

  function selectStudent(studentId: string) {
    const record = data.attendance.find((item) => item.studentId === studentId);
    setNewAttendance({
      studentId,
      attendances: String(record?.attendances ?? 0),
      authorisedAbsence: String(record?.authorisedAbsence ?? 0),
      unauthorisedAbsence: String(record?.unauthorisedAbsence ?? 0),
    });
  }

  const sessions =
    Number(newAttendance.attendances || 0) +
    Number(newAttendance.authorisedAbsence || 0) +
    Number(newAttendance.unauthorisedAbsence || 0);

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Registrar Entry" subtitle="Enter the attendance totals used in student reports">
        <form onSubmit={createAttendance} className="grid gap-3">
          <SelectInput label="Student" value={newAttendance.studentId} options={data.students.map((student) => option(student.id, `${student.year} · ${student.name} · ${student.studentId}`))} onChange={selectStudent} />
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Number of attendances" value={newAttendance.attendances} onChange={(value) => setNewAttendance({ ...newAttendance, attendances: value })} required type="number" min={0} />
            <TextInput label="Number of authorised absences" value={newAttendance.authorisedAbsence} onChange={(value) => setNewAttendance({ ...newAttendance, authorisedAbsence: value })} required type="number" min={0} />
            <TextInput label="Number of unauthorised absences" value={newAttendance.unauthorisedAbsence} onChange={(value) => setNewAttendance({ ...newAttendance, unauthorisedAbsence: value })} required type="number" min={0} />
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            Number of sessions: <span className="font-semibold text-zinc-950">{sessions}</span>
          </div>
          <PrimaryButton label={selectedRecord ? "Update registrar entry" : "Save registrar entry"} />
        </form>
      </Panel>

      <Panel title="Registrar Log" subtitle={`${data.students.length} students`}>
        <DataTable
          headers={["Student", "Year", "Sessions", "Attendances", "Authorised", "Unauthorised", "Actions"]}
          rows={data.students.map((student) => {
            const record = data.attendance.find((item) => item.studentId === student.id);
            return [
              <PersonCell key="student" title={student.name} subtitle={student.studentId} />,
              student.year,
              record?.sessions ?? 0,
              record?.attendances ?? 0,
              record?.authorisedAbsence ?? 0,
              record?.unauthorisedAbsence ?? 0,
              record ? (
                <IconButton
                  key="delete"
                  label="Delete attendance"
                  onClick={() => {
                    const confirmed = window.confirm(`Delete registrar entry for ${student.name}?`);
                    if (confirmed) deleteAttendance(record.id, student.id);
                  }}
                />
              ) : (
                <span key="empty" className="text-xs text-zinc-400">No entry</span>
              ),
            ];
          })}
        />
      </Panel>
    </div>
  );
}
