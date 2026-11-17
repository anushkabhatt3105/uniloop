import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseAuthProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase.js';
import { api, getUserPrivateProfile, saveUserProfile } from '../lib/api.js';
import { User } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsProfileCompletion: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  dismissProfileCompletion: () => void;
  signInWithGoogle: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    college: string;
    department: string;
    password: string;
    phone?: string;
  }) => Promise<string>;
  logout: () => Promise<void>;
  updateProfile: (payload: {
    name?: string;
    college?: string;
    department?: string;
    phone?: string;
  }) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthError(err: any): Error {
  const code = err?.code || '';
  if (code === 'auth/operation-not-allowed') {
    return new Error(
      'Email/Password sign-in is not yet enabled in Firebase Console. Please use "Continue with Google" above, or enable Email/Password under Firebase Console → Authentication → Sign-in method.'
    );
  }
  if (code === 'auth/popup-closed-by-user') {
    return new Error('Sign-in popup was closed before completion.');
  }
  if (code === 'auth/popup-blocked') {
    return new Error('Browser blocked the sign-in popup. Please allow popups for this site.');
  }
  if (code === 'auth/email-already-in-use') {
    return new Error('An account with this email address already exists.');
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return new Error('Invalid email or password. Please try again.');
  }
  if (code === 'auth/weak-password') {
    return new Error('Password must be at least 6 characters long.');
  }
  return err instanceof Error ? err : new Error('Authentication failed.');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const dismissProfileCompletion = useCallback(() => {
    setNeedsProfileCompletion(false);
  }, []);

  const syncUserFromFirebase = useCallback(async (fbUser: FirebaseUser | null) => {
    setFirebaseUser(fbUser);
    if (!fbUser) {
      setUser(null);
      setNeedsProfileCompletion(false);
      setIsLoading(false);
      return;
    }

    try {
      if (fbUser.emailVerified) {
        const existing = await getUserPrivateProfile(fbUser.uid);
        if (existing) {
          setUser({ ...existing, emailVerified: fbUser.emailVerified });
        } else {
          // Check for pending email/password registration metadata first to avoid double-write race
          const pendingKey = `uniloop_pending_profile_${fbUser.uid}`;
          const rawPending = localStorage.getItem(pendingKey);
          let pending: { name?: string; college?: string; department?: string; phone?: string } | null = null;
          if (rawPending) {
            try {
              pending = JSON.parse(rawPending);
            } catch {
              localStorage.removeItem(pendingKey);
            }
          }

          const created = await saveUserProfile({
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: pending?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Campus Student',
            college: pending?.college || 'Apex Institute of Technology',
            department: pending?.department || 'Campus Member',
            phone: pending?.phone || undefined,
            isCreate: true,
          });
          if (pending) {
            localStorage.removeItem(pendingKey);
          } else {
            setNeedsProfileCompletion(true);
          }
          setUser({ ...created, emailVerified: fbUser.emailVerified });
        }
        api.ensureSampleListingsSeededOnce().catch(() => {});
      } else {
        // Unverified email/password user: keep basic session info until email is verified
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Campus Student',
          email: fbUser.email || '',
          college: 'Apex Institute of Technology',
          department: 'Pending Verification',
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          isVerifiedCollegeEmail: false,
          emailVerified: false,
        });
      }
    } catch (err) {
      console.error('Failed to sync user profile from Firestore:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, fbUser => {
      syncUserFromFirebase(fbUser);
    });
    return () => unsubscribe();
  }, [syncUserFromFirebase]);

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) {
      setUser(null);
      return;
    }
    await reload(auth.currentUser);
    await auth.currentUser.getIdToken(true);
    await syncUserFromFirebase(auth.currentUser);
  }, [syncUserFromFirebase]);

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await syncUserFromFirebase(cred.user);
      closeAuthModal();
    } catch (err) {
      throw mapAuthError(err);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncUserFromFirebase(cred.user);
      closeAuthModal();
    } catch (err) {
      throw mapAuthError(err);
    }
  };

  const register = async (payload: {
    name: string;
    email: string;
    college: string;
    department: string;
    password: string;
    phone?: string;
  }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, payload.email.trim(), payload.password);
      await updateFirebaseAuthProfile(cred.user, { displayName: payload.name.trim() });
      await sendEmailVerification(cred.user);

      // Persist chosen college/department/phone in localStorage temporarily until email is verified
      localStorage.setItem(
        `uniloop_pending_profile_${cred.user.uid}`,
        JSON.stringify({
          name: payload.name.trim(),
          college: payload.college.trim(),
          department: payload.department.trim(),
          phone: payload.phone?.trim() || '',
        })
      );

      await syncUserFromFirebase(cred.user);
      return 'Account created! Please click the verification link sent to your email address, then refresh your status to unlock listing and borrowing.';
    } catch (err) {
      throw mapAuthError(err);
    }
  };

  // Fallback sync if pending metadata remained on a previously created profile
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified || !user || user.department === 'Pending Verification') return;
    const key = `uniloop_pending_profile_${firebaseUser.uid}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      localStorage.removeItem(key);
      saveUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: parsed.name || firebaseUser.displayName || 'Student',
        college: parsed.college || 'Apex Institute of Technology',
        department: parsed.department || 'General',
        phone: parsed.phone || undefined,
        isCreate: false,
      })
        .then(saved => {
          setUser({ ...saved, emailVerified: true });
        })
        .catch(() => {});
    } catch {
      localStorage.removeItem(key);
    }
  }, [firebaseUser, user]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    setNeedsProfileCompletion(false);
  };

  const updateProfile = async (payload: {
    name?: string;
    college?: string;
    department?: string;
    phone?: string;
  }) => {
    if (!auth.currentUser) throw new Error('You must be signed in.');
    if (!auth.currentUser.emailVerified) {
      throw new Error('Please verify your email address first before saving your Firestore profile.');
    }

    const existing = await getUserPrivateProfile(auth.currentUser.uid);
    const updated = await saveUserProfile({
      uid: auth.currentUser.uid,
      email: auth.currentUser.email || user?.email || '',
      name: payload.name ?? user?.name ?? 'Student',
      college: payload.college ?? user?.college ?? 'Apex Institute of Technology',
      department: payload.department ?? user?.department ?? 'Campus Member',
      phone: payload.phone !== undefined ? payload.phone : user?.phone,
      isCreate: !existing,
    });
    if (payload.name) {
      await updateFirebaseAuthProfile(auth.currentUser, { displayName: payload.name.trim() });
    }
    setUser({ ...updated, emailVerified: auth.currentUser.emailVerified });
    setNeedsProfileCompletion(false);
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No signed-in user.');
    await sendEmailVerification(auth.currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        isAuthenticated: !!user,
        needsProfileCompletion,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        dismissProfileCompletion,
        signInWithGoogle,
        login,
        register,
        logout,
        updateProfile,
        resendVerificationEmail,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
