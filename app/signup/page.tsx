import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage({
  searchParams
}: {
  searchParams?: {
    next?: string;
  };
}) {
  const user = await getCurrentUser();
  const nextPath = searchParams?.next || "/";

  if (user) {
    redirect(nextPath);
  }

  return <AuthForm mode="signup" nextPath={nextPath} />;
}
