import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { demoData, SchoolData, User } from "./demo-data";

const databaseUrl = process.env.DATABASE_URL;

export const hasDatabase = Boolean(databaseUrl);

const sql = databaseUrl ? neon(databaseUrl) : null;

const demoStore = {
  data: structuredClone(demoData) as SchoolData,
};

export async function ensureSchema() {
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'attendent')),
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      year TEXT NOT NULL,
      guardian TEXT NOT NULL DEFAULT '',
      attendance INTEGER NOT NULL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      year TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS teacher_subjects (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      year TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS student_subjects (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      year TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(student_id, subject_id)
    )
  `;

  await sql`
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

  await sql`
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

  const existing = await sql`SELECT COUNT(*)::int AS count FROM users`;
  if (existing[0]?.count === 0) {
    await seedDemoData();
  } else {
    await ensureDefaultPasswords();
  }
}

async function seedDemoData() {
  if (!sql) return;

  for (const user of demoData.users) {
    const defaultPassword =
      user.role === "admin" ? "admin123" : user.role === "teacher" ? "teacher123" : "attend123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    await sql`
      INSERT INTO users (id, name, email, password_hash, role, status)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${passwordHash}, ${user.role}, ${user.status})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  for (const student of demoData.students) {
    await sql`
      INSERT INTO students (id, student_id, name, year, guardian, attendance, status)
      VALUES (${student.id}, ${student.studentId}, ${student.name}, ${student.year}, ${student.guardian}, ${student.attendance}, ${student.status})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  for (const subject of demoData.subjects) {
    await sql`
      INSERT INTO subjects (id, name, year)
      VALUES (${subject.id}, ${subject.name}, ${subject.year})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  for (const item of demoData.teacherSubjects) {
    await sql`
      INSERT INTO teacher_subjects (id, teacher_id, subject_id, year)
      VALUES (${item.id}, ${item.teacherId}, ${item.subjectId}, ${item.year})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  for (const item of demoData.studentSubjects) {
    await sql`
      INSERT INTO student_subjects (id, student_id, subject_id, year)
      VALUES (${item.id}, ${item.studentId}, ${item.subjectId}, ${item.year})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  for (const report of demoData.reports) {
    await sql`
      INSERT INTO reports (id, student_id, subject_id, teacher_id, percentage, effort, attainment, note)
      VALUES (${report.id}, ${report.studentId}, ${report.subjectId}, ${report.teacherId}, ${report.percentage}, ${report.effort}, ${report.attainment}, ${report.note})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  for (const record of demoData.attendance) {
    await sql`
      INSERT INTO attendance (id, student_id, date, status, authorised_absence, unauthorised_absence)
      VALUES (${record.id}, ${record.studentId}, ${record.date}, ${record.status}, ${record.authorisedAbsence}, ${record.unauthorisedAbsence})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function ensureDefaultPasswords() {
  if (!sql) return;

  const users = await sql`
    SELECT id, role FROM users
    WHERE password_hash IS NULL OR password_hash = ''
  `;

  for (const user of users as Array<{ id: string; role: string }>) {
    const defaultPassword =
      user.role === "admin" ? "admin123" : user.role === "teacher" ? "teacher123" : "attend123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    await sql`
      UPDATE users SET password_hash = ${passwordHash}
      WHERE id = ${user.id}
    `;
  }
}

export async function getSchoolData(): Promise<SchoolData> {
  if (!sql) {
    return {
      ...demoStore.data,
      meta: { source: "demo", generatedAt: new Date().toISOString() },
    };
  }

  await ensureSchema();

  const [users, students, subjects, teacherSubjects, studentSubjects, reports, attendance] =
    await Promise.all([
      sql`SELECT id, name, email, role, status FROM users ORDER BY created_at DESC`,
      sql`SELECT id, student_id AS "studentId", name, year, guardian, attendance, status FROM students ORDER BY created_at DESC`,
      sql`SELECT id, name, year FROM subjects ORDER BY year, name`,
      sql`SELECT id, teacher_id AS "teacherId", subject_id AS "subjectId", year FROM teacher_subjects ORDER BY created_at DESC`,
      sql`SELECT id, student_id AS "studentId", subject_id AS "subjectId", year FROM student_subjects ORDER BY created_at DESC`,
      sql`SELECT id, student_id AS "studentId", subject_id AS "subjectId", teacher_id AS "teacherId", percentage, effort, attainment, note FROM reports ORDER BY created_at DESC`,
      sql`SELECT id, student_id AS "studentId", TO_CHAR(date, 'YYYY-MM-DD') AS date, status, authorised_absence AS "authorisedAbsence", unauthorised_absence AS "unauthorisedAbsence" FROM attendance ORDER BY date DESC, created_at DESC`,
    ]);

  const years = Array.from(
    new Set([
      ...students.map((student) => String(student.year)),
      ...subjects.map((subject) => String(subject.year)),
    ]),
  ).sort();

  return {
    users: users as SchoolData["users"],
    students: students as SchoolData["students"],
    subjects: subjects as SchoolData["subjects"],
    years,
    teacherSubjects: teacherSubjects as SchoolData["teacherSubjects"],
    studentSubjects: studentSubjects as SchoolData["studentSubjects"],
    reports: reports as SchoolData["reports"],
    attendance: attendance as SchoolData["attendance"],
    meta: { source: "neon", generatedAt: new Date().toISOString() },
  };
}

type SessionUser = Pick<User, "id" | "role"> | null;

export async function mutateSchoolData(
  action: string,
  payload: Record<string, unknown>,
  sessionUser: SessionUser = null,
) {
  if (!sql) {
    const id = typeof payload.id === "string" ? payload.id : crypto.randomUUID();

    if (action === "create-user") {
      demoStore.data.users.unshift({
        id,
        name: String(payload.name ?? ""),
        email: String(payload.email ?? ""),
        role: payload.role === "admin" || payload.role === "attendent" ? payload.role : "teacher",
        status: "active",
      });
    }

    if (action === "delete-user") {
      demoStore.data.users = demoStore.data.users.filter((user) => user.id !== payload.id);
    }

    if (action === "create-student") {
      const year = String(payload.year ?? "Year 7");
      demoStore.data.students.unshift({
        id,
        studentId: String(payload.studentId ?? ""),
        name: String(payload.name ?? ""),
        year,
        guardian: String(payload.guardian ?? ""),
        attendance: 100,
        status: "active",
      });

      const yearSubjects = demoStore.data.subjects.filter((subject) => subject.year === year);
      for (const subject of yearSubjects) {
        const exists = demoStore.data.studentSubjects.some(
          (item) => item.studentId === id && item.subjectId === subject.id,
        );
        if (!exists) {
          demoStore.data.studentSubjects.unshift({
            id: crypto.randomUUID(),
            studentId: id,
            subjectId: subject.id,
            year,
          });
        }
      }
    }

    if (action === "delete-student") {
      demoStore.data.students = demoStore.data.students.filter((student) => student.id !== payload.id);
    }

    if (action === "create-subject") {
      demoStore.data.subjects.unshift({
        id,
        name: String(payload.name ?? ""),
        year: String(payload.year ?? "Year 7"),
      });
    }

    if (action === "delete-subject") {
      demoStore.data.subjects = demoStore.data.subjects.filter((subject) => subject.id !== payload.id);
    }

    if (action === "assign-subject") {
      demoStore.data.teacherSubjects.unshift({
        id,
        teacherId: String(payload.teacherId ?? ""),
        subjectId: String(payload.subjectId ?? ""),
        year: String(payload.year ?? "Year 7"),
      });
    }

    if (action === "assign-student-subject") {
      demoStore.data.studentSubjects.unshift({
        id,
        studentId: String(payload.studentId ?? ""),
        subjectId: String(payload.subjectId ?? ""),
        year: String(payload.year ?? "Year 7"),
      });
    }

    if (action === "create-report") {
      const teacherId = sessionUser?.role === "teacher" ? sessionUser.id : String(payload.teacherId ?? "");
      const subjectId = String(payload.subjectId ?? "");
      if (sessionUser?.role === "teacher") {
        const canAccess = demoStore.data.teacherSubjects.some(
          (item) => item.teacherId === sessionUser.id && item.subjectId === subjectId,
        );
        if (!canAccess) {
          throw new Error("Teacher is not assigned to this subject");
        }
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
        status:
          payload.status === "absent" || payload.status === "authorised"
            ? payload.status
            : "present",
        authorisedAbsence: Number(payload.authorisedAbsence ?? 0),
        unauthorisedAbsence: Number(payload.unauthorisedAbsence ?? 0),
      });
    }

    demoStore.data.years = Array.from(
      new Set([
        ...demoStore.data.years,
        ...demoStore.data.students.map((student) => student.year),
        ...demoStore.data.subjects.map((subject) => subject.year),
      ]),
    ).sort();

    return getSchoolData();
  }

  await ensureSchema();
  const id = typeof payload.id === "string" ? payload.id : crypto.randomUUID();

  if (action === "create-user") {
    const passwordHash = await bcrypt.hash(String(payload.password || "school123"), 10);
    await sql`
      INSERT INTO users (id, name, email, password_hash, role, status)
      VALUES (${id}, ${payload.name as string}, ${payload.email as string}, ${passwordHash}, ${payload.role as string}, 'active')
    `;
  }

  if (action === "delete-user") {
    await sql`DELETE FROM users WHERE id = ${payload.id as string}`;
  }

  if (action === "create-student") {
    const studentYear = payload.year as string;
    await sql`
      INSERT INTO students (id, student_id, name, year, guardian, attendance, status)
      VALUES (${id}, ${payload.studentId as string}, ${payload.name as string}, ${studentYear}, ${payload.guardian as string}, 100, 'active')
    `;

    const yearSubjects = await sql`
      SELECT id, year FROM subjects WHERE year = ${studentYear}
    `;

    for (const subject of yearSubjects as Array<{ id: string; year: string }>) {
      await sql`
        INSERT INTO student_subjects (id, student_id, subject_id, year)
        VALUES (${crypto.randomUUID()}, ${id}, ${subject.id}, ${subject.year})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  if (action === "delete-student") {
    await sql`DELETE FROM students WHERE id = ${payload.id as string}`;
  }

  if (action === "create-subject") {
    await sql`
      INSERT INTO subjects (id, name, year)
      VALUES (${id}, ${payload.name as string}, ${payload.year as string})
    `;
  }

  if (action === "delete-subject") {
    await sql`DELETE FROM subjects WHERE id = ${payload.id as string}`;
  }

  if (action === "assign-subject") {
    await sql`
      INSERT INTO teacher_subjects (id, teacher_id, subject_id, year)
      VALUES (${id}, ${payload.teacherId as string}, ${payload.subjectId as string}, ${payload.year as string})
      ON CONFLICT DO NOTHING
    `;
  }

  if (action === "assign-student-subject") {
    await sql`
      INSERT INTO student_subjects (id, student_id, subject_id, year)
      VALUES (${id}, ${payload.studentId as string}, ${payload.subjectId as string}, ${payload.year as string})
      ON CONFLICT DO NOTHING
    `;
  }

  if (action === "create-report") {
    const teacherId =
      sessionUser?.role === "teacher" ? sessionUser.id : (payload.teacherId as string);
    const subjectId = payload.subjectId as string;
    if (sessionUser?.role === "teacher") {
      const access = await sql`
        SELECT id FROM teacher_subjects
        WHERE teacher_id = ${sessionUser.id} AND subject_id = ${subjectId}
        LIMIT 1
      `;
      if (access.length === 0) {
        throw new Error("Teacher is not assigned to this subject");
      }
    }

    await sql`
      INSERT INTO reports (id, student_id, subject_id, teacher_id, percentage, effort, attainment, note)
      VALUES (${id}, ${payload.studentId as string}, ${subjectId}, ${teacherId}, ${Number(payload.percentage)}, ${payload.effort as string}, ${payload.attainment as string}, '')
    `;
  }

  if (action === "create-attendance") {
    await sql`
      INSERT INTO attendance (id, student_id, date, status, authorised_absence, unauthorised_absence)
      VALUES (${id}, ${payload.studentId as string}, ${payload.date as string}, ${payload.status as string}, ${Number(payload.authorisedAbsence || 0)}, ${Number(payload.unauthorisedAbsence || 0)})
    `;
  }

  return getSchoolData();
}

export async function authenticateUser(email: string, password: string) {
  if (!sql) {
    const user = demoStore.data.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    const demoPassword =
      user?.role === "admin" ? "admin123" : user?.role === "teacher" ? "teacher123" : "attend123";
    if (!user || password !== demoPassword) return null;
    return user;
  }

  await ensureSchema();
  const rows = await sql`
    SELECT id, name, email, role, status, password_hash AS "passwordHash"
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  const user = rows[0] as
    | (SchoolData["users"][number] & { passwordHash: string | null })
    | undefined;
  if (!user?.passwordHash) return null;
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export async function getUserById(id: string) {
  if (!sql) {
    return demoStore.data.users.find((user) => user.id === id) ?? null;
  }

  await ensureSchema();
  const rows = await sql`
    SELECT id, name, email, role, status
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;
  return (rows[0] as SchoolData["users"][number] | undefined) ?? null;
}
