
export type Department = {
  _id: string;
  id: string; // short id
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
  picture?: string;
  departmentId?: string;
};

export type Event = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  mode: 'online' | 'offline';
  online?: {
    provider: 'google_meet' | 'zoom' | 'other';
    url: string;
  };
  offline?: {
    venueName: string;
    address: string;
    mapLink?: string;
  };
  startAt: string;
  endAt: string;
  department: Department | string;
  createdBy: User | string;
  payment: {
    method: 'free' | 'gateway' | 'qr_code';
    gatewayProvider?: 'razorpay' | 'stripe';
    gatewayLink?: string;
    price: number;
    currency: string;
    qrImageUrl?: string;
    qrInstructions?: string;
    allowScreenshot?: boolean;
  };
  contacts: {
    name: string;
    phone?: string;
    email?: string;
  }[];
  departmentSite?: string;
  contactEmail?: string;
  status: 'draft' | 'published' | 'cancelled';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  imageHint?: string; // Kept for placeholder compatibility
  participants: User[]; // This might come from a separate endpoint
  registrationFee: number; // Kept for placeholder compatibility
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
};

export type LoggedInUser = {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'department_admin' | 'user';
  departmentId?: string;
  picture?: string;
};

export type ApiSuccessResponse<T> = {
  success: true;
  token?: string;
  user?: LoggedInUser;
  data?: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  details?: { field: string; msg: string }[];
};

    