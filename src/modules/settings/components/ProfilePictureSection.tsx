"use client";

import { useRef, useState, useTransition } from "react";

import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfileImageAction } from "@/modules/settings/api/settings.actions";

const TARGET_SIZE = 160;

// Resizes/crops the picked file to a small square JPEG data URL entirely in
// the browser — no upload endpoint or blob storage needed for that.
function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = URL.createObjectURL(file);
  });
}

type Props = { initialImage: null | string; name: string };

export function ProfilePictureSection({ initialImage, name }: Props) {
  const [image, setImage] = useState(initialImage);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const dataUrl = await resizeToDataUrl(file);
      setImage(dataUrl);
      startTransition(async () => {
        try {
          await updateProfileImageAction(dataUrl);
          toast.success("Profile picture updated");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to save profile picture");
        }
      });
    } catch {
      toast.error("Could not process that image");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Profile picture</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="size-16" size="lg">
          {image && <AvatarImage alt={name} src={image} />}
          <AvatarFallback className="bg-primary/10 text-lg text-primary">
            {name.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        <div>
          <Button disabled={pending} onClick={() => inputRef.current?.click()} type="button" variant="outline">
            <Upload className="h-4 w-4" />
            {pending ? "Uploading..." : "Change picture"}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">JPG or PNG, square images look best.</p>
        </div>

        <input accept="image/*" className="hidden" onChange={handleFileChange} ref={inputRef} type="file" />
      </CardContent>
    </Card>
  );
}
