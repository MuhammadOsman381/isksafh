import crypto from "node:crypto";
import fs from "node:fs";
import postgres from "postgres";

const env = readEnvFile();
const databaseUrl = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL ?? env.SUPABASE_DATABASE_URL ?? env.DATABASE_URL;
const requestedCount = Number(process.argv[2] ?? 0);
const count = Number.isInteger(requestedCount) && requestedCount > 0
  ? requestedCount
  : randomInt(500, 600);

const firstNames = [
  "Aariz",
  "Aayan",
  "Abdullah",
  "Adam",
  "Aisha",
  "Alina",
  "Amina",
  "Amna",
  "Anas",
  "Dania",
  "Emaan",
  "Fatima",
  "Hania",
  "Hassan",
  "Ibrahim",
  "Laiba",
  "Mariam",
  "Musa",
  "Noor",
  "Omar",
  "Rayan",
  "Sara",
  "Taha",
  "Yahya",
  "Zain",
  "Zara",
];

const lastNames = [
  "Ahmed",
  "Ali",
  "Farooq",
  "Hassan",
  "Iqbal",
  "Khan",
  "Malik",
  "Mirza",
  "Qureshi",
  "Rahman",
  "Raza",
  "Saeed",
  "Sheikh",
  "Siddiqui",
  "Usman",
  "Yousaf",
];

if (!databaseUrl) {
  console.error("Missing SUPABASE_DATABASE_URL or DATABASE_URL.");
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  prepare: false,
  max: 1,
  connect_timeout: 10,
  idle_timeout: 10,
});

try {
  const years = await sql`
    SELECT name
    FROM academic_years
    ORDER BY name ASC
  `;

  if (years.length === 0) {
    throw new Error("No academic years found. Create years in the admin portal first.");
  }

  const yearNames = years.map((year) => year.name);
  const existingIds = new Set(
    (await sql`
      SELECT student_id
      FROM students
      WHERE student_id LIKE 'RND-%'
    `).map((student) => student.student_id),
  );

  let created = 0;
  let allottedSubjects = 0;

  for (let index = 0; index < count; index += 1) {
    const year = pick(yearNames);
    const id = crypto.randomUUID();
    const studentId = nextStudentId(existingIds);
    const name = randomStudentName();

    await sql`
      INSERT INTO students (id, student_id, name, year, attendance, status)
      VALUES (${id}, ${studentId}, ${name}, ${year}, 100, 'active')
      ON CONFLICT (student_id) DO NOTHING
    `;

    const assignments = await sql`
      SELECT DISTINCT subject_id
      FROM teacher_subjects
      WHERE year = ${year}
    `;

    for (const assignment of assignments) {
      await sql`
        INSERT INTO student_subjects (id, student_id, subject_id, year)
        VALUES (${crypto.randomUUID()}, ${id}, ${assignment.subject_id}, ${year})
        ON CONFLICT (student_id, subject_id) DO NOTHING
      `;
      allottedSubjects += 1;
    }

    created += 1;
  }

  console.log(`Created ${created} random students.`);
  console.log(`Used years: ${yearNames.join(", ")}`);
  console.log(`Created ${allottedSubjects} student-subject allotments from teacher assignments.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 }).catch(() => {});
}

function readEnvFile() {
  if (!fs.existsSync(".env")) return {};

  return Object.fromEntries(
    fs.readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        const value = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
        return [key.trim(), value];
      }),
  );
}

function nextStudentId(existingIds) {
  let studentId = "";
  do {
    studentId = `RND-${randomInt(100000, 999999)}`;
  } while (existingIds.has(studentId));
  existingIds.add(studentId);
  return studentId;
}

function randomStudentName() {
  return `${pick(firstNames)} ${pick(lastNames)}`;
}

function pick(items) {
  return items[randomInt(0, items.length - 1)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
