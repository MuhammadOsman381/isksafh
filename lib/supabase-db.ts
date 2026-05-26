import { drizzle } from "drizzle-orm/postgres-js";
import { and, asc, desc, eq } from "drizzle-orm";
import postgres from "postgres";
import { demoData, SchoolData, User } from "./demo-data";
import { academicYears, attendance, reports, studentSubjects, students, subjects, teacherSubjects, users } from "./db/schema";

const databaseUrl = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

export const hasDatabase = Boolean(databaseUrl);

const client = databaseUrl ? postgres(databaseUrl, { prepare: false }) : null;
const db = client ? drizzle(client) : null;

const demoStore = {
  data: structuredClone(demoData) as SchoolData,
};

type SessionUser = Pick<User, "id" | "role"> | null;

export async function ensureSchema() {
  if (!client || !db) return;

  await client`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL DEFAULT 'school123',
      role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'attendent')),
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'school123'`;
  await client`
    UPDATE users
    SET password = CASE
      WHEN role = 'admin' THEN 'admin123'
      WHEN role = 'attendent' THEN 'attend123'
      ELSE 'teacher123'
    END
    WHERE password IS NULL OR password = '' OR password = 'school123'
  `;

  await client`
    CREATE TABLE IF NOT EXISTS academic_years (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      year TEXT NOT NULL,
      attendance INTEGER NOT NULL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await client`ALTER TABLE students DROP COLUMN IF EXISTS guardian`;

  await client`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      year TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await client`ALTER TABLE subjects ALTER COLUMN year SET DEFAULT ''`;

  await client`
    CREATE TABLE IF NOT EXISTS teacher_subjects (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      year TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(teacher_id, subject_id)
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS student_subjects (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      year TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(student_id, subject_id)
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      percentage INTEGER NOT NULL,
      effort TEXT NOT NULL,
      attainment TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'authorised')),
      authorised_absence INTEGER NOT NULL DEFAULT 0,
      unauthorised_absence INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const existing = await db.select().from(users).limit(1);
  if (existing.length === 0) {
    await seedDemoData();
  }

  const existingYears = await db.select().from(academicYears).limit(1);
  if (existingYears.length === 0) {
    const yearNames = Array.from(new Set(demoData.years));
    for (const year of yearNames) {
      await db.insert(academicYears).values({ id: crypto.randomUUID(), name: year }).onConflictDoNothing();
    }
  }
}

async function seedDemoData() {
  if (!db) return;

  for (const user of demoData.users) {
    await db.insert(users).values(user).onConflictDoNothing();
  }

  for (const student of demoData.students) {
    await db.insert(students).values(student).onConflictDoNothing();
  }

  for (const subject of demoData.subjects) {
    await db.insert(subjects).values(subject).onConflictDoNothing();
  }

  for (const year of demoData.years) {
    await db.insert(academicYears).values({ id: crypto.randomUUID(), name: year }).onConflictDoNothing();
  }

  for (const item of demoData.teacherSubjects) {
    await db.insert(teacherSubjects).values(item).onConflictDoNothing();
  }

  for (const item of demoData.studentSubjects) {
    await db.insert(studentSubjects).values(item).onConflictDoNothing();
  }

  for (const report of demoData.reports) {
    await db.insert(reports).values(report).onConflictDoNothing();
  }

  for (const record of demoData.attendance) {
    await db.insert(attendance).values({
      ...record,
      authorisedAbsence: record.authorisedAbsence,
      unauthorisedAbsence: record.unauthorisedAbsence,
    }).onConflictDoNothing();
  }
}

export async function getSchoolData(): Promise<SchoolData> {
  if (!db) {
    return {
      ...demoStore.data,
      meta: { source: "demo", generatedAt: new Date().toISOString() },
    };
  }

  await ensureSchema();

  const [userRows, studentRows, subjectRows, yearRows, teacherSubjectRows, studentSubjectRows, reportRows, attendanceRows] =
    await Promise.all([
      db.select().from(users).orderBy(desc(users.createdAt)),
      db.select().from(students).orderBy(desc(students.createdAt)),
      db.select().from(subjects).orderBy(asc(subjects.year), asc(subjects.name)),
      db.select().from(academicYears).orderBy(asc(academicYears.name)),
      db.select().from(teacherSubjects).orderBy(desc(teacherSubjects.createdAt)),
      db.select().from(studentSubjects).orderBy(desc(studentSubjects.createdAt)),
      db.select().from(reports).orderBy(desc(reports.createdAt)),
      db.select().from(attendance).orderBy(desc(attendance.date), desc(attendance.createdAt)),
    ]);

  return {
    users: userRows as SchoolData["users"],
    students: studentRows as SchoolData["students"],
    subjects: subjectRows as SchoolData["subjects"],
    years: yearRows.map((year) => year.name),
    teacherSubjects: teacherSubjectRows as SchoolData["teacherSubjects"],
    studentSubjects: studentSubjectRows as SchoolData["studentSubjects"],
    reports: reportRows as SchoolData["reports"],
    attendance: attendanceRows.map((record) => ({
      id: record.id,
      studentId: record.studentId,
      date: String(record.date),
      status: record.status as SchoolData["attendance"][number]["status"],
      authorisedAbsence: record.authorisedAbsence,
      unauthorisedAbsence: record.unauthorisedAbsence,
    })),
    meta: { source: "supabase", generatedAt: new Date().toISOString() },
  };
}

export async function mutateSchoolData(
  action: string,
  payload: Record<string, unknown>,
  sessionUser: SessionUser = null,
) {
  if (!db) {
    mutateDemoData(action, payload, sessionUser);
    return getSchoolData();
  }

  await ensureSchema();
  const id = typeof payload.id === "string" ? payload.id : crypto.randomUUID();

  if (action === "create-user") {
    await db.insert(users).values({
      id,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      password: String(payload.password ?? "school123"),
      role: normalizeRole(payload.role),
      status: normalizeUserStatus(payload.status),
    });
  }

  if (action === "update-user") {
    await db.update(users)
      .set({
        name: String(payload.name ?? ""),
        email: String(payload.email ?? ""),
        password: String(payload.password ?? ""),
        role: normalizeRole(payload.role),
        status: normalizeUserStatus(payload.status),
      })
      .where(eq(users.id, String(payload.id)));
  }

  if (action === "delete-user") {
    await db.delete(users).where(eq(users.id, String(payload.id)));
  }

  if (action === "create-year") {
    await db.insert(academicYears).values({ id, name: String(payload.name ?? "") }).onConflictDoNothing();
  }

  if (action === "create-subject") {
    await db.insert(subjects).values({
      id,
      name: String(payload.name ?? ""),
      year: "",
    });
  }

  if (action === "delete-subject") {
    await db.delete(subjects).where(eq(subjects.id, String(payload.id)));
  }

  if (action === "create-student") {
    const studentYear = String(payload.year ?? "");
    await db.insert(students).values({
      id,
      studentId: String(payload.studentId ?? ""),
      name: String(payload.name ?? ""),
      year: studentYear,
      attendance: 100,
      status: "active",
    });
    const yearAssignments = await db.select().from(teacherSubjects).where(eq(teacherSubjects.year, studentYear));
    const subjectIds = Array.from(new Set(yearAssignments.map((assignment) => assignment.subjectId)));
    for (const subjectId of subjectIds) {
      await db.insert(studentSubjects).values({
        id: crypto.randomUUID(),
        studentId: id,
        subjectId,
        year: studentYear,
      }).onConflictDoNothing();
    }
  }

  if (action === "update-student") {
    await db.update(students)
      .set({
        studentId: String(payload.studentId ?? ""),
        name: String(payload.name ?? ""),
        year: String(payload.year ?? ""),
        status: normalizeStudentStatus(payload.status),
      })
      .where(eq(students.id, String(payload.id)));
  }

  if (action === "delete-student") {
    await db.delete(students).where(eq(students.id, String(payload.id)));
  }

  if (action === "assign-student-subject") {
    await db.insert(studentSubjects).values({
      id,
      studentId: String(payload.studentId ?? ""),
      subjectId: String(payload.subjectId ?? ""),
      year: String(payload.year ?? ""),
    }).onConflictDoNothing();
  }

  if (action === "update-student-subject") {
    await db.update(studentSubjects)
      .set({
        studentId: String(payload.studentId ?? ""),
        subjectId: String(payload.subjectId ?? ""),
        year: String(payload.year ?? ""),
      })
      .where(eq(studentSubjects.id, String(payload.id)));
  }

  if (action === "delete-student-subject") {
    await db.delete(studentSubjects).where(eq(studentSubjects.id, String(payload.id)));
  }

  if (action === "assign-subject") {
    await db.insert(teacherSubjects).values({
      id,
      teacherId: String(payload.teacherId ?? ""),
      subjectId: String(payload.subjectId ?? ""),
      year: String(payload.year ?? ""),
    }).onConflictDoNothing();
  }

  if (action === "update-teacher-assignment") {
    await db.update(teacherSubjects)
      .set({
        teacherId: String(payload.teacherId ?? ""),
        subjectId: String(payload.subjectId ?? ""),
        year: String(payload.year ?? ""),
      })
      .where(eq(teacherSubjects.id, String(payload.id)));
  }

  if (action === "delete-teacher-assignment") {
    await db.delete(teacherSubjects).where(eq(teacherSubjects.id, String(payload.id)));
  }

  if (action === "create-report") {
    const teacherId = sessionUser?.role === "teacher" ? sessionUser.id : String(payload.teacherId ?? "");
    const subjectId = String(payload.subjectId ?? "");
    if (sessionUser?.role === "teacher") {
      const studentId = String(payload.studentId ?? "");
      const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (!student) throw new Error("Student does not exist");
      const access = await db.select().from(teacherSubjects)
        .where(and(eq(teacherSubjects.teacherId, sessionUser.id), eq(teacherSubjects.subjectId, subjectId)))
        .limit(1);
      if (access.length === 0) throw new Error("Teacher is not assigned to this subject");
      const canGradeStudent = access.some((assignment) => assignment.year === student.year);
      if (!canGradeStudent) throw new Error("Teacher is not assigned to this student's year");
      const studentAccess = await db.select().from(studentSubjects)
        .where(and(eq(studentSubjects.studentId, studentId), eq(studentSubjects.subjectId, subjectId)))
        .limit(1);
      if (studentAccess.length === 0) throw new Error("Subject is not allotted to this student");
    }
    await db.insert(reports).values({
      id,
      studentId: String(payload.studentId ?? ""),
      subjectId,
      teacherId,
      percentage: Number(payload.percentage ?? 0),
      effort: String(payload.effort ?? ""),
      attainment: String(payload.attainment ?? ""),
      note: "",
    });
  }

  if (action === "create-attendance") {
    await db.insert(attendance).values({
      id,
      studentId: String(payload.studentId ?? ""),
      date: String(payload.date ?? new Date().toISOString().slice(0, 10)),
      status: String(payload.status ?? "present"),
      authorisedAbsence: Number(payload.authorisedAbsence || 0),
      unauthorisedAbsence: Number(payload.unauthorisedAbsence || 0),
    });
  }

  return getSchoolData();
}

function mutateDemoData(action: string, payload: Record<string, unknown>, sessionUser: SessionUser) {
  const id = typeof payload.id === "string" ? payload.id : crypto.randomUUID();

  if (action === "create-user") {
    demoStore.data.users.unshift({
      id,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      password: String(payload.password ?? "school123"),
      role: normalizeRole(payload.role),
      status: normalizeUserStatus(payload.status),
    });
  }
  if (action === "update-user") {
    demoStore.data.users = demoStore.data.users.map((user) =>
      user.id === payload.id
        ? {
            ...user,
            name: String(payload.name ?? user.name),
            email: String(payload.email ?? user.email),
            password: String(payload.password ?? user.password),
            role: normalizeRole(payload.role),
            status: normalizeUserStatus(payload.status),
          }
        : user,
    );
  }
  if (action === "delete-user") {
    demoStore.data.users = demoStore.data.users.filter((user) => user.id !== payload.id);
  }
  if (action === "create-year") {
    const name = String(payload.name ?? "");
    if (name && !demoStore.data.years.includes(name)) demoStore.data.years.push(name);
  }
  if (action === "create-subject") {
    demoStore.data.subjects.unshift({ id, name: String(payload.name ?? ""), year: "" });
  }
  if (action === "delete-subject") {
    demoStore.data.subjects = demoStore.data.subjects.filter((subject) => subject.id !== payload.id);
  }
  if (action === "create-student") {
    const studentYear = String(payload.year ?? "");
    demoStore.data.students.unshift({
      id,
      studentId: String(payload.studentId ?? ""),
      name: String(payload.name ?? ""),
      year: studentYear,
      attendance: 100,
      status: "active",
    });
    const subjectIds = Array.from(
      new Set(
        demoStore.data.teacherSubjects
          .filter((assignment) => assignment.year === studentYear)
          .map((assignment) => assignment.subjectId),
      ),
    );
    for (const subjectId of subjectIds) {
      demoStore.data.studentSubjects.unshift({
        id: crypto.randomUUID(),
        studentId: id,
        subjectId,
        year: studentYear,
      });
    }
  }
  if (action === "update-student") {
    demoStore.data.students = demoStore.data.students.map((student) =>
      student.id === payload.id
        ? {
            ...student,
            studentId: String(payload.studentId ?? student.studentId),
            name: String(payload.name ?? student.name),
            year: String(payload.year ?? student.year),
            status: normalizeStudentStatus(payload.status),
          }
        : student,
    );
  }
  if (action === "delete-student") {
    demoStore.data.students = demoStore.data.students.filter((student) => student.id !== payload.id);
    demoStore.data.studentSubjects = demoStore.data.studentSubjects.filter((item) => item.studentId !== payload.id);
  }
  if (action === "assign-student-subject") {
    const exists = demoStore.data.studentSubjects.some(
      (item) => item.studentId === payload.studentId && item.subjectId === payload.subjectId,
    );
    if (!exists) {
      demoStore.data.studentSubjects.unshift({
        id,
        studentId: String(payload.studentId ?? ""),
        subjectId: String(payload.subjectId ?? ""),
        year: String(payload.year ?? ""),
      });
    }
  }
  if (action === "update-student-subject") {
    demoStore.data.studentSubjects = demoStore.data.studentSubjects.map((item) =>
      item.id === payload.id
        ? {
            ...item,
            studentId: String(payload.studentId ?? item.studentId),
            subjectId: String(payload.subjectId ?? item.subjectId),
            year: String(payload.year ?? item.year),
          }
        : item,
    );
  }
  if (action === "delete-student-subject") {
    demoStore.data.studentSubjects = demoStore.data.studentSubjects.filter((item) => item.id !== payload.id);
  }
  if (action === "assign-subject") {
    demoStore.data.teacherSubjects.unshift({
      id,
      teacherId: String(payload.teacherId ?? ""),
      subjectId: String(payload.subjectId ?? ""),
      year: String(payload.year ?? ""),
    });
  }
  if (action === "update-teacher-assignment") {
    demoStore.data.teacherSubjects = demoStore.data.teacherSubjects.map((item) =>
      item.id === payload.id
        ? {
            ...item,
            teacherId: String(payload.teacherId ?? item.teacherId),
            subjectId: String(payload.subjectId ?? item.subjectId),
            year: String(payload.year ?? item.year),
          }
        : item,
    );
  }
  if (action === "delete-teacher-assignment") {
    demoStore.data.teacherSubjects = demoStore.data.teacherSubjects.filter((item) => item.id !== payload.id);
  }
  if (action === "create-report") {
    const teacherId = sessionUser?.role === "teacher" ? sessionUser.id : String(payload.teacherId ?? "");
    const subjectId = String(payload.subjectId ?? "");
    if (sessionUser?.role === "teacher") {
      const studentId = String(payload.studentId ?? "");
      const student = demoStore.data.students.find((item) => item.id === studentId);
      if (!student) throw new Error("Student does not exist");
      const teacherAssignment = demoStore.data.teacherSubjects.find(
        (item) => item.teacherId === sessionUser.id && item.subjectId === subjectId,
      );
      if (!teacherAssignment) throw new Error("Teacher is not assigned to this subject");
      if (teacherAssignment.year !== student.year) throw new Error("Teacher is not assigned to this student's year");
      const studentAccess = demoStore.data.studentSubjects.some(
        (item) => item.studentId === studentId && item.subjectId === subjectId,
      );
      if (!studentAccess) throw new Error("Subject is not allotted to this student");
    }
    demoStore.data.reports.unshift({
      id,
      studentId: String(payload.studentId ?? ""),
      subjectId,
      teacherId,
      percentage: Number(payload.percentage ?? 0),
      effort: String(payload.effort ?? ""),
      attainment: String(payload.attainment ?? ""),
      note: "",
    });
  }
  if (action === "create-attendance") {
    demoStore.data.attendance.unshift({
      id,
      studentId: String(payload.studentId ?? ""),
      date: String(payload.date ?? new Date().toISOString().slice(0, 10)),
      status: payload.status === "absent" || payload.status === "authorised" ? payload.status : "present",
      authorisedAbsence: Number(payload.authorisedAbsence ?? 0),
      unauthorisedAbsence: Number(payload.unauthorisedAbsence ?? 0),
    });
  }
}

export async function authenticateUser(email: string, password: string) {
  if (!db) {
    const user = demoStore.data.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password || user.status === "blocked") return null;
    return user;
  }

  await ensureSchema();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || user.password !== password || user.status === "blocked") return null;
  return user as SchoolData["users"][number];
}

export async function getUserById(id: string) {
  if (!db) {
    return demoStore.data.users.find((user) => user.id === id) ?? null;
  }

  await ensureSchema();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return (user as SchoolData["users"][number] | undefined) ?? null;
}

function normalizeRole(role: unknown): User["role"] {
  return role === "admin" || role === "attendent" ? role : "teacher";
}

function normalizeUserStatus(status: unknown): User["status"] {
  return status === "blocked" ? "blocked" : "active";
}

function normalizeStudentStatus(status: unknown): SchoolData["students"][number]["status"] {
  return status === "watch" || status === "inactive" ? status : "active";
}
