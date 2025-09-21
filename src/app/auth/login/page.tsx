
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppWindow } from "lucide-react";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { GoogleOneTap, useGoogleAuth } from "@/components/layout/google-one-tap";
import { useCallback, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleAuth = useCallback(async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not retrieve Google credential.",
        });
        return;
    }
    setIsGoogleLoading(true);

    try {
        const response: any = await api('/auth/google', {
            method: 'POST',
            body: { idToken: credentialResponse.credential },
        });

        if (response.success && response.apiKey && response.user) {
            localStorage.setItem('userApiKey', response.apiKey);
            localStorage.setItem('loggedInUser', JSON.stringify(response.user));
            toast({
                title: "Login Successful",
                description: `Welcome back, ${response.user.name}!`,
            });
            window.location.reload();
        } else {
             if (response.isNewUser && response.profile) {
                sessionStorage.setItem('google_signup_profile', JSON.stringify(response.profile));
                router.push('/auth/signup');
             } else {
                throw new Error(response.message || "Google login failed: Invalid response from server.");
             }
        }
    } catch (error: any) {
         try {
            const parsedError = JSON.parse(error.message);
             if (parsedError.isNewUser && parsedError.profile) {
                sessionStorage.setItem('google_signup_profile', JSON.stringify(parsedError.profile));
                router.push('/auth/signup');
                return;
            }
             toast({
                variant: "destructive",
                title: "Login Failed",
                description: parsedError.message || "An unknown error occurred.",
            });
        } catch(e) {
             toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.message || "An unknown error occurred.",
            });
        }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [toast, router]);


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
      <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
             <AppWindow className="mx-auto h-10 w-10 text-primary mb-2" />
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>
              Sign in with Google to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             <div className="flex justify-center">
                 <GoogleLogin
                    onSuccess={handleGoogleAuth}
                    onError={() => {
                        console.error('Login Failed');
                    }}
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
