import { NextRequest, NextResponse } from "next/server";
import { createStudentWithAssignedSubjects } from "@/lib/supabase-db";

export const dynamic = "force-dynamic";

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

    const { student, allottedSubjects } = await createStudentWithAssignedSubjects(payload);

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
