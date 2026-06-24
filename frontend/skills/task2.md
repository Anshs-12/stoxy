# Stoxy Frontend Integration — Agent Prompt

## ROLE & MISSION

You are a senior frontend engineer being onboarded onto **Stoxy**, a full-stack real-time stock screener and portfolio tracker. The backend just completed a major migration: all stock/index data now comes from **Upstox** instead of the old provider, and a **real-time WebSocket → Redis pipeline** now powers live prices across the entire app.

Your job is to **rewire the existing frontend's data layer** to talk to this new backend architecture — re-enabling Portfolio and Watchlist with live pricing, wiring up a global ticker-polling engine, and updating Stock Search/Detail and the market index overview to use the new instrument-key-based contracts.

This is **NOT a redesign**. The existing visual design, component library, layout system, and any "skills"/design-token folders in the frontend are to be **preserved and extended**, not replaced. Where the old data-fetching logic for Portfolio/Watchlist/Stock Search is stale or was built for the old API shape, you should remove/replace *that logic* — but the UI shell, styling, navigation, and component structure around it should stay intact and simply be improved/filled in with real, live data.

Read this entire document before writing any code. It is long because it needs to be — read it fully, then re-read the "Permissions & Access Boundaries" and "Definition of Done" sections one more time before you start.

---

## PERMISSIONS & ACCESS BOUNDARIES (CRITICAL — READ FIRST)

These rules are non-negotiable and apply for the entire duration of this task, across every step of the execution plan below.

### 1. Backend source code — READ ONLY, NOTHING ELSE
- You may **read** any file under the backend's `src/` tree (controllers, services, DTOs/payloads, mappers, repositories, models, security config, exceptions) **purely to understand API contracts** — request/response shapes, field names, types, endpoint paths, HTTP methods, and error formats.
- You may **NOT**:
  - Write, create, edit, rename, move, or delete **any** file in the backend.
  - Run **any** command that touches the backend (`mvn`, `./mvnw`, `java -jar`, `docker compose up` for the backend service, database migrations, etc.).
  - Execute, build, test, or start the backend application in any way.
  - Modify `pom.xml`, `application.properties`/`application.yml`, Docker files, or any backend configuration.
- If something about the backend seems wrong, missing, or inconvenient for the frontend — **do not fix it**. Note it clearly in your final summary as a "Backend follow-up" item instead.

### 2. Environment files — NEVER READ, ANYWHERE
- Do **not** open, read, `cat`, `grep`, or otherwise inspect any file matching: `.env`, `.env.*`, `*.env`, `application.properties`, `application.yml`, `application-*.yml`, `secrets.*`, or anything that looks like it stores credentials, API keys, tokens, database URLs, or OAuth secrets — whether in the backend, frontend, or repo root.
- If you need to know *whether* an environment variable exists (e.g., `VITE_API_BASE_URL`), you may reference it **by name** in code (e.g., `import.meta.env.VITE_API_BASE_URL`), but never print, log, or read its actual value.
- If a `.env.example` / `.env.sample` file exists in the frontend and contains only placeholder keys (no real secrets), you may read that one — it's a template, not a secret.

### 3. Frontend — full access
- Within the frontend project folder, you have **full read, write, and execute access**. Install packages, restructure internal files, add new components/hooks/services, run the dev server, run the build, run linters/formatters/tests — whatever you need to ship a working result.
- "Full access" does not mean "free rein on design" — see the next section.

### 4. Design preservation — improve, don't replace
- Before writing a single line of UI code, explore the existing frontend structure:
  - Find and read any "skills", design-system, theme, or design-tokens folder/files.
  - Find and read the existing shared component library (buttons, cards, tables, modals, charts, skeletons, layout components).
  - Identify existing patterns for: API calls, state management, routing, error/toast notifications, loading states.
