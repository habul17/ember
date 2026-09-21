import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toDayKey, toLocalDayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const courses = await prisma.course.findMany({
    where: { userId: session.user.id },
    orderBy: { position: "asc" },
    include: {
      items: { orderBy: [{ scheduledOn: "asc" }, { position: "asc" }] },
    },
  });

  return (
    <AppShell
      serverToday={toLocalDayKey(new Date())}
      userName={session.user.name ?? "there"}
      userImage={session.user.image ?? null}
      courses={courses.map((course) => ({
        id: course.id,
        name: course.name,
        items: course.items.map((item) => ({
          id: item.id,
          title: item.title,
          day: toDayKey(item.scheduledOn),
          completedAt: item.completedAt?.toISOString() ?? null,
        })),
      }))}
    />
  );
}
