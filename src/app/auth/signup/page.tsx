
"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from 'react';
import { Combobox } from '@/components/ui/combobox';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import type { ApiSuccessResponse, LoggedInUser, Department } from '@/lib/types';
import { useGoogleLogin } from '@react-oauth/google';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
...
    </svg>
);


type College = {
    university: string;
    college: string;
    college_type: string;
    state: string;
    district: string;
};

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [googleId, setGoogleId] = useState<string | null>(null);
  const [googleProfilePicture, setGoogleProfilePicture] = useState<string | null>(null);

  const [collegeValue, setCollegeValue] = useState("");
  const [departmentValue, setDepartmentValue] = useState("");
  
  const [colleges, setColleges] = useState<{ value: string; label: string }[]>([]);
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  
  useEffect(() => {
    const googleProfile = sessionStorage.getItem('google_signup_profile');
    if (googleProfile) {
        const profile = JSON.parse(googleProfile);
        setName(profile.name || '');
        setEmail(profile.email || '');
        setGoogleId(profile.googleId || null);
        setGoogleProfilePicture(profile.picture || null);
        sessionStorage.removeItem('google_signup_profile');
    } else {
        // If no google profile, redirect to home to initiate login
        router.push('/');
    }

    async function fetchColleges() {
      try {
        const response = await fetch('https://raw.githubusercontent.com/VarthanV/Indian-Colleges-List/master/colleges.json');
        const data: College[] = await response.json();
        const formattedColleges = data.map(c => ({
            value: c.college.toLowerCase(),
            label: c.college,
        }));
        setColleges(formattedColleges);
      } catch (error) {
        console.error("Failed to fetch colleges:", error);
         toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load college list.",
        });
      } finally {
        setLoadingColleges(false);
      }
    }
    
    async function fetchDepartments() {
        try {
            const response = await api<ApiSuccessResponse<{ departments: Department[] }>>('/departments');
            if(response.success && response.data) {
                const formattedDepartments = response.data.departments.map(d => ({
                    value: d._id,
                    label: d.name,
                }));
                setDepartments(formattedDepartments);
            }
        } catch (error) {
            console.error("Failed to fetch departments:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load department list.",
            });
        } finally {
            setLoadingDepartments(false);
        }
    }

    fetchColleges();
    fetchDepartments();
  }, [toast, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCollege = colleges.find(c => c.value === collegeValue);
    if (!selectedCollege) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please select a valid college from the list.",
        });
        return;
    }
    if (!departmentValue) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please select your department.",
        });
        return;
    }

    try {
        const registrationData: any = {
            name,
            email,
            college: selectedCollege.label,
            department: departmentValue,
            googleId: googleId,
            picture: googleProfilePicture
        };
        
        const response = await api<ApiSuccessResponse<{ user: LoggedInUser, apiKey: string }>>('/auth/register', {
            method: 'POST',
            body: registrationData
        });

        if (response.success && response.apiKey && response.user) {
            localStorage.setItem('userApiKey', response.apiKey);
            localStorage.setItem('loggedInUser', JSON.stringify(response.user));
            toast({
                title: "Registration Successful",
                description: `Welcome, ${response.user.name}!`,
            });
            window.location.href = '/u/d/dashboard';
        } else {
            throw new Error((response as any).message || "Registration failed.");
        }

    } catch (error) {
        let errorMessage = "Could not create your account. Please try again.";
        try {
            const parsedError = JSON.parse((error as Error).message);
            errorMessage = parsedError.message || errorMessage;
        } catch (e) {
            errorMessage = (error as Error).message;
        }
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: errorMessage,
        });
    }
  };

  if (!googleId) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <p>Loading...</p>
          </div>
      )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-14rem)] py-12">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleRegister}>
            <CardHeader>
            <CardTitle className="text-2xl font-headline">Complete Your Profile</CardTitle>
            <CardDescription>
                Welcome! Just a few more details to get you started.
            </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="John Doe" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="mail@example.com"
                required
                value={email} 
                onChange={e => setEmail(e.target.value)}
                disabled // Disable email editing as it comes from Google
                />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Combobox 
                    items={departments}
                    value={departmentValue}
                    onChange={setDepartmentValue}
                    placeholder={loadingDepartments ? "Loading departments..." : "Select department..."}
                    searchPlaceholder="Search departments..."
                    noResultsMessage="No department found."
                    disabled={loadingDepartments}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="college">College</Label>
                <Combobox 
                    items={colleges}
                    value={collegeValue}
                    onChange={setCollegeValue}
                    placeholder={loadingColleges ? "Loading colleges..." : "Select college..."}
                    searchPlaceholder="Search colleges..."
                    noResultsMessage="No college found."
                    disabled={loadingColleges}
                />
            </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">Complete Registration</Button>
           
            <div className="mt-4 text-center text-sm">
                Wrong account?{" "}
                <Link href="/" className="underline">
                Go back
                </Link>
            </div>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
