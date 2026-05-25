# Internationalization (i18n) — Phased Migration Plan

> **Status:** 🟡 PHASE 1 COMPLETE — Global i18n foundation established and Account page migrated. Roadmap prepared for remaining modules.  
> **Date:** 2026-05-25  
> **Scope:** Establish `src/lib/i18n` foundation, wrap the application layout in a global `LanguageProvider`, fully migrate the Account page (`akun_page/*`), translate shared UI keys, and document the roadmap for other dashboards.

---

## 1. Core Principles

To ensure system stability during translation, the following engineering rules **MUST** be strictly enforced:

> [!IMPORTANT]
> 1. **Do NOT Mutate Logic Values**: Database keys, state names, route paths, form payloads, and API parameters must remain in their raw form. Only display text/labels shown to the user should be translated.
> 2. **Client-Side Translation**: Keep translation lightweight using dictionary files (`id.js`, `en.js`) loaded via the client-side `useLanguage` hook. No database or RLS schema changes should be introduced.
> 3. **No Placeholders**: Never show visible placeholder messages like "Segera hadir" or "Coming soon" for unimplemented language selectors or components.

### Raw Values That Must Stay Unchanged:
- **Roles**: `owner`, `admin`, `manajer`, `staff`, `anak_kandang`, `view_only`, `sopir`
- **Subscription Plans**: `free`, `starter`, `pro`, `business`, `enterprise`
- **Business Verticals**: `peternak`, `sembako`, `broker`, `rpa`, `admin`, `poultry_broker`, `broker_telur`, `egg_broker`, `sembako_broker`, `distributor_sembako`, `rpa_buyer`
- **Identifiers**: `tenant_id`, `user_id`, `email`, route paths
- **Database Enums & Permissions**: All raw Postgres enum strings and key authorization tokens
- **Forms & Payloads**: All key-value names sent to database updates or RPC functions

---

## 2. i18n Architecture Foundation

The foundation resides in `src/lib/i18n/` and consists of:

```
src/lib/i18n/
├── dictionaries/
│   ├── id.js       # Indonesian Translations (Default)
│   └── en.js       # English Translations
├── LanguageProvider.jsx   # React Context Provider managing global state
└── useLanguage.js         # Custom hook to consume the language context
```

### Context & Hook API:
- `lang`: Current language (`'id'` or `'en'`), persisted to `ternakos.language` in `localStorage`.
- `setLang(code)`: Updates selected language state globally and triggers reactive re-renders.
- `t(key, fallback)`: Translates standard text keys.
- `tRole(role)`: Helper to map raw database role string to a display label.
- `tPlan(plan)`: Helper to map subscription plan names to display labels.
- `tStatus(status)`: Helper to translate status, billing status, or payment status.
- `tVertical(vertical)`: Helper to map vertical model keys to translated display names.

---

## 3. Migration Roadmap & Checklist

The translation rollout is divided into logical phases to prevent giant, high-risk refactoring passes.

### Phase 1: Foundation & Account Page (COMPLETED)
- [x] Create directory `src/lib/i18n/` with dictionaries (`id.js`, `en.js`), `LanguageProvider.jsx`, and `useLanguage.js`.
- [x] Wrap root layout tree with `<LanguageProvider>` in `src/App.jsx`.
- [x] Add Phase 2 common dictionary keys (e.g. `common.save`, `common.cancel`, `common.active`, etc.).
- [x] Migrate `src/dashboard/_shared/pages/akun_page/index.jsx`, `AccountCards.jsx`, and `DialogSheets.jsx` to use the global i18n context.
- [x] Delete legacy local `src/lib/hooks/useLanguage.js`.
- [x] Verify persistence in `ternakos.language` and immediate UI updates on language change.

---

### Phase 2: Core Dashboards (Next Actions)

#### 3.1 Peternak Dashboard
Translate features inside `src/dashboard/peternak/`:
- [ ] **Beranda**: Summary metrics, alerts, cycle details.
- [ ] **Daily Task**: Tasks list, logging forms, status indicators.
- [ ] **Pakan**: Feed stock manager, recording logs, supplier names.
- [ ] **Laporan**: Graphs, ADG, mortality, and HPP metrics.
- [ ] **Anak Kandang**: Team allocation, inviting farm hands.

#### 3.2 Broker Dashboard
Translate features inside `src/dashboard/broker/`:
- [ ] **Transaksi**: POS sheets, customer orders, supplier invoices.
- [ ] **Pengiriman**: Fleet mapping, delivery notes, driver status.
- [ ] **Armada**: Vehicle details, vehicle limits warning.
- [ ] **Simulator**: Margin projection calculations, input metrics.

#### 3.3 RPA Dashboard
Translate features inside `src/dashboard/rumah_potong/`:
- [ ] **Order**: Purchasing logs, weight recording.
- [ ] **Hutang**: Supplier payable records, billing status.
- [ ] **Distribusi**: Logistics logs, driver assignments.

#### 3.4 Market & Harga Pasar
Translate features inside `src/dashboard/_shared/pages/`:
- [ ] **Market**: Trading interface, pricing boards.
- [ ] **HargaPasar**: Regional poultry price reports, regional filters.

---

### Phase 3: Public, Auth, and Admin Pages

#### 3.5 Landing Page & Public Pages
Translate main landing page and marketing files:
- [ ] `src/pages/LandingPage.jsx`
- [ ] `src/pages/FiturPage.jsx`
- [ ] `src/pages/FAQPage.jsx`
- [ ] Pricing, Security, and Hubungi Kami page content.

#### 3.6 Auth & Onboarding Flow
Translate registration and configuration paths:
- [ ] Login / Register forms (`Login.jsx`, `Register.jsx`).
- [ ] Onboarding wizard (`OnboardingFlow.jsx`, `WelcomeOnboard.jsx`) — *Important: keep form payload property keys raw*.

#### 3.7 Billing & Subscription Portal
Translate package choices and invoice actions:
- [ ] `UpgradePlan.jsx` plan cards, tier features.
- [ ] `BillingPortal.jsx` payment logs, renewal steps.

#### 3.8 Admin Panel
Translate superadmin analytics pages:
- [ ] `AdminBeranda.jsx`, `AdminUsers.jsx`, `AdminSubscriptions.jsx`, `AdminActivity.jsx` log summaries.

---

## 4. Verification Check

During the migration of each subsequent page, verify the following:
1. **No Logic Drift**: Confirm that role checks (e.g. `role === 'owner'`) and plan thresholds (e.g. `plan === 'pro'`) continue using raw, untranslated values.
2. **Persistence**: Refreshing the browser maintains the updated language selections.
3. **No Leakage**: Check that toast messages and validation errors display in the chosen language.
