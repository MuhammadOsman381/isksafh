import { SignJWT } from "jose";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, getUserById } from "@/lib/neon";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "local-school-secret");

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
    const user = await getUserById(payload.sub);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");

  const user = await authenticateUser(email, password);
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
