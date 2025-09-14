
export type Department = {
  _id: string;
  id: string;
  name: string;
  head?: {
    name: string;
    email: string;
  };
};

export type User = {
  _id: string;
  id: string;
  name: string;
  email: string;
  college: string;
  registeredAt: string;
  avatarUrl: string;
};

export type Event = {
  id: string;
  name:string;
  description: string;
  date: string;
  department: Department;
  participants: User[];
  imageUrl: string;
  imageHint: string;
  registrationFee: number;
  mode: 'online' | 'offline';
  category: 'technical' | 'non-technical';
};

export type Winner = {
  id: string;
  eventId: string;
  position: number;
  user: User;
  prizeAmount: number;
};

export type Financials = {
  totalRevenue: number;
  totalPrizes: number;
  netIncome: number;
}

export type LoggedInUser = {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'department_admin' | 'user';
  departmentId?: string; // Department ID
  picture?: string;
};

export type ApiSuccessResponse<T> = {
    success: true;
    token?: string;
    user?: LoggedInUser;
    data?: T;
};

export type ApiErrorResponse = {
    success: false;
    message: string;
    details?: { field: string; msg: string }[];
};
