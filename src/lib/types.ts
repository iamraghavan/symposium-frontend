

export type Department = {
  _id: string;
  id: string; // short id or uuid
  code: string;
  name: string;
  shortcode: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type User = {
  _id: string;
  id: string;
  name: string;
  email: string;
  college?: string;
  registeredAt?: string;
  avatarUrl?: string;
  picture?: string;
  departmentId?: string;
  role?: 'super_admin' | 'department_admin' | 'user';
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
    method: 'none' | 'gateway' | 'qr';
    gatewayProvider?: 'razorpay' | 'stripe';
    price: number;
    currency: string;
    qrImageUrl?: string;
    qrInstructions?: string;
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
  imageHint?: string; 
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
  department?: Department | string; 
  picture?: string;
  provider?: string;
  hasPaidSymposium?: boolean;
  [key: string]: any; 
};

export type Registration = {
  _id: string;
  event: Event | string;
  user: User | string;
  type: 'individual' | 'team';
  team?: {
    name: string;
    size: number;
    members: { name: string; email: string; }[];
  };
  status: 'pending' | 'confirmed' | 'cancelled';
  payment: {
    method: 'none' | 'gateway';
    currency: string;
    amount: number;
    status: 'paid' | 'pending';
  };
  notes?: string;
  eventName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
    _id: string;
    user: User | string;
    registration: string | null;
    kind: 'symposium' | 'event';
    memberEmails: string[];
    amount: number;
    currency: string;
    orderId: string;
    paymentId: string;
    status: 'paid' | 'pending' | 'failed';
    createdAt: string;
    updatedAt: string;
    raw?: object;
};

export type ApiSuccessResponse<T> = {
  success: true;
  token?: string;
  user?: LoggedInUser;
  apiKey?: string;
  data?: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  registration?: T;
  payment?: any; // Generic payment object for various responses
  entries?: any; // For status checks
};


export type ApiErrorResponse = {
  success: false;
  message: string;
  details?: { field: string; msg: string }[];
  isNewUser?: boolean;
  profile?: {
    googleId: string;
    name: string;
    email: string;
    picture?: string;
  },
  payment?: {
      neededFor: string[];
      feeInInr: number;
  }
};
    
