import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import ScheduleModule from "@/components/schedule/ScheduleModule";

export default async function SchedulePage() {
  const session = getSessionFromCookie(await cookies());

  if (!session) {
    redirect("/login");
  }

  return <ScheduleModule />;
}
