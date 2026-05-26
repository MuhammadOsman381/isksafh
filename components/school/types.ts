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
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type NewStudentForm = {
  studentId: string;
  name: string;
  year: string;
  guardian: string;
};

export type NewSubjectForm = {
  name: string;
  year: string;
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
  date: string;
  status: "present" | "absent" | "authorised";
  authorisedAbsence: string;
  unauthorisedAbsence: string;
};

export type AssignmentForm = {
  teacherId: string;
  studentId: string;
  subjectId: string;
  year: string;
};

export type FormHandler = (event: FormEvent<HTMLFormElement>) => void;

export type { Role, SchoolData, Student, User };
