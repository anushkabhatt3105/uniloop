import React from 'react';
import { Repeat, ShieldCheck, Heart, MapPin, Mail, PhoneCall } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Repeat className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">UniLoop</span>
            </div>
            <p className="text-xs text-blue-400 font-semibold tracking-wide">
              Share More. Spend Less.
            </p>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              UniLoop is a student-first campus platform focused on borrowing, lending, and renting academic resources safely and affordably—helping students save money without buying forever. Buying and selling remain available as secondary options.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero data brokering • Strict phone number privacy</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Borrow & Lend
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('explore')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Borrow & Rent Items
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('create-listing')}
                  className="hover:text-blue-400 transition-colors"
                >
                  List an Item
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Student Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-blue-400 transition-colors"
                >
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Privacy & Safety */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Privacy & Trust
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-400 font-bold">•</span>
                <span>No public phone numbers</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-400 font-bold">•</span>
                <span>Owner permission required for phone sharing</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-400 font-bold">•</span>
                <span>Safe public campus hand-off points</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-400 font-bold">•</span>
                <span>Physical return confirmations</span>
              </li>
            </ul>
          </div>

          {/* Campus Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Campus Support
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>support@uniloop.campus.in</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Apex Institute Campus Center</span>
              </p>
              <p className="text-[11px] text-slate-500 pt-2">
                Operating for student welfare during academic hours (8:00 AM – 8:00 PM).
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 UniLoop Platform. Built for College Students.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for smarter, sustainable campuses.
          </p>
        </div>
      </div>
    </footer>
  );
};
