import { NextResponse } from "next/server";
import { createDefaultAdminUser } from "@/lib/supabase-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await createDefaultAdminUser();
    return NextResponse.json({
      ok: true,
      created: result.created,
      user: result.user
        ? {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            password: result.user.password,
            role: result.user.role,
            status: result.user.status,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to create admin",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
