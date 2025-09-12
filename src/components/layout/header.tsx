
"use client";

import Link from "next/link";
import { AppWindow, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="mr-6 flex">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <AppWindow className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg">Symposium Central</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex flex-1 items-center gap-4 text-sm">
           <Button variant="ghost" asChild>
              <Link href="/events">Explore Events</Link>
           </Button>
            <Button variant="ghost" asChild>
              <Link href="/#about-event">About</Link>
           </Button>
            <Button variant="ghost" asChild>
              <Link href="/code-of-conduct">Code of Conduct</Link>
           </Button>
        </nav>

        <div className="flex items-center justify-end space-x-2 ml-auto">
           <Button variant="outline" asChild>
             <Link href="/auth/login">Log in</Link>
           </Button>
           <Button asChild>
             <Link href="/auth/signup">Sign up</Link>
           </Button>
        </div>
      </div>
    </header>
  );
}