- **Reuse these wherever possible.** If Portfolio already has a `<PortfolioCard />` or similar component with the right look and feel, keep its structure/styling and just feed it real data and new props as needed — don't rebuild it from scratch in a different style.
- If a component is fundamentally incompatible with the new data shape (e.g., expects a field that no longer exists), adapt it minimally — change props/data mapping, not its visual identity.
- New UI you *do* need to add (e.g., live price tickers, slippage-retry banners, "price changed" indicators) should visually match the existing design language — same spacing scale, color tokens, typography, card/border treatments, etc.
- If you genuinely cannot find an existing pattern for something (e.g., there's no "skeleton loader" component yet), it's fine to add one — but base it on the existing design tokens/theme rather than inventing a new visual style.

---

## PROJECT CONTEXT — WHAT CHANGED IN THE BACKEND

Stoxy's backend just shipped a large migration (merged to `master`, PR title: *"feat: migrate to Upstox market data API"*). Three things happened, in order:

### A. Stock & Index data moved to Upstox
- Stock search, stock detail, and a new index search endpoint now hit Upstox's REST API under the hood.
- The stock detail response now carries an `instrumentKey` (Upstox's unique identifier, format like `NSE_EQ|INE002A01018`) — this key is now the **primary identifier** used across Portfolio, Watchlist, and the ticker endpoints. Stock symbol is still present for display, but **instrumentKey is the source of truth for lookups**.
- Error responses were standardized: `APIResponse` was renamed to `ApiErrorResponse`, and a new `UpstoxFeedException` covers Upstox-specific failures (e.g., live price unavailable, price slippage rejected).

### B. A real-time WebSocket → Redis pipeline was added
- The backend maintains a persistent WebSocket connection to Upstox's V3 market data feed (`UpstoxWebSocketClient` + `MarketDataHandler`), decoding Protobuf binary messages and caching them in Redis under `LTPC:{instrumentKey}` and `FULL:{instrumentKey}` keys, with short TTLs.
- Auto-reconnect is handled server-side — the frontend never needs to manage a WebSocket connection itself. **The frontend talks to plain REST/polling endpoints only.**
- On startup, the backend auto-subscribes to ~15 marquee market indices in `ltpc` mode — these are "always live" without any frontend action.
- For any other instrument (individual stocks), the backend subscribes **on demand**: when the frontend polls `/ticker/live/ltpc` or `/ticker/live/fullFeed` for an instrument key it hasn't seen before, the backend detects the missing Redis key, triggers a live subscription, and the data becomes available on a subsequent poll (typically within 1-2 polling cycles).
- New `TickerController` exposes:
  - `GET /ticker/live/ltpc` — lightweight price data (last traded price, etc.) for a list of instrument keys.
  - `GET /ticker/live/fullFeed` — richer market-depth/full quote data for a list of instrument keys (used primarily on stock detail pages).
  - Both return a **map keyed by instrumentKey** — `{ "NSE_EQ|INE002A01018": { ...data }, "NSE_EQ|INE062A01020": null }`. A `null` value for a key means "not cached yet, subscription was just triggered — poll again shortly."

### C. Portfolio and Watchlist were re-enabled on this new pipeline
- Both were **temporarily disabled** mid-migration (you may see old frontend code that was built against their *pre-migration* shapes — that code is now stale).
- **Portfolio**: `getPortfolio`/`buyStock`/`sellStock` now source live prices from Redis via `TickerService` instead of per-stock REST calls. Buy/sell now validates the client-submitted price against the live price with a **1% slippage tolerance** — if the live price has moved more than 1% since the frontend last fetched it, the order is rejected and the frontend must handle that gracefully (see Portfolio section below).
- **Watchlist**: stock resolution now uses `instrumentKey` instead of stock symbol throughout. The watchlist-stock response now includes `instrumentKey` (for ticker polling) and `priceAddedAt` (a price snapshot supplied **by the frontend** at the time of adding — not fetched by the backend).

---

## REQUIRED BACKEND READING LIST (read-only)

Before writing frontend code, read these backend files to extract **exact** field names, types, and endpoint signatures. Everything in this prompt describing DTO shapes is based on the migration's design discussions — **treat it as a strong guide, but the source files below are the ground truth.** If anything in this prompt conflicts with what you read in these files, the files win.

All controllers below use the application's context path — check `application.properties`/`application.yml` is **not** something you need to read for this; instead, infer the context path from any existing frontend API client config (the frontend almost certainly already has a base URL configured — e.g. something like `http://localhost:8080/api/v2`). Reuse whatever base URL the existing frontend already points at.

### Controllers (endpoint paths, HTTP methods, request/response types)
- `src/main/java/com/stockChecker/live_stock_checker/controller/TickerController.java`
- `src/main/java/com/stockChecker/live_stock_checker/controller/PortfolioController.java`
- `src/main/java/com/stockChecker/live_stock_checker/controller/WatchlistController.java`
- `src/main/java/com/stockChecker/live_stock_checker/controller/StockController.java`
- `src/main/java/com/stockChecker/live_stock_checker/controller/IndexController.java`

### DTOs / Payloads (exact field names + types — this is what you'll map in TypeScript)
- `src/main/java/com/stockChecker/live_stock_checker/payload/WebsocketPayload/LtpcDataDTO.java`
- `src/main/java/com/stockChecker/live_stock_checker/payload/WebsocketPayload/FullFeedDataDTO.java`
- `src/main/java/com/stockChecker/live_stock_checker/payload/WebsocketPayload/QuoteDTO.java`
- `src/main/java/com/stockChecker/live_stock_checker/payload/PortfolioPayload/*.java` (all files — Portfolio/PortfolioStock response DTOs, Buy/Sell request & response DTOs, TransactionResponseDTO)
- `src/main/java/com/stockChecker/live_stock_checker/payload/WatchlistPayload/*.java` (all files)
- `src/main/java/com/stockChecker/live_stock_checker/payload/StockPayload/StockDetailResponseDTO.java`
- `src/main/java/com/stockChecker/live_stock_checker/payload/StockPayload/StockSearchDTO.java`
- `src/main/java/com/stockChecker/live_stock_checker/payload/StockPayload/StockSearchResponseDTO.java`
- `src/main/java/com/stockChecker/live_stock_checker/payload/IndexPayload/IndexSearchDTO.java`
- `src/main/java/com/stockChecker/live_stock_checker/payload/IndexPayload/IndexSearchResponseDTO.java`
- `src/main/java/com/stockChecker/live_stock_checker/payload/IndexPayload/IndexDetailResponseDTO.java`
- `src/main/java/com/stockChecker/live_stock_checker/payload/ApiErrorResponse.java`
- `src/main/java/com/stockChecker/live_stock_checker/payload/ErrorCode.java`

### Exceptions (for error-handling UI)
- `src/main/java/com/stockChecker/live_stock_checker/exceptions/GlobalExceptionHandler.java`
- `src/main/java/com/stockChecker/live_stock_checker/exceptions/UpstoxFeedException.java`
- Any `ResourceNotFoundException`, `ResourceExistsException`, `InsufficientQuantityException`, `StockNotFoundException` classes referenced by the above.

### Security (to confirm auth requirements per endpoint)
- `src/main/java/com/stockChecker/live_stock_checker/security/WebSecurityConfig.java`
- `src/main/java/com/stockChecker/live_stock_checker/security/JWT/AuthEntryPoint.java`

Do **not** read anything else in the backend beyond what's needed to clarify these contracts. Do not read `StockDataSeeder`, `StockDataSeederListener`, `MarketDataHandler`, `UpstoxWebSocketClient`, `WebSocketManager`, or the `.proto` schema — those are internal plumbing the frontend never touches directly.

---

## ARCHITECTURE: THE NEW FRONTEND DATA LAYER

### Base API client
- Locate the existing API client/service layer (likely an `axios` instance, `fetch` wrapper, or similar with a configured base URL and auth/cookie handling). Reuse it.
- All new endpoints below are relative to that same base URL — do **not** create a second client or a different base URL.
- Ensure the client already attaches whatever auth mechanism the existing app uses (cookies/JWT) — Portfolio and Watchlist endpoints are authenticated; `/ticker/live/*` may or may not require auth (check `WebSecurityConfig.java`).

### The Ticker Polling Engine (new — core piece of this task)

This is the most important new piece of infrastructure. Design a **single, shared, centralized polling mechanism** rather than letting every component manage its own `setInterval`. Goals:

1. **Single source of truth** for "what instrument keys does the UI currently need live prices for, and what's the latest data for each."
2. **Request batching** — if Portfolio needs 8 instrument keys and Watchlist needs 5 (with overlap), the engine should combine them into as few HTTP requests as possible per polling tick, not one request per stock.
3. **Subscription-based consumption** — components "subscribe" to the instrument keys they care about (e.g., on mount) and "unsubscribe" on unmount. The engine's active key-set is the union of all current subscriptions.
4. **Two independent pools**: one for `ltpc` data (used by Portfolio, Watchlist, Index overview — cheap, frequent) and one for `fullFeed` data (used by Stock Detail — typically just one instrument at a time).
5. **Polling interval**: default to **2 seconds** for `ltpc`, **2-3 seconds** for `fullFeed`. Make both intervals easily configurable in one place (a constant/config file), not hardcoded in multiple spots.
6. **Pause when tab is hidden** — use the Page Visibility API to stop polling when the tab isn't visible, and resume (with an immediate poll) when it becomes visible again. This avoids wasting requests and rate-limit budget.
7. **Graceful handling of `null` values** — when the map returned for an instrument key is `null` (not yet cached), the UI for that instrument should show a loading/skeleton state for price-dependent fields, **not** an error, and should pick up the value automatically on a later poll once the backend subscription completes.
8. **Cleanup** — every component that subscribes must unsubscribe on unmount. No dangling intervals, no memory leaks, no requests for instrument keys nothing on screen needs anymore.
9. **Error resilience** — if a poll request fails (network error, 5xx), don't crash the UI or clear existing cached prices; keep showing the last-known values, retry on the next tick, and only surface a subtle "live data may be delayed" indicator if failures persist for several consecutive ticks.

Conceptual shape (adapt to whatever state-management pattern the existing frontend already uses — Context + hooks, Zustand, Redux, etc. — **do not introduce a new state management library** if one is already in place):

```
TickerStore (or TickerProvider/Context)
  state:
    ltpcData: Record<instrumentKey, LtpcData | null>
    fullFeedData: Record<instrumentKey, FullFeedData | null>
    ltpcSubscriptions: Set<instrumentKey>  // union of all active subscribers' keys
    fullFeedSubscriptions: Set<instrumentKey>
    lastError: Error | null
    consecutiveFailures: number

  effects:
    every LTPC_POLL_INTERVAL_MS:
      if document.visibilityState === 'visible' AND ltpcSubscriptions.size > 0:
        keys = Array.from(ltpcSubscriptions)
        result = GET /ticker/live/ltpc?instrumentKeyList=<keys joined as backend expects>
        merge result into ltpcData (don't wipe existing entries not in this batch)

    every FULLFEED_POLL_INTERVAL_MS:
      same pattern for fullFeedSubscriptions / fullFeedData

  hooks exposed to components:
    useLtpc(instrumentKeys: string[]): Record<instrumentKey, LtpcData | null>
      - registers these keys on mount, unregisters on unmount/change
      - returns current ltpcData slice for just these keys

    useFullFeed(instrumentKey: string): FullFeedData | null
      - same pattern, single key
```

**Important — confirm the exact query parameter format** by reading `TickerController.java`: Spring's `@RequestParam List<String>` typically accepts either repeated params (`?instrumentKeyList=A&instrumentKeyList=B`) or a single comma-separated value (`?instrumentKeyList=A,B`), depending on how it's declared and configured. Verify empirically (or from the controller annotation) which format works, and encode accordingly — getting this wrong will silently return empty/partial results.

---

## FEATURE SPEC 1 — STOCK SEARCH & DETAIL

### Search
- Wire the existing stock search UI to the migrated search endpoint (`StockController` — verify exact path, e.g. `/stock/search?query=...`).
- Response is now `StockSearchResponseDTO` containing a list of `StockSearchDTO` — each result should include at least `stockSymbol`, `stockName`, and `instrumentKey`. Confirm exact fields from source.
- Each search result, when clicked, should navigate to the Stock Detail page using a route param that includes enough info to fetch detail (symbol and/or instrumentKey, per however the existing routing works).

### Detail page
- Fetch `StockDetailResponseDTO` from the stock detail endpoint. This now includes `instrumentKey` alongside company info, financials, and static price info fields.
- **On mount**, subscribe this instrument's key to the **fullFeed** ticker pool via `useFullFeed(instrumentKey)`. This is what triggers (server-side) the `full` mode subscription for this instrument — the detail page is the *only* place that should use `fullFeed`.
- Render live fields (current price, day change, day change %, volume, OHLC, etc. — whatever `FullFeedDataDTO`/`QuoteDTO` actually contain per your reading of those files) reactively from `useFullFeed`. While the value is `null`, show skeleton/shimmer placeholders over the existing static layout — do not show "$0" or "N/A" as the live values, since that reads as broken data.
- **Two actions on this page must be wired to the new contracts:**
  1. **"Buy" / "Add to Portfolio"** → opens the existing buy flow (see Portfolio spec), pre-filled with this stock's `instrumentKey`, `stockSymbol`, and the **current live price** (from the fullFeed/ltpc data) as the default `buyPrice`.
  2. **"Add to Watchlist"** → opens the existing add-to-watchlist flow (see Watchlist spec), pre-filled with `instrumentKey`, `stockSymbol`, and the **current live price** as `priceAddedAt`.

---

## FEATURE SPEC 2 — MARKET / INDEX OVERVIEW

- The backend auto-subscribes ~15 marquee indices on startup, always available via `/ticker/live/ltpc`.
- If the existing frontend has a market overview / index ticker bar / homepage widget, wire it to:
  1. Fetch the list of marquee index instrument keys — either via the index search endpoint (`IndexController`/`IndexSearchResponseDTO`) filtered to the marquee set, or via whatever static/config list the backend exposes for these (check `IndexController` and `MarketIndex` model references in the DTOs for a "priority"/"marquee" flag — read-only, don't guess).
  2. Subscribe those instrument keys via `useLtpc(...)`.
  3. Render each index's name, last price, and change (absolute + %) — using existing layout/styling for this widget.
- If the existing frontend has an index search page, wire it to `IndexController`'s search endpoint the same way the stock search was wired, using `IndexSearchDTO`/`IndexSearchResponseDTO` shapes.

---

## FEATURE SPEC 3 — PORTFOLIO (the big one)

### 3.1 Fetching and displaying the portfolio

- `GET /portfolio/` returns `PortfolioResponseDTO`:
  - `portfolioId` — may be `null` if the user has no portfolio yet (a "demo"/empty response is returned in that case — `stocks: []`, `sectorBreakdown: {}`, `totalInvestedValue` likely `0`). Treat a `null` `portfolioId` as **"no holdings yet"** — show an empty/onboarding state ("You haven't bought any stocks yet — search for a stock to get started"), **not** an error.
  - `lastUpdatedAt` — timestamp of this response (informational only).
  - `totalInvestedValue` — static, backend-computed sum of all holdings' invested amounts. **This is the only portfolio-level total the backend computes.**
  - `stocks` — array of `PortfolioStockResponseDTO`, each containing (verify exact names): `stockName`, `stockSymbol`, `avgBuyingPrice`, `totalQuantity`, `investedAmount`, `instrumentKey`.
  - `sectorBreakdown` — a map of `sector name → percentage of totalInvestedValue` (static, backend-computed). Use this to render the existing sector pie/donut chart, unchanged in structure from before **except** confirm the percentages are now pre-computed (no client-side math needed for this chart).

- **Everything else is computed on the frontend, live, per stock:**
  1. On mount, collect every holding's `instrumentKey` and subscribe them all via `useLtpc(instrumentKeys)`.
  2. For each holding, once its live price (`currentPrice`) is available:
     - `currentValue = currentPrice * totalQuantity`
     - `unrealizedPnL = currentValue - investedAmount`
     - `unrealizedPnLPercent = (unrealizedPnL / investedAmount) * 100`
     - If `LtpcDataDTO` includes a previous-close field (check the source file — Upstox LTPC payloads typically include a close price), also compute:
       - `dayPnL = (currentPrice - previousClose) * totalQuantity`
       - `dayPnLPercent = ((currentPrice - previousClose) / previousClose) * 100`
     - If no previous-close field exists in `LtpcDataDTO`, omit day-change figures for now and note this in your final summary as a "Backend follow-up" — do not fabricate a value.
  3. **Portfolio-level totals** (total current value, total unrealized PnL, total unrealized PnL %, total day PnL, total day PnL %) are the **sum/aggregate of the per-stock live computations above** — not from the backend. Recompute these on every polling tick as live prices update.
  4. While a given holding's live price is still `null` (not yet cached), show that row with a skeleton for the live-dependent columns (current price, current value, PnL) while still showing the static columns (symbol, name, qty, avg buy price, invested amount) immediately.

### 3.2 Buying a stock

- Entry points: a "Buy" button on a portfolio row (to add to an existing holding) and the "Buy"/"Add to Portfolio" action from the Stock Detail page (for a new holding).
- The buy form needs: `instrumentKey`, `stockSymbol`, `quantity` (user input), and `buyPrice`.
- **`buyPrice` must be the live price from the ticker engine at the moment the user opens/submits the form** — not a stale value from when the portfolio/page first loaded. Re-fetch or read the latest `useLtpc`/`useFullFeed` value right before submission, or show the live price prominently in the form so the user sees it update in real time while the form is open.
- `POST /portfolio/buyStock` with `{ instrumentKey, stockSymbol, quantity, buyPrice }` (confirm exact field names from `BuyStockRequestDTO`).
- **Slippage handling (critical):** the backend re-checks the live price server-side and rejects the order (via `UpstoxFeedException`, surfaced through `ApiErrorResponse`) if the price has moved **more than 1%** from the `buyPrice` you submitted. On this specific error:
  - Do **not** show a generic "something went wrong" error.
  - Show a clear message like: *"Price moved before your order went through. Latest price: ₹X. Review and retry?"*
  - Refresh the displayed live price (it should already be live via the ticker engine) and let the user re-submit with one click/confirmation — don't make them re-open the whole form.
- On success (`BuyStockResponseDTO` — confirm fields: `stockSymbol`, `instrumentKey`, `buyPrice`, `quantityBought`, `boughtAt`), show a success confirmation (toast/modal consistent with existing patterns) and refresh the portfolio list (re-fetch `/portfolio/` and re-subscribe ticker keys if a new instrument was added).

### 3.3 Selling a stock

- Entry point: a "Sell" button on a portfolio row. Only show this for holdings the user actually owns (`totalQuantity > 0`).
- The sell form needs: `instrumentKey`, `stockSymbol`, `quantity` (user input, must be `<= totalQuantity` for that holding — validate client-side before submit, but the backend is the real authority), and `sellingPrice`.
- Same live-price freshness requirement as buying: `sellingPrice` should reflect the current live price at submission time.
- `POST /portfolio/sellStock` with `{ instrumentKey, stockSymbol, quantity, sellingPrice }` (confirm exact field names from `SellStockRequestDTO`).
- **Two error cases to handle specifically:**
  1. **Slippage rejection** (`UpstoxFeedException`, same 1% tolerance as buying) — same UX as the buy-side slippage handling above.
  2. **Insufficient quantity** (`InsufficientQuantityException`) — if the user somehow attempts to sell more than they hold (e.g., stale UI state from another tab), show a clear message: *"You only hold N shares of this stock"* and refresh the holding's quantity from `/portfolio/`.
- On success (`SellStockResponseDTO` — confirm fields: `stockSymbol`, `instrumentKey`, `sellPrice`, `quantitySold`, `realizedProfitLoss`, `soldAt`):
  - Show the realized P&L from this specific sale prominently in the confirmation (e.g., *"Sold 5 shares of INFY — Realized P&L: +₹1,250"*), with appropriate green/red styling matching the existing PnL color conventions.
  - Refresh the portfolio. If `totalQuantity` for that stock is now `0`, the backend deletes the holding entirely — the row should disappear from the portfolio list on refresh; handle this as a normal removal, not an error.

### 3.4 Transaction history

- `GET /portfolio/transactions` — full transaction history (all stocks). `GET /portfolio/transaction/{stockSymbol}` — history for one stock.
- Both return `List<TransactionResponseDTO>` — confirm exact fields (likely includes: stock symbol, instrument key, transaction type BUY/SELL, quantity, price, timestamp).
- If either endpoint returns an empty list or a "no transactions" error response (`ResourceNotFoundException` — check `GlobalExceptionHandler` for whether this becomes a 404 with a message, or an empty 200), handle both cases as an empty-state UI ("No transactions yet"), not a hard error.
- Wire the existing transaction history table/list UI to these endpoints, preserving its current layout/columns where possible — just feed it live data instead of whatever it was using before.

### 3.5 PDF export

- `GET /portfolio/transactions/export` returns a PDF binary (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="transactions.pdf"`).
- Wire the existing "Export"/"Download statement" button to call this endpoint and trigger a browser download of the returned blob using the filename from the response header (or a sensible default if unavailable).
- Handle the "no transaction history" error the same way as 3.4 — if the user has no transactions, disable or hide the export button rather than letting them hit an error.

---

## FEATURE SPEC 4 — WATCHLIST

### 4.1 Watchlist list & summary

- `GET /watchlist/` returns `List<WatchlistSummaryDTO>` — each item includes `watchlistId` and `watchlistName` (confirm exact fields). Render the existing "your watchlists" list/grid UI from this.
- "Create new watchlist" → `POST /watchlist/create` with `{ watchlistName }` (confirm field name from `CreateWatchRequestDTO`).
  - Handle the **duplicate name** error (`ResourceExistsException` — *"Watchlist with this name already exists!"*) with an inline form error, not a toast that disappears — the user needs to immediately know to pick a different name.

### 4.2 Single watchlist view

- `GET /watchlist/{watchlistId}` returns `WatchlistResponseDTO`: `watchlistName`, `createdAt`, and `watchlistStocks: WatchlistStockResponseDTO[]`.
- Each `WatchlistStockResponseDTO` includes (confirm exact fields): `stockName`, `stockSymbol`, `instrumentKey`, `priceAddedAt`, `addedAt`.
- On mount, collect all `instrumentKey`s from `watchlistStocks` and subscribe via `useLtpc(instrumentKeys)` — same pattern as Portfolio.
- For each watched stock, once live price is available, compute and display **client-side**:
  - `currentPrice` (from `useLtpc`)
  - `change = currentPrice - priceAddedAt`
  - `changePercent = (change / priceAddedAt) * 100`
  - Style positive/negative the same way Portfolio's PnL is styled, for visual consistency.
- While live price is `null`, show a skeleton for `currentPrice`/`change`/`changePercent` columns, same as Portfolio — the static columns (`stockName`, `stockSymbol`, `priceAddedAt`, `addedAt`) render immediately.

### 4.3 Adding a stock to a watchlist

- Entry point: an "Add to Watchlist" action — from the Stock Detail page (primary), and/or a search-within-watchlist-view flow if the existing UI has one.
- `POST /watchlist/{watchlistId}/stocks` with body `{ stockSymbol, instrumentKey, priceAddedAt }` (confirm exact field names from `WatchlistStockRequestDTO` — note this DTO is used **only** for adding now, not for removal).
- **`priceAddedAt` must be the current live price** at the moment of adding (from the ticker engine on the Stock Detail page) — this is a frontend-supplied snapshot, the backend does not fetch it.
- Handle the **duplicate stock** error (`ResourceExistsException` — *"Stock already exists in the specified watchlist"*) with a clear inline message — e.g., disable the "Add" button and show "Already in this watchlist" if you can detect it ahead of time, or show the error message returned if not.
- On success, refresh the watchlist view (re-fetch `/watchlist/{watchlistId}` and update ticker subscriptions to include the new instrument key).

### 4.4 Removing a stock from a watchlist

- **This is now a `DELETE` request with the instrument key as a query parameter — not a request body.**
- `DELETE /watchlist/{watchlistId}/stocks?stockInstrumentKey={instrumentKey}` (confirm exact query param name from `WatchlistController`).
- On success (`204 No Content`), remove the row from the UI optimistically or refresh the watchlist; also unsubscribe that instrument key from the ticker engine if no other visible component still needs it.
- If the stock isn't found in the watchlist (`ResourceNotFoundException` — stale UI state), refresh the watchlist view to resync.

### 4.5 Deleting an entire watchlist

- `DELETE /watchlist/{watchlistId}` (`204 No Content` on success). Wire the existing "delete watchlist" action (likely with a confirmation dialog, per existing UX patterns) to this. On success, navigate back to the watchlist list view and refresh it.

---

## ERROR HANDLING & RESILIENCE (cross-cutting)

### Error response shape
- All backend errors now come back as `ApiErrorResponse` (renamed from `APIResponse`). Read `ApiErrorResponse.java` and `GlobalExceptionHandler.java` to get the **exact** JSON shape (likely something like `{ "status": 400, "error": "..." }`, but confirm).
- Update (or create, if one doesn't exist) a **single shared error-parsing utility** in the frontend's API client layer that extracts a human-readable message from any `ApiErrorResponse`, so every feature (Portfolio, Watchlist, Search, etc.) surfaces errors consistently via whatever toast/banner/inline-error pattern the existing frontend already uses.

### Specific error types to map to user-facing messages

| Backend exception | When it happens | Suggested frontend handling |
|---|---|---|
| `UpstoxFeedException` (live price unavailable) | Ticker poll for an instrument returns no live data and an action needs a live price (buy/sell submit) | "Live price temporarily unavailable for this stock — please try again in a moment." |
| `UpstoxFeedException` (slippage rejected) | Buy/sell price moved >1% since submission | See Portfolio 3.2/3.3 — show latest price, offer one-click retry |
| `InsufficientQuantityException` | Sell quantity > held quantity | "You only hold N shares — refreshing your portfolio." + auto-refresh |
| `ResourceExistsException` (watchlist name) | Duplicate watchlist name on create | Inline form error |
| `ResourceExistsException` (watchlist stock) | Stock already in watchlist | Inline message / disable Add |
| `ResourceNotFoundException` (watchlist/portfolio/stock not found) | Stale references, deleted entities | Refresh the relevant list/view to resync state |
| `StockNotFoundException` | Invalid/unknown `instrumentKey` passed somewhere | Should not normally be user-reachable if Search→Detail→Buy/Watchlist flows pass real instrument keys through — if you hit this, it likely indicates a frontend bug in how instrumentKey is threaded through; fix the data flow rather than just catching the error |

### General resilience rules
- Ticker polling failures must **never** clear already-displayed prices — always merge new data over old, never replace wholesale on error.
- Any mutation (buy, sell, add/remove watchlist stock, create/delete watchlist) should leave the UI in a recoverable state on failure — no silent failures, no stuck spinners. Every loading state needs a corresponding success and error resolution.
- Network/5xx errors on read endpoints (`/portfolio/`, `/watchlist/`, etc.) should show a retry affordance consistent with how the existing frontend already handles failed data fetches elsewhere (reuse that pattern — don't invent a new one).

---

## UI/UX STATES CHECKLIST (apply to every view touched)

For **every** screen/component you touch in this task, make sure all of these states are handled using the existing design system's primitives (skeletons, spinners, empty-state illustrations/components, error banners — whatever already exists):

1. **Initial load** — static data not yet fetched (skeleton/spinner for the whole section).
2. **Static data loaded, live data pending** — static fields render immediately; live-dependent fields (price, PnL, change%) show a lightweight skeleton/shimmer, not zeros or dashes.
3. **Fully loaded** — everything rendering normally, live values updating smoothly on each poll (avoid jarring layout shifts on each update — reserve space for live values from the start).
4. **Empty state** — no portfolio holdings / no watchlists / no transactions / no search results. Use existing empty-state components/copy conventions.
5. **Error state** — fetch failed. Retry affordance, doesn't wipe other already-loaded sections of the page.
6. **Mutation in-flight** — buy/sell/add/remove/create/delete in progress (disable the relevant button, show inline spinner — don't block the whole page unless that's the existing pattern for similar actions).
7. **Mutation error** — see the error-mapping table above; specific, actionable messages, not generic failures.
8. **Mutation success** — confirmation + refreshed data, consistent with existing success feedback patterns (toast, inline message, etc.)

---

## EXECUTION PLAN (suggested phases)

You don't have to follow this exact order, but it's designed to de-risk the work and let you validate the ticker engine early before building features on top of it.

### Phase 0 — Reconnaissance
- Explore the frontend folder structure end-to-end. Identify: framework/tooling (package.json), routing setup, state management approach, existing API client, design system/skills/theme folders, existing component library, and the **current (likely stale)** Portfolio/Watchlist/Stock pages and their data-fetching code.
- Read the backend files listed in "Required Backend Reading List" and extract exact DTO shapes and endpoint signatures. Write these down (e.g., as TypeScript interfaces in a new or existing types file) before proceeding — this becomes your contract reference for the rest of the task.
- Identify the existing API base URL configuration and confirm `/ticker/live/*`, `/portfolio/*`, `/watchlist/*` are reachable through it (check auth requirements via `WebSecurityConfig.java`).

### Phase 1 — Ticker Polling Engine
- Build the centralized ticker polling engine described above (`useLtpc`, `useFullFeed`, visibility-aware polling, batching, null-handling).
- Build a small, temporary debug view (or reuse an existing dev/debug route if one exists) to confirm the engine correctly polls, batches, and updates for a hardcoded set of instrument keys (e.g., the marquee indices, which are always live) before wiring it into real features. Remove/hide this debug view before finishing, unless the project already has a dedicated internal debug area where it'd fit naturally.

### Phase 2 — Stock Search & Detail
- Wire search to the migrated endpoint and confirm `instrumentKey` flows through to the detail route.
- Wire the detail page to `useFullFeed`, render live fields with skeletons, and implement the "Buy" and "Add to Watchlist" entry points (these can open the forms built in Phases 3/4 — sequence as convenient).

### Phase 3 — Portfolio
- Re-enable the Portfolio page: fetch `/portfolio/`, handle the empty/demo state, subscribe all holdings' instrument keys via `useLtpc`, implement all the live computations from Feature Spec 3.1.
- Implement Buy and Sell flows with slippage handling (3.2, 3.3).
- Wire transaction history and PDF export (3.4, 3.5).

### Phase 4 — Watchlist
- Re-enable watchlist list/summary and single-watchlist views, with live price + delta computations (4.1, 4.2).
- Implement add/remove stock and create/delete watchlist flows (4.3-4.5), including the query-param-based removal.

### Phase 5 — Market/Index Overview
- Wire the marquee index ticker bar (or equivalent) and any index search UI (Feature Spec 2).

### Phase 6 — Polish & resilience pass
- Go through the UI/UX States Checklist for every screen touched.
- Verify all subscriptions are cleaned up correctly (no console warnings about leaked intervals/subscriptions; check the Network tab shows polling stops on unmount and pauses on tab-hide).
- Run whatever lint/typecheck/test commands the project defines and fix anything broken by your changes.

### Phase 7 — Final summary
- Write a summary covering: what was changed, any "Backend follow-up" items you noted (fields you couldn't confirm, missing data needed for a feature, etc.), and any design-system additions you made and why.

---

## DEFINITION OF DONE

A change is complete only when **all** of the following are true:

- [ ] No frontend code references the old (pre-migration) Portfolio/Watchlist/Stock response shapes — everything matches the DTOs read from the backend source files.
- [ ] Ticker polling is centralized through a single engine; no component manages its own interval/polling loop.
- [ ] Polling pauses when the tab is hidden and resumes on visibility, with an immediate refresh on resume.
- [ ] All subscriptions are cleaned up on unmount — verified by checking no stray network requests continue after navigating away from a page.
- [ ] Portfolio: empty/demo state, live PnL math (current value, unrealized PnL/%, day PnL/% if data available), buy flow with slippage-retry UX, sell flow with slippage-retry and insufficient-quantity handling, transaction history, and PDF export all work end-to-end against the real backend.
- [ ] Watchlist: list/summary, single-watchlist view with live price + delta vs `priceAddedAt`, create (with duplicate-name handling), add stock (with duplicate-stock handling and live `priceAddedAt`), remove stock (via query-param DELETE), and delete watchlist all work end-to-end.
- [ ] Stock Search → Detail flow works with `instrumentKey` threaded through to both the ticker engine (fullFeed) and the Buy/Add-to-Watchlist actions.
- [ ] Market/index overview (if present in the existing UI) shows live marquee index data.
- [ ] Every touched screen handles all 8 states in the "UI/UX States Checklist."
- [ ] All errors map to specific, actionable messages per the error-handling table — no generic "Something went wrong" for cases that have a better message available.
- [ ] The existing visual design, theme, component library, and any skills/design-token folders are intact and reused — no parallel/duplicate component systems introduced.
- [ ] No backend files were modified, created, deleted, or executed. No `.env`/credential files were read.
- [ ] Lint/typecheck/build (whatever the project defines) passes.
- [ ] A final summary is written covering changes made and any "Backend follow-up" items.

---

## A NOTE ON UNCERTAINTY

Several exact field names in this prompt (especially within `LtpcDataDTO`, `FullFeedDataDTO`, `QuoteDTO`, and the Portfolio/Watchlist DTOs) are described based on architectural intent rather than verified source code. **You have read access specifically so you can verify these before writing code that depends on them.** Where this prompt's description and the actual source disagree, the source wins — but if a *feature* described here (e.g., day P&L, which depends on a previous-close field) turns out to be unsupported by the actual DTO shape, don't silently drop it — implement everything else, and call out the gap explicitly in your final summary as a "Backend follow-up" so it can be addressed in a future backend change.
