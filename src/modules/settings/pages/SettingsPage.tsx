import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { ACCENT_COLOR_COOKIE_NAME, isAccentColor } from "@/lib/accent-color-cookie";
import { logoutAction } from "@/lib/actions/auth";
import { getCurrentMember } from "@/lib/session";
import { PasswordSection } from "@/modules/settings/components/PasswordSection";
import { ProfilePictureSection } from "@/modules/settings/components/ProfilePictureSection";
import { ThemeSection } from "@/modules/settings/components/ThemeSection";

export async function SettingsPage() {
  const { userId } = await getCurrentMember();
  const [[user], cookieStore] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)),
    cookies(),
  ]);

  const accentCookie = cookieStore.get(ACCENT_COLOR_COOKIE_NAME)?.value ?? "";
  const accent = isAccentColor(accentCookie) ? accentCookie : "purple";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and appearance</p>
      </div>

      <ThemeSection initialAccent={accent} />
      <ProfilePictureSection initialImage={user?.image ?? null} name={user?.name ?? "?"} />
      <PasswordSection />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={logoutAction}>
            <Button type="submit" variant="destructive">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
