import postgres from "postgres";

const databaseUrl = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("SUPABASE_DATABASE_URL or DATABASE_URL is required.");
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
});

try {
  const duplicates = await sql`
    SELECT year, subject_id, COUNT(*)::int AS count
    FROM teacher_subjects
    GROUP BY year, subject_id
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length) {
    console.error("Cannot add year + subject unique constraint because duplicates exist:");
    console.table(duplicates);
    process.exit(1);
  }

  await sql`
    ALTER TABLE teacher_subjects
    DROP CONSTRAINT IF EXISTS teacher_subjects_teacher_id_subject_id_key
  `;

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'teacher_subjects_year_subject_id_key'
      ) THEN
        ALTER TABLE teacher_subjects
          ADD CONSTRAINT teacher_subjects_year_subject_id_key UNIQUE (year, subject_id);
      END IF;
    END $$;
  `;

  console.log("Teacher subject constraint fixed: unique rule is now year + subject.");
} finally {
  await sql.end();
}
