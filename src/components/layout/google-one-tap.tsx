
"use client";

import { useGoogleOneTapLogin, CredentialResponse } from "@react-oauth/google";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import type { LoggedInUser } from "@/lib/types";
import { isAdmin } from "@/lib/utils";

function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

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

  const completeLogin = useCallback((apiKey: string, user: LoggedInUser) => {
    localStorage.setItem('userApiKey', apiKey);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    setCookie('apiKey', apiKey, 7); // Set cookie for server-side actions
    setUser(user);
    toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
    });

    if (isAdmin(user)) {
        window.location.href = '/u/s/portal/dashboard';
    } else {
        window.location.href = '/u/d/dashboard';
    }
  }, [toast]);

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

        if (response.success && response.apiKey && response.user) {
            completeLogin(response.apiKey, response.user);
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
