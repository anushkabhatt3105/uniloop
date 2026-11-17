import React, { useState } from 'react';
import { BorrowRequest } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { Phone, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface PhoneShareModalProps {
  request: BorrowRequest;
  isOpen: boolean;
  onClose: () => void;
  onDecisionMade: (updatedRequest: BorrowRequest) => void;
  onOpenProfile?: () => void;
}

export const PhoneShareModal: React.FC<PhoneShareModalProps> = ({
  request,
  isOpen,
  onClose,
  onDecisionMade,
  onOpenProfile,
}) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const trimmedPhone = user?.phone?.trim() || '';
  const hasPhoneInProfile = Boolean(trimmedPhone);

  const handleChoice = async (sharePhone: boolean) => {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      const res = await api.setPhonePrivacy(request.id, sharePhone);
      onDecisionMade(res.request);
      onClose();
    } catch (err: any) {
      setErrorMessage(api.formatError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90dvh] shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Contact Privacy & Permission</h2>
              <p className="text-xs text-blue-100">Owner-Controlled Sharing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact privacy modal"
            className="p-1 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-2">
              <p>{errorMessage}</p>
              {!hasPhoneInProfile && onOpenProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Open Profile to Add Phone Number
                </button>
              )}
            </div>
          )}

          <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-100">
            <h3 className="text-sm font-bold text-slate-900">
              Request Accepted for "{request.listingTitle}"
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Borrower: <strong className="text-slate-800">{request.borrowerName}</strong> ({request.borrowerDepartment}, {request.borrowerCollege})
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2">
            <p className="text-sm font-bold text-slate-900">
              Would you like to share your phone number with this student?
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              In accordance with UniLoop privacy standards, your phone number is never shown publicly. If you choose to share it, only <strong>{request.borrowerName}</strong> will receive access to call or text you for coordinating item pickup.
            </p>

            {hasPhoneInProfile ? (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Your profile phone number:</span>
                <span className="font-mono font-bold text-slate-800">{trimmedPhone}</span>
              </div>
            ) : (
              <div className="mt-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    You have not added a phone number to your profile yet. You can still choose <strong>Keep Number Private</strong>, or add your phone number in Profile to share it.
                  </span>
                </div>
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProfile();
                    }}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-200 text-amber-950 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Add Number
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Explicit Choice Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleChoice(true)}
              disabled={submitting}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Share Number</span>
            </button>

            <button
              type="button"
              onClick={() => handleChoice(false)}
              disabled={submitting}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <EyeOff className="w-4 h-4 text-slate-500" />
              <span>Keep Number Private</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-600">
            You can change this permission at any time while the request is active from your Item Requests dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};
