
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
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleAuth } from "@/components/layout/google-one-tap";


export default function LoginPage() {
  const { handleGoogleAuth, isGoogleLoading } = useGoogleAuth();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
      <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
             <AppWindow className="mx-auto h-10 w-10 text-primary mb-2" />
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>
              Sign in with Google to continue. The One-Tap prompt may appear for instant access.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             <div className="flex justify-center">
                 <GoogleLogin
                    onSuccess={handleGoogleAuth}
                    onError={() => {
                        console.error('Login Failed');
                    }}
                    useOneTap
                />
             </div>
            <p className="text-sm text-center text-muted-foreground px-4">
              If you don&apos;t have an account, signing in will guide you through registration.
            </p>
          </CardContent>
          <div className="p-6 pt-0 text-center text-sm">
              <Link href="/" className="underline">
              Return to Homepage
              </Link>
          </div>
      </Card>
    </div>
  );
}
