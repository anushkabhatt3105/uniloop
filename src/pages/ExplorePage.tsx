import React, { useState, useEffect } from 'react';
import { Listing, ItemCategory, RequestStatus } from '../types/index.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { ListingCard } from '../components/ListingCard.js';
import {
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface ExplorePageProps {
  initialCategory?: ItemCategory | 'All';
  initialPricingFilter?: string;
  onItemClick: (listing: Listing) => void;
  onRequestClick: (listing: Listing) => void;
  refreshTrigger?: number;
}

type ExplorePricingFilter =
  | 'All'
  | 'borrow_rent'
  | 'rentals'
  | 'free'
  | 'hourly'
  | 'period'
  | 'daily'
  | 'weekly'
  | 'sale';

export const ExplorePage: React.FC<ExplorePageProps> = ({
  initialCategory = 'All',
  initialPricingFilter = 'All',
  onItemClick,
  onRequestClick,
  refreshTrigger = 0,
}) => {
  const { isAuthenticated } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [userRequestMap, setUserRequestMap] = useState<Record<string, RequestStatus>>({});
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'All'>(initialCategory);
  const [pricingFilter, setPricingFilter] = useState<ExplorePricingFilter>(
    (initialPricingFilter as ExplorePricingFilter) || 'All'
  );
  const [freeOnly, setFreeOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(50);
  const [sortBy, setSortBy] = useState<'newest' | 'lowest_price' | 'highest_price'>('newest');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Sync category & pricing filter if props change
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialPricingFilter) {
      setPricingFilter(initialPricingFilter as ExplorePricingFilter);
    }
  }, [initialPricingFilter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const [res, reqRes] = await Promise.all([
        api.getListings({
          q: searchQuery,
          category: selectedCategory,
          pricingMethod: pricingFilter,
          freeOnly: freeOnly,
          availableOnly: availableOnly,
          maxPrice: maxPrice < 50 ? maxPrice : undefined,
          sort: sortBy,
        }),
        isAuthenticated ? api.getMyRequests().catch(() => ({ requests: [] })) : Promise.resolve({ requests: [] }),
      ]);

      setListings(res.listings);

      const statusMap: Record<string, RequestStatus> = {};
      for (const req of reqRes.requests) {
        if (['pending', 'accepted', 'borrowed', 'return_requested'].includes(req.status)) {
          if (!statusMap[req.listingId]) {
            statusMap[req.listingId] = req.status;
          }
        }
      }
      setUserRequestMap(statusMap);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, pricingFilter, freeOnly, availableOnly, maxPrice, sortBy, refreshTrigger, isAuthenticated]);

  const categoriesList: (ItemCategory | 'All')[] = [
    'All',
    'Electronics',
    'Academic Equipment',
    'Books and Notes',
    'Lab Equipment',
    'Stationery',
    'Other',
  ];

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setPricingFilter('All');
    setFreeOnly(false);
    setAvailableOnly(false);
    setMaxPrice(50);
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'All' ||
    pricingFilter !== 'All' ||
    freeOnly ||
    availableOnly ||
    maxPrice < 50 ||
    sortBy !== 'newest';

  const pricingLabels: Record<ExplorePricingFilter, string> = {
    All: 'All Models',
    borrow_rent: 'Borrow & Rent',
    free: 'Free Borrow',
    rentals: 'All Rentals',
    hourly: 'Per Hour',
    period: 'Per Period',
    daily: 'Per Day',
    weekly: 'Per Week',
    sale: 'Buy & Sell (Secondary)',
  };

  return (
    <div className="py-8 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Search Bar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Borrow, Rent & Explore Campus Gear
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Borrow academic gear for free or rent by the hour or day from fellow students.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search charger, calculator, lab coat, book, drafter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Horizontal Scroll Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Secondary Controls Bar: Filters Toggle, Free Toggle, Sort */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showFiltersMobile
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters & Price</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={freeOnly}
                  onChange={e => setFreeOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>Free Borrowing Only</span>
              </label>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={e => setAvailableOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Available Now Only</span>
              </label>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline px-1 cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="newest">Borrow & Rent First</option>
                  <option value="lowest_price">Lowest Price (₹ - High)</option>
                  <option value="highest_price">Highest Price</option>
                </select>
              </div>
            </div>
          </div>

          {/* Expanded Filter Panel */}
          {showFiltersMobile && (
            <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
              {/* Pricing Method */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Sharing & Pricing Basis
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['All', 'borrow_rent', 'free', 'rentals', 'hourly', 'period', 'daily', 'weekly', 'sale'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPricingFilter(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        pricingFilter === p
                          ? p === 'sale'
                            ? 'border-slate-700 bg-slate-700 text-white'
                            : 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pricingLabels[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Max Price
                  </label>
                  <span className="text-xs font-extrabold text-blue-600">
                    {maxPrice >= 50 ? 'Any Price' : `Up to ₹${maxPrice}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-medium">
                  <span>₹0 (Free)</span>
                  <span>₹25</span>
                  <span>₹50+</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Listings Count Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing <strong className="text-slate-900">{listings.length}</strong> items on campus
          </span>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div
                key={n}
                className="h-80 rounded-2xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No matching campus items found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Try adjusting your search keywords, clearing your filters, or be the first student to list this item!
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                userRequestStatus={userRequestMap[listing.id]}
                onClick={() => onItemClick(listing)}
                onRequestClick={e => {
                  e.stopPropagation();
                  onRequestClick(listing);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
