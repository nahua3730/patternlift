import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { HomePage } from "@/components/home-page";

export default async function LandingPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect("/today");
  }
  return <HomePage currentUser={currentUser} />;
}
