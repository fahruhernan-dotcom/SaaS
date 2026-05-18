# ACCOUNT PROFILE AUDIT REPORT
## Main Objective
Audit and unify the fragmented account, profile, and settings interfaces across all Ternak OS verticals into a single, shared, and maintainable architecture.

---

### TAHAP 1: IDENTIFICATION & FILE MAPPING
Here are the files identified that currently serve as Akun/Profile/Settings pages across different business models:

**Admin/Superadmin:**
- `src/dashboard/admin/AdminSettings.jsx`
- `src/dashboard/admin/AdminSubscriptions.jsx`

**Peternak (All types: Sapi, Domba, Kambing - Breeding/Fattening/Trading):**
- Uses a single shared `Akun.jsx` component mapped in `PeternakRouter.jsx`.
- Mapped as `akun: <Akun />` for all business models.

**Broker (Poultry & Sembako):**
- `src/dashboard/broker/poultry_broker/Akun.jsx` (Currently mapped in `BrokerRouter.jsx` for poultry broker and meat broker as `<Akun />`).
- `src/dashboard/broker/sembako_broker/Akun.jsx` (Mapped in `BrokerRouter.jsx` as `<SembakoAkun />`).

**Rumah Potong (RPA):**
- `src/dashboard/rumah_potong/rpa/Akun.jsx` (Mapped in `RPPageRouter.jsx` as `<RPAAkun />`).

**Shared/Global Components:**
- `src/dashboard/_shared/pages/Akun.jsx`
- `src/dashboard/_shared/pages/UpgradePlan.jsx`

---

### TAHAP 2: ROUTE MAPPING
Currently, the routes are mapped dynamically depending on the vertical's router file:

1. **`PeternakRouter.jsx`**: Maps the `akun` key to `<Akun />` (imported from `_shared/pages/Akun.jsx` or similar) for 9 different Peternak business models.
2. **`BrokerRouter.jsx`**: 
   - Maps `<Akun />` for Poultry Broker, Meat Broker, Egg Broker.
   - Maps `<SembakoAkun />` for Sembako Broker.
3. **`RPPageRouter.jsx`**: Maps `<RPAAkun />` for Rumah Potong Ayam.

**Problem:** We have at least 4 different `Akun.jsx` files maintaining similar layouts and logic (Logout, Tenant Switcher, Subscription Info).

---

### TAHAP 3: COMPONENT DUPLICATION ANALYSIS

Across these files, we observe the following redundant UI sections:
1. **User Profile Header:** Displaying User Avatar, Email, and Name.
2. **Tenant/Business Model Switcher:** Showing the active business name and role, and a button to switch tenant.
3. **Subscription / Billing:** "Upgrade Plan" buttons or displaying the current active plan limits.
4. **App Settings / Preferences:** Dark mode, Language, Notifications.
5. **Logout Button:** The universal sign-out action using Supabase auth.

**Proposed Solution:**
Instead of a file-per-vertical approach (`RPAAkun`, `SembakoAkun`, `BrokerAkun`), we create a single `SharedAccountPage.jsx`.
Role-specific settings (e.g., RPA-specific configurations or Sembako-specific store settings) will be rendered conditionally using configuration/props based on `useAuth().app_role` and `useAuth().business_model`, rather than duplicating the entire page.

---

### TAHAP 4: STANDARDIZED DATA-FETCHING STRATEGY

Currently, each `Akun.jsx` likely fetches its own profile data or relies on the global `useAuth()`.
**Recommendation:**
1. Create a `useAccountProfile()` hook in `src/lib/hooks/` (if not already strictly defined by `useAuth()`) to handle unified data logic:
   - Supabase `auth.getUser()`
   - Profile table fetching
   - Active Tenant & Business Model data
   - Subscription limits.
2. The UI components will purely consume this hook, decoupling data from the presentation layer.

---

### TAHAP 5: ROADMAP FOR MERGING REDUNDANT ROUTES

1. **Create the New Architecture Layout:**
   - `src/dashboard/_shared/account/SharedAccountPage.jsx`
   - `src/dashboard/_shared/account/components/ProfileHeader.jsx`
   - `src/dashboard/_shared/account/components/TenantSwitcher.jsx`
   - `src/dashboard/_shared/account/components/SubscriptionCard.jsx`
   - `src/dashboard/_shared/account/components/LogoutSection.jsx`

2. **Refactor Existing `Akun.jsx`:**
   - Build `SharedAccountPage.jsx` ensuring it covers the union of all features from Peternak, Broker, and RPA.
   - Insert Role-Specific logic via a `<RoleSpecificSettings role={app_role} businessModel={business_model} />` component.

3. **Update Routers:**
   - Modify `PeternakRouter.jsx`, `BrokerRouter.jsx`, and `RPPageRouter.jsx` to import and render `<SharedAccountPage />` instead of their localized versions.

4. **Verify & Cleanup:**
   - Ensure the Auth Flow and Subscription Flow are unaffected.
   - Delete `src/dashboard/broker/poultry_broker/Akun.jsx`
   - Delete `src/dashboard/broker/sembako_broker/Akun.jsx`
   - Delete `src/dashboard/rumah_potong/rpa/Akun.jsx`
   - Consolidate into `src/dashboard/_shared/pages/Akun.jsx` or the new folder.

**Note:** No files are deleted and no changes to Supabase/RLS are made at this stage. This is a pure UI architecture cleanup to establish a single source of truth.
