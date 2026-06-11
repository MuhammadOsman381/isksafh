ALTER TABLE "teacher_subjects" DROP CONSTRAINT IF EXISTS "teacher_subjects_teacher_id_subject_id_key";
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'teacher_subjects_year_subject_id_key'
  ) THEN
    ALTER TABLE "teacher_subjects"
      ADD CONSTRAINT "teacher_subjects_year_subject_id_key" UNIQUE ("year", "subject_id");
  END IF;
END $$;
