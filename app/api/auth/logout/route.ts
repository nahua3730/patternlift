import { NextResponse } from "next/server";
import { clearCookieConfig, deleteSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (token) {
    deleteSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearCookieConfig());
  return response;
}
