"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({
  className,
  children
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={pending}
      className={className}
    >
      {pending ? "Logging out..." : children ?? "Log out"}
    </button>
  );
}
