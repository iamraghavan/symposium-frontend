
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppWindow } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
      <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
             <AppWindow className="mx-auto h-10 w-10 text-primary mb-2" />
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>
              To continue, please sign in. If you have a Google account, the One-Tap sign-in will appear automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              If you don&apos;t have an account, signing in with Google for the first time will guide you through the registration process.
            </p>
             <div className="mt-6 text-center text-sm">
                <Link href="/" className="underline">
                Return to Homepage
                </Link>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
