import { NextResponse } from "next/server";
import { createSession, createUser, getCookieConfig } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    const displayName = body.displayName?.trim() ?? "";

    if (!email) {
      return NextResponse.json({ error: "Please enter an email." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Please use at least 8 characters for the password." },
        { status: 400 }
      );
    }

    const user = await createUser({ email, password, displayName });
    const sessionToken = createSession(user.id);
    const response = NextResponse.json({ user });
    response.cookies.set(getCookieConfig(sessionToken));
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "We couldn't create your account right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
