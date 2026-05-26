import { NextRequest, NextResponse } from "next/server";
import { mutateSchoolData } from "@/lib/supabase-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = {
      studentId: String(body.studentId ?? ""),
      name: String(body.name ?? ""),
      year: String(body.year ?? ""),
    };

    if (!payload.studentId || !payload.name || !payload.year) {
      return NextResponse.json(
        { error: "studentId, name, and year are required" },
        { status: 400 },
      );
    }

    const data = await mutateSchoolData("create-student", payload, { id: "public-api", role: "admin" });
    const student = data.students.find((item) => item.studentId === payload.studentId);
    const allottedSubjects = student
      ? data.studentSubjects
          .filter((item) => item.studentId === student.id)
          .map((item) => {
            const subject = data.subjects.find((subjectItem) => subjectItem.id === item.subjectId);
            return {
              id: item.id,
              subjectId: item.subjectId,
              subjectName: subject?.name ?? "Subject",
              year: item.year,
            };
          })
      : [];

    return NextResponse.json({ student, allottedSubjects }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to create student",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
