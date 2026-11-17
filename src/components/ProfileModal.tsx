import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { X, ShieldCheck, User, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, needsProfileCompletion } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setCollege(user.college);
      setDepartment(user.department);
      setPhone(user.phone || '');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        name,
        college,
        department,
        phone,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(api.formatError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-200" />
            <div>
              <h2 className="text-base font-bold">Student Profile & Privacy</h2>
              <p className="text-xs text-blue-100">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {needsProfileCompletion && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <strong>Welcome to UniLoop!</strong> Please confirm your college name, department, and optional phone number to finish setting up your student profile.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Profile details saved successfully!</span>
            </div>
          )}

          {/* Verification Badge */}
          <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-950">
                {user.isVerifiedCollegeEmail ? 'Verified Campus Account' : 'Campus Member Account'}
              </p>
              <p className="text-[11px] text-blue-800 leading-tight">
                {user.isVerifiedCollegeEmail
                  ? 'Your institutional domain has been validated for peer transactions.'
                  : 'College domain could not be verified automatically; please present campus ID upon item collection.'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              College Name
            </label>
            <input
              type="text"
              value={college}
              onChange={e => setCollege(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Department or Course
            </label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
              <strong className="text-slate-800">Phone Privacy Guarantee:</strong> Your number is NEVER displayed on public item cards or listings. You can choose to share it on a per-request basis only after you accept an incoming request.
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
