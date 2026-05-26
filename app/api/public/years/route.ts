import { NextResponse } from "next/server";
import { getSchoolData } from "@/lib/supabase-db";

export async function GET() {
  try {
    const data = await getSchoolData();
    return NextResponse.json({ years: data.years });
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
