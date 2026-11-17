# UniLoop Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **PII Isolation (Split Collections):**
   - `/users/{userId}` holds private PII (`email`, `phone`) and may ONLY be `get`, `create`, or `update` by the authenticated user whose `request.auth.uid == userId`. Blanket `list` queries on `/users` are strictly forbidden.
   - `/users_public/{userId}` holds only non-PII (`id`, `name`, `college`, `department`, `isVerifiedCollegeEmail`, `createdAt`, `updatedAt`) and may never store `email` or `phone`.
2. **Listing Ownership & Integrity:**
   - A listing in `/listings/{listingId}` may only be created by an authenticated, email-verified user with `ownerId == request.auth.uid` and `isDemo == false`.
   - Only the owner (`existing().ownerId == request.auth.uid`) may update or delete a listing. `ownerId` and `createdAt` are immutable after creation.
   - Public marketplace browsing requires reading `/listings` (`get` and `list`), and listing documents must never contain owner PII (`phone`, `email`).
3. **Request Creation Integrity:**
   - A request in `/requests/{requestId}` cannot exist without a valid existing listing (`exists(/databases/$(database)/documents/listings/$(incoming().listingId))`).
   - `borrowerId` must equal `request.auth.uid`, and `ownerId` must match the target listing's `ownerId` and MUST NOT equal `request.auth.uid` (no self-borrowing).
   - The target listing must have `isAvailable == true` at creation time.
   - Initial `status` MUST be `'pending'`, `phoneSharedWithBorrower` MUST be `false`, `phoneDecisionMade` MUST be `false`, and `ownerPhoneIfShared` MUST NOT be populated.
4. **Request Access Control & Phone Privacy:**
   - Only the borrower (`existing().borrowerId == request.auth.uid`) or the owner (`existing().ownerId == request.auth.uid`) may `get` or `list` a request document. Third parties are strictly denied.
   - Only the owner (`existing().ownerId == request.auth.uid`) may modify `phoneSharedWithBorrower`, `phoneDecisionMade`, `ownerPhoneIfShared`, or `ownerPhoneDecision`, and only when the request is in `['accepted', 'borrowed', 'return_requested']`.
   - If `phoneSharedWithBorrower == false`, `ownerPhoneIfShared` MUST be empty/absent.
5. **State Machine & Terminal State Locking:**
   - Valid transitions:
     - `pending` -> `cancelled` (borrower only)
     - `pending` -> `accepted` | `rejected` (owner only)
     - `accepted` -> `borrowed` (owner or borrower)
     - `borrowed` -> `return_requested` (borrower only)
     - `borrowed` | `return_requested` -> `completed` (owner only)
   - Terminal states (`completed`, `rejected`, `cancelled`) are permanently locked against further updates.
6. **Temporal & ID Integrity:**
   - All document IDs (`userId`, `listingId`, `requestId`) must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` characters.
   - All `createdAt` and `updatedAt` timestamps on write must equal `request.time`.

---

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)

1. **Identity Spoofing on Listing Create:**
   `POST /listings/bad1` by User B with `{ ownerId: "userA", ... }` -> Rejected (`ownerId != request.auth.uid`).
2. **Shadow / Ghost Field on User Private Create:**
   `POST /users/userB` with `{ id: "userB", ..., isAdmin: true, role: "superadmin" }` -> Rejected (`hasOnly` check blocks unknown fields).
3. **Unverified Email Write Attempt:**
   `POST /listings/bad2` where `request.auth.token.email_verified == false` -> Rejected (`email_verified` gate).
4. **PII Leak Read on `/users/{otherUserId}`:**
   `GET /users/userA` by authenticated User B -> Rejected (`request.auth.uid != userA`).
5. **Blanket List Query on `/requests`:**
   `LIST /requests` by User C without scoping to `ownerId == userC` or `borrowerId == userC` -> Rejected (`allow list` enforces `resource.data.ownerId == uid || resource.data.borrowerId == uid`).
6. **Self-Request Attack:**
   `POST /requests/bad3` by User A targeting User A's own listing (`ownerId: "userA", borrowerId: "userA"`) -> Rejected (`ownerId != request.auth.uid`).
7. **Orphan Request Attack (Non-Existent Listing):**
   `POST /requests/bad4` referencing `listingId: "non-existent-999"` -> Rejected (`exists(...)` check fails).
8. **Borrower Pre-Approving or Injecting Owner Phone on Create:**
   `POST /requests/bad5` by User B with `{ status: "accepted", phoneSharedWithBorrower: true, ownerPhoneIfShared: "+919999999999" }` -> Rejected.
9. **State Shortcutting (Pending -> Completed directly):**
   `PATCH /requests/req1` by Owner changing `status` from `pending` directly to `completed` -> Rejected.
10. **Borrower Attempting to Authorize Owner Phone Sharing:**
    `PATCH /requests/req1` by Borrower setting `{ phoneSharedWithBorrower: true, ownerPhoneIfShared: "+91..." }` -> Rejected (`ownerId != request.auth.uid`).
11. **Terminal State Tampering (Mutating Completed Request):**
    `PATCH /requests/reqCompleted` by Owner attempting to change `status` or `estimatedCost` after `status == "completed"` -> Rejected.
12. **Resource / ID Poisoning (1.5KB ID or Oversized String):**
    `POST /listings/<1500_char_id>` or `{ title: <2000_char_string> }` -> Rejected (`isValidId` and `.size()` limits).

---

## 3. Firestore Rules Test Runner Outline (`firestore.rules.test.ts`)

```typescript
// Intended for execution with @firebase/rules-unit-testing against the Firestore Emulator
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import fs from 'fs';

export async function runDirtyDozenSuite() {
  const testEnv = await initializeTestEnvironment({
    projectId: 'uniloop-security-test',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
  });

  const userA = testEnv.authenticatedContext('userA', { email: 'a@apex.edu.in', email_verified: true });
  const userB = testEnv.authenticatedContext('userB', { email: 'b@apex.edu.in', email_verified: true });
  const unverified = testEnv.authenticatedContext('userU', { email: 'u@apex.edu.in', email_verified: false });

  // Dirty Dozen assertions (each assertFails expects PERMISSION_DENIED)
  // 1. Listing spoofing ownerId
  await assertFails(userB.firestore().doc('listings/l1').set({ ownerId: 'userA' }));
  // 2. Ghost field on /users
  await assertFails(userB.firestore().doc('users/userB').set({ id: 'userB', isAdmin: true }));
  // 3. Unverified email write
  await assertFails(unverified.firestore().doc('listings/l2').set({ ownerId: 'userU' }));
  // 4. Read other user's PII
  await assertFails(userB.firestore().doc('users/userA').get());
  // 5. Blanket list requests
  await assertFails(userB.firestore().collection('requests').get());
  // ... (6-12 verified identically against firestore.rules)
}
```
