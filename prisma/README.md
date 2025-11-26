# ⚠️ Critical Schema Migration Notice: User ID Change

**Date:** 2025-11-27
**Topic:** Transition from UUID (String) to BigInt (Integer) for User IDs

## 🚨 The Change
We have merged the Authentication starter schema with our core E-commerce schema (`v1.dbml`).
*   **Old Auth Schema:** `User.id` was `String` (UUID).
*   **New Master Schema:** `User.id` is now **`BigInt`** (Autoincrement).

This change affects **ALL** relationships linking to `User` (Orders, Reviews, Vendors, etc.).

## 🛠️ Action Items for Developers

### 1. Update Type Definitions
If you are manually defining types for User IDs in your frontend or API, change them from `string` to `number` or `bigint`.

```typescript
// ❌ OLD
interface UserProfile {
  id: string;
}

// ✅ NEW
interface UserProfile {
  id: bigint; // or number if you serialize it
}
```

### 2. Handle BigInt Serialization (JSON)
`BigInt` cannot be natively serialized to JSON (e.g., in API responses). You **MUST** add a global serializer or handle it in your response helpers.

**Recommended Fix (Global):**
Add this to your app's entry point (`index.ts` or `server.ts`):

```typescript
// Allow BigInt to be serialized as string or number
(BigInt.prototype as any).toJSON = function () {
  return this.toString(); // Returns "123" (safer for large IDs)
  // OR return Number(this); // Returns 123 (if you are sure IDs won't exceed 2^53)
};
```

### 3. Update NextAuth / Auth Adapters
If using `next-auth` or similar with the Prisma Adapter:
*   Ensure the adapter is compatible with `Int` or `BigInt` IDs.
*   The default Prisma Adapter handles this, but your **Session callbacks** might need adjustment if they expect a string ID.

```typescript
// Example NextAuth Callback Adjustment
callbacks: {
  session: async ({ session, user }) => {
    if (session?.user) {
      session.user.id = user.id.toString(); // Convert BigInt to String for the frontend
    }
    return session;
  }
}
```

### 4. Check Foreign Keys
Anywhere you reference `userId`, ensure you are passing a `BigInt` or a valid integer.
*   **Don't:** `prisma.order.findMany({ where: { userId: "some-uuid-string" } })` -> **CRASH**
*   **Do:** `prisma.order.findMany({ where: { userId: 123n } })`

## 📂 Affected Files (Specific to Project Structure)
Based on your project structure at `C:\Users\Admin\Desktop\officehub\test-app\src`, these files are highly likely to need updates:

### Auth & Users
*   `modules/auth/entities/user.entity.ts`: **CRITICAL**. Update the ID type definition here.
*   `modules/auth/auth.service.ts`: Check any logic that generates or expects UUIDs.
*   `modules/auth/auth.dto.ts`: Update DTOs to validate `number`/`bigint` instead of `string` (UUID).
*   `modules/users/users.service.ts`: Update `findById` or similar methods to accept `BigInt`.
*   `modules/users/users.controller.ts`: Ensure route parameters (e.g., `/:id`) are parsed as integers.

### Line Integration
*   `modules/line/entities/message.entity.ts`: Check if `lineUserId` links to the internal `User` table.
*   `modules/line/line-user/line-user.service.ts`: If you link Line Users to System Users, check the foreign key types.

### Shared Types
*   `types/index.ts`: Check for any global `User` or `Session` interfaces.

---
**Why this change?**
BigInt IDs are significantly more performant for indexing and storage in large-scale e-commerce databases compared to UUID strings. This aligns our Auth system with our core Order/Product architecture.
