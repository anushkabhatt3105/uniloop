/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { DemoSwitcherBanner } from './components/DemoSwitcherBanner.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { HomePage } from './pages/HomePage.js';
import { ExplorePage } from './pages/ExplorePage.js';
import { ItemDetailPage } from './pages/ItemDetailPage.js';
import { CreateListingPage } from './pages/CreateListingPage.js';
import { EditListingPage } from './pages/EditListingPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AuthModal } from './components/AuthModal.js';
import { ProfileModal } from './components/ProfileModal.js';
import { RequestItemModal } from './components/RequestItemModal.js';
import { Listing, ItemCategory, BorrowRequest } from './types/index.js';
import { api } from './lib/api.js';

function MainApp() {
  const {
    user,
    isAuthenticated,
    openAuthModal,
    needsProfileCompletion,
    dismissProfileCompletion,
  } = useAuth();

  const [currentView, setCurrentView] = useState<string>('home');
  const [dashboardInitialTab, setDashboardInitialTab] = useState<'incoming' | 'my-requests' | 'borrowed' | 'my-listings' | 'history'>('incoming');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [exploreCategory, setExploreCategory] = useState<ItemCategory | 'All'>('All');
  const [explorePricingFilter, setExplorePricingFilter] = useState<string>('All');

  // Modals
  const [requestModalListing, setRequestModalListing] = useState<Listing | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Incoming pending count for navbar indicator
  const [pendingIncomingCount, setPendingIncomingCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Live incoming pending requests count for the logged-in owner
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setPendingIncomingCount(0);
      return;
    }

    const unsubscribe = api.subscribeToRequests(({ incoming }) => {
      const pending = incoming.filter(r => r.status === 'pending').length;
      setPendingIncomingCount(pending);
    });

    return () => unsubscribe();
  }, [isAuthenticated, user?.id, refreshTrigger]);

  useEffect(() => {
    if (needsProfileCompletion && isAuthenticated) {
      setProfileModalOpen(true);
    }
  }, [needsProfileCompletion, isAuthenticated]);

  const handleNavigate = (view: string, itemId?: string) => {
    if ((view === 'create-listing' || view === 'edit-listing' || view === 'dashboard') && !isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (view === 'dashboard') {
      setDashboardInitialTab('incoming');
    }
    if (view === 'explore') {
      setExploreCategory('All');
      setExplorePricingFilter('All');
    }
    if (itemId) {
      setSelectedListingId(itemId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemClick = (listing: Listing) => {
    setSelectedListingId(listing.id);
    setCurrentView('item-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestClick = (listing: Listing) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setRequestModalListing(listing);
  };

  const handleRequestSuccess = (_newRequest: BorrowRequest) => {
    setRefreshTrigger(prev => prev + 1);
    setDashboardInitialTab('my-requests');
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Demo Switcher for fast evaluation */}
      <DemoSwitcherBanner onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />

      {/* Main App Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        incomingPendingCount={pendingIncomingCount}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectCategory={cat => {
              setExploreCategory(cat);
              setExplorePricingFilter('All');
              setCurrentView('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExploreBorrowRent={() => {
              setExploreCategory('All');
              setExplorePricingFilter('borrow_rent');
              setCurrentView('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExploreBuySell={() => {
              setExploreCategory('All');
              setExplorePricingFilter('sale');
              setCurrentView('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onItemClick={handleItemClick}
            onRequestClick={handleRequestClick}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'explore' && (
          <ExplorePage
            initialCategory={exploreCategory}
            initialPricingFilter={explorePricingFilter}
            onItemClick={handleItemClick}
            onRequestClick={handleRequestClick}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'item-detail' && selectedListingId && (
          <ItemDetailPage
            listingId={selectedListingId}
            onBack={() => {
              setCurrentView('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRequestClick={handleRequestClick}
          />
        )}

        {currentView === 'create-listing' && (
          <CreateListingPage
            onSuccess={newListing => {
              setRefreshTrigger(prev => prev + 1);
              setSelectedListingId(newListing.id);
              setCurrentView('item-detail');
            }}
            onCancel={() => handleNavigate('home')}
          />
        )}

        {currentView === 'edit-listing' && selectedListingId && (
          <EditListingPage
            listingId={selectedListingId}
            onSuccess={updated => {
              setRefreshTrigger(prev => prev + 1);
              setSelectedListingId(updated.id);
              setCurrentView('item-detail');
            }}
            onDeleted={() => {
              setRefreshTrigger(prev => prev + 1);
              setCurrentView('dashboard');
            }}
            onCancel={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardPage
            onNavigate={handleNavigate}
            initialTab={dashboardInitialTab}
            onDataChanged={() => setRefreshTrigger(prev => prev + 1)}
            onOpenProfile={() => setProfileModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Modals */}
      <AuthModal />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          dismissProfileCompletion();
        }}
      />

      {requestModalListing && (
        <RequestItemModal
          listing={requestModalListing}
          isOpen={!!requestModalListing}
          onClose={() => setRequestModalListing(null)}
          onRequestSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
