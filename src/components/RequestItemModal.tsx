import React, { useState, useEffect, useMemo } from 'react';
import { Listing, BorrowRequest } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { ProductImage } from './ProductImage.js';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  MapPin,
  Sparkles,
  Info,
} from 'lucide-react';

interface RequestItemModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onRequestSuccess: (request: BorrowRequest) => void;
}

export const RequestItemModal: React.FC<RequestItemModalProps> = ({
  listing,
  isOpen,
  onClose,
  onRequestSuccess,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const formatLocalDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Today formatted as local YYYY-MM-DD
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  const defaultTimeStr = useMemo(() => {
    const d = new Date();
    const roundedMins = Math.ceil((d.getMinutes() + 15) / 5) * 5;
    d.setMinutes(roundedMins, 0, 0);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }, []);

  const [pickupDate, setPickupDate] = useState(todayStr);
  const [pickupTime, setPickupTime] = useState(defaultTimeStr);
  const [selectedDurationKey, setSelectedDurationKey] = useState(listing.allowedDurations[0] || '1 hour');
  const [customHours, setCustomHours] = useState<number>(4);
  const [customDays, setCustomDays] = useState<number>(2);

  const [returnDate, setReturnDate] = useState(todayStr);
  const [returnTime, setReturnTime] = useState('14:00');
  const [note, setNote] = useState('');

  const [collegePeriodMins, setCollegePeriodMins] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch configured college period length
  useEffect(() => {
    api.getSettings()
      .then(s => {
        if (s.collegePeriodMinutes) setCollegePeriodMins(s.collegePeriodMinutes);
      })
      .catch(() => {});
  }, []);

  // Update selected duration key if listing changes
  useEffect(() => {
    if (listing.pricingMethod === 'sale') {
      setSelectedDurationKey('One-time purchase');
    } else if (listing.allowedDurations && listing.allowedDurations.length > 0) {
      setSelectedDurationKey(listing.allowedDurations[0]);
    }
  }, [listing]);

  // Compute calculated duration in hours & auto-populate return date/time
  const durationInfo = useMemo(() => {
    if (listing.pricingMethod === 'sale') {
      return {
        hours: 1,
        key: 'One-time purchase',
      };
    }

    let hoursEquivalent = 1;

    const lower = selectedDurationKey.toLowerCase();
    if (lower.includes('1 hour') || lower === '1h') hoursEquivalent = 1;
    else if (lower.includes('2 hour') || lower === '2h') hoursEquivalent = 2;
    else if (lower.includes('3 hour') || lower === '3h') hoursEquivalent = 3;
    else if (lower.includes('custom hour')) hoursEquivalent = Math.max(1, customHours);
    else if (lower.includes('1 period') || lower === '1 college period') hoursEquivalent = collegePeriodMins / 60;
    else if (lower.includes('2 period') || lower === '2 college periods') hoursEquivalent = (collegePeriodMins * 2) / 60;
    else if (lower.includes('3 period') || lower === '3 college periods') hoursEquivalent = (collegePeriodMins * 3) / 60;
    else if (lower.includes('1 day') || lower === '24 hours') hoursEquivalent = 24;
    else if (lower.includes('2 day')) hoursEquivalent = 48;
    else if (lower.includes('3 day')) hoursEquivalent = 72;
    else if (lower.includes('multiple days')) hoursEquivalent = Math.max(2, customDays) * 24;
    else if (lower.includes('1 week') || lower.includes('7 days')) hoursEquivalent = 168;

    const displayKey =
      selectedDurationKey === 'Custom Hours'
        ? `${Math.max(1, customHours)} hours (Custom)`
        : lower.includes('multiple days')
          ? `${Math.max(2, customDays)} days`
          : selectedDurationKey;

    return {
      hours: hoursEquivalent,
      key: displayKey,
    };
  }, [listing.pricingMethod, selectedDurationKey, customHours, customDays, collegePeriodMins]);

  // Calculate return date/time automatically based on pickup & duration
  useEffect(() => {
    if (!pickupDate || !pickupTime) return;
    try {
      const dt = new Date(`${pickupDate}T${pickupTime}`);
      if (isNaN(dt.getTime())) return;

      const returnDt = new Date(dt.getTime() + durationInfo.hours * 60 * 60 * 1000);
      const retDateStr = formatLocalDate(returnDt);
      const retTimeStr = returnDt.toTimeString().substring(0, 5);

      setReturnDate(retDateStr);
      setReturnTime(retTimeStr);
    } catch {
      // ignore
    }
  }, [pickupDate, pickupTime, durationInfo.hours]);

  // Calculate estimated total price
  const estimatedCost = useMemo(() => {
    if (listing.pricingMethod === 'free' || listing.price === 0) {
      return 0;
    }

    if (listing.pricingMethod === 'hourly') {
      return Math.round(listing.price * Math.max(1, Math.ceil(durationInfo.hours)));
    }

    if (listing.pricingMethod === 'period') {
      const periodsCount = Math.max(1, Math.round(durationInfo.hours / (collegePeriodMins / 60)));
      return Math.round(listing.price * periodsCount);
    }

    if (listing.pricingMethod === 'daily') {
      const daysCount = Math.max(1, Math.ceil(durationInfo.hours / 24));
      return Math.round(listing.price * daysCount);
    }

    if (listing.pricingMethod === 'sale') {
      return listing.price;
    }

    if (listing.pricingMethod === 'weekly') {
      const weeksCount = Math.max(1, Math.ceil(durationInfo.hours / 168));
      return Math.round(listing.price * weeksCount);
    }

    return listing.price;
  }, [listing.price, listing.pricingMethod, durationInfo.hours, collegePeriodMins]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (user?.id === listing.ownerId) {
      setErrorMessage('You cannot request your own listed item.');
      return;
    }

    const start = new Date(`${pickupDate}T${pickupTime}`).getTime();
    const end = new Date(`${returnDate}T${returnTime}`).getTime();

    if (isNaN(start) || isNaN(end)) {
      setErrorMessage('Please provide valid pickup and return dates/times.');
      return;
    }

    if (start >= end) {
      setErrorMessage('Expected return time must be after the pickup time.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createRequest({
        listingId: listing.id,
        pickupDate,
        pickupTime,
        durationKey: durationInfo.key,
        durationHours: durationInfo.hours,
        returnDate,
        returnTime,
        estimatedCost,
        note,
      });

      onRequestSuccess(res.request);
      onClose();
    } catch (err: any) {
      setErrorMessage(api.formatError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90dvh] shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-200" />
            <div>
              <h2 className="text-lg font-bold">
                {listing.pricingMethod === 'sale' ? 'Request to Buy (Secondary Option)' : 'Request to Borrow / Rent'}
              </h2>
              <p className="text-xs text-blue-100">Coordinate pickup with student owner</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close request modal"
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Wrapper */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {/* Item Summary Preview */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-3">
            <ProductImage
              src={listing.imageUrl}
              alt={listing.title}
              className="w-14 h-14 rounded-xl object-contain bg-white border border-slate-200 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">{listing.title}</h3>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                Pickup: {listing.campusLocation}
              </p>
              <p className="text-xs text-blue-700 font-semibold mt-0.5">
                Owner: {listing.ownerName} ({listing.ownerDepartment})
              </p>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Duration Selector (Shown for Borrow / Rent listings) */}
          {listing.pricingMethod !== 'sale' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Desired Borrowing Duration
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {listing.allowedDurations.map(dur => (
                  <button
                    type="button"
                    key={dur}
                    onClick={() => setSelectedDurationKey(dur)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                      selectedDurationKey === dur
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    {dur}
                  </button>
                ))}

                {/* Custom Hours option */}
                <button
                  type="button"
                  onClick={() => setSelectedDurationKey('Custom Hours')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                    selectedDurationKey === 'Custom Hours'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  Custom Hours
                </button>
              </div>

              {selectedDurationKey === 'Custom Hours' && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span>Number of hours:</span>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={customHours}
                    onChange={e => setCustomHours(Number(e.target.value) || 1)}
                    className="w-16 px-2 py-1 rounded bg-white border border-slate-300 font-bold text-center"
                  />
                </div>
              )}

              {selectedDurationKey.toLowerCase().includes('multiple day') && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span>Number of days:</span>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={customDays}
                    onChange={e => setCustomDays(Math.max(2, Number(e.target.value) || 2))}
                    className="w-16 px-2 py-1 rounded bg-white border border-slate-300 font-bold text-center"
                  />
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-2">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>
                  Standard college period is configured as <strong>{collegePeriodMins} minutes</strong>.
                </span>
              </div>
            </div>
          )}

          {/* Pickup Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Pickup Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={todayStr}
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Pickup Time
              </label>
              <input
                type="time"
                value={pickupTime}
                onChange={e => setPickupTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Expected Return Date & Time (for Borrow / Rent) */}
          {listing.pricingMethod !== 'sale' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Expected Return Date
                </label>
                <input
                  type="date"
                  min={pickupDate || todayStr}
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Expected Return Time
                </label>
                <input
                  type="time"
                  value={returnTime}
                  onChange={e => setReturnTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Note to Owner (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. I need it for the 2:00 PM digital electronics lab in Room 204. Will take utmost care."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Pricing & Return Details Summary Box */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl border border-blue-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {listing.pricingMethod === 'sale' ? 'One-Time Purchase Price' : 'Estimated Total'}
                </span>
                <span className="text-xs text-slate-600">
                  {listing.pricingMethod === 'sale'
                    ? 'Secondary buy/sell option'
                    : `Rate: ${listing.price === 0 || listing.pricingMethod === 'free' ? 'Free Borrow' : `₹${listing.price} ${{ hourly: '/ hour', daily: '/ day', period: '/ period', weekly: '/ week' }[listing.pricingMethod] || `/ ${listing.pricingMethod}`}`}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-blue-700">
                  {estimatedCost === 0 ? 'FREE' : `₹${estimatedCost}`}
                </span>
                <p className="text-[10px] text-slate-600">No platform fee</p>
              </div>
            </div>

            {listing.pricingMethod !== 'sale' && (
              <div className="pt-2 border-t border-blue-200/70 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Agreed Duration
                  </span>
                  <span className="font-bold text-slate-900">{durationInfo.key}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Expected Return Time
                  </span>
                  <span className="font-bold text-slate-900">
                    {returnDate} at {returnTime}
                  </span>
                </div>
              </div>
            )}
          </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 pb-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {submitting
                  ? 'Submitting...'
                  : listing.pricingMethod === 'sale'
                    ? 'Send Purchase Request'
                    : 'Send Borrow Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
