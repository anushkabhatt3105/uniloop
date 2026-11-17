import React from 'react';
import { Listing, RequestStatus } from '../types/index.js';
import { ProductImage } from './ProductImage.js';
import { MapPin, Clock, Tag, Sparkles } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  onRequestClick?: (e: React.MouseEvent) => void;
  userRequestStatus?: RequestStatus;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onClick,
  userRequestStatus,
}) => {
  const nowMs = Date.now();
  const hasActiveSlotNow = (listing.reservedSlots || []).some(slot => {
    const start = new Date(slot.startIso).getTime();
    const end = new Date(slot.endIso).getTime();
    return nowMs >= start && nowMs <= end;
  });
  const hasUpcomingSlot = (listing.reservedSlots || []).some(slot => {
    return new Date(slot.endIso).getTime() >= nowMs;
  });

  const getAvailabilityBadge = () => {
    if (!listing.isAvailable) {
      return {
        label: 'Booked / Unavailable',
        bg: 'bg-slate-800/90 text-slate-200',
        dot: 'bg-rose-400',
      };
    }
    if (userRequestStatus === 'pending') {
      return {
        label: 'Requested',
        bg: 'bg-amber-500 text-white',
        dot: 'bg-white animate-pulse',
      };
    }
    if (userRequestStatus === 'accepted' || userRequestStatus === 'borrowed' || userRequestStatus === 'return_requested') {
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
    if (hasUpcomingSlot) {
      return {
        label: 'Available (Booked Slots)',
        bg: 'bg-emerald-600 text-white',
        dot: 'bg-white animate-pulse',
      };
    }
    return {
      label: 'Available',
      bg: 'bg-emerald-500 text-white',
      dot: 'bg-white animate-pulse',
    };
  };

  const badge = getAvailabilityBadge();

  const formatPrice = (price: number, method: string) => {
    if (method === 'sale') {
      return (
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-base font-extrabold text-slate-800">₹{price}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Buy</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">Secondary option</span>
        </div>
      );
    }

    if (price === 0 || method === 'free') {
      return (
        <div className="text-right">
          <span className="text-emerald-700 font-extrabold text-base block leading-tight">FREE</span>
          <span className="text-[10px] text-emerald-600 font-semibold">Free Borrow</span>
        </div>
      );
    }

    const labels: Record<string, string> = {
      hourly: '/ hour',
      period: '/ period',
      daily: '/ day',
      weekly: '/ week',
    };

    return (
      <div className="text-right">
        <div className="flex items-baseline justify-end gap-1">
          <span className="text-lg font-extrabold text-slate-900">₹{price}</span>
          <span className="text-xs text-slate-500 font-medium">{labels[method] || `/${method}`}</span>
        </div>
        <span className="text-[10px] text-blue-600 font-semibold">Rent</span>
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-50 overflow-hidden border-b border-slate-100">
        <ProductImage
          src={listing.imageUrl}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-xs flex items-center gap-1">
            <Tag className="w-3 h-3 text-blue-600" />
            {listing.category}
          </span>
          {listing.pricingMethod === 'sale' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/85 text-slate-100 shadow-xs backdrop-blur-xs">
              Buy / Sell (Secondary)
            </span>
          )}
          {listing.isDemo && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/95 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Demo Sample
            </span>
          )}
        </div>

        <div className="absolute top-2.5 right-2.5">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-xs flex items-center gap-1.5 ${badge.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        </div>

        {/* Condition tag */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/75 text-white backdrop-blur-xs">
            {listing.condition}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>

          {/* Location & Durations */}
          <div className="mt-3 space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{listing.campusLocation}</span>
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">
                {listing.pricingMethod === 'sale' ? (
                  'One-time purchase (Secondary option)'
                ) : (
                  <>
                    Durations: {listing.allowedDurations.slice(0, 3).join(', ')}
                    {listing.allowedDurations.length > 3 ? ` +${listing.allowedDurations.length - 3} more` : ''}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Owner & Price Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] border border-slate-200">
              {listing.ownerName.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-800 block leading-tight max-w-[110px] truncate">
                {listing.ownerName}
              </span>
              <span className="text-[10px] text-slate-600 block leading-none truncate max-w-[110px]">
                {listing.ownerDepartment}
              </span>
            </div>
          </div>

          <div>
            {formatPrice(listing.price, listing.pricingMethod)}
          </div>
        </div>
      </div>
    </div>
  );
};
