import Link from "next/link";
import { AppWindow } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <AppWindow className="h-6 w-6 text-primary" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by Vibe Coder. The source code is available on GitHub.
          </p>
        </div>
        <div className="flex items-center gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin Login</Link>
        </div>
      </div>
    </footer>
  );
}
