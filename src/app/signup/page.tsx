"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chrome } from "lucide-react";

export default function SignupPage() {
  
  const handleGoogleSignup = () => {
    // Placeholder for Google Sign-up logic
    alert("Redirecting to Google for sign-up...");
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            Join the symposium community. It's fast and easy.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button variant="outline" className="w-full" onClick={handleGoogleSignup}>
            <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8S111.8 11.6 244 11.6C303.4 11.6 355.8 33.4 394.8 68.4l-64.3 62.1C308.2 110.1 278.3 97.4 244 97.4c-83.8 0-152.3 68.5-152.3 152.9s68.5 152.9 152.3 152.9c98.2 0 130.3-71.1 133.5-108.7H244V261.8h244z"
                ></path>
              </svg>
            Sign up with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
