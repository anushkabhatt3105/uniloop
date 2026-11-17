import React, { useState, useEffect } from 'react';
import { BorrowRequest, Listing, RequestStatus } from '../types/index.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { PhoneShareModal } from '../components/PhoneShareModal.js';
import { ProductImage } from '../components/ProductImage.js';
import {
  Inbox,
  Send,
  Package,
  History,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Phone,
  PhoneCall,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  PlusCircle,
  RotateCcw,
  Eye,
  EyeOff,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  Trash2,
  Edit,
  RefreshCw,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (view: string, itemId?: string) => void;
  initialTab?: 'incoming' | 'my-requests' | 'borrowed' | 'my-listings' | 'history';
  onDataChanged?: () => void;
  onOpenProfile?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  initialTab = 'incoming',
  onDataChanged,
  onOpenProfile,
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'incoming' | 'my-requests' | 'borrowed' | 'my-listings' | 'history'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [incomingRequests, setIncomingRequests] = useState<BorrowRequest[]>([]);
  const [myRequests, setMyRequests] = useState<BorrowRequest[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Phone privacy modal state
  const [phoneModalRequest, setPhoneModalRequest] = useState<BorrowRequest | null>(null);

  // In-app confirmation & rejection modals (no browser alert/confirm/prompt)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'primary' | 'danger';
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectBusy, setRejectBusy] = useState(false);

  // Notifications / feedback
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [incRes, myReqRes, listRes] = await Promise.all([
        api.getMyIncomingRequests(),
        api.getMyRequests(),
        api.getListings({}),
      ]);

      setIncomingRequests(incRes.requests);
      setMyRequests(myReqRes.requests);
      setMyListings(listRes.listings.filter(l => !l.isDemo && l.ownerId === user?.id));
    } catch (err) {
      setErrorNotice(api.formatError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (!user?.id) return;
    let firstEmission = true;
    const unsubscribe = api.subscribeToRequests(
      ({ incoming, outgoing }) => {
        setIncomingRequests(incoming);
        setMyRequests(outgoing);
        if (firstEmission) {
          firstEmission = false;
        } else {
          api.getListings({})
            .then(res => setMyListings(res.listings.filter(l => !l.isDemo && l.ownerId === user.id)))
            .catch(() => {});
        }
      },
      err => {
        console.error('Live request subscription error:', err);
      }
    );
    return () => unsubscribe();
  }, [user?.id]);

  const showNotice = (msg: string) => {
    setErrorNotice(null);
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const showError = (err: unknown) => {
    setErrorNotice(api.formatError(err));
  };

  // Status Badge Helper
  const renderStatusBadge = (
    status: RequestStatus,
    isOverdue = false,
    perspective: 'owner' | 'borrower' | 'borrowed' | 'history' = 'borrower'
  ) => {
    if (isOverdue && (status === 'borrowed' || status === 'return_requested')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse flex items-center gap-1 shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5" /> OVERDUE
        </span>
      );
    }

    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {perspective === 'owner' ? 'Pending Approval' : 'Pending'}
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted – Ready for Pickup
          </span>
        );
      case 'borrowed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />{' '}
            {perspective === 'owner'
              ? 'Handed Over – With Borrower'
              : perspective === 'borrowed'
                ? 'Currently Borrowed'
                : 'Borrowed – In Your Possession'}
          </span>
        );
      case 'return_requested':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Return Pending Confirmation
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
            Cancelled
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  // Overdue check
  const checkIsOverdue = (req: BorrowRequest): boolean => {
    if (req.pricingMethod === 'sale') return false;
    if (req.status !== 'borrowed' && req.status !== 'return_requested') return false;
    try {
      const returnTimeMs = new Date(`${req.returnDate}T${req.returnTime}`).getTime();
      return Date.now() > returnTimeMs;
    } catch {
      return false;
    }
  };

  // Actions
  const handleOwnerRespond = async (requestId: string, action: 'accept' | 'reject') => {
    if (action === 'reject') {
      setRejectTargetId(requestId);
      setRejectionReasonInput('');
      return;
    }

    try {
      const res = await api.respondToRequest(requestId, 'accept');
      showNotice(res.message);

      await fetchDashboardData();
      if (onDataChanged) onDataChanged();

      if (res.showPhoneSharePrompt) {
        setPhoneModalRequest(res.request);
      }
    } catch (err: any) {
      showError(err);
    }
  };

  const handleSubmitRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTargetId) return;
    try {
      setRejectBusy(true);
      const res = await api.respondToRequest(rejectTargetId, 'reject', rejectionReasonInput);
      setRejectTargetId(null);
      setRejectionReasonInput('');
      showNotice(res.message);
      await fetchDashboardData();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      showError(err);
    } finally {
      setRejectBusy(false);
    }
  };

  const handleBorrowerCancel = (requestId: string) => {
    setConfirmModal({
      title: 'Cancel Borrow Request',
      message: 'Are you sure you want to cancel this pending request?',
      confirmLabel: 'Cancel Request',
      tone: 'danger',
      onConfirm: async () => {
        const res = await api.cancelRequest(requestId);
        showNotice(res.message);
        await fetchDashboardData();
        if (onDataChanged) onDataChanged();
      },
    });
  };

  const handleOwnerHandover = (requestId: string) => {
    setConfirmModal({
      title: 'Mark as Handed Over',
      message: 'Confirm that you have physically handed this item over to the borrower?',
      confirmLabel: 'Mark as Handed Over',
      tone: 'primary',
      onConfirm: async () => {
        const res = await api.markAsBorrowed(requestId, 'owner');
        showNotice(res.message);
        await fetchDashboardData();
        if (onDataChanged) onDataChanged();
      },
    });
  };

  const handleBorrowerCollected = (requestId: string) => {
    setConfirmModal({
      title: 'Confirm Item Collection',
      message: 'Confirm that you have collected this item from the owner and it is now in your possession?',
      confirmLabel: "I've Collected the Item",
      tone: 'primary',
      onConfirm: async () => {
        const res = await api.markAsBorrowed(requestId, 'borrower');
        showNotice(res.message);
        await fetchDashboardData();
        if (onDataChanged) onDataChanged();
      },
    });
  };

  const handleMarkAsReturned = (requestId: string) => {
    setConfirmModal({
      title: 'Mark Item as Returned',
      message: 'Confirm that you are returning this item to the owner? The owner will need to confirm receipt before the item becomes available again.',
      confirmLabel: 'Mark as Returned',
      tone: 'primary',
      onConfirm: async () => {
        const res = await api.requestReturn(requestId);
        showNotice(res.message);
        await fetchDashboardData();
        if (onDataChanged) onDataChanged();
      },
    });
  };

  const handleConfirmReturn = (requestId: string) => {
    setConfirmModal({
      title: 'Confirm Return Received',
      message: 'Have you physically received your item back in good condition? Only after your confirmation will this item become available for borrowing again.',
      confirmLabel: 'Confirm Return Received',
      tone: 'primary',
      onConfirm: async () => {
        const res = await api.confirmReturn(requestId, true);
        showNotice(res.message);
        await fetchDashboardData();
        if (onDataChanged) onDataChanged();
      },
    });
  };

  const handleToggleListing = async (listingId: string) => {
    try {
      const res = await api.toggleListingAvailability(listingId);
      showNotice(res.message);
      await fetchDashboardData();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      showError(err);
    }
  };

  const handleDeleteListing = (listingId: string, title: string) => {
    setConfirmModal({
      title: 'Delete Campus Listing',
      message: `Permanently remove "${title}" from UniLoop?`,
      confirmLabel: 'Delete Permanently',
      tone: 'danger',
      onConfirm: async () => {
        const res = await api.deleteListing(listingId);
        showNotice(res.message);
        await fetchDashboardData();
        if (onDataChanged) onDataChanged();
      },
    });
  };

  const executeConfirmModal = async () => {
    if (!confirmModal) return;
    try {
      setConfirmBusy(true);
      await confirmModal.onConfirm();
      setConfirmModal(null);
    } catch (err: any) {
      setConfirmModal(null);
      showError(err);
    } finally {
      setConfirmBusy(false);
    }
  };

  const handleCopyPhone = (phoneNum: string, id: string) => {
    navigator.clipboard?.writeText(phoneNum);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Filtered views
  const pendingIncomingCount = incomingRequests.filter(r => r.status === 'pending').length;

  const borrowedList = myRequests.filter(
    r => r.status === 'borrowed' || r.status === 'return_requested'
  );

  const historyMap = new Map<string, BorrowRequest>();
  for (const r of [...myRequests, ...incomingRequests]) {
    if (['completed', 'rejected', 'cancelled'].includes(r.status) && !historyMap.has(r.id)) {
      historyMap.set(r.id, r);
    }
  }
  const historyList = Array.from(historyMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="py-8 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Banner notifications */}
        {feedbackNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
            <button
              onClick={() => setFeedbackNotice(null)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-600 hover:text-rose-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {user?.emailVerified === false && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Your email ({user.email}) is not yet verified. Please verify via the link in your inbox and click <strong>I Verified</strong> in the top bar to publish listings or respond to requests.
            </span>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{user?.college} • {user?.department}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your item requests, incoming approvals, and active campus borrowings in real time.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchDashboardData()}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => onNavigate('create-listing')}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List New Item</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'incoming'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Incoming Requests</span>
            {pendingIncomingCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'incoming' ? 'bg-white text-blue-700' : 'bg-rose-500 text-white'
              }`}>
                {pendingIncomingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('my-requests')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'my-requests'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>My Requests ({myRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('borrowed')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'borrowed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>My Borrowed Items ({borrowedList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('my-listings')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'my-listings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>My Listings ({myListings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Transaction History</span>
          </button>
        </div>

        {/* Tab 1: INCOMING REQUESTS (Owner Approval Dashboard) */}
        {activeTab === 'incoming' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Item Requests for Your Listings ({incomingRequests.length})
              </h2>
              <span className="text-xs text-slate-500">
                You decide individually whether to lend or rent to each student.
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(n => (
                  <div key={n} className="h-44 bg-white rounded-3xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            ) : incomingRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Inbox className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No incoming requests yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When other campus students request your listed gear, their requests will appear here for your review and approval.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map(req => {
                  const isOverdue = checkIsOverdue(req);
                  const canActAsOwner = req.ownerId === user?.id;
                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4 transition-all hover:border-blue-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={req.listingImageUrl}
                            alt={req.listingTitle}
                            className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                                {req.listingTitle}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-500">
                              Requested by: <strong className="text-slate-800">{req.borrowerName}</strong> ({req.borrowerDepartment})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {renderStatusBadge(req.status, isOverdue, 'owner')}
                        </div>
                      </div>

                      {/* Request Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">
                            Pickup Date & Time
                          </span>
                          <span className="font-semibold text-slate-800">
                            {req.pickupDate} at {req.pickupTime}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">
                            Agreed Duration & Cost
                          </span>
                          <span className="font-semibold text-slate-800">
                            {req.durationKey} • {req.estimatedCost === 0 ? 'FREE' : `₹${req.estimatedCost}`}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">
                            Expected Return Time
                          </span>
                          <span className="font-semibold text-slate-800">
                            {req.pricingMethod === 'sale'
                              ? 'One-time Purchase (No return)'
                              : `${req.returnDate} at ${req.returnTime}`}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">
                            Borrower Email
                          </span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {req.borrowerEmail}
                          </span>
                        </div>
                      </div>

                      {/* Optional Note from Borrower */}
                      {req.note && (
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-700">
                          <strong className="text-blue-900 font-bold block mb-0.5">Borrower's Note:</strong>
                          <span>"{req.note}"</span>
                        </div>
                      )}

                      {/* Owner Action Buttons depending on status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        {/* Phone Sharing permission reminder / trigger */}
                        <div className="text-xs">
                          {req.status === 'pending' ? (
                            <span className="text-slate-600 italic">
                              Review details before accepting. Conflicting slots are automatically checked.
                            </span>
                          ) : ['accepted', 'borrowed', 'return_requested', 'completed'].includes(req.status) ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-slate-600 font-medium">Phone Sharing:</span>
                              {req.phoneSharedWithBorrower ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <Eye className="w-3 h-3" /> Shared with {req.borrowerName}
                                </span>
                              ) : req.ownerPhoneDecision === 'private' ? (
                                <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                  <EyeOff className="w-3 h-3 text-slate-400" /> Kept Private
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <EyeOff className="w-3 h-3 text-amber-500" /> Not Shared Yet
                                </span>
                              )}
                              {['accepted', 'borrowed', 'return_requested'].includes(req.status) && (
                                <button
                                  type="button"
                                  onClick={() => setPhoneModalRequest(req)}
                                  className="text-blue-600 font-bold hover:underline ml-1 cursor-pointer"
                                >
                                  {req.phoneDecisionMade ? 'Change' : 'Set Permission'}
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>

                        {/* Status specific OWNER action controls */}
                        {canActAsOwner && (
                          <div className="flex items-center gap-2">
                            {req.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOwnerRespond(req.id, 'reject')}
                                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  Reject Request
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOwnerRespond(req.id, 'accept')}
                                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Accept Request</span>
                                </button>
                              </>
                            )}

                            {req.status === 'accepted' && (
                              <button
                                type="button"
                                onClick={() => handleOwnerHandover(req.id)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Package className="w-4 h-4" />
                                <span>Mark as Handed Over</span>
                              </button>
                            )}

                            {req.status === 'borrowed' && (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                Handed over to borrower — awaiting return
                              </span>
                            )}

                            {req.status === 'return_requested' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmReturn(req.id)}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Confirm Return Received</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: MY REQUESTS (Items Student Has Requested) */}
        {activeTab === 'my-requests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Your Outgoing Requests ({myRequests.length})
              </h2>
              <span className="text-xs text-slate-500">
                Track status, owner responses, and pickup coordinates
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(n => (
                  <div key={n} className="h-44 bg-white rounded-3xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            ) : myRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Send className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No item requests yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse our campus catalog to find chargers, calculators, or lab gear you need for class today!
                </p>
                <button
                  onClick={() => onNavigate('explore')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm mt-2"
                >
                  Explore Items
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map(req => {
                  const isOverdue = checkIsOverdue(req);
                  const isBorrower = req.borrowerId === user?.id;
                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4 transition-all hover:border-blue-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={req.listingImageUrl}
                            alt={req.listingTitle}
                            className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 shrink-0"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">
                              {req.listingTitle}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Owner: <strong className="text-slate-800">{req.ownerName}</strong> ({req.ownerCollege})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {renderStatusBadge(req.status, isOverdue, 'borrower')}
                        </div>
                      </div>

                      {/* Pickup & Schedule Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">
                            Pickup Point & Time
                          </span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{req.listingLocation}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {req.pickupDate} at {req.pickupTime}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">
                            Agreed Borrowing Duration
                          </span>
                          <span className="font-semibold text-slate-800">
                            {req.durationKey}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">
                            Expected Return Time
                          </span>
                          <span className="font-semibold text-slate-800">
                            {req.pricingMethod === 'sale'
                              ? 'One-time Purchase (No return)'
                              : `${req.returnDate} at ${req.returnTime}`}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">
                            Estimated Total
                          </span>
                          <span className="font-black text-blue-700 text-sm">
                            {req.estimatedCost === 0 ? 'FREE' : `₹${req.estimatedCost}`}
                          </span>
                        </div>
                      </div>

                      {req.status === 'rejected' && req.rejectionReason && (
                        <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 text-xs text-rose-800">
                          <strong className="font-bold">Owner Reason:</strong> {req.rejectionReason}
                        </div>
                      )}

                      {/* OWNER CONTACT & PRIVACY LOGIC (Critical requirement) */}
                      {['accepted', 'borrowed', 'return_requested', 'completed'].includes(req.status) && (
                        <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-blue-700" />
                              <span className="text-xs font-bold text-blue-950">
                                Owner Contact Details:
                              </span>
                            </div>

                            {/* Privacy display logic */}
                            {req.phoneSharedWithBorrower && req.ownerPhoneIfShared ? (
                              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-800">
                                <span>{req.ownerPhoneIfShared}</span>
                                <span className="text-[10px] font-sans font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Authorized by Owner
                                </span>
                              </div>
                            ) : req.ownerPhoneDecision === 'private' ? (
                              <p className="text-xs text-slate-600 italic">
                                The owner has chosen to keep their contact details private (contact details not shared). Please coordinate at the designated pickup location.
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 italic">
                                Contact details have not been shared yet. Please meet at the designated pickup location.
                              </p>
                            )}
                          </div>

                          {/* Call / Copy button only if authorized */}
                          {req.phoneSharedWithBorrower && req.ownerPhoneIfShared && (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${req.ownerPhoneIfShared}`}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>Call Owner</span>
                              </a>

                              <button
                                onClick={() => handleCopyPhone(req.ownerPhoneIfShared!, req.id)}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center gap-1 shadow-xs transition-colors"
                              >
                                {copiedPhoneId === req.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Copy Number</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Borrower Actions */}
                      {isBorrower && (
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            {req.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleBorrowerCancel(req.id)}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                              >
                                Cancel Request
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {req.status === 'accepted' && (
                              <button
                                type="button"
                                onClick={() => handleBorrowerCollected(req.id)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                              >
                                <Package className="w-4 h-4" />
                                <span>I've Collected the Item</span>
                              </button>
                            )}

                            {req.status === 'borrowed' && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('borrowed')}
                                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <span>Manage in My Borrowed Items</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {req.status === 'return_requested' && (
                              <div className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Return Pending Confirmation — waiting for owner to confirm receipt</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: MY BORROWED ITEMS */}
        {activeTab === 'borrowed' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Active Campus Items in Your Possession ({borrowedList.length})
              </h2>
              <span className="text-xs text-slate-500">
                Keep track of return deadlines to maintain great campus standing.
              </span>
            </div>

            {borrowedList.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No active borrowed items</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You do not currently have any active rentals or borrowed items.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {borrowedList.map(req => {
                  const isOverdue = checkIsOverdue(req);
                  const isBorrower = req.borrowerId === user?.id;
                  return (
                    <div
                      key={req.id}
                      className={`bg-white rounded-3xl p-6 border shadow-xs space-y-4 ${
                        isOverdue ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200/90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={req.listingImageUrl}
                            alt={req.listingTitle}
                            className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 shrink-0"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{req.listingTitle}</h3>
                            <p className="text-xs text-slate-500">Owner: {req.ownerName}</p>
                          </div>
                        </div>
                        {renderStatusBadge(req.status, isOverdue, 'borrowed')}
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Agreed Borrowing Duration:</span>
                          <span className="font-bold text-slate-900">{req.durationKey}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pickup Details:</span>
                          <span className="font-bold text-slate-900 truncate max-w-[220px]">
                            {req.listingLocation} • {req.pickupDate} at {req.pickupTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Expected Return Time:</span>
                          <span className="font-bold text-slate-900">
                            {req.pricingMethod === 'sale'
                              ? 'One-time Purchase (No return)'
                              : `${req.returnDate} at ${req.returnTime}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/70">
                          <span className="text-slate-500">Owner Contact:</span>
                          {req.phoneSharedWithBorrower && req.ownerPhoneIfShared ? (
                            <span className="font-mono font-bold text-emerald-700">
                              {req.ownerPhoneIfShared}
                            </span>
                          ) : req.ownerPhoneDecision === 'private' ? (
                            <span className="text-slate-600 italic">The owner has chosen to keep their contact details private.</span>
                          ) : (
                            <span className="text-slate-500 italic">Not shared yet</span>
                          )}
                        </div>
                      </div>

                      {isBorrower && req.status === 'borrowed' && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsReturned(req.id)}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Mark as Returned</span>
                        </button>
                      )}

                      {req.status === 'return_requested' && (
                        <div className="text-center py-2.5 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-xl border border-indigo-200">
                          Return Pending Confirmation — waiting for owner to confirm receipt
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: MY LISTINGS (Items Student Has Listed) */}
        {activeTab === 'my-listings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Your Campus Listings ({myListings.length})
              </h2>
              <button
                onClick={() => onNavigate('create-listing')}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>List an Item</span>
              </button>
            </div>

            {myListings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Layers className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">You haven't listed any items yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Share extra chargers, textbooks, or tools with fellow students on campus.
                </p>
                <button
                  onClick={() => onNavigate('create-listing')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm mt-2"
                >
                  Create Your First Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.map(listing => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-16/9 bg-slate-50 overflow-hidden border-b border-slate-100">
                        <ProductImage
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-full h-full object-contain p-2"
                        />
                        <div className="absolute top-2.5 right-2.5">
                          <button
                            onClick={() => handleToggleListing(listing.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-xs flex items-center gap-1 ${
                              listing.isAvailable
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-800 text-slate-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${listing.isAvailable ? 'bg-white' : 'bg-rose-400'}`} />
                            {listing.isAvailable ? 'Available' : 'Unavailable'}
                          </button>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {listing.category}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {listing.pricingMethod === 'sale'
                              ? `₹${listing.price} (Buy/Sell Secondary)`
                              : listing.price === 0 || listing.pricingMethod === 'free'
                                ? 'FREE Borrow'
                                : `₹${listing.price} ${{ hourly: '/ hour', daily: '/ day', period: '/ period', weekly: '/ week' }[listing.pricingMethod] || `/ ${listing.pricingMethod}`}`}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {listing.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2">
                          {listing.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleListing(listing.id)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        {listing.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onNavigate('edit-listing', listing.id)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                          title="Edit Listing"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteListing(listing.id, listing.title)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: TRANSACTION HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Completed & Closed Transactions ({historyList.length})
              </h2>
              <span className="text-xs text-slate-500">
                Permanent record of fulfilled campus sharings
              </span>
            </div>

            {historyList.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                  <History className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No completed history yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Completed item handbacks and past requests will be archived here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map(req => {
                  const isUserOwner = req.ownerId === user?.id;
                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <ProductImage
                          src={req.listingImageUrl}
                          alt={req.listingTitle}
                          className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900">{req.listingTitle}</h4>
                          <p className="text-slate-500 text-[11px]">
                            {isUserOwner
                              ? `Lent to: ${req.borrowerName}`
                              : `Borrowed from: ${req.ownerName}`}
                            {' • '}
                            {req.pickupDate} ({req.durationKey})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800">
                          {req.estimatedCost === 0 ? 'Free' : `₹${req.estimatedCost}`}
                        </span>
                        {renderStatusBadge(req.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Phone Sharing Decision Modal */}
      {phoneModalRequest && (
        <PhoneShareModal
          request={phoneModalRequest}
          isOpen={!!phoneModalRequest}
          onClose={() => setPhoneModalRequest(null)}
          onOpenProfile={onOpenProfile}
          onDecisionMade={updated => {
            setIncomingRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
            setMyRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
            if (onDataChanged) onDataChanged();
            showNotice(
              updated.phoneSharedWithBorrower
                ? 'Phone number shared with this borrower only.'
                : 'Privacy preference saved: your phone number is kept private.'
            );
          }}
        />
      )}

      {/* Rejection Reason Modal */}
      {rejectTargetId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white">
              <h3 className="text-base font-bold">Reject Borrow Request</h3>
              <p className="text-xs text-slate-300 mt-0.5">Optionally share a brief reason with the student</p>
            </div>
            <form onSubmit={handleSubmitRejection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={rejectionReasonInput}
                  onChange={e => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Schedule conflict, item needed for exam"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectTargetId(null)}
                  disabled={rejectBusy}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectBusy}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {rejectBusy ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-3">
              <h3 className="text-base font-extrabold text-slate-900">{confirmModal.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.message}</p>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  disabled={confirmBusy}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmModal}
                  disabled={confirmBusy}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 ${
                    confirmModal.tone === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {confirmBusy ? 'Processing...' : confirmModal.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
