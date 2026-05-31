import { drizzle } from "drizzle-orm/postgres-js";
import { and, asc, desc, eq } from "drizzle-orm";
import postgres from "postgres";
import { demoData, SchoolData, User } from "./demo-data";
import { academicYears, attendance, reports, studentSubjects, students, subjects, teacherSubjects, users } from "./db/schema";

const databaseUrl = process.env.SUPABASE_DATABASE_URL;

export const hasDatabase = Boolean(databaseUrl);

type DatabaseClient = postgres.Sql<Record<string, never>>;
type Database = ReturnType<typeof drizzle>;
type GlobalWithDatabase = typeof globalThis & {
  __schoolPostgresClient?: DatabaseClient;
  __schoolDrizzleDb?: Database;
};

const globalForDatabase = globalThis as GlobalWithDatabase;

function createClient() {
  if (!databaseUrl) return null;
  return postgres(databaseUrl, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

const client =
  databaseUrl
    ? globalForDatabase.__schoolPostgresClient ?? createClient()
    : null;
const db = client
  ? globalForDatabase.__schoolDrizzleDb ?? drizzle(client)
  : null;

if (process.env.NODE_ENV !== "production" && client && db) {
  globalForDatabase.__schoolPostgresClient = client;
  globalForDatabase.__schoolDrizzleDb = db;
}

const demoStore = {
  data: structuredClone(demoData) as SchoolData,
};

type SessionUser = Pick<User, "id" | "role"> | null;

let schoolDataCache:
  | {
      expiresAt: number;
      data?: SchoolData;
      promise?: Promise<SchoolData>;
    }
  | null = null;

const SCHOOL_DATA_CACHE_MS = process.env.NODE_ENV === "production" ? 0 : 750;

function clearSchoolDataCache() {
  schoolDataCache = null;
}

async function ensureUsersTable() {
  if (!client) throw new Error("Database is not configured");

  await client`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL DEFAULT 'school123',
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS id TEXT`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'school123'`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`;
}

export async function createDefaultAdminUser() {
  const admin = {
    id: crypto.randomUUID(),
    name: "Admin",
    email: "admin@gmail.com",
    password: "12345678",
    role: "admin" as const,
    status: "active" as const,
  };

  if (!db) {
    const existing = demoStore.data.users.find((user) => user.email.toLowerCase() === admin.email);
    if (existing) {
      demoStore.data.users = demoStore.data.users.map((user) =>
        user.email.toLowerCase() === admin.email
          ? { ...user, name: admin.name, password: admin.password, role: admin.role, status: admin.status }
          : user,
      );
      return { user: demoStore.data.users.find((user) => user.email.toLowerCase() === admin.email), created: false };
    }
    demoStore.data.users.unshift(admin);
    return { user: admin, created: true };
  }

  if (!client) throw new Error("Database is not configured");

  await ensureUsersTable();

  const existingRows = await client`
    SELECT id, name, email, password, role, status
    FROM users
    WHERE email = ${admin.email}
    LIMIT 1
  `;
  const existing = existingRows[0] as typeof admin | undefined;
  if (existing) {
    await client`
      UPDATE users
      SET name = ${admin.name},
          password = ${admin.password},
          role = ${admin.role},
          status = ${admin.status}
      WHERE email = ${admin.email}
    `;
    clearSchoolDataCache();
    return {
      user: { ...existing, name: admin.name, password: admin.password, role: admin.role, status: admin.status },
      created: false,
    };
  }

  await client`
    INSERT INTO users (id, name, email, password, role, status)
    VALUES (${admin.id}, ${admin.name}, ${admin.email}, ${admin.password}, ${admin.role}, ${admin.status})
  `;
  clearSchoolDataCache();
  return { user: admin, created: true };
}

export async function getAdminUsersForSuperAdmin() {
  if (!db) {
    return demoStore.data.users.filter((user) => user.role === "admin");
  }
  if (!client) throw new Error("Database is not configured");
  await ensureUsersTable();
  const rows = await client`
    SELECT id, name, email, password, role, status
    FROM users
    WHERE role = 'admin'
    ORDER BY email ASC
  `;
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    password: String(row.password ?? ""),
    role: "admin" as const,
    status: row.status === "blocked" ? "blocked" as const : "active" as const,
  }));
}

