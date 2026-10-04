import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_CREDENTIALS,
  createSessionValue,
  SESSION_COOKIE_NAME,
  type SessionUser,
  type UserRole,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = String(body.role || "").toLowerCase();
    const username = String(body.username || "").trim();
    const pin = String(body.pin || "").trim();

    if (!role || !username || !pin) {
      return NextResponse.json(
        { success: false, message: "Username, PIN, and role are required." },
        { status: 400 },
      );
    }

    if (!Object.prototype.hasOwnProperty.call(AUTH_CREDENTIALS, role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role selected." },
        { status: 400 },
      );
    }

    const selectedRole = role as UserRole;
    const credential = AUTH_CREDENTIALS[selectedRole];

    if (credential.username !== username || credential.pin !== pin) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials for the selected role." },
        { status: 401 },
      );
    }

    const user: SessionUser = {
      username: credential.username,
      name: credential.name,
      role: selectedRole,
    };

    const response = NextResponse.json({ success: true, user });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionValue(user),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to process login request." },
      { status: 500 },
    );
  }
}
