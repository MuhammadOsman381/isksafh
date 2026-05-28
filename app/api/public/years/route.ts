import { NextResponse } from "next/server";
import { getAcademicYearNames } from "@/lib/supabase-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const years = await getAcademicYearNames();
    return NextResponse.json({ years });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load years",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
