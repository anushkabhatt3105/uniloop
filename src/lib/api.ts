import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  getReadableErrorMessage,
  handleFirestoreError,
  OperationType,
  timestampToIso,
} from './firebase.js';
import { DEMO_SAMPLE_LISTINGS } from './demoData.js';
import { BorrowRequest, Listing, ReservedSlot, User } from '../types/index.js';

const DEMO_IMAGE_BY_ID = new Map(DEMO_SAMPLE_LISTINGS.map(item => [item.id, item.imageUrl]));
const FALLBACK_LISTING_IMAGE = '/images/listings/fallback.jpg';

function resolveListingImageUrl(id: string, rawUrl: unknown, isDemo?: boolean): string {
  const trimmed = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const demoLocal = DEMO_IMAGE_BY_ID.get(id);
  if (demoLocal && (!trimmed || (isDemo && !trimmed.startsWith('/images/listings/')))) {
    return demoLocal;
  }
  return trimmed || FALLBACK_LISTING_IMAGE;
}

function mapListingDoc(id: string, data: Record<string, any>): Listing {
  return {
    id,
    ownerId: data.ownerId,
    ownerName: data.ownerName,
    ownerCollege: data.ownerCollege,
    ownerDepartment: data.ownerDepartment,
    title: data.title,
    category: data.category,
    description: data.description,
    condition: data.condition,
    imageUrl: resolveListingImageUrl(id, data.imageUrl, Boolean(data.isDemo)),
    campusLocation: data.campusLocation,
    availabilityHours: data.availabilityHours,
    pricingMethod: data.pricingMethod,
    price: Number(data.price) || 0,
    allowedDurations: Array.isArray(data.allowedDurations) ? data.allowedDurations : [],
    usageInstructions: data.usageInstructions || undefined,
    quantity: Number(data.quantity) || 1,
    isAvailable: Boolean(data.isAvailable),
    isDemo: Boolean(data.isDemo),
    reservedSlots: Array.isArray(data.reservedSlots) ? data.reservedSlots : [],
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function mapRequestDoc(id: string, data: Record<string, any>): BorrowRequest {
  return {
    id,
    listingId: data.listingId,
    listingTitle: data.listingTitle,
    listingCategory: data.listingCategory,
    listingImageUrl: resolveListingImageUrl(data.listingId, data.listingImageUrl, Boolean(data.isDemoRequest)),
    listingLocation: data.listingLocation,
    ownerId: data.ownerId,
    ownerName: data.ownerName,
    ownerCollege: data.ownerCollege,
    borrowerId: data.borrowerId,
    borrowerName: data.borrowerName,
    borrowerEmail: data.borrowerEmail,
    borrowerCollege: data.borrowerCollege,
    borrowerDepartment: data.borrowerDepartment,
    pickupDate: data.pickupDate,
    pickupTime: data.pickupTime,
    durationKey: data.durationKey,
    durationHours: Number(data.durationHours) || 1,
    returnDate: data.returnDate,
    returnTime: data.returnTime,
    pricingMethod: data.pricingMethod,
    rate: Number(data.rate) || 0,
    estimatedCost: Number(data.estimatedCost) || 0,
    note: data.note || undefined,
    status: data.status,
    rejectionReason: data.rejectionReason || undefined,
    isDemoRequest: Boolean(data.isDemoRequest),
    phoneSharedWithBorrower: Boolean(data.phoneSharedWithBorrower),
    phoneDecisionMade: Boolean(data.phoneDecisionMade),
    ownerPhoneIfShared: data.ownerPhoneIfShared ? String(data.ownerPhoneIfShared) : undefined,
    ownerPhoneDecision: data.ownerPhoneDecision || 'not_set',
    createdAt: timestampToIso(data.createdAt),
    acceptedAt: data.acceptedAt ? timestampToIso(data.acceptedAt) : undefined,
    borrowedAt: data.borrowedAt ? timestampToIso(data.borrowedAt) : undefined,
    returnRequestedAt: data.returnRequestedAt ? timestampToIso(data.returnRequestedAt) : undefined,
    completedAt: data.completedAt ? timestampToIso(data.completedAt) : undefined,
    cancelledAt: data.cancelledAt ? timestampToIso(data.cancelledAt) : undefined,
    rejectedAt: data.rejectedAt ? timestampToIso(data.rejectedAt) : undefined,
  };
}

function requireVerifiedAuthUser() {
  const current = auth.currentUser;
  if (!current) {
    throw new Error('Authentication required. Please log in.');
  }
  if (!current.emailVerified) {
    throw new Error('Please verify your email address before performing this action.');
  }
  return current;
}

function slotsOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const a0 = new Date(startA).getTime();
  const a1 = new Date(endA).getTime();
  const b0 = new Date(startB).getTime();
  const b1 = new Date(endB).getTime();
  return a0 < b1 && b0 < a1;
}

const REMOVED_LEGACY_DEMO_IDS = new Set([
  'demo-listing-5-arduino',
  'demo-listing-6-hdmi',
  'demo-listing-7-book',
  'demo-listing-8-mouse',
]);

const REMOVED_SAMPLE_TITLES = new Set([
  '65W USB-C Laptop Charger (Sample Listing)',
]);

function isRemovedSampleListing(title?: string | null): boolean {
  return Boolean(title && REMOVED_SAMPLE_TITLES.has(title.trim()));
}

function buildDemoListingPayload(sample: Listing): Record<string, any> {
  const payload: Record<string, any> = {
    id: sample.id,
    ownerId: sample.ownerId,
    ownerName: sample.ownerName.slice(0, 100),
    ownerCollege: sample.ownerCollege.slice(0, 150),
    ownerDepartment: sample.ownerDepartment.slice(0, 150),
    title: sample.title.slice(0, 140),
    category: sample.category,
    description: sample.description.slice(0, 2000),
    condition: sample.condition,
    imageUrl: sample.imageUrl.slice(0, 250000),
    campusLocation: sample.campusLocation.slice(0, 200),
    availabilityHours: sample.availabilityHours.slice(0, 200),
    pricingMethod: sample.pricingMethod,
    price: sample.pricingMethod === 'free' ? 0 : Math.max(0, Number(sample.price) || 0),
    allowedDurations: sample.allowedDurations.slice(0, 15),
    quantity: Math.max(1, Math.min(100, Number(sample.quantity) || 1)),
    isAvailable: true,
    isDemo: true,
    reservedSlots: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (sample.usageInstructions?.trim()) {
    payload.usageInstructions = sample.usageInstructions.trim().slice(0, 500);
  }
  return payload;
}

let sessionSeedPromise: Promise<{ seededCount: number; totalSampleCount: number }> | null = null;

export async function getUserPrivateProfile(uid: string): Promise<User | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: d.id,
      name: d.name,
      email: d.email,
      college: d.college,
      department: d.department,
      phone: d.phone || undefined,
      isVerifiedCollegeEmail: Boolean(d.isVerifiedCollegeEmail),
      emailVerified: auth.currentUser?.emailVerified,
      createdAt: timestampToIso(d.createdAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(params: {
  uid: string;
  email: string;
  name: string;
  college: string;
  department: string;
  phone?: string;
  isCreate: boolean;
}): Promise<User> {
  const isEduDomain =
    /\.(edu|ac\.in|edu\.in|college\.edu)$/i.test(params.email) || params.email.includes('campus');
  const trimmedName = (params.name.trim() || 'Campus Student').slice(0, 100);
  const trimmedCollege = (params.college.trim() || 'Apex Institute of Technology').slice(0, 150);
  const trimmedDept = (params.department.trim() || 'Campus Member').slice(0, 150);
  const trimmedPhone = params.phone ? params.phone.trim().slice(0, 30) : '';

  const batch = writeBatch(db);
  const privateRef = doc(db, 'users', params.uid);
  const publicRef = doc(db, 'users_public', params.uid);

  const privatePayload: Record<string, any> = {
    id: params.uid,
    name: trimmedName,
    email: params.email.toLowerCase().trim().slice(0, 254),
    college: trimmedCollege,
    department: trimmedDept,
    isVerifiedCollegeEmail: isEduDomain,
    updatedAt: serverTimestamp(),
  };

  if (trimmedPhone) {
    privatePayload.phone = trimmedPhone;
  } else if (!params.isCreate) {
    privatePayload.phone = '';
  }

  const publicPayload: Record<string, any> = {
    id: params.uid,
    name: trimmedName,
    college: trimmedCollege,
    department: trimmedDept,
    isVerifiedCollegeEmail: isEduDomain,
    updatedAt: serverTimestamp(),
  };

  if (params.isCreate) {
    privatePayload.createdAt = serverTimestamp();
    publicPayload.createdAt = serverTimestamp();
    batch.set(privateRef, privatePayload);
    batch.set(publicRef, publicPayload);
  } else {
    batch.update(privateRef, {
      name: trimmedName,
      college: trimmedCollege,
      department: trimmedDept,
      phone: trimmedPhone,
      isVerifiedCollegeEmail: isEduDomain,
      updatedAt: serverTimestamp(),
    });
    batch.update(publicRef, {
      name: trimmedName,
      college: trimmedCollege,
      department: trimmedDept,
      isVerifiedCollegeEmail: isEduDomain,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, params.isCreate ? OperationType.CREATE : OperationType.UPDATE, `users/${params.uid}`);
  }

  const fresh = await getUserPrivateProfile(params.uid);
  if (!fresh) {
    throw new Error('Could not reload saved profile.');
  }
  return fresh;
}

export const api = {
  // --- Listings ---
  getListings: async (
    params: {
      q?: string;
      category?: string;
      pricingMethod?: string;
      freeOnly?: boolean;
      availableOnly?: boolean;
      maxPrice?: number;
      sort?: string;
    } = {}
  ): Promise<{ listings: Listing[] }> => {
    let firestoreListings: Listing[] = [];
    const path = 'listings';
    try {
      const qRef = query(collection(db, 'listings'), where('isAvailable', 'in', [true, false]));
      const snap = await getDocs(qRef);
      firestoreListings = snap.docs.map(d => mapListingDoc(d.id, d.data()));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }

    // Deduplicate: live Firestore docs override static fallback entries so live availability & bookings always show
    const mergedMap = new Map<string, Listing>();
    const pendingDeletions: Promise<void>[] = [];
    const currentUser = auth.currentUser;

    for (const item of firestoreListings) {
      if (isRemovedSampleListing(item.title)) {
        if (currentUser?.emailVerified && item.ownerId === currentUser.uid) {
          pendingDeletions.push(deleteDoc(doc(db, 'listings', item.id)).catch(() => {}));
        }
        continue;
      }
      if (!REMOVED_LEGACY_DEMO_IDS.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    }
    if (pendingDeletions.length > 0) {
      await Promise.allSettled(pendingDeletions);
    }
    for (const sample of DEMO_SAMPLE_LISTINGS) {
      if (!mergedMap.has(sample.id)) {
        mergedMap.set(sample.id, sample);
      }
    }
    let listings: Listing[] = Array.from(mergedMap.values());

    if (params.q && params.q.trim()) {
      const term = params.q.toLowerCase().trim();
      listings = listings.filter(
        l =>
          l.title.toLowerCase().includes(term) ||
          l.description.toLowerCase().includes(term) ||
          l.category.toLowerCase().includes(term) ||
          l.campusLocation.toLowerCase().includes(term) ||
          l.ownerName.toLowerCase().includes(term)
      );
    }

    if (params.category && params.category !== 'All') {
      listings = listings.filter(l => l.category === params.category);
    }

    if (params.pricingMethod && params.pricingMethod !== 'All') {
      if (params.pricingMethod === 'borrow_rent') {
        listings = listings.filter(l => l.pricingMethod !== 'sale');
      } else if (params.pricingMethod === 'rentals') {
        listings = listings.filter(l => ['hourly', 'period', 'daily', 'weekly'].includes(l.pricingMethod));
      } else {
        listings = listings.filter(l => l.pricingMethod === params.pricingMethod);
      }
    }

    if (params.freeOnly) {
      listings = listings.filter(l => l.price === 0 || l.pricingMethod === 'free');
    }

    if (params.availableOnly) {
      listings = listings.filter(l => l.isAvailable);
    }

    if (params.maxPrice !== undefined) {
      const max = Number(params.maxPrice);
      listings = listings.filter(l => l.price <= max);
    }

    if (params.sort === 'lowest_price') {
      listings.sort((a, b) => a.price - b.price);
    } else if (params.sort === 'highest_price') {
      listings.sort((a, b) => b.price - a.price);
    } else {
      // Keep borrowing/renting listings prioritized ahead of secondary buy/sell items
      listings.sort((a, b) => {
        const aIsSale = a.pricingMethod === 'sale' ? 1 : 0;
        const bIsSale = b.pricingMethod === 'sale' ? 1 : 0;
        if (aIsSale !== bIsSale) return aIsSale - bIsSale;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return { listings };
  },

  getListing: async (id: string): Promise<Listing & { ownerProfile: any }> => {
    const path = `listings/${id}`;
    try {
      const snap = await getDoc(doc(db, 'listings', id));
      if (snap.exists()) {
        const listing = mapListingDoc(snap.id, snap.data());
        if (isRemovedSampleListing(listing.title)) {
          if (auth.currentUser?.emailVerified && listing.ownerId === auth.currentUser.uid) {
            await deleteDoc(doc(db, 'listings', id)).catch(() => {});
          }
          throw new Error('Listing not found.');
        }

        let publicOwner: Record<string, any> | null = null;
        if (!listing.isDemo) {
          try {
            const pubSnap = await getDoc(doc(db, 'users_public', listing.ownerId));
            if (pubSnap.exists()) {
              publicOwner = pubSnap.data();
            }
          } catch {
            // Fallback to snapshot fields stored on listing
          }
        }

        return {
          ...listing,
          ownerProfile: {
            id: listing.ownerId,
            name: publicOwner?.name || listing.ownerName,
            college: publicOwner?.college || listing.ownerCollege,
            department: publicOwner?.department || listing.ownerDepartment,
            isVerifiedCollegeEmail: publicOwner?.isVerifiedCollegeEmail ?? true,
            memberSince: listing.isDemo
              ? 'Campus Sample Member'
              : publicOwner?.createdAt
                ? new Date(timestampToIso(publicOwner.createdAt)).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Campus Member',
          },
        };
      }

      // Fallback before first signed-in user seeds sample listings to Firestore
      const demoMatch = DEMO_SAMPLE_LISTINGS.find(l => l.id === id);
      if (demoMatch) {
        return {
          ...demoMatch,
          ownerProfile: {
            id: demoMatch.ownerId,
            name: demoMatch.ownerName,
            college: demoMatch.ownerCollege,
            department: demoMatch.ownerDepartment,
            isVerifiedCollegeEmail: true,
            memberSince: 'Campus Sample Member',
          },
        };
      }

      throw new Error('Listing not found.');
    } catch (error) {
      if (error instanceof Error && error.message === 'Listing not found.') {
        throw error;
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  seedSampleListings: async (): Promise<{ seededCount: number; totalSampleCount: number }> => {
    const current = auth.currentUser;
    if (!current || !current.emailVerified) {
      return { seededCount: 0, totalSampleCount: DEMO_SAMPLE_LISTINGS.length };
    }

    const qRef = query(collection(db, 'listings'), where('isAvailable', 'in', [true, false]));
    const snap = await getDocs(qRef).catch(err =>
      handleFirestoreError(err, OperationType.LIST, 'listings')
    );
    const existingIds = new Set(snap.docs.map(d => d.id));
    const missing = DEMO_SAMPLE_LISTINGS.filter(sample => !existingIds.has(sample.id));

    if (missing.length === 0) {
      return { seededCount: 0, totalSampleCount: DEMO_SAMPLE_LISTINGS.length };
    }

    const batch = writeBatch(db);
    for (const sample of missing) {
      batch.set(doc(db, 'listings', sample.id), buildDemoListingPayload(sample));
    }

    try {
      await batch.commit();
      return { seededCount: missing.length, totalSampleCount: DEMO_SAMPLE_LISTINGS.length };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'listings');
    }
  },

  ensureSampleListingsSeededOnce: async (): Promise<{ seededCount: number; totalSampleCount: number }> => {
    if (!sessionSeedPromise) {
      sessionSeedPromise = api.seedSampleListings().catch(err => {
        sessionSeedPromise = null;
        throw err;
      });
    }
    return sessionSeedPromise;
  },

  createListing: async (listingData: Partial<Listing>): Promise<{ listing: Listing; message: string }> => {
    const current = requireVerifiedAuthUser();
    const profile = await getUserPrivateProfile(current.uid);
    if (!profile) {
      throw new Error('Please complete your student profile before creating a listing.');
    }

    const id = `listing-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const pricingMethod = listingData.pricingMethod || 'hourly';
    const numericPrice = pricingMethod === 'free' ? 0 : Math.max(0, Number(listingData.price) || 0);
    const allowedDurations =
      pricingMethod === 'sale'
        ? ['One-time purchase']
        : Array.isArray(listingData.allowedDurations) && listingData.allowedDurations.length > 0
          ? listingData.allowedDurations.slice(0, 15)
          : ['1 hour', '2 hours', '3 hours', '1 day', 'Multiple days'];

    const title = (listingData.title || '').trim().slice(0, 140);
    const description = (listingData.description || '').trim().slice(0, 2000);
    const campusLocation = (listingData.campusLocation || '').trim().slice(0, 200);
    const availabilityHours = (listingData.availabilityHours || '').trim().slice(0, 200) || 'Flexible campus hours';

    if (!title || !description || !campusLocation) {
      throw new Error('Please provide a title, description, and campus pickup location.');
    }

    const payload: Record<string, any> = {
      id,
      ownerId: current.uid,
      ownerName: (profile.name.trim() || 'Campus Student').slice(0, 100),
      ownerCollege: (profile.college.trim() || 'Apex Institute of Technology').slice(0, 150),
      ownerDepartment: (profile.department.trim() || 'Campus Member').slice(0, 150),
      title,
      category: listingData.category || 'Electronics',
      description,
      condition: listingData.condition || 'Good',
      imageUrl: (
        listingData.imageUrl?.trim() ||
        FALLBACK_LISTING_IMAGE
      ).slice(0, 250000),
      campusLocation,
      availabilityHours,
      pricingMethod,
      price: numericPrice,
      allowedDurations,
      quantity: Math.max(1, Math.min(100, Number(listingData.quantity) || 1)),
      isAvailable: true,
      isDemo: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (listingData.usageInstructions?.trim()) {
      payload.usageInstructions = listingData.usageInstructions.trim().slice(0, 500);
    }

    const path = `listings/${id}`;
    try {
      await setDoc(doc(db, 'listings', id), payload);
      const created = await getDoc(doc(db, 'listings', id));
      return {
        listing: mapListingDoc(id, created.data() || payload),
        message: 'Item listed successfully on campus!',
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updateListing: async (
    id: string,
    listingData: Partial<Listing>
  ): Promise<{ listing: Listing; message: string }> => {
    requireVerifiedAuthUser();
    const path = `listings/${id}`;
    try {
      const ref = doc(db, 'listings', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        throw new Error('Listing not found.');
      }

      const existing = snap.data();
      const pricingMethod = listingData.pricingMethod || existing.pricingMethod;
      const numericPrice =
        pricingMethod === 'free'
          ? 0
          : listingData.price !== undefined
            ? Math.max(0, Number(listingData.price) || 0)
            : existing.price;

      const updates: Record<string, any> = {
        title: (listingData.title ?? existing.title).trim().slice(0, 140),
        category: listingData.category ?? existing.category,
        description: (listingData.description ?? existing.description).trim().slice(0, 2000),
        condition: listingData.condition ?? existing.condition,
        imageUrl: (listingData.imageUrl ?? existing.imageUrl).trim().slice(0, 250000),
        campusLocation: (listingData.campusLocation ?? existing.campusLocation).trim().slice(0, 200),
        availabilityHours: (listingData.availabilityHours ?? existing.availabilityHours).trim().slice(0, 200),
        pricingMethod,
        price: numericPrice,
        allowedDurations:
          Array.isArray(listingData.allowedDurations) && listingData.allowedDurations.length > 0
            ? listingData.allowedDurations.slice(0, 15)
            : existing.allowedDurations,
        quantity:
          listingData.quantity !== undefined
            ? Math.max(1, Math.min(100, Number(listingData.quantity) || 1))
            : existing.quantity,
        isAvailable:
          listingData.isAvailable !== undefined ? Boolean(listingData.isAvailable) : existing.isAvailable,
        updatedAt: serverTimestamp(),
      };

      if (listingData.usageInstructions !== undefined) {
        updates.usageInstructions = listingData.usageInstructions.trim().slice(0, 500);
      }

      await updateDoc(ref, updates);
      const updated = await getDoc(ref);
      return {
        listing: mapListingDoc(id, updated.data()!),
        message: 'Listing updated successfully.',
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Listing not found.') throw error;
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  toggleListingAvailability: async (
    id: string,
    isAvailable?: boolean
  ): Promise<{ listing: Listing; message: string }> => {
    requireVerifiedAuthUser();
    const path = `listings/${id}`;
    try {
      const ref = doc(db, 'listings', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        throw new Error('Listing not found.');
      }
      const nextStatus = isAvailable !== undefined ? Boolean(isAvailable) : !snap.data().isAvailable;
      await updateDoc(ref, { isAvailable: nextStatus, updatedAt: serverTimestamp() });
      const updated = await getDoc(ref);
      return {
        listing: mapListingDoc(id, updated.data()!),
        message: nextStatus ? 'Item is now marked as Available.' : 'Item is now marked as Unavailable.',
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Listing not found.') throw error;
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteListing: async (id: string): Promise<{ message: string }> => {
    requireVerifiedAuthUser();
    const path = `listings/${id}`;
    try {
      await deleteDoc(doc(db, 'listings', id));
      return { message: 'Listing removed successfully.' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // --- Borrowing Requests ---
  createRequest: async (payload: {
    listingId: string;
    pickupDate: string;
    pickupTime: string;
    durationKey: string;
    durationHours: number;
    returnDate: string;
    returnTime: string;
    estimatedCost: number;
    note?: string;
  }): Promise<{ request: BorrowRequest; message: string }> => {
    const current = requireVerifiedAuthUser();

    const profile = await getUserPrivateProfile(current.uid);
    if (!profile) {
      throw new Error('Please complete your student profile before requesting items.');
    }

    const listingRef = doc(db, 'listings', payload.listingId);
    let listingSnap = await getDoc(listingRef).catch(err =>
      handleFirestoreError(err, OperationType.GET, `listings/${payload.listingId}`)
    );

    if (!listingSnap.exists()) {
      const demoSample = DEMO_SAMPLE_LISTINGS.find(d => d.id === payload.listingId);
      if (demoSample) {
        try {
          await setDoc(listingRef, buildDemoListingPayload(demoSample));
          listingSnap = await getDoc(listingRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `listings/${payload.listingId}`);
        }
      }
    }

    if (!listingSnap.exists()) {
      throw new Error('Item listing not found.');
    }

    const listing = mapListingDoc(listingSnap.id, listingSnap.data());
    if (isRemovedSampleListing(listing.title)) {
      throw new Error('Item listing not found.');
    }
    if (listing.ownerId === current.uid) {
      throw new Error('You cannot request your own listed item.');
    }
    if (!listing.isAvailable) {
      throw new Error('This item is currently unavailable.');
    }

    const pickupFull = `${payload.pickupDate}T${payload.pickupTime}`;
    const returnFull = `${payload.returnDate}T${payload.returnTime}`;
    const startMs = new Date(pickupFull).getTime();
    const endMs = new Date(returnFull).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      throw new Error('Invalid date or time format.');
    }
    if (startMs >= endMs) {
      throw new Error('Expected return time must be strictly after pickup time.');
    }

    // Check against reservedSlots on the listing to prevent overlapping reservations
    const conflictSlot = (listing.reservedSlots || []).find(slot =>
      slotsOverlap(pickupFull, returnFull, slot.startIso, slot.endIso)
    );
    if (conflictSlot) {
      throw new Error(
        `Reservation conflict: This item is already booked from ${conflictSlot.startIso.replace('T', ' ')} to ${conflictSlot.endIso.replace('T', ' ')}. Please choose another time.`
      );
    }

    const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const reqDoc: Record<string, any> = {
      id: reqId,
      listingId: listing.id,
      listingTitle: (listing.title.trim() || 'Campus Item').slice(0, 140),
      listingCategory: listing.category,
      listingImageUrl: (listing.imageUrl.trim() || FALLBACK_LISTING_IMAGE).slice(0, 250000),
      listingLocation: (listing.campusLocation.trim() || 'Campus Pickup Point').slice(0, 200),
      ownerId: listing.ownerId,
      ownerName: (listing.ownerName.trim() || 'Campus Student').slice(0, 100),
      ownerCollege: (listing.ownerCollege.trim() || 'Apex Institute of Technology').slice(0, 150),
      borrowerId: current.uid,
      borrowerName: (profile.name.trim() || 'Campus Student').slice(0, 100),
      borrowerEmail: (current.email || profile.email).toLowerCase().trim().slice(0, 254),
      borrowerCollege: (profile.college.trim() || 'Apex Institute of Technology').slice(0, 150),
      borrowerDepartment: (profile.department.trim() || 'Campus Member').slice(0, 150),
      pickupDate: payload.pickupDate,
      pickupTime: payload.pickupTime,
      durationKey: (payload.durationKey || 'Standard').trim().slice(0, 60) || 'Standard',
      durationHours: Math.max(0.25, Math.min(720, Number(payload.durationHours) || 2)),
      returnDate: payload.returnDate,
      returnTime: payload.returnTime,
      pricingMethod: listing.pricingMethod,
      rate: listing.price,
      estimatedCost: Math.max(0, Number(payload.estimatedCost) || 0),
      status: 'pending',
      isDemoRequest: Boolean(listing.isDemo),
      phoneSharedWithBorrower: false,
      phoneDecisionMade: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (payload.note?.trim()) {
      reqDoc.note = payload.note.trim().slice(0, 500);
    }

    const path = `requests/${reqId}`;
    try {
      await setDoc(doc(db, 'requests', reqId), reqDoc);
      const saved = await getDoc(doc(db, 'requests', reqId));
      return {
        request: mapRequestDoc(reqId, saved.data() || reqDoc),
        message: 'Request sent to owner! Track status in My Requests.',
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  getMyRequests: async (): Promise<{ requests: BorrowRequest[] }> => {
    const current = auth.currentUser;
    if (!current) return { requests: [] };
    const path = 'requests';
    try {
      const qRef = query(collection(db, 'requests'), where('borrowerId', '==', current.uid));
      const snap = await getDocs(qRef);
      const list = snap.docs
        .map(d => mapRequestDoc(d.id, d.data()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { requests: list };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  getMyIncomingRequests: async (): Promise<{ requests: BorrowRequest[] }> => {
    const current = auth.currentUser;
    if (!current) return { requests: [] };
    const path = 'requests';
    try {
      const ownerQuery = query(collection(db, 'requests'), where('ownerId', '==', current.uid));
      const ownerSnap = await getDocs(ownerQuery);

      const list = ownerSnap.docs
        .map(d => mapRequestDoc(d.id, d.data()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { requests: list };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  cancelRequest: async (id: string): Promise<{ request: BorrowRequest; message: string }> => {
    const current = requireVerifiedAuthUser();
    const path = `requests/${id}`;
    const ref = doc(db, 'requests', id);
    const snap = await getDoc(ref).catch(err => handleFirestoreError(err, OperationType.GET, path));
    if (!snap.exists()) {
      throw new Error('Request not found.');
    }
    const existing = mapRequestDoc(snap.id, snap.data());
    if (existing.borrowerId !== current.uid) {
      throw new Error('Only the borrower can cancel this request.');
    }
    if (existing.status !== 'pending') {
      throw new Error('Only pending requests can be cancelled.');
    }

    try {
      await updateDoc(ref, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const updated = await getDoc(ref);
      return {
        request: mapRequestDoc(id, updated.data()!),
        message: 'Request cancelled.',
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  respondToRequest: async (
    id: string,
    action: 'accept' | 'reject',
    rejectionReason?: string
  ): Promise<{ request: BorrowRequest; message: string; showPhoneSharePrompt?: boolean }> => {
    const current = requireVerifiedAuthUser();
    const reqRef = doc(db, 'requests', id);
    const reqSnap = await getDoc(reqRef).catch(err =>
      handleFirestoreError(err, OperationType.GET, `requests/${id}`)
    );
    if (!reqSnap.exists()) {
      throw new Error('Request not found.');
    }
    const reqData = mapRequestDoc(reqSnap.id, reqSnap.data());

    if (reqData.ownerId !== current.uid) {
      throw new Error('Only the item owner can respond to this request.');
    }
    if (reqData.status !== 'pending') {
      throw new Error('Only pending requests can be accepted or rejected.');
    }

    if (action === 'reject') {
      try {
        await updateDoc(reqRef, {
          status: 'rejected',
          rejectionReason: (
            rejectionReason?.trim() || 'Owner is unable to fulfill this request at this time.'
          ).slice(0, 300),
          rejectedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        const updated = await getDoc(reqRef);
        return {
          request: mapRequestDoc(id, updated.data()!),
          message: 'Request rejected.',
        };
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `requests/${id}`);
      }
    }

    // Check overlap against existing active owner requests for this listing
    const pickupFull = `${reqData.pickupDate}T${reqData.pickupTime}`;
    const returnFull = `${reqData.returnDate}T${reqData.returnTime}`;

    const listingRef = doc(db, 'listings', reqData.listingId);
    const listingSnap = await getDoc(listingRef).catch(err =>
      handleFirestoreError(err, OperationType.GET, `listings/${reqData.listingId}`)
    );

    const existingSlots: ReservedSlot[] = listingSnap.exists()
      ? (listingSnap.data().reservedSlots as ReservedSlot[]) || []
      : [];

    const conflict = existingSlots.find(
      s => s.requestId !== id && slotsOverlap(pickupFull, returnFull, s.startIso, s.endIso)
    );
    if (conflict) {
      throw new Error(
        `Conflicting reservation: Another student already has this item reserved from ${conflict.startIso.replace('T', ' ')} to ${conflict.endIso.replace('T', ' ')}.`
      );
    }

    // Also verify against incoming active requests owned by this user
    const ownerReqs = await api.getMyIncomingRequests();
    const reqConflict = ownerReqs.requests.find(
      r =>
        r.id !== id &&
        r.listingId === reqData.listingId &&
        ['accepted', 'borrowed', 'return_requested'].includes(r.status) &&
        slotsOverlap(pickupFull, returnFull, `${r.pickupDate}T${r.pickupTime}`, `${r.returnDate}T${r.returnTime}`)
    );
    if (reqConflict) {
      throw new Error(
        `Conflicting reservation: Already approved for ${reqConflict.borrowerName} from ${reqConflict.pickupDate} ${reqConflict.pickupTime} to ${reqConflict.returnDate} ${reqConflict.returnTime}.`
      );
    }

    const nextSlots: ReservedSlot[] = [
      ...existingSlots.slice(-19),
      { requestId: id, startIso: pickupFull, endIso: returnFull },
    ];

    const batch = writeBatch(db);
    batch.update(reqRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const canUpdateListing = listingSnap.exists() && listingSnap.data().ownerId === current.uid;

    if (canUpdateListing) {
      const qty = Number(listingSnap.data().quantity) || 1;
      batch.update(listingRef, {
        reservedSlots: nextSlots,
        isAvailable: qty > nextSlots.length,
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
      const updated = await getDoc(reqRef);
      return {
        request: mapRequestDoc(id, updated.data()!),
        message: 'Request accepted! You can now choose whether to share your phone number with this student.',
        showPhoneSharePrompt: true,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `requests/${id}`);
    }
  },

  setPhonePrivacy: async (
    id: string,
    sharePhone: boolean
  ): Promise<{ request: BorrowRequest; message: string }> => {
    const current = requireVerifiedAuthUser();
    const reqRef = doc(db, 'requests', id);
    const reqSnap = await getDoc(reqRef).catch(err =>
      handleFirestoreError(err, OperationType.GET, `requests/${id}`)
    );
    if (!reqSnap.exists()) {
      throw new Error('Request not found.');
    }
    const reqData = mapRequestDoc(reqSnap.id, reqSnap.data());
    if (reqData.ownerId !== current.uid) {
      throw new Error('Only the item owner can update contact sharing permissions.');
    }
    if (!['accepted', 'borrowed', 'return_requested'].includes(reqData.status)) {
      throw new Error('Contact privacy can only be updated on active accepted requests.');
    }

    let ownerPhone = '';
    if (sharePhone) {
      const profile = await getUserPrivateProfile(current.uid);
      const trimmedPhone = profile?.phone?.trim() || '';
      if (trimmedPhone.length < 3) {
        throw new Error('Please add a valid phone number in your Profile first before choosing Share Number.');
      }
      ownerPhone = trimmedPhone.slice(0, 30);
    }

    try {
      await updateDoc(reqRef, {
        phoneSharedWithBorrower: sharePhone,
        phoneDecisionMade: true,
        ownerPhoneIfShared: sharePhone ? ownerPhone : deleteField(),
        ownerPhoneDecision: sharePhone ? 'shared' : 'private',
        updatedAt: serverTimestamp(),
      });
      const updated = await getDoc(reqRef);
      return {
        request: mapRequestDoc(id, updated.data()!),
        message: sharePhone ? 'Phone number shared with this borrower only.' : 'Phone number kept private.',
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `requests/${id}`);
    }
  },

  subscribeToRequests: (
    onUpdate: (data: { incoming: BorrowRequest[]; outgoing: BorrowRequest[] }) => void,
    onError?: (err: Error) => void
  ): (() => void) => {
    const current = auth.currentUser;
    if (!current) return () => {};

    let ownerDocs: BorrowRequest[] = [];
    let borrowerDocs: BorrowRequest[] = [];
    let ownerReady = false;
    let borrowerReady = false;

    const emit = () => {
      if (!ownerReady || !borrowerReady) return;
      const incoming = [...ownerDocs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const outgoing = [...borrowerDocs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      onUpdate({ incoming, outgoing });
    };

    const ownerQuery = query(collection(db, 'requests'), where('ownerId', '==', current.uid));
    const borrowerQuery = query(collection(db, 'requests'), where('borrowerId', '==', current.uid));

    const unsubOwner = onSnapshot(
      ownerQuery,
      snap => {
        ownerDocs = snap.docs.map(d => mapRequestDoc(d.id, d.data()));
        ownerReady = true;
        emit();
      },
      error => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'requests');
        } catch (wrapped) {
          if (onError && wrapped instanceof Error) onError(wrapped);
        }
      }
    );

    const unsubBorrower = onSnapshot(
      borrowerQuery,
      snap => {
        borrowerDocs = snap.docs.map(d => mapRequestDoc(d.id, d.data()));
        borrowerReady = true;
        emit();
      },
      error => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'requests');
        } catch (wrapped) {
          if (onError && wrapped instanceof Error) onError(wrapped);
        }
      }
    );

    return () => {
      unsubOwner();
      unsubBorrower();
    };
  },

  markAsBorrowed: async (
    id: string,
    actorRole?: 'owner' | 'borrower'
  ): Promise<{ request: BorrowRequest; message: string }> => {
    const current = requireVerifiedAuthUser();
    const reqRef = doc(db, 'requests', id);
    const reqSnap = await getDoc(reqRef).catch(err =>
      handleFirestoreError(err, OperationType.GET, `requests/${id}`)
    );
    if (!reqSnap.exists()) {
      throw new Error('Request not found.');
    }
    const reqData = mapRequestDoc(reqSnap.id, reqSnap.data());

    if (reqData.status !== 'accepted') {
      throw new Error('Item handover or collection can only be confirmed for accepted requests.');
    }

    const isOwner = reqData.ownerId === current.uid;
    const isBorrower = reqData.borrowerId === current.uid;

    if (actorRole === 'owner' && !isOwner) {
      throw new Error('Only the item owner can confirm handover.');
    }
    if (actorRole === 'borrower' && !isBorrower) {
      throw new Error('Only the borrower can confirm collection.');
    }
    if (!isOwner && !isBorrower) {
      throw new Error('Only the owner or borrower can update handover status.');
    }

    try {
      await updateDoc(reqRef, {
        status: 'borrowed',
        borrowedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const updated = await getDoc(reqRef);
      return {
        request: mapRequestDoc(id, updated.data()!),
        message:
          actorRole === 'owner'
            ? 'Handover confirmed! The item is now marked as borrowed.'
            : 'Collection confirmed! Item is now in your possession.',
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `requests/${id}`);
    }
  },

  requestReturn: async (id: string): Promise<{ request: BorrowRequest; message: string }> => {
    const current = requireVerifiedAuthUser();
    const reqRef = doc(db, 'requests', id);
    const reqSnap = await getDoc(reqRef).catch(err =>
      handleFirestoreError(err, OperationType.GET, `requests/${id}`)
    );
    if (!reqSnap.exists()) {
      throw new Error('Request not found.');
    }
    const reqData = mapRequestDoc(reqSnap.id, reqSnap.data());

    if (reqData.borrowerId !== current.uid) {
      throw new Error('Only the borrower can mark this item as returned.');
    }
    if (reqData.status !== 'borrowed') {
      throw new Error('Only items currently in your possession can be marked as returned.');
    }

    try {
      await updateDoc(reqRef, {
        status: 'return_requested',
        returnRequestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const updated = await getDoc(reqRef);
      return {
        request: mapRequestDoc(id, updated.data()!),
        message: 'Marked as returned! Status is now Return Pending Confirmation until the owner confirms receipt.',
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `requests/${id}`);
    }
  },

  confirmReturn: async (
    id: string,
    makeItemAvailableAgain = true
  ): Promise<{ request: BorrowRequest; message: string }> => {
    const current = requireVerifiedAuthUser();
    const reqRef = doc(db, 'requests', id);
    const reqSnap = await getDoc(reqRef).catch(err =>
      handleFirestoreError(err, OperationType.GET, `requests/${id}`)
    );
    if (!reqSnap.exists()) {
      throw new Error('Request not found.');
    }
    const reqData = mapRequestDoc(reqSnap.id, reqSnap.data());

    if (reqData.ownerId !== current.uid) {
      throw new Error('Only the item owner can confirm physical return.');
    }
    if (reqData.status !== 'return_requested') {
      throw new Error('The borrower must mark the item as returned before you confirm receipt.');
    }

    const listingRef = doc(db, 'listings', reqData.listingId);
    const listingSnap = await getDoc(listingRef).catch(() => null);

    const batch = writeBatch(db);
    batch.update(reqRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const canUpdateListing = listingSnap && listingSnap.exists() && listingSnap.data().ownerId === current.uid;

    if (canUpdateListing) {
      const existingSlots: ReservedSlot[] = listingSnap.data().reservedSlots || [];
      const filteredSlots = existingSlots.filter(s => s.requestId !== id);
      batch.update(listingRef, {
        reservedSlots: filteredSlots,
        isAvailable: makeItemAvailableAgain !== false,
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
      const updated = await getDoc(reqRef);
      return {
        request: mapRequestDoc(id, updated.data()!),
        message: 'Return receipt confirmed! Transaction is completed and the item is available again.',
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `requests/${id}`);
    }
  },

  // --- Settings ---
  getSettings: async (): Promise<{ collegePeriodMinutes: number; defaultCollegeName: string }> => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'campus'));
      if (snap.exists()) {
        const d = snap.data();
        return {
          collegePeriodMinutes: Number(d.collegePeriodMinutes) || 50,
          defaultCollegeName: d.defaultCollegeName || 'Apex Institute of Technology',
        };
      }
    } catch {
      // Return defaults cleanly if settings doc does not exist yet
    }
    return {
      collegePeriodMinutes: 50,
      defaultCollegeName: 'Apex Institute of Technology',
    };
  },

  formatError: getReadableErrorMessage,
};
