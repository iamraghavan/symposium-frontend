
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Trash, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Department, LoggedInUser, ApiSuccessResponse } from "@/lib/types";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";


export default function AdminDepartmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isNewDepartmentDialogOpen, setIsNewDepartmentDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
        const parsedUser = JSON.parse(userData) as LoggedInUser;
        if (parsedUser.role !== 'super_admin') {
            router.push('/u/s/portal/dashboard');
        } else {
            setUser(parsedUser);
            fetchDepartments();
        }
    } else {
        router.push('/c/auth/login?login=s_admin');
    }
  }, [router]);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
        const response = await api<ApiSuccessResponse<{ departments: Department[] }>>('/departments', { authenticated: true });
        if (response.success && response.data) {
            setDepartments(response.data.departments);
        }
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch departments.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handleCreateDepartment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newDepartmentData = {
        id: formData.get("id") as string,
        name: formData.get("name") as string,
        headName: formData.get("headName") as string,
        headEmail: formData.get("headEmail") as string,
    }

    try {
      await api('/departments', { method: 'POST', body: newDepartmentData, authenticated: true });
      setIsNewDepartmentDialogOpen(false);
      await fetchDepartments();
       toast({
        title: "Success",
        description: "Department created successfully.",
      });
    } catch(error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: (error as Error).message,
        });
    }
  };
  
  const handleUpdateDepartment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingDepartment) return;
    
    const formData = new FormData(event.currentTarget);
     const updatedDepartmentData = {
        name: formData.get("name") as string,
        headName: formData.get("headName") as string,
        headEmail: formData.get("headEmail") as string,
    }
    try {
        await api(`/departments/${editingDepartment._id}`, { method: 'PUT', body: updatedDepartmentData, authenticated: true });
        setEditingDepartment(null);
        await fetchDepartments();
        toast({
            title: "Success",
            description: "Department updated successfully.",
        });
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: (error as Error).message,
        });
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    try {
        await api(`/departments/${departmentId}`, { method: 'DELETE', authenticated: true });
        await fetchDepartments();
         toast({
            title: "Success",
            description: "Department deleted successfully.",
        });
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: (error as Error).message,
        });
    }
  };

  if (!user || user.role !== 'super_admin') {
    return null; // or a loading spinner while redirecting
  }


  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            Departments
          </h2>
          <p className="text-muted-foreground">
            Manage your college's departments and their heads.
          </p>
        </div>
         <Dialog open={isNewDepartmentDialogOpen} onOpenChange={setIsNewDepartmentDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Fill in the details for the new department.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDepartment}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Department Name
                  </Label>
                  <Input id="name" name="name" className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="id" className="text-right">
                    Department ID
                  </Label>
                  <Input id="id" name="id" placeholder="e.g. cse, ece" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="headName" className="text-right">
                    Head's Name
                  </Label>
                  <Input id="headName" name="headName" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="headEmail" className="text-right">
                    Head's Email
                  </Label>
                  <Input id="headEmail" name="headEmail" type="email" className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department Name</TableHead>
                <TableHead>Department Head</TableHead>
                <TableHead>Head's Email</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Loading...
                    </TableCell>
                </TableRow>
              ) : departments.map((dept) => (
                <TableRow key={dept._id}>
                  <TableCell className="font-medium">
                    <Badge variant="secondary">{dept.name}</Badge>
                  </TableCell>
                  <TableCell>{dept.head?.name || "N/A"}</TableCell>
                  <TableCell className="text-muted-foreground">{dept.head?.email || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => setEditingDepartment(dept)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                           </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                 <Trash className="mr-2 h-4 w-4" />
                                 <span>Delete</span>
                               </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the 
                                  <span className="font-semibold"> {dept.name} </span> 
                                  department and all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteDepartment(dept._id)}>
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit Department Dialog */}
      <Dialog open={!!editingDepartment} onOpenChange={() => setEditingDepartment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>
                Update the details for the department.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateDepartment}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Department Name
                  </Label>
                  <Input id="edit-name" name="name" className="col-span-3" defaultValue={editingDepartment?.name} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-headName" className="text-right">
                    Head's Name
                  </Label>
                  <Input id="edit-headName" name="headName" className="col-span-3" defaultValue={editingDepartment?.head?.name} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-headEmail" className="text-right">
                    Head's Email
                  </Label>
                  <Input id="edit-headEmail" name="headEmail" type="email" className="col-span-3" defaultValue={editingDepartment?.head?.email} required />
                </div>
              </div>
              <DialogFooter>
                 <Button variant="outline" type="button" onClick={() => setEditingDepartment(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
    </>
  );
}
