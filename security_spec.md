# Security Specification & Payload-First TDD (`firestore.rules`)

## 1. Data Invariants
1. **Strict Ownership**: Every document under `/users/{userId}`, `/users/{userId}/voicePresets/{presetId}`, and `/users/{userId}/takes/{takeId}` can ONLY be read, created, updated, or deleted by the authenticated, email-verified user whose `request.auth.uid == userId`.
2. **Identity Integrity**: `uid` / `ownerId` inside incoming payloads MUST strictly equal `request.auth.uid` and remain immutable on updates.
3. **Temporal Integrity**: `createdAt` MUST equal `request.time` on create and remain immutable on update. `updatedAt` MUST equal `request.time` on both create and update.
4. **No Shadow Fields**: Strict `keys().hasAll(...) && keys().hasOnly(...)` on create and `diff(existing()).affectedKeys().hasOnly(...)` on update.
5. **Path ID & Payload Bounds**: Every document ID (`userId`, `presetId`, `takeId`) must match `^[a-zA-Z0-9_-]+$` and `<= 128` chars; every string has explicit `.size()` bounds.

## 2. "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated read** on `/users/uid123` (`auth: null`).
2. **Cross-user read** by `uidB` on `/users/uidA/takes/take1`.
3. **Unverified email write** (`auth: { uid: 'uidA', token: { email_verified: false } }`) attempting to create `/users/uidA`.
4. **Identity spoofing** on create: `uidA` creating `/users/uidA/takes/t1` with `ownerId: 'uidB'`.
5. **Shadow field injection** on create: `uidA` creating `/users/uidA` with extra field `isAdmin: true`.
6. **Immutable field tampering** on update: `uidA` updating `createdAt` or `uid` on `/users/uidA`.
7. **Timestamp forgery** on create: `uidA` passing client-side timestamp for `createdAt` instead of `request.time`.
8. **Invalid enum value** on `preferredModel`: passing `"gpt-4o"` instead of allowed Gemini TTS models.
9. **Resource exhaustion / oversized script**: `script` > 15,000 characters or `displayName` > 80 characters.
10. **Path ID poisoning**: creating `/users/uidA/takes/../../../evil` or ID > 128 characters.
11. **Unbounded type injection**: passing `voiceLocked: "yes"` (string) instead of `boolean`.
12. **Blanket list scraping**: `uidB` running `list` query on `/users/uidA/takes`.
