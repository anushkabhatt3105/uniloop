import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Repeat,
  PlusCircle,
  Compass,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, itemId?: string) => void;
  incomingPendingCount?: number;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  incomingPendingCount = 0,
  onOpenProfile,
}) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Repeat className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  UniLoop
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Campus
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-tight -mt-0.5 hidden sm:block">
                Share More. Spend Less.
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNav('home')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'home'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => handleNav('explore')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                currentView === 'explore'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              Borrow & Rent
            </button>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login');
                } else {
                  handleNav('create-listing');
                }
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                currentView === 'create-listing'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              List an Item
            </button>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login');
                } else {
                  handleNav('dashboard');
                }
              }}
              className={`relative px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                currentView === 'dashboard'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              My Dashboard
              {incomingPendingCount > 0 && (
                <span className="flex items-center justify-center bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full animate-bounce">
                  {incomingPendingCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action / Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                        {user.name}
                      </span>
                      {user.isVerifiedCollegeEmail && (
                        <span title="College Email Verified">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-none truncate max-w-[120px]">
                      {user.department || user.college}
                    </span>
                  </div>
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                          <CheckCircle className="w-3 h-3" /> Campus Member
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        My Profile & Phone Privacy
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNav('dashboard');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                        Item Requests & Borrowings
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 transition-all"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all"
                >
                  Student Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-6 space-y-2">
          {isAuthenticated && user && (
            <div className="p-3 mb-2 bg-blue-50/60 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.college}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfile();
                }}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Profile
              </button>
            </div>
          )}

          <button
            onClick={() => handleNav('home')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Home
          </button>
          <button
            onClick={() => handleNav('explore')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Compass className="w-4 h-4 text-blue-600" />
            Borrow & Rent
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setMobileMenuOpen(false);
                openAuthModal('login');
              } else {
                handleNav('create-listing');
              }
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            List an Item
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setMobileMenuOpen(false);
                openAuthModal('login');
              } else {
                handleNav('dashboard');
              }
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              My Dashboard
            </span>
            {incomingPendingCount > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {incomingPendingCount} pending
              </span>
            )}
          </button>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                Log Out
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-slate-700 border border-slate-200"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('register');
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-white bg-blue-600 shadow-sm"
                >
                  Student Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
