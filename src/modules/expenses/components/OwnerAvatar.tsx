import { Users } from "lucide-react";

import { TONE_BADGE_CLASSES } from "@/components/ToneIcon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type MemberRole, memberTone } from "@/modules/expenses/lib/member-tone";

type Props = { name: string; role: MemberRole };

export function OwnerAvatar({ name, role }: Props) {
  return (
    <Avatar size="sm">
      <AvatarFallback className={role === "shared" ? "bg-muted text-muted-foreground" : TONE_BADGE_CLASSES[memberTone(role)]}>
        {role === "shared" ? <Users className="size-3.5" /> : name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
