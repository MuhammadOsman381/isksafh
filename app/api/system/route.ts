import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getSchoolData, mutateSchoolData } from "@/lib/supabase-db";
import type { Role } from "@/lib/demo-data";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "local-school-secret");

export async function GET() {
  try {
    const data = await getSchoolData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load school data",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionUser = await getSessionUser(request);
    if (!canRunAction(String(body.action ?? ""), sessionUser?.role ?? null)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const data = await mutateSchoolData(body.action, body.payload ?? {}, sessionUser);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to update school data",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function canRunAction(action: string, role: Role | null) {
  const adminOnly = new Set([
    "create-user",
    "update-user",
    "delete-user",
    "create-year",
    "create-subject",
    "delete-subject",
    "create-student",
    "update-student",
    "delete-student",
    "assign-student-subject",
    "update-student-subject",
    "delete-student-subject",
    "assign-subject",
    "update-teacher-assignment",
    "delete-teacher-assignment",
  ]);

  if (adminOnly.has(action)) return role === "admin";
  if (action === "create-report") return role === "admin" || role === "teacher";
  if (action === "create-attendance") return role === "admin" || role === "attendent";
  return role !== null;
}

async function getSessionUser(request: NextRequest) {
  const token = request.cookies.get("school_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub !== "string") return null;
    if (payload.role !== "admin" && payload.role !== "teacher" && payload.role !== "attendent") {
      return null;
    }
    return { id: payload.sub, role: payload.role as Role };
  } catch {
    return null;
  }
}