export async function updateAdminLoginDetails(payload: Record<string, unknown>) {
  const currentEmail = String(payload.currentEmail ?? "").trim().toLowerCase();
  const name = String(payload.name ?? "Admin").trim() || "Admin";
  const email = String(payload.email ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "").trim();
  const status = normalizeUserStatus(payload.status);

  if (!email || !password) throw new Error("Email and password are required");

  if (!db) {
    const existing = demoStore.data.users.find((user) => user.role === "admin" && user.email.toLowerCase() === currentEmail);
    if (existing) {
      demoStore.data.users = demoStore.data.users.map((user) =>
        user.id === existing.id ? { ...user, name, email, password, role: "admin", status } : user,
      );
      return demoStore.data.users.find((user) => user.id === existing.id);
    }
    const admin = { id: crypto.randomUUID(), name, email, password, role: "admin" as const, status };
    demoStore.data.users.unshift(admin);
    return admin;
  }

  if (!client) throw new Error("Database is not configured");
  await ensureUsersTable();

  const existingRows = currentEmail
    ? await client`SELECT id FROM users WHERE lower(email) = ${currentEmail} AND role = 'admin' LIMIT 1`
    : [];
  const existing = existingRows[0] as { id: string } | undefined;

  if (existing) {
    await client`
      UPDATE users
      SET name = ${name},
          email = ${email},
          password = ${password},
          role = 'admin',
          status = ${status}
      WHERE id = ${existing.id}
    `;
    clearSchoolDataCache();
    return { id: existing.id, name, email, password, role: "admin" as const, status };
  }

  const id = crypto.randomUUID();
  await client`
    INSERT INTO users (id, name, email, password, role, status)
    VALUES (${id}, ${name}, ${email}, ${password}, 'admin', ${status})
  `;
  clearSchoolDataCache();
  return { id, name, email, password, role: "admin" as const, status };
}

