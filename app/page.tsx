import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionFromCookie } from "@/lib/auth";

export default async function HomePage() {
  const session = getSessionFromCookie(await cookies());

  if (session) {
    redirect("/dashboard");
  }

  redirect("/login");
}
