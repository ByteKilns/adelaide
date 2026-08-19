import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  containerClassName?: string;
  error?: string;
  label: string;
  labelClassName?: string;
} & Omit<React.ComponentProps<typeof Input>, "id"> & { id?: string };

// Every form in this app was hand-rolling <div><Label/><Input/></div> —
// this is the one place that pairing lives now.
export function TextField({ className, containerClassName, error, id, label, labelClassName, ...props }: Props) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className={cn("space-y-1", containerClassName)}>
      <Label className={labelClassName} htmlFor={fieldId}>
        {label}
      </Label>
      <Input aria-invalid={Boolean(error)} className={className} id={fieldId} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