export async function seedDemoData() {
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

export async function getAcademicYearNames(): Promise<string[]> {
  if (!db) {
    return demoStore.data.years;
  }

  const rows = await db.select().from(academicYears).orderBy(asc(academicYears.name));
  return rows.map((year) => year.name);
}

export async function getSchoolData(options: { bypassCache?: boolean } = {}): Promise<SchoolData> {
  if (!db) {
    return {
      ...demoStore.data,
      meta: { source: "demo", generatedAt: new Date().toISOString() },
    };
  }

  if (!options.bypassCache && schoolDataCache) {
    if (schoolDataCache.data && schoolDataCache.expiresAt > Date.now()) {
      return schoolDataCache.data;
    }
    if (schoolDataCache.promise) return schoolDataCache.promise;
  }

  const promise = loadSchoolData();
  if (SCHOOL_DATA_CACHE_MS > 0 && !options.bypassCache) {
    schoolDataCache = { expiresAt: Date.now() + SCHOOL_DATA_CACHE_MS, promise };
  }

  const data = await promise;
  if (SCHOOL_DATA_CACHE_MS > 0 && !options.bypassCache) {
    schoolDataCache = { expiresAt: Date.now() + SCHOOL_DATA_CACHE_MS, data };
  }
  return data;
}

async function loadSchoolData(): Promise<SchoolData> {
  if (!db) throw new Error("Database is not configured");

  const [
    userRows,
    studentRows,
    subjectRows,
    yearRows,
    teacherSubjectRows,
    studentSubjectRows,
    reportRows,
    attendanceRows,
  ] = await Promise.all([
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

  if (action === "delete-year") {
    const yearName = String(payload.name ?? "").trim();
    if (!yearName) throw new Error("Year name is required");
    const studentsInYear = await db.select().from(students).where(eq(students.year, yearName)).limit(1);
    if (studentsInYear.length > 0) throw new Error(`Cannot delete ${yearName} because students are assigned to it`);
    await db.delete(teacherSubjects).where(eq(teacherSubjects.year, yearName));
    await db.delete(studentSubjects).where(eq(studentSubjects.year, yearName));
    await db.delete(academicYears).where(eq(academicYears.name, yearName));
  }

  if (action === "create-subject") {
    await db.insert(subjects).values({
      id,
      name: String(payload.name ?? ""),
      year: "",
    });
  }

  if (action === "delete-subject") {
    const subjectId = String(payload.id ?? "");
    if (!subjectId) throw new Error("Subject is required");
    await db.delete(reports).where(eq(reports.subjectId, subjectId));
    await db.delete(teacherSubjects).where(eq(teacherSubjects.subjectId, subjectId));
    await db.delete(studentSubjects).where(eq(studentSubjects.subjectId, subjectId));
    await db.delete(subjects).where(eq(subjects.id, subjectId));
  }

  if (action === "create-student") {
    await createStudentWithAssignedSubjects(payload, id);
  }

  if (action === "update-student") {
    const studentId = String(payload.id ?? "");
    const nextStudentId = String(payload.studentId ?? "").trim();
    const nextName = String(payload.name ?? "").trim();
    const nextYear = String(payload.year ?? "").trim();
    if (!studentId || !nextStudentId || !nextName || !nextYear) {
      throw new Error("Student ID, name, and year are required");
    }

    const [existingStudent] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    if (!existingStudent) throw new Error("Student does not exist");

    const [studentWithSameId] = await db.select().from(students).where(eq(students.studentId, nextStudentId)).limit(1);
    if (studentWithSameId && studentWithSameId.id !== studentId) {
      throw new Error(`Student ID ${nextStudentId} is already used by another student`);
    }

    await db.update(students)
      .set({
        studentId: nextStudentId,
        name: nextName,
        year: nextYear,
        status: normalizeStudentStatus(payload.status),
      })
      .where(eq(students.id, studentId));

    if (existingStudent.year !== nextYear) {
      await db.delete(studentSubjects).where(eq(studentSubjects.studentId, studentId));
      const yearAssignments = await db.select().from(teacherSubjects).where(eq(teacherSubjects.year, nextYear));
      const subjectIds = Array.from(new Set(yearAssignments.map((assignment) => assignment.subjectId)));
      if (subjectIds.length > 0) {
        await db.insert(studentSubjects).values(
          subjectIds.map((subjectId) => ({
            id: crypto.randomUUID(),
            studentId,
            subjectId,
            year: nextYear,
          })),
        ).onConflictDoNothing();
      }
    }
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
    const studentId = String(payload.studentId ?? "");
    const reportValues = {
      studentId,
      subjectId,
      teacherId,
      percentage: Number(payload.percentage ?? 0),
      effort: String(payload.effort ?? ""),
      attainment: String(payload.attainment ?? ""),
      note: "",
    };
    const [existingReport] = await db.select().from(reports)
      .where(and(eq(reports.studentId, studentId), eq(reports.subjectId, subjectId), eq(reports.teacherId, teacherId)))
      .limit(1);
    if (existingReport) {
      await db.update(reports).set(reportValues).where(eq(reports.id, existingReport.id));
    } else {
      await db.insert(reports).values({ id, ...reportValues });
    }
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

  clearSchoolDataCache();
  return getSchoolData({ bypassCache: true });
}

export async function createStudentWithAssignedSubjects(
  payload: Record<string, unknown>,
  id = crypto.randomUUID(),
) {
  if (!db) {
    mutateDemoData("create-student", { ...payload, id }, { id: "public-api", role: "admin" });
    const student = demoStore.data.students.find((item) => item.id === id || item.studentId === payload.studentId);
    return {
      student: student ?? null,
      allottedSubjects: student
        ? demoStore.data.studentSubjects
            .filter((item) => item.studentId === student.id)
            .map((item) => ({
              id: item.id,
              subjectId: item.subjectId,
              subjectName: demoStore.data.subjects.find((subject) => subject.id === item.subjectId)?.name ?? "Subject",
              year: item.year,
            }))
        : [],
    };
  }

  const studentYear = String(payload.year ?? "");
  const student = {
    id,
    studentId: String(payload.studentId ?? ""),
    name: String(payload.name ?? ""),
    year: studentYear,
    attendance: 100,
    status: "active" as const,
  };

  await db.insert(students).values(student);

  const yearAssignments = await db
    .select({
      subjectId: teacherSubjects.subjectId,
      subjectName: subjects.name,
    })
    .from(teacherSubjects)
    .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id))
    .where(eq(teacherSubjects.year, studentYear));

  const subjectMap = new Map(yearAssignments.map((assignment) => [assignment.subjectId, assignment.subjectName]));
  const subjectIds = Array.from(subjectMap.keys());
  const allottedSubjects = subjectIds.map((subjectId) => ({
    id: crypto.randomUUID(),
    studentId: id,
    subjectId,
    year: studentYear,
  }));

  if (allottedSubjects.length > 0) {
    await db.insert(studentSubjects).values(allottedSubjects).onConflictDoNothing();
  }

  clearSchoolDataCache();

  return {
    student,
    allottedSubjects: allottedSubjects.map((item) => ({
      id: item.id,
      subjectId: item.subjectId,
      subjectName: subjectMap.get(item.subjectId) ?? "Subject",
      year: item.year,
    })),
  };
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
  if (action === "delete-year") {
    const name = String(payload.name ?? "").trim();
    const studentsInYear = demoStore.data.students.some((student) => student.year === name);
    if (studentsInYear) throw new Error(`Cannot delete ${name} because students are assigned to it`);
    demoStore.data.years = demoStore.data.years.filter((year) => year !== name);
    demoStore.data.teacherSubjects = demoStore.data.teacherSubjects.filter((item) => item.year !== name);
    demoStore.data.studentSubjects = demoStore.data.studentSubjects.filter((item) => item.year !== name);
  }
  if (action === "create-subject") {
    demoStore.data.subjects.unshift({ id, name: String(payload.name ?? ""), year: "" });
  }
  if (action === "delete-subject") {
    demoStore.data.subjects = demoStore.data.subjects.filter((subject) => subject.id !== payload.id);
    demoStore.data.teacherSubjects = demoStore.data.teacherSubjects.filter((item) => item.subjectId !== payload.id);
    demoStore.data.studentSubjects = demoStore.data.studentSubjects.filter((item) => item.subjectId !== payload.id);
    demoStore.data.reports = demoStore.data.reports.filter((report) => report.subjectId !== payload.id);
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
    const nextYear = String(payload.year ?? "").trim();
    const previousStudent = demoStore.data.students.find((student) => student.id === payload.id);
    demoStore.data.students = demoStore.data.students.map((student) =>
      student.id === payload.id
        ? {
            ...student,
            studentId: String(payload.studentId ?? student.studentId),
            name: String(payload.name ?? student.name),
            year: nextYear || student.year,
            status: normalizeStudentStatus(payload.status),
          }
        : student,
    );
    const updatedStudent = demoStore.data.students.find((student) => student.id === payload.id);
    if (updatedStudent && previousStudent && nextYear && previousStudent.year !== nextYear) {
      demoStore.data.studentSubjects = demoStore.data.studentSubjects.filter((item) => item.studentId !== updatedStudent.id);
      const subjectIds = Array.from(
        new Set(
          demoStore.data.teacherSubjects
            .filter((assignment) => assignment.year === nextYear)
            .map((assignment) => assignment.subjectId),
        ),
      );
      for (const subjectId of subjectIds) {
        demoStore.data.studentSubjects.unshift({
          id: crypto.randomUUID(),
          studentId: updatedStudent.id,
          subjectId,
          year: nextYear,
        });
      }
    }
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
    const studentId = String(payload.studentId ?? "");
    const existingReport = demoStore.data.reports.find(
      (report) => report.studentId === studentId && report.subjectId === subjectId && report.teacherId === teacherId,
    );
    const nextReport = {
      studentId,
      subjectId,
      teacherId,
      percentage: Number(payload.percentage ?? 0),
      effort: String(payload.effort ?? ""),
      attainment: String(payload.attainment ?? ""),
      note: "",
    };
    if (existingReport) {
      demoStore.data.reports = demoStore.data.reports.map((report) =>
        report.id === existingReport.id ? { ...report, ...nextReport } : report,
      );
    } else {
      demoStore.data.reports.unshift({ id, ...nextReport });
    }
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

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || user.password !== password || user.status === "blocked") return null;
  return user as SchoolData["users"][number];
}

export async function getUserById(id: string) {
  if (!db) {
    return demoStore.data.users.find((user) => user.id === id) ?? null;
  }

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
