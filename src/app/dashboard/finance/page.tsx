import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Banknote } from "lucide-react";

export default function FinancePage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-[calc(100vh-10rem)]">
      <div className="flex flex-col items-center gap-4 text-center">
        <Banknote className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-2xl font-bold tracking-tight font-headline">
          Financial Overview
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          This section is under construction. Soon you will be able to view detailed financial summaries, track revenue from registration fees, and manage prize money distribution.
        </p>
      </div>
    </div>
  );
}
