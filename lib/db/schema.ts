import { sql } from "drizzle-orm";
import { check, date, foreignKey, index, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull().default("school123"),
  role: text("role").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailUnique: unique("users_email_key").on(table.email),
  roleIdx: index("users_role_idx").on(table.role),
  createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  roleCheck: check("users_role_check", sql`${table.role} IN ('admin', 'teacher', 'attendent')`),
}));

export const academicYears = pgTable("academic_years", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nameUnique: unique("academic_years_name_key").on(table.name),
}));

export const students = pgTable("students", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  name: text("name").notNull(),
  year: text("year").notNull(),
  attendance: integer("attendance").notNull().default(100),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentIdUnique: unique("students_student_id_key").on(table.studentId),
  yearIdx: index("students_year_idx").on(table.year),
  createdAtIdx: index("students_created_at_idx").on(table.createdAt),
}));

export const subjects = pgTable("subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  year: text("year").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  yearNameIdx: index("subjects_year_name_idx").on(table.year, table.name),
}));

export const teacherSubjects = pgTable("teacher_subjects", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull(),
  subjectId: text("subject_id").notNull(),
  year: text("year").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  teacherFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [users.id],
    name: "teacher_subjects_teacher_id_fkey",
  }).onDelete("cascade"),
  subjectFk: foreignKey({
    columns: [table.subjectId],
    foreignColumns: [subjects.id],
    name: "teacher_subjects_subject_id_fkey",
  }).onDelete("cascade"),
  teacherIdx: index("teacher_subjects_teacher_id_idx").on(table.teacherId),
  subjectIdx: index("teacher_subjects_subject_id_idx").on(table.subjectId),
  yearIdx: index("teacher_subjects_year_idx").on(table.year),
  createdAtIdx: index("teacher_subjects_created_at_idx").on(table.createdAt),
  teacherSubjectUnique: unique("teacher_subjects_teacher_id_subject_id_key").on(table.teacherId, table.subjectId),
}));

export const studentSubjects = pgTable("student_subjects", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  subjectId: text("subject_id").notNull(),
  year: text("year").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentFk: foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.id],
    name: "student_subjects_student_id_fkey",
  }).onDelete("cascade"),
  subjectFk: foreignKey({
    columns: [table.subjectId],
    foreignColumns: [subjects.id],
    name: "student_subjects_subject_id_fkey",
  }).onDelete("cascade"),
  studentIdx: index("student_subjects_student_id_idx").on(table.studentId),
  subjectIdx: index("student_subjects_subject_id_idx").on(table.subjectId),
  yearIdx: index("student_subjects_year_idx").on(table.year),
  createdAtIdx: index("student_subjects_created_at_idx").on(table.createdAt),
  studentSubjectUnique: unique("student_subjects_student_id_subject_id_key").on(table.studentId, table.subjectId),
}));

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  subjectId: text("subject_id").notNull(),
  teacherId: text("teacher_id").notNull(),
  percentage: integer("percentage").notNull(),
  effort: text("effort").notNull(),
  attainment: text("attainment").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentFk: foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.id],
    name: "reports_student_id_fkey",
  }).onDelete("cascade"),
  subjectFk: foreignKey({
    columns: [table.subjectId],
    foreignColumns: [subjects.id],
    name: "reports_subject_id_fkey",
  }).onDelete("cascade"),
  teacherFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [users.id],
    name: "reports_teacher_id_fkey",
  }).onDelete("cascade"),
  studentIdx: index("reports_student_id_idx").on(table.studentId),
  subjectIdx: index("reports_subject_id_idx").on(table.subjectId),
  teacherIdx: index("reports_teacher_id_idx").on(table.teacherId),
  createdAtIdx: index("reports_created_at_idx").on(table.createdAt),
}));

export const attendance = pgTable("attendance", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull(),
  authorisedAbsence: integer("authorised_absence").notNull().default(0),
  unauthorisedAbsence: integer("unauthorised_absence").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentFk: foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.id],
    name: "attendance_student_id_fkey",
  }).onDelete("cascade"),
  studentIdx: index("attendance_student_id_idx").on(table.studentId),
  dateCreatedAtIdx: index("attendance_date_created_at_idx").on(table.date, table.createdAt),
  statusCheck: check("attendance_status_check", sql`${table.status} IN ('present', 'absent', 'authorised')`),
}));
