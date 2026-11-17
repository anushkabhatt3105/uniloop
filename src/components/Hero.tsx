import React from 'react';
import { Compass, PlusCircle, ShieldCheck, Sparkles, IndianRupee, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface HeroProps {
  onExplore: () => void;
  onListItem: () => void;
  onExploreBuySell?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore, onListItem, onExploreBuySell }) => {
  const { isAuthenticated, openAuthModal } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white py-12 md:py-20 border-b border-slate-100">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-72 bg-gradient-to-tr from-blue-400/10 via-emerald-400/10 to-indigo-400/10 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Campus Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold mb-6 border border-blue-200/80 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Campus-Only Borrow, Lend & Rent Platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Need It for a Day? <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
            Don't Buy It Forever.
          </span>
        </h1>

        {/* Supporting text */}
        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Borrow academic gear for free or rent it for a few hours or days from students on your campus.
          Lend out idle items to help peers—without anyone having to buy new.
        </p>

        {/* Call-to-action Buttons: Borrow & Lend Primary */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={onExplore}
            className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            Borrow & Rent Items
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal('login');
              else onListItem();
            }}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            List an Item
          </button>
        </div>

        {/* Secondary Buy/Sell link */}
        {onExploreBuySell && (
          <div className="mt-4">
            <button
              onClick={onExploreBuySell}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Buying & selling is secondary — browse student Buy & Sell listings →
            </button>
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Campus Verified</p>
              <p className="text-[10px] text-slate-500">Student email verified</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Zero Platform Fee</p>
              <p className="text-[10px] text-slate-500">Free or direct rental</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Student Privacy</p>
              <p className="text-[10px] text-slate-500">Protected contact details</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Flexible Periods</p>
              <p className="text-[10px] text-slate-500">Hourly, daily or per-class</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
