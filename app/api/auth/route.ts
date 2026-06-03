import { SignJWT } from "jose";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, getUserById } from "@/lib/supabase-db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "local-school-secret");

export const dynamic = "force-dynamic";

const AUTH_TIMEOUT_MS = 6_000;
const localAdmin = {
  id: "local-dev-admin",
  name: "Admin",
  email: "admin@gmail.com",
  password: "12345678",
  role: "admin" as const,
  status: "active" as const,
};

function withTimeout<T>(promise: Promise<T>, message: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      windowlessSetTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS);
    }),
  ]);
}

function windowlessSetTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms);
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("school_session")?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub !== "string") {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    if (process.env.NODE_ENV !== "production" && payload.sub === localAdmin.id) {
      return NextResponse.json({ user: localAdmin });
    }
    const user = await withTimeout(getUserById(payload.sub), "Auth database request timed out");
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      try {
        const { payload } = await jwtVerify(token, secret);
        if (payload.sub === localAdmin.id) return NextResponse.json({ user: localAdmin });
      } catch {
        return NextResponse.json({ user: null }, { status: 401 });
      }
    }
    if (error instanceof Error && error.message.includes("timed out")) {
      return NextResponse.json({ user: null, detail: error.message }, { status: 503 });
    }
    return NextResponse.json({ user: null }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");

  let user;
  try {
    user = await withTimeout(authenticateUser(email, password), "Auth database request timed out");
  } catch (error) {
    if (
      process.env.NODE_ENV !== "production" &&
      email.toLowerCase() === localAdmin.email &&
      password === localAdmin.password
    ) {
      user = localAdmin;
    } else {
    return NextResponse.json(
      {
        error: "Unable to login",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
    }
  }
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await new SignJWT({
    sub: user.id,
    role: user.role,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const response = NextResponse.json({ user });
  response.cookies.set("school_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("school_session");
  return response;
}
