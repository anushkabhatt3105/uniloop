import React, { useState, useEffect } from 'react';
import { Hero } from '../components/Hero.js';
import { HowItWorks } from '../components/HowItWorks.js';
import { CategoriesSection } from '../components/CategoriesSection.js';
import { WhyUniLoop } from '../components/WhyUniLoop.js';
import { ListingCard } from '../components/ListingCard.js';
import { Listing, ItemCategory, RequestStatus } from '../types/index.js';
import { api } from '../lib/api.js';
import { Compass, ArrowRight, Sparkles, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface HomePageProps {
  onNavigate: (view: string, itemId?: string) => void;
  onSelectCategory: (cat: ItemCategory) => void;
  onExploreBorrowRent?: () => void;
  onExploreBuySell?: () => void;
  onItemClick: (item: Listing) => void;
  onRequestClick: (item: Listing) => void;
  refreshTrigger?: number;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectCategory,
  onExploreBorrowRent,
  onExploreBuySell,
  onItemClick,
  onRequestClick,
  refreshTrigger = 0,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [userRequestMap, setUserRequestMap] = useState<Record<string, RequestStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [listRes, reqRes] = await Promise.all([
          api.getListings(),
          isAuthenticated ? api.getMyRequests().catch(() => ({ requests: [] })) : Promise.resolve({ requests: [] }),
        ]);

        if (!active) return;

        const borrowRentItems = listRes.listings.filter(l => l.pricingMethod !== 'sale');
        setFeaturedListings(
          (borrowRentItems.length > 0 ? borrowRentItems : listRes.listings).slice(0, 6)
        );

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
        console.error('Error fetching featured listings:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [refreshTrigger, isAuthenticated]);

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <Hero
        onExplore={onExploreBorrowRent || (() => onNavigate('explore'))}
        onExploreBuySell={onExploreBuySell}
        onListItem={() => {
          if (!isAuthenticated) openAuthModal('login');
          else onNavigate('create-listing');
        }}
      />

      {/* Featured Listings Preview */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Featured Campus Resources
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Available to Borrow & Rent Right Now
              </h2>
            </div>
            <button
              onClick={onExploreBorrowRent || (() => onNavigate('explore'))}
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <span>View all borrow & rent items</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div
                  key={n}
                  className="h-80 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
                />
              ))}
            </div>
          ) : featuredListings.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-sm font-semibold text-slate-600">No items currently available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map(listing => (
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

          <div className="mt-10 text-center">
            <button
              onClick={() => onNavigate('explore')}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Explore All Campus Items</span>
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Popular Categories */}
      <CategoriesSection
        onSelectCategory={cat => {
          onSelectCategory(cat);
        }}
      />

      {/* Why UniLoop */}
      <WhyUniLoop />

      {/* Student Call-to-action Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Have Gear Lying Idle in Your Hostel or Locker?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Lend your unused calculators, extra chargers, lab coats, and textbooks completely free or set your own hourly or daily rental rate. Help a fellow student save money today!
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (!isAuthenticated) openAuthModal('login');
                else onNavigate('create-listing');
              }}
              className="px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-blue-900 font-extrabold text-sm shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Lend or Rent Out an Item on UniLoop</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
