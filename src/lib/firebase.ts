import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getReadableErrorMessage(err: unknown, fallback = 'An error occurred. Please try again.'): string {
  if (!(err instanceof Error)) return fallback;
  try {
    const parsed = JSON.parse(err.message);
    if (parsed && typeof parsed.error === 'string') {
      if (parsed.error.includes('Missing or insufficient permissions')) {
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          return 'Please verify your email address first before performing this action.';
        }
        return 'Permission denied by database security rules. Please ensure you are signed in and authorized.';
      }
      if (parsed.error.includes('Quota exceeded')) {
        return 'Firebase daily free-tier quota exceeded. Quota resets tomorrow.';
      }
      return parsed.error;
    }
  } catch {
    // Not a JSON FirestoreErrorInfo string
  }
  return err.message || fallback;
}

export function timestampToIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof (value as any)?.toDate === 'function') {
    return (value as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();
