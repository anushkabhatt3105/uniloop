import React, { useState, useEffect } from 'react';
import { Listing, RequestStatus } from '../types/index.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { ProductImage } from '../components/ProductImage.js';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Tag,
  Sparkles,
  Calendar,
  AlertCircle,
  Lock,
  Share2,
} from 'lucide-react';

interface ItemDetailPageProps {
  listingId: string;
  onBack: () => void;
  onRequestClick: (listing: Listing) => void;
}

export const ItemDetailPage: React.FC<ItemDetailPageProps> = ({
  listingId,
  onBack,
  onRequestClick,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [listing, setListing] = useState<(Listing & { ownerProfile: any }) | null>(null);
  const [userRequestStatus, setUserRequestStatus] = useState<RequestStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getListing(listingId),
      isAuthenticated ? api.getMyRequests().catch(() => ({ requests: [] })) : Promise.resolve({ requests: [] }),
    ])
      .then(([res, reqRes]) => {
        if (!active) return;
        setListing(res);
        const matchingReq = reqRes.requests.find(
          r =>
            r.listingId === listingId &&
            ['pending', 'accepted', 'borrowed', 'return_requested'].includes(r.status)
        );
        setUserRequestStatus(matchingReq ? matchingReq.status : null);
      })
      .catch(err => {
        if (!active) return;
        setError(api.formatError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [listingId, isAuthenticated]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-4/3 bg-slate-200 rounded-3xl" />
            <div className="space-y-4">
              <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-200 rounded-lg" />
              <div className="h-32 bg-slate-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Item not found</h2>
        <p className="text-xs text-slate-500">
          {error || 'The listing may have been removed or deleted by the owner.'}
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer"
        >
          Back to marketplace
        </button>
      </div>
    );
  }

  const isOwner = user?.id === listing.ownerId;
  const nowMs = Date.now();
  const upcomingSlots = (listing.reservedSlots || []).filter(
    slot => new Date(slot.endIso).getTime() >= nowMs
  );
  const hasActiveSlotNow = upcomingSlots.some(slot => {
    const start = new Date(slot.startIso).getTime();
    const end = new Date(slot.endIso).getTime();
    return nowMs >= start && nowMs <= end;
  });

  const getAvailabilityState = () => {
    if (!listing.isAvailable) {
      return {
        label: 'Booked / Unavailable',
        bg: 'bg-slate-800 text-slate-200',
        dot: 'bg-rose-400',
      };
    }
    if (userRequestStatus === 'pending') {
      return {
        label: 'Requested (Pending Approval)',
        bg: 'bg-amber-500 text-white',
        dot: 'bg-white animate-pulse',
      };
    }
    if (
      userRequestStatus === 'accepted' ||
      userRequestStatus === 'borrowed' ||
      userRequestStatus === 'return_requested'
    ) {
      return {
        label: 'Booked by You',
        bg: 'bg-blue-600 text-white',
        dot: 'bg-white',
      };
    }
    if (hasActiveSlotNow) {
      return {
        label: 'Currently Booked',
        bg: 'bg-amber-600 text-white',
        dot: 'bg-white',
      };
    }
    if (upcomingSlots.length > 0) {
      return {
        label: 'Available (Has Booked Slots)',
        bg: 'bg-emerald-600 text-white',
        dot: 'bg-white animate-pulse',
      };
    }
    return {
      label: 'Available Now',
      bg: 'bg-emerald-500 text-white',
      dot: 'bg-white animate-pulse',
    };
  };

  const availabilityBadge = getAvailabilityState();

  const formatSlotDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <div className="py-8 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to explore</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedNotice ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Main Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left: Image Container */}
            <div className="lg:col-span-7 bg-slate-50 relative flex items-center justify-center p-6 border-b lg:border-b-0 lg:border-r border-slate-100">
              <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200/70">
                <ProductImage
                  src={listing.imageUrl}
                  alt={listing.title}
                  loading="eager"
                  className="w-full h-full object-contain p-3"
                />
                <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-900 shadow-sm backdrop-blur-xs flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    {listing.category}
                  </span>
                  {listing.pricingMethod === 'sale' && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800/90 text-slate-100 shadow-xs backdrop-blur-xs">
                      Buy / Sell (Secondary Option)
                    </span>
                  )}
                  {listing.isDemo && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/95 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Demo Listing
                    </span>
                  )}
                </div>

                <div className="absolute top-4 right-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-xs flex items-center gap-1.5 ${availabilityBadge.bg}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${availabilityBadge.dot}`} />
                    {availabilityBadge.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Info & Actions */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Title & Condition */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Condition: {listing.condition}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Qty: {listing.quantity}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    {listing.title}
                  </h1>
                </div>

                {/* Price Display */}
                <div className="p-4 bg-gradient-to-r from-blue-50/80 to-emerald-50/80 rounded-2xl border border-blue-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      {listing.pricingMethod === 'sale'
                        ? 'One-Time Purchase (Secondary)'
                        : listing.price === 0 || listing.pricingMethod === 'free'
                          ? 'Free Campus Borrowing'
                          : 'Rental Pricing (Owner-Set Rate)'}
                    </span>
                    {listing.pricingMethod === 'sale' ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900">₹{listing.price}</span>
                        <span className="text-xs font-bold text-slate-500">Buy Outright</span>
                      </div>
                    ) : listing.price === 0 || listing.pricingMethod === 'free' ? (
                      <span className="text-2xl font-black text-emerald-700">FREE</span>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900">₹{listing.price}</span>
                        <span className="text-xs font-bold text-slate-500">
                          {{ hourly: '/ hour', daily: '/ day', period: '/ period', weekly: '/ week' }[listing.pricingMethod] || `/ ${listing.pricingMethod}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-white/80 px-2.5 py-1 rounded-full border border-blue-200">
                    Direct Student Hand-off
                  </span>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Description
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>

                {/* Usage Instructions (if any) */}
                {listing.usageInstructions && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 block mb-0.5">
                      Usage Guidelines from Owner:
                    </span>
                    <p className="text-slate-600">{listing.usageInstructions}</p>
                  </div>
                )}

                {/* Allowed durations */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {listing.pricingMethod === 'sale'
                      ? 'Transaction Option'
                      : 'Available Borrowing / Rental Durations'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.pricingMethod === 'sale' ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        One-time purchase (Secondary option)
                      </span>
                    ) : (
                      listing.allowedDurations.map(dur => (
                        <span
                          key={dur}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          {dur}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Current & Upcoming Booked Time Windows */}
                {listing.pricingMethod !== 'sale' && upcomingSlots.length > 0 && (
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-1.5">
                    <span className="font-bold text-amber-900 block">
                      Booked Time Windows (Unavailable Slots):
                    </span>
                    <ul className="space-y-1 text-amber-800">
                      {upcomingSlots.map(slot => (
                        <li key={slot.requestId} className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            {formatSlotDateTime(slot.startIso)} → {formatSlotDateTime(slot.endIso)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pickup details */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-semibold">Campus Pickup Point:</strong>
                      <span>{listing.campusLocation}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-semibold">Availability Hours:</strong>
                      <span>{listing.availabilityHours}</span>
                    </div>
                  </div>
                </div>

                {/* Owner Profile Card (Strict Privacy: NO phone number displayed!) */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {listing.ownerProfile?.name?.charAt(0) || listing.ownerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {listing.ownerProfile?.name || listing.ownerName}
                        </span>
                        {listing.ownerProfile?.isVerifiedCollegeEmail && (
                          <span title="Verified Campus Student">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {listing.ownerProfile?.department || listing.ownerDepartment} • {listing.ownerCollege}
                      </p>
                    </div>
                  </div>

                  {/* Explicit privacy note */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-600 font-medium bg-white px-2 py-1 rounded-lg border border-slate-200">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Private Contact</span>
                  </div>
                </div>
              </div>

              {/* Action Button Section */}
              <div className="pt-2">
                {isOwner ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs text-center font-medium">
                    This is your own listing. You can manage incoming requests from your Dashboard.
                  </div>
                ) : !listing.isAvailable ? (
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 text-xs text-center font-medium">
                    This item is currently booked or unavailable for new requests.
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) openAuthModal('login');
                        else onRequestClick(listing);
                      }}
                      className={`w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        listing.pricingMethod === 'sale'
                          ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-800/20'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25 hover:shadow-blue-600/35'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>
                        {listing.pricingMethod === 'sale'
                          ? 'Request to Buy (Secondary Option)'
                          : listing.price === 0 || listing.pricingMethod === 'free'
                            ? 'Request to Borrow (Free)'
                            : 'Request to Rent'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
