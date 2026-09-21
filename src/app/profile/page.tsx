import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileView } from "@/components/profile-view";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toLocalDayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [user, courses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        image: true,
        createdAt: true,
        accounts: { select: { provider: true }, take: 1 },
      },
    }),
    prisma.course.findMany({
      where: { userId: session.user.id },
      orderBy: { position: "asc" },
      // Only the completion instants matter here; the heatmaps and streaks are
      // built entirely from when boxes were ticked, never the planned date.
      include: { items: { select: { completedAt: true } } },
    }),
  ]);

  return (
    <ProfileView
      serverToday={toLocalDayKey(new Date())}
      user={{
        name: user?.name ?? session.user.name ?? "there",
        email: user?.email ?? session.user.email ?? null,
        image: user?.image ?? session.user.image ?? null,
        provider: user?.accounts[0]?.provider ?? null,
        joined: (user?.createdAt ?? new Date()).toISOString(),
      }}
      courses={courses.map((course) => ({
        id: course.id,
        name: course.name,
        total: course.items.length,
        completedAt: course.items.flatMap((item) =>
          item.completedAt ? [item.completedAt.toISOString()] : [],
        ),
      }))}
    />
  );
}
