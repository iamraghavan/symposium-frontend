
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

export function formDataToObject(formData: FormData): Record<string, any> {
  const obj: Record<string, any> = {};

  formData.forEach((value, key) => {
    // This regex handles keys like 'contacts[0].name' and 'payment.price'
    const keys = key.match(/[^\[\].]+/g) || [];

    keys.reduce((acc, currentKey, index) => {
      const isLast = index === keys.length - 1;
      // Check if the next key is a number, which implies the current one is an array
      const isArray = !isLast && /^\d+$/.test(keys[index + 1]);

      if (isLast) {
        acc[currentKey] = value;
      } else {
        if (!acc[currentKey]) {
          acc[currentKey] = isArray ? [] : {};
        }
      }
      
      return acc[currentKey];
    }, obj);
  });

  return obj;
}
