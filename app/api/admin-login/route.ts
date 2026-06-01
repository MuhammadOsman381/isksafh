import { NextRequest, NextResponse } from "next/server";
import { getPrimaryAdminLoginDetails, updatePrimaryAdminLoginDetails } from "@/lib/supabase-db";

const accessKey = process.env.SUPER_ADMIN_ACCESS_KEY ?? "superadmin123";

export const dynamic = "force-dynamic";

function isAllowed(request: NextRequest) {
  return request.headers.get("x-super-admin-key") === accessKey;
}

export async function GET(request: NextRequest) {
  if (!isAllowed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = await getPrimaryAdminLoginDetails();
    if (!admin) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    return NextResponse.json({ admin });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load admin login",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const admin = await updatePrimaryAdminLoginDetails(body);
    return NextResponse.json({ ok: true, admin });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to update admin login",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
