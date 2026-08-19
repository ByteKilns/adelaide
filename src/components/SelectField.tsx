import { useId } from "react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectFieldOption = { label: string; value: string };

type Props = {
  containerClassName?: string;
  disabled?: boolean;
  id?: string;
  label: string;
  onValueChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  triggerClassName?: string;
  value: string;
};

// The Select-based counterpart to TextField — every form pairing a Label
// with a boxed Select was hand-rolling this same wrapper.
export function SelectField({
  containerClassName,
  disabled,
  id,
  label,
  onValueChange,
  options,
  placeholder,
  triggerClassName,
  value,
}: Props) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className={cn("space-y-1", containerClassName)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <Select disabled={disabled} onValueChange={onValueChange} value={value}>
        <SelectTrigger className={cn("w-full", triggerClassName)} id={fieldId}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
