# Phase 7 — Project-wide npm run lint Cleanup

## Status

| Field | Value |
|-------|-------|
| Status | 🟡 PLANNING |
| Depends on | Error Logging Phase 6.F ✅ DONE |
| Created | 2026-05-19 |
| Goal | `npm run lint` exits with 0 errors and `npm run build` passes |
| Scope | Lint-only cleanup — no feature work, no schema changes, no new instrumentation |

---

## Context

During Error Logging Phases 6.A–6.F, pre-existing lint errors in touched files were deliberately deferred when the fix required structural changes (rename, file split, hook-dep reshape). Those deferrals are collected in the ROADMAP Lint Debt Log and are the input for Phase 7.

Phase 7 is a **separate task** from error logging. It does not add instrumentation, rename `actionName` values, or touch schema/RLS/RPC/logger utilities.

---

## Guardrails

| Rule | Detail |
|------|--------|
| No schema / RLS / RPC changes | Frozen at Phase 6.0B |
| No logger utility refactor | `errorLogger.js`, `supabaseLogger.js`, `actionLogger.js` are stable |
| No `actionName` renames | Legacy `handleSave` / `submitDaily` / `createCycle` rename is a separate cosmetic phase |
| No business logic rewrite | Fix the lint error, not the feature |
| No styling or UI redesign | Component structure changes only if required by a `react-hooks/rules-of-hooks` violation |
| No broad formatting churn | Do not run `prettier --write` or `eslint --fix` across the project |
| No blanket `/* eslint-disable */` | Targeted `// eslint-disable-next-line <rule> -- <reason>` only |
| Keep fixes minimal and scoped | One file, one rule, one targeted change — reviewable in isolation |
| Do not change eslint.config.js rule severity | Config changes are a separate PR |

---

## Commands Reference

```bash
# 7.0 — capture full baseline
npm run lint 2>&1 | tee lint-report.txt

# per-file lint during fix work
npx eslint src/lib/hooks/createPenggemukanHooks.js

# verify build still passes after each fix batch
npm run build
```

> **Never run** `npx eslint --fix .` — auto-fix can silently rewrite logic and delete intentional dead-code documentation.

---

## Phase 7 Sub-phases

### 7.0 — Baseline Report

**Goal:** Capture the actual current error/warning count before touching anything. Numbers in the Known Debt table below are approximate (recorded at deferral time); the real list may differ.

```bash
npm run lint 2>&1 | tee lint-report.txt
```

After running, triage the output into three buckets:

| Bucket | Criterion | Action |
|--------|-----------|--------|
| **Runtime risk** | `no-undef`, missing import that causes throw at render | Fix in 7.1 immediately |
| **Safe dead code** | `no-unused-vars` on destructured vars, dead imports | Fix in 7.2 (batch per file) |
| **Hook / structural** | `react-hooks/exhaustive-deps`, `react-refresh/only-export-components` | Review in 7.3 — defer if risky |

**Status:** ⏳ Not started

---

### 7.1 — Runtime-Risk Errors

Fix errors that will cause a runtime throw or undefined behavior in the browser. These are the highest priority because they affect live users regardless of whether lint is "passing".

| File | Rule | Approx lines | Fix |
|------|------|-------------|-----|
| `src/lib/hooks/createPenggemukanHooks.js` | `no-undef` `process` × 6 | 1523, 1709, 1722, 1739, 1809, 1952 | Replace `process.env.X` → `import.meta.env.X` (Vite native) |
| `src/dashboard/_shared/components/FormJualModal.jsx` | `useState` used but not imported | 43 | Add `useState` to the React named import on line 1 |

**Verification after 7.1:**
```bash
npx eslint src/lib/hooks/createPenggemukanHooks.js
npx eslint src/dashboard/_shared/components/FormJualModal.jsx
npm run build
```

**Status:** ⏳ Not started

---

### 7.2 — Safe Unused Vars / Imports

Fix `no-unused-vars` violations where the fix is a safe, minimal rename or removal. Rule: prefix unused destructured vars with `_`; remove provably-dead imports. Do not rename variables that carry documentation intent — weigh case by case.

#### `src/lib/hooks/createPenggemukanHooks.js` (~17 deferred errors, Phase 6.B)

| Rule | Approx lines | Var name(s) | Fix |
|------|-------------|-------------|-----|
| `no-unused-vars` | 486 | `age_confidence`, `acquisition_type` | Prefix → `_age_confidence`, `_acquisition_type` in mutationFn signature. No call-site change needed (positional args, not named). |
| `no-unused-vars` | 549, 627, 996, 1307 | `batch_id` in `onSuccess` callbacks | Rename to `_batch_id` — preserves the destructure-for-documentation pattern |
| `no-unused-vars` | 642, 659, 674, 1025 | `batchId` in `onSuccess` callbacks | Rename to `_batchId` — same pattern |
| `no-unused-vars` | 1025 | `batch_id` in `useDeleteWeightRecord.onSuccess` | Rename `batch_id` → `_batch_id`; keep `animal_id` — it drives the cache key |

#### `src/lib/hooks/useSapiPenggemukanData.js` (deferred Phase 6.F, exact lines unknown until baseline run)

Run baseline first (`npx eslint src/lib/hooks/useSapiPenggemukanData.js`), then apply `_`-prefix renames to any `no-unused-vars` that are safe destructured-but-undread vars.

