import { getCurrentUser } from "@/lib/auth";
import { HomePage } from "@/components/home-page";

export default async function LandingPage() {
  const currentUser = await getCurrentUser();
  return <HomePage currentUser={currentUser} />;
}
