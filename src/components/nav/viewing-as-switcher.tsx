"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setViewingAsAction } from "@/lib/actions/viewing-as";

type Member = { id: string; name: string };

type Props = {
  members: Member[];
  realMemberId: string;
  viewingAsMemberId: string;
};

export function ViewingAsSwitcher({ members, realMemberId, viewingAsMemberId }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">Viewing as</p>
      <Select
        value={viewingAsMemberId}
        disabled={pending}
        onValueChange={(value) =>
          startTransition(async () => {
            try {
              await setViewingAsAction(value);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to switch view");
            }
          })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.id === realMemberId ? "Me" : m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
