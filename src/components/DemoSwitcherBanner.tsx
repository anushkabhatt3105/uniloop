import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { CheckCircle2, Sparkles, RefreshCw, ShieldAlert } from 'lucide-react';

interface DemoSwitcherBannerProps {
  onRefreshData?: () => void;
}

export const DemoSwitcherBanner: React.FC<DemoSwitcherBannerProps> = () => {
  const {
    user,
    isAuthenticated,
    openAuthModal,
    resendVerificationEmail,
    refreshUser,
  } = useAuth();
  const [resending, setResending] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setBannerError(null);
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await resendVerificationEmail();
      showNotice('Verification email resent! Please check your inbox.');
    } catch (err: any) {
      setBannerError(api.formatError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <aside aria-label="Campus Firebase Status Bar" className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-2 px-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-400/30">
            <Sparkles className="w-3 h-3 text-blue-400" />
            UniLoop Live (Firebase)
          </span>

          {isAuthenticated && user ? (
            user.emailVerified === false ? (
              <div className="flex items-center gap-2 text-amber-300 flex-wrap">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Verify your email ({user.email}) to publish listings & submit requests.</span>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold"
                >
                  {resending ? 'Sending...' : 'Resend Link'}
                </button>
                <button
                  onClick={() => refreshUser()}
                  className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> I Verified
                </button>
              </div>
            ) : (
              <span className="text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Signed in as <strong className="text-white">{user.name}</strong> ({user.email})
              </span>
            )
          ) : (
            <span className="text-slate-300">
              Sign in with Google or your college email to list items & submit live borrow requests.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {bannerNotice && (
            <span className="text-emerald-400 font-medium">
              ✓ {bannerNotice}
            </span>
          )}
          {bannerError && (
            <span className="text-rose-400 font-medium">
              ! {bannerError}
            </span>
          )}

          {!isAuthenticated && (
            <button
              onClick={() => openAuthModal('login')}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
