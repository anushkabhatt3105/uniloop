import React, { useState, useEffect } from 'react';
import { ItemCategory, ItemCondition, PricingMethod, Listing } from '../types/index.js';
import { api } from '../lib/api.js';
import { compressImageFile } from '../lib/imageUtils.js';
import { useAuth } from '../context/AuthContext.js';
import { ProductImage } from '../components/ProductImage.js';
import { ArrowLeft, Save, AlertCircle, Trash2, Upload } from 'lucide-react';

interface EditListingPageProps {
  listingId: string;
  onSuccess: (updated: Listing) => void;
  onDeleted: () => void;
  onCancel: () => void;
}

export const EditListingPage: React.FC<EditListingPageProps> = ({
  listingId,
  onSuccess,
  onDeleted,
  onCancel,
}) => {
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Electronics');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [imageUrl, setImageUrl] = useState('');
  const [campusLocation, setCampusLocation] = useState('');
  const [availabilityHours, setAvailabilityHours] = useState('');
  const [pricingMethod, setPricingMethod] = useState<PricingMethod>('hourly');
  const [price, setPrice] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [usageInstructions, setUsageInstructions] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const defaultDurations = ['1 hour', '2 hours', '3 hours', '1 day', 'Multiple days', '1 period', '2 periods', '1 week'];
  const [selectedDurations, setSelectedDurations] = useState<string[]>(['1 hour', '2 hours', '3 hours', '1 day']);
  const [customDurationInput, setCustomDurationInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getListing(listingId)
      .then(res => {
        setListing(res);
        setTitle(res.title);
        setCategory(res.category);
        setDescription(res.description);
        setCondition(res.condition);
        setImageUrl(res.imageUrl);
        setCampusLocation(res.campusLocation);
        setAvailabilityHours(res.availabilityHours);
        setPricingMethod(res.pricingMethod);
        setPrice(res.price);
        setIsAvailable(res.isAvailable);
        setUsageInstructions(res.usageInstructions || '');
        setQuantity(res.quantity || 1);
        setSelectedDurations(
          Array.isArray(res.allowedDurations) && res.allowedDurations.length > 0
            ? res.allowedDurations
            : ['1 hour', '2 hours']
        );
      })
      .catch(err => {
        setError(api.formatError(err));
      })
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-sm text-slate-500">Listing not found.</p>
        <button onClick={onCancel} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Go Back
        </button>
      </div>
    );
  }

  if (user?.id !== listing.ownerId) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">Access Denied</h3>
        <p className="text-xs text-slate-500 mt-1">You are only permitted to edit listings created by you.</p>
        <button onClick={onCancel} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
          Back
        </button>
      </div>
    );
  }

  const handleToggleDuration = (dur: string) => {
    if (selectedDurations.includes(dur)) {
      if (selectedDurations.length > 1) {
        setSelectedDurations(selectedDurations.filter(d => d !== dur));
      }
    } else {
      setSelectedDurations([...selectedDurations, dur]);
    }
  };

  const handleAddCustomDuration = () => {
    const trimmed = customDurationInput.trim();
    if (trimmed && !selectedDurations.includes(trimmed)) {
      setSelectedDurations([...selectedDurations, trimmed]);
      setCustomDurationInput('');
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImageFile(file);
      setImageUrl(compressed);
    } catch (err: any) {
      setError(err.message || 'Could not process the selected image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pricingMethod !== 'sale' && selectedDurations.length === 0) {
      setError('Please keep at least one borrowing duration.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.updateListing(listing.id, {
        title,
        category,
        description,
        condition,
        imageUrl,
        campusLocation,
        availabilityHours,
        pricingMethod,
        price: pricingMethod === 'free' ? 0 : Number(price) || 0,
        allowedDurations: pricingMethod === 'sale' ? ['One-time purchase'] : selectedDurations,
        quantity,
        isAvailable,
        usageInstructions,
      });

      onSuccess(res.listing);
    } catch (err: any) {
      setError(api.formatError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await api.deleteListing(listing.id);
      onDeleted();
    } catch (err: any) {
      setError(api.formatError(err));
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="py-8 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {!confirmingDelete ? (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Listing</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-rose-800">Permanently delete?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
          <h1 className="text-xl font-black text-slate-900 tracking-tight mb-4">
            Edit Listing Details
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Item Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ItemCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Academic Equipment">Academic Equipment</option>
                  <option value="Books and Notes">Books and Notes</option>
                  <option value="Lab Equipment">Lab Equipment</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value as ItemCondition)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="Brand New">Brand New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
              />
            </div>

            {/* Photo Edit */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-4">
              <ProductImage
                src={imageUrl}
                alt={title || 'Listing photo'}
                className="w-20 h-20 rounded-xl object-contain bg-white border border-slate-200 shrink-0"
              />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Item Photo</span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload new photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder={imageUrl.startsWith('data:') ? 'Custom uploaded photo (or paste URL to replace)' : 'Image URL (https://...)'}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Pricing Basis
                </label>
                <select
                  value={pricingMethod}
                  onChange={e => setPricingMethod(e.target.value as PricingMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="free">Free Borrowing (₹0)</option>
                  <option value="hourly">Rent — Per hour</option>
                  <option value="daily">Rent — Per day</option>
                  <option value="period">Rent — Per college period</option>
                  <option value="weekly">Rent — Per week</option>
                  <option value="sale">Sell — One-time purchase</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Price in ₹
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={pricingMethod === 'free'}
                  value={pricingMethod === 'free' ? 0 : price}
                  onChange={e => setPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Borrowing Durations */}
            {pricingMethod !== 'sale' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Offered Borrowing Durations
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...defaultDurations, ...selectedDurations.filter(d => d !== 'One-time purchase')])).map(dur => (
                    <button
                      type="button"
                      key={dur}
                      onClick={() => handleToggleDuration(dur)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedDurations.includes(dur)
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {selectedDurations.includes(dur) && '✓ '}
                      {dur}
                    </button>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    placeholder="Add custom duration (e.g. 3 college periods)"
                    value={customDurationInput}
                    onChange={e => setCustomDurationInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDuration}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={campusLocation}
                  onChange={e => setCampusLocation(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Availability Hours
                </label>
                <input
                  type="text"
                  value={availabilityHours}
                  onChange={e => setAvailabilityHours(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Availability Status
                </label>
                <select
                  value={isAvailable ? 'true' : 'false'}
                  onChange={e => setIsAvailable(e.target.value === 'true')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="true">Available for Requests</option>
                  <option value="false">Unavailable / Locked</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Usage Instructions
                </label>
                <input
                  type="text"
                  value={usageInstructions}
                  onChange={e => setUsageInstructions(e.target.value)}
                  placeholder="Optional care guidelines"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
