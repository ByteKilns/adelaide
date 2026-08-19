import { ChevronDown, Search, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Search, date range, and the three dropdown filters are visual
// placeholders — filtering logic isn't wired up yet. Kept disabled rather
// than silently doing nothing on interaction.
export function ExpenseFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-8" disabled placeholder="Search expenses..." />
      </div>
      {["Date range", "Category", "Owner", "Paid by"].map((label) => (
        <Button className="text-muted-foreground" disabled key={label} type="button" variant="outline">
          {label}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      ))}
      <Button className="text-muted-foreground" disabled type="button" variant="ghost">
        Clear filters
      </Button>
      <Button className="ml-auto text-muted-foreground" disabled type="button" variant="outline">
        <Upload className="h-4 w-4" />
        Export
      </Button>
    </div>
  );
}
