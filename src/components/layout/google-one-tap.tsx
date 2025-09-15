
"use client";

import { useGoogleOneTapLogin, CredentialResponse } from "@react-oauth/google";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import type { LoggedInUser } from "@/lib/types";


export function GoogleOneTap() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [user, setUser] = useState<LoggedInUser | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [pathname]);

  const completeLogin = useCallback((token: string, user: LoggedInUser) => {
    localStorage.setItem('jwt', token);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    setUser(user);
    toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
    });

    if (user.role === 'super_admin' || user.role === 'department_admin') {
        router.push('/u/s/portal/dashboard');
    } else {
        // Refresh page to update header state
        router.refresh();
    }
  }, [toast, router]);

  const handleGoogleAuth = useCallback(async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not retrieve Google credential.",
        });
        return;
    }

    try {
        const response: any = await api('/auth/google', {
            method: 'POST',
            body: { idToken: credentialResponse.credential },
        });

        if (response.success && response.token && response.user) {
            completeLogin(response.token, response.user);
        } else {
             if (response.isNewUser && response.profile) {
                // One-tap should ideally not be for new users, but we handle it.
                // We redirect them to signup to complete their profile.
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
    }
  }, [completeLogin, toast, router]);

  useGoogleOneTapLogin({
    onSuccess: handleGoogleAuth,
    onError: () => {
      console.error('One Tap login failed');
    },
    disabled: !!user, // Disable if user is already logged in
  });

  return null;
}
