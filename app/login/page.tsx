import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
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

  return <AuthForm mode="login" nextPath={nextPath} />;
}
