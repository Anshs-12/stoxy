# Fix Broken Stoxy Frontend & Migrate to Bun

## Problem Summary

The frontend build is completely broken with **17 `UNRESOLVED_IMPORT` errors** from the build log, plus additional TypeScript strict-mode issues. The existing `node_modules` were installed on Windows (`C:\Users\Ansh S\Desktop\...`) and are stale/incompatible on the current Linux system. The user wants to migrate from npm to **bun** as the package manager.

---

## Complete Problem List

### 🔴 Critical — Build-Breaking Issues

| # | Issue | Location | Root Cause |
|---|-------|----------|------------|
| 1 | `node_modules` installed on **Windows** | `frontend/node_modules/` | `build-error.log` references `C:\Users\Ansh S\Desktop\...` paths. These native binaries are incompatible on Linux. Needs full reinstall. |
| 2 | `bun.lock` exists but npm's `package-lock.json` also present | `frontend/` | Mixed lockfiles cause confusion. Need to clean and use only bun. |
| 3 | `useApi.ts` has **unused imports** | [useApi.ts](file:///home/ansh/Desktop/live-stock-checker/frontend/src/hooks/useApi.ts) | `stocksApi` imported on line 2 but never used. `noUnusedLocals: true` in tsconfig causes TS error. `lastParams` also set but never read. |
| 4 | `ToastContext.tsx` — `React` imported but unused | [ToastContext.tsx](file:///home/ansh/Desktop/live-stock-checker/frontend/src/context/ToastContext.tsx#L1) | `import React` is unnecessary with `react-jsx` transform, and `noUnusedLocals` flags it. |
| 5 | `Sidebar.tsx` — unused icon imports | [Sidebar.tsx](file:///home/ansh/Desktop/live-stock-checker/frontend/src/components/layout/Sidebar.tsx#L2) | `Settings` and `HelpCircle` are imported from `lucide-react` but never used. |
| 6 | `IndexDetail.tsx` — unused icon imports | [IndexDetail.tsx](file:///home/ansh/Desktop/live-stock-checker/frontend/src/components/pages/IndexDetail.tsx#L4) | `TrendingUp` and `TrendingDown` imported but only destructured in the array (only `label`, `val`, `color` are used in the `.map()` — `Icon` is omitted). |
| 7 | `StockScreener.tsx` — unused `Search` import | [StockScreener.tsx](file:///home/ansh/Desktop/live-stock-checker/frontend/src/components/pages/StockScreener.tsx#L3) | `Search` icon imported from lucide but used — actually this one IS used on line 216. **False alarm**, this is fine. |
| 8 | Vite 8 + React 19 compatibility | `package.json` | `vite@^8.0.1` with `@vitejs/plugin-react@^6.0.1` and `@types/react@^18.0.0` — the `@types/react` is v18 but `react` is v19. Type mismatch. |

### 🟡 Minor / Non-Breaking Issues

| # | Issue | Location |
|---|-------|----------|
| 9 | `Watchlist.tsx` uses old OAuth URL `/api/v1/...` | [Watchlist.tsx:33,103](file:///home/ansh/Desktop/live-stock-checker/frontend/src/components/pages/Watchlist.tsx#L33) |
| 10 | `build-error.log` and `build-log.txt` are stale Windows artifacts | `frontend/` |
| 11 | `postcss.config.cjs` uses old CJS format (works but newer style preferred) | `frontend/postcss.config.cjs` |

---

## Proposed Changes

### Phase 1: Clean Slate — Migrate to Bun

#### [MODIFY] [package.json](file:///home/ansh/Desktop/live-stock-checker/frontend/package.json)
- Update `@types/react` and `@types/react-dom` to `^19.0.0` to match React 19
- Keep all other deps as-is (they work fine)

#### Environment Cleanup
- Delete `node_modules/`, `package-lock.json`, `build-error.log`, `build-log.txt`
- Run `bun install` to do a fresh install using `bun.lock`

---

### Phase 2: Fix TypeScript Strict-Mode Violations

#### [MODIFY] [useApi.ts](file:///home/ansh/Desktop/live-stock-checker/frontend/src/hooks/useApi.ts)
- Remove unused `stocksApi` import (line 2)
- Remove unused `lastParams` state variable (line 8, 13)

#### [MODIFY] [ToastContext.tsx](file:///home/ansh/Desktop/live-stock-checker/frontend/src/context/ToastContext.tsx)
- Remove unused `React` import (line 1). Only `createContext`, `useContext`, `useState`, `useCallback`, `ReactNode` are needed.

#### [MODIFY] [Sidebar.tsx](file:///home/ansh/Desktop/live-stock-checker/frontend/src/components/layout/Sidebar.tsx)
- Remove unused `Settings` and `HelpCircle` imports from lucide-react (line 2)

#### [MODIFY] [IndexDetail.tsx](file:///home/ansh/Desktop/live-stock-checker/frontend/src/components/pages/IndexDetail.tsx)
- Remove unused `TrendingUp` and `TrendingDown` imports from lucide-react (line 4)

---

### Phase 3: Fix Stale API URLs

#### [MODIFY] [Watchlist.tsx](file:///home/ansh/Desktop/live-stock-checker/frontend/src/components/pages/Watchlist.tsx)
- Change `/api/v1/oauth2/authorization/google` → `/api/v2/oauth2/authorization/google` on lines 33 and 103

---

## Verification Plan

### Automated Tests
1. `bun install` — Verify clean dependency installation
2. `bun run build` — Verify zero build errors (the critical gate)
3. `bun run dev` — Start the dev server and verify it boots without errors

### Manual Verification
- Open the dev server in browser to confirm the app renders
