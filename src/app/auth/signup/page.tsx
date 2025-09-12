
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GoogleIcon from '@mui/icons-material/Google';

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
             <GoogleIcon className="mr-2 h-4 w-4" />
            Sign up with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
