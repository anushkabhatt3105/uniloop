import React, { useState } from 'react';
import { ItemCategory, ItemCondition, PricingMethod, Listing } from '../types/index.js';
import { api } from '../lib/api.js';
import { compressImageFile } from '../lib/imageUtils.js';
import { useAuth } from '../context/AuthContext.js';
import {
  PlusCircle,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  MapPin,
  Clock,
  ArrowLeft,
  X,
} from 'lucide-react';

interface CreateListingPageProps {
  onSuccess: (newListing: Listing) => void;
  onCancel: () => void;
}

export const CreateListingPage: React.FC<CreateListingPageProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Electronics');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('Like New');
  const [uploadedImageDataUrl, setUploadedImageDataUrl] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [previewLoadError, setPreviewLoadError] = useState(false);
  const [campusLocation, setCampusLocation] = useState('Central Library Foyer');
  const [availabilityHours, setAvailabilityHours] = useState('Mon - Fri, 9:00 AM - 5:00 PM');
  const [pricingMethod, setPricingMethod] = useState<PricingMethod>('hourly');
  const [price, setPrice] = useState<number>(10);
  const [quantity, setQuantity] = useState<number>(1);
  const [usageInstructions, setUsageInstructions] = useState('');

  // Durations checkboxes
  const defaultDurations = ['1 hour', '2 hours', '3 hours', '1 day', 'Multiple days', '1 period', '2 periods', '1 week'];
  const [selectedDurations, setSelectedDurations] = useState<string[]>(['1 hour', '2 hours', '3 hours', '1 day']);
  const [customDurationInput, setCustomDurationInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePreviewUrl = customImageUrl.trim() || uploadedImageDataUrl;

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
    if (customDurationInput.trim() && !selectedDurations.includes(customDurationInput.trim())) {
      setSelectedDurations([...selectedDurations, customDurationInput.trim()]);
      setCustomDurationInput('');
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreviewLoadError(false);
    try {
      const compressed = await compressImageFile(file);
      setUploadedImageDataUrl(compressed);
      setCustomImageUrl('');
    } catch (err: any) {
      setError(err.message || 'Could not process the selected image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !campusLocation.trim()) {
      setError('Please fill in all mandatory listing fields.');
      return;
    }

    if (pricingMethod !== 'sale' && selectedDurations.length === 0) {
      setError('Please specify at least one allowable borrowing duration.');
      return;
    }

    if (customImageUrl.trim() && previewLoadError) {
      setError('The entered image URL could not be loaded. Please upload a photo from your device or enter a valid image URL.');
      return;
    }

    try {
      setSubmitting(true);
      const finalImage = activePreviewUrl;
      const res = await api.createListing({
        title,
        category,
        description,
        condition,
        imageUrl: finalImage,
        campusLocation,
        availabilityHours,
        pricingMethod,
        price: pricingMethod === 'free' ? 0 : Number(price) || 0,
        allowedDurations: pricingMethod === 'sale' ? ['One-time purchase'] : selectedDurations,
        usageInstructions,
        quantity,
      });

      onSuccess(res.listing);
    } catch (err: any) {
      setError(api.formatError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <span className="text-xs font-semibold text-slate-500">
            Posting as: <strong className="text-slate-800">{user?.name}</strong> ({user?.department})
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Lend or Rent Out an Item on Campus
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Lend free of charge or set your own hourly/daily rental rate so fellow students can borrow temporarily. (Selling is also available as a secondary option.)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {user?.emailVerified === false && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Please verify your email address ({user.email}) before publishing a listing. Click <strong>I Verified</strong> in the top bar once confirmed.
                </span>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Item Name / Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Dell 65W USB-C Fast Charger"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ItemCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Item Condition *
                  </label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value as ItemCondition)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe specifications, port types, model, whether it includes cables or batteries, etc."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Photo Selection / Upload */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Item Photo (Upload or Enter URL)
              </label>

              {/* Current Preview */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0">
                  {activePreviewUrl && !previewLoadError ? (
                    <img
                      src={activePreviewUrl}
                      alt="Selected Photo Preview"
                      onError={() => setPreviewLoadError(true)}
                      className="w-full h-full object-contain bg-white"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center px-2 text-slate-400">
                      <ImageIcon className={`w-6 h-6 mb-1 ${previewLoadError ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span className={`text-[10px] font-semibold leading-tight ${previewLoadError ? 'text-rose-500' : 'text-slate-400'}`}>
                        {previewLoadError ? 'Invalid URL' : 'No photo yet'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold text-slate-800">Selected Photo Preview</p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload from device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    {activePreviewUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImageDataUrl('');
                          setCustomImageUrl('');
                          setPreviewLoadError(false);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-200 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={e => {
                      setCustomImageUrl(e.target.value);
                      setPreviewLoadError(false);
                    }}
                    placeholder="Or paste an image URL (https://...)"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {previewLoadError && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      Could not load image from this URL. Please check the link or upload a photo from your device.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing & Duration Models */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Lending / Rental Terms & Durations (Primary)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Owner sets rental rate or lends free
                </span>
              </div>

              {/* Mode Quick Picker: Free Lend vs Paid Rent vs Sell */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPricingMethod('free')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    pricingMethod === 'free'
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-extrabold text-emerald-700">Lend Free of Charge</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">₹0 • Help fellow students</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (pricingMethod === 'free' || pricingMethod === 'sale') {
                      setPricingMethod('hourly');
                    }
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    ['hourly', 'daily', 'period', 'weekly'].includes(pricingMethod)
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-extrabold text-blue-700">Rent Out (Set Rate)</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Per hour, day, period, or week</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPricingMethod('sale')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    pricingMethod === 'sale'
                      ? 'border-slate-700 bg-slate-100 ring-2 ring-slate-400/30'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-700">Sell Item</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">One-time purchase only</p>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Pricing Basis
                  </label>
                  <select
                    value={pricingMethod}
                    onChange={e => setPricingMethod(e.target.value as PricingMethod)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {pricingMethod === 'sale'
                      ? 'Selling Price in ₹ (INR)'
                      : `Your Rental Price in ₹ (INR) ${pricingMethod === 'free' ? '(Free — ₹0)' : ''}`}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      disabled={pricingMethod === 'free'}
                      value={pricingMethod === 'free' ? 0 : price}
                      onChange={e => setPrice(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Durations Checkboxes (for Borrow / Rent only) */}
              {pricingMethod !== 'sale' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Offered Borrowing Durations (Check all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {defaultDurations.map(dur => (
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

                  {/* Add Custom Duration */}
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
            </div>

            {/* Campus Hand-off Location & Hours */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Campus Logistics & Instructions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Pickup Location on Campus *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={campusLocation}
                      onChange={e => setCampusLocation(e.target.value)}
                      placeholder="e.g. Central Library 2nd Floor or CS Lab 3"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Availability Dates & Times *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={availabilityHours}
                      onChange={e => setAvailabilityHours(e.target.value)}
                      placeholder="e.g. Mon - Fri, 9:00 AM - 5:00 PM"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Optional Usage Instructions / Care Guidelines
                  </label>
                  <input
                    type="text"
                    value={usageInstructions}
                    onChange={e => setUsageInstructions(e.target.value)}
                    placeholder="e.g. Keep away from water, return folded, do not erase memory, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Quantity Available
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? 'Publishing...' : 'Publish Campus Listing'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
