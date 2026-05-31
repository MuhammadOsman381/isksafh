import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { importStudentsForYear } from "@/lib/supabase-db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "local-school-secret");

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser(request);
  if (sessionUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const year = String(formData.get("year") ?? "").trim();
    const file = formData.get("file");

    if (!year) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Excel file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json({ error: "Excel file has no sheets" }, { status: 400 });
    }

    const sheet = workbook.Sheets[firstSheetName];
    const table = XLSX.utils.sheet_to_json<Array<string | number | null>>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });
    const rows = extractStudentRows(table);
    const result = await importStudentsForYear(year, rows);

    return NextResponse.json({
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      sheet: firstSheetName,
      data: result.data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to import students",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function extractStudentRows(table: Array<Array<string | number | null>>) {
  const headerIndex = table.findIndex((row) => {
    const normalized = row.map((cell) => normalizeHeader(cell));
    return hasStudentIdHeader(normalized) && normalized.includes("name");
  });

  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  const headers = headerIndex >= 0 ? table[headerIndex].map((cell) => normalizeHeader(cell)) : [];
  const studentIdIndex = headerIndex >= 0 ? headers.findIndex((header) => isStudentIdHeader(header)) : 1;
  const nameIndex = headerIndex >= 0 ? headers.findIndex((header) => header === "name") : 2;

  if (studentIdIndex < 0 || nameIndex < 0) {
    throw new Error("First sheet must contain Student# and Name columns");
  }

  return table.slice(startIndex).map((row) => ({
    studentId: String(row[studentIdIndex] ?? "").trim(),
    name: String(row[nameIndex] ?? "").trim(),
  })).filter((row) => row.studentId && row.name);
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[#_.-]/g, "");
}

function hasStudentIdHeader(headers: string[]) {
  return headers.some((header) => isStudentIdHeader(header));
}

function isStudentIdHeader(header: string) {
  return ["student", "studentid", "studentno", "stdid", "std"].includes(header);
}

async function getSessionUser(request: NextRequest) {
  const token = request.cookies.get("school_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub !== "string") return null;
    if (payload.role !== "admin" && payload.role !== "teacher" && payload.role !== "attendent") return null;
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
