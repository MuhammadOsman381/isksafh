import type { FormEvent } from "react";
import type { Role, SchoolData, Student, User } from "@/lib/demo-data";

export type Tab =
  | "dashboard"
  | "students"
  | "teachers"
  | "subjects"
  | "marks"
  | "attendance"
  | "reports";

export type NewUserForm = {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: "active" | "blocked";
};

export type NewStudentForm = {
  id?: string;
  studentId: string;
  name: string;
  year: string;
  status: "active" | "watch" | "inactive";
};

export type NewSubjectForm = {
  name: string;
  year: string;
};

export type NewYearForm = {
  name: string;
};

export type NewReportForm = {
  studentId: string;
  subjectId: string;
  teacherId: string;
  percentage: string;
  effort: string;
  attainment: string;
};

export type NewAttendanceForm = {
  studentId: string;
  sessions: string;
  attendances: string;
  authorisedAbsence: string;
  unauthorisedAbsence: string;
};

export type AssignmentForm = {
  id?: string;
  teacherId: string;
  studentId: string;
  subjectId: string;
  year: string;
};

export type FormHandler = (event: FormEvent<HTMLFormElement>) => void;

export type { Role, SchoolData, Student, User };
