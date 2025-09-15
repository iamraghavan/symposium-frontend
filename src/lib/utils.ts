import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { LoggedInUser } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isAdmin(user: LoggedInUser | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'department_admin';
}