**Verification after 7.2:**
```bash
npx eslint src/lib/hooks/createPenggemukanHooks.js
npx eslint src/lib/hooks/useSapiPenggemukanData.js
npm run build
```

**Status:** ⏳ Not started

---

### 7.3 — React Hook Dependency Review

`react-hooks/exhaustive-deps` violations require case-by-case analysis. Blindly adding every missing dep can introduce infinite re-render loops. For each instance:

1. Identify what's missing from the deps array.
2. Ask: is it a stable ref (Supabase client, `queryClient`, function defined at module scope, `useRef` value)? If yes → `// eslint-disable-next-line react-hooks/exhaustive-deps -- stable ref: <name>`.
3. Is it genuinely changing per render? → Add to deps array and verify no loop.
4. Is it a function defined inside the component that should be `useCallback`? → Wrap with `useCallback`.

#### Known instances

| File | Approx line | Missing dep | Recommendation |
|------|-------------|-------------|----------------|
| `src/lib/hooks/useAuth.jsx` | 124 | `fetchAuthData` | Wrap in `useCallback` or move inside effect. Verify no infinite-loop: `fetchAuthData` must not itself depend on the effect's output. |
| `src/lib/hooks/useSapiPenggemukanData.js` | various | Unknown — get from baseline run | Audit per instance after 7.0 |

#### `react-refresh/only-export-components` in `useAuth.jsx`

| File | Lines | Note | Recommendation |
|------|-------|------|----------------|
| `src/lib/hooks/useAuth.jsx` | 189, 205, 209 | `useAuth`, `getBrokerBasePath`, `getPeternakBasePath` exported alongside `AuthProvider` component | **Structural change** — move the three exports to a separate file (e.g. `src/lib/hooks/useAuthUtils.js`) and update all import sites. Risky: many files import from `useAuth.jsx`. Run `grep -r "from.*useAuth"` before touching. Defer if import-site count is high. |

**Defer rule for 7.3:** If a `react-hooks/exhaustive-deps` fix requires wrapping a function in `useCallback` AND that function is called in multiple places AND the `useCallback` dep array is itself non-trivial → document in "Deferred to 7.4" table and move on. Do not block the lint pass on structural refactors.

**Verification after 7.3:**
```bash
npx eslint src/lib/hooks/useAuth.jsx
npx eslint src/lib/hooks/useSapiPenggemukanData.js
npm run build
```

**Status:** ⏳ Not started

---

### 7.4 — Defer / Escalate Structural Issues

Any violation that cannot be fixed safely within Phase 7's guardrails goes here. Document the reason and the proposed fix for a future dedicated refactor phase.

#### Known candidates (pre-populated from ROADMAP Lint Debt Log)

| File | Rule | Reason deferred | Proposed future fix |
|------|------|-----------------|---------------------|
| `src/lib/hooks/useAuth.jsx` | `react-refresh/only-export-components` × 3 | Requires file split + updating all `useAuth.jsx` import sites across the project | Create `useAuthUtils.js` exporting `useAuth`, `getBrokerBasePath`, `getPeternakBasePath`; update all callers; verify build |
| `src/dashboard/_shared/components/BusinessModelOverlay.jsx` | `react-hooks/set-state-in-effect` (warn) | Intentional pattern — derived state synced from async query; downgraded to warn in eslint.config.js already | Leave as warn. If ever promoted to error, add targeted `// eslint-disable-next-line` with comment |
| `src/pages/AuthCallback.jsx` | `react-hooks/set-state-in-effect` (warn) | Intentional state machine (`setPhase('error')` inside useEffect) | Same — leave as warn |

> Add rows here during 7.3 if new structural issues are found that cannot be fixed safely.

**Status:** ⏳ Updated as 7.3 executes

---

### 7.5 — Final Verification

Run full lint and build. Both must be clean before closing Phase 7.

```bash
npm run lint
npm run build
```

Expected outcomes:
- `npm run lint` → 0 errors (warnings from intentionally-downgraded rules are acceptable)
- `npm run build` → exit 0 on both client and SSR bundles
- No behavior changes in application
- All 7.4 deferrals documented

**Status:** ⏳ Not started

---

## Definition of Done

- [ ] 7.0 baseline report captured (`lint-report.txt`)
- [ ] 7.1 runtime-risk errors fixed and verified
- [ ] 7.2 safe unused-var renames applied and verified per file
- [ ] 7.3 hook-dep violations reviewed; each either fixed or explicitly deferred to 7.4
- [ ] 7.4 structural deferrals documented with proposed future fix
- [ ] 7.5 `npm run lint` exits 0; `npm run build` passes
- [ ] Commit message: `chore(lint): Phase 7 — project-wide ESLint cleanup post Phase 6.F`
- [ ] No new behavior changes — only dead-code removal and harmless renames

---

## Out of Scope

| Item | Reason |
|------|--------|
| `actionName` literal renames (`handleSave` → `account.edit_profile.save`, etc.) | Separate cosmetic rename phase — does not block lint pass |
| New error logging instrumentation | Phase 6.F closed; next instrumentation sweep is a new phase |
| Updating `eslint.config.js` rule severity | Config changes are a separate PR; Phase 7 fixes code to satisfy current rules |
| Broad `npx eslint --fix .` autorun | Not safe — auto-fix can rewrite logic; fix manually per file |
| `prettier` formatting sweep | Not related to lint errors; out of scope |
| Adding new features or refactoring business logic | Fix the lint, not the feature |
