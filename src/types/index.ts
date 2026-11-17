export type ItemCategory =
  | 'Electronics'
  | 'Academic Equipment'
  | 'Books and Notes'
  | 'Lab Equipment'
  | 'Stationery'
  | 'Other';

export type ItemCondition = 'Brand New' | 'Like New' | 'Good' | 'Fair';

export type PricingMethod = 'free' | 'hourly' | 'period' | 'daily' | 'weekly' | 'sale';

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'borrowed'
  | 'return_requested'
  | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  department: string;
  phone?: string;
  createdAt: string;
  isVerifiedCollegeEmail?: boolean;
  emailVerified?: boolean;
}

export interface ReservedSlot {
  requestId: string;
  startIso: string;
  endIso: string;
}

export interface UserPublicProfile {
  id: string;
  name: string;
  college: string;
  department: string;
  emailDomain: string;
  isVerifiedCollegeEmail?: boolean;
  memberSince?: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerCollege: string;
  ownerDepartment: string;
  title: string;
  category: ItemCategory;
  description: string;
  condition: ItemCondition;
  imageUrl: string;
  campusLocation: string;
  availabilityHours: string;
  pricingMethod: PricingMethod;
  price: number; // in INR (₹), 0 for free
  allowedDurations: string[]; // e.g. ["1 hour", "2 hours", "3 hours", "1 period", "2 periods", "3 periods", "1 day", "2 days", "1 week"]
  usageInstructions?: string;
  quantity: number;
  isAvailable: boolean;
  isDemo?: boolean;
  reservedSlots?: ReservedSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface BorrowRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  listingCategory: ItemCategory;
  listingImageUrl: string;
  listingLocation: string;
  ownerId: string;
  ownerName: string;
  ownerCollege: string;
  borrowerId: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerCollege: string;
  borrowerDepartment: string;
  borrowerPhone?: string;
  
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:mm
  durationKey: string; // e.g., "2 hours", "3 periods", "1 day"
  durationHours: number; // in hours equivalent for calculation/overlaps
  returnDate: string;
  returnTime: string;
  
  pricingMethod: PricingMethod;
  rate: number;
  estimatedCost: number;
  note?: string;
  
  status: RequestStatus;
  rejectionReason?: string;
  isDemoRequest?: boolean;
  
  // Phone privacy sharing flags
  phoneSharedWithBorrower: boolean;
  phoneDecisionMade: boolean;
  ownerPhoneIfShared?: string; // only populated server-side if authorized!
  ownerPhoneDecision?: 'shared' | 'private' | 'not_set';

  // Timestamps of state transitions
  createdAt: string;
  acceptedAt?: string;
  borrowedAt?: string;
  returnRequestedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
}

export interface AppSettings {
  collegePeriodMinutes: number; // default 50
  defaultCollegeName: string;
}
