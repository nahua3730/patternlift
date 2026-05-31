import { NextResponse } from "next/server";
import { authenticateUser, createSession, getCookieConfig } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter both email and password." },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);
    const sessionToken = createSession(user.id);
    const response = NextResponse.json({ user });
    response.cookies.set(getCookieConfig(sessionToken));
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "We couldn't log you in right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
