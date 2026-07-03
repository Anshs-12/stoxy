/**
 * marketSocket.ts
 *
 * Singleton WebSocket manager for the /api/v2/wss/market endpoint.
 *
 * Connection URL derivation:
 *   VITE_API_URL = http://localhost:8080/api/v2
 *     → ws://localhost:8080/api/v2/wss/market   (direct, in prod)
 *   In Vite dev server the proxy rewrites /api/v2 → http://localhost:8080,
 *   so we connect to ws://localhost:5173/api/v2/wss/market which Vite
 *   proxies (ws: true) to ws://localhost:8080/api/v2/wss/market.
 *
 * Message contract (UpstoxSubscribeRequest shape):
 *   Subscribe:   { guid, method: "sub",   data: { mode: "ltpc"|"fullFeed", instrumentKeys: [...] } }
 *   Unsubscribe: { guid, method: "unsub", data: { mode: "ltpc"|"fullFeed", instrumentKeys: [...] } }
 *   BroadcastHandler checks subscribeRequest.getMethod() for "unsub".
 *
 * Lifecycle:
 *   - On close code 4000 → market closed; never reconnect for this session.
 *   - On any other unexpected close → exponential back-off reconnect.
 *   - subscribe() is ref-counted; cleanup fn sends unsub when refs hit 0.
 *   - On reconnect, all active subscriptions are re-sent automatically.
 */

export type TickMode = 'ltpc' | 'fullFeed';

export interface TickMessage {
  /** instrumentKey is always present on LtpcDataDTO and FullFeedDataDTO */
  instrumentKey: string;
  /** LtpcDataDTO + FullFeedDataDTO both serialize ltp/cp/ltt via @JsonProperty */
  ltp?: number;
  cp?: number;
  ltt?: number;
  [key: string]: unknown;
}

type TickListener = (msg: TickMessage) => void;
type StatusListener = (status: SocketStatus) => void;

export type SocketStatus =
  | 'connecting'
  | 'open'
  | 'market_closed'   // code 4000 — do NOT retry
  | 'reconnecting'
  | 'closed';

/**
 * Derive the full WebSocket URL.
 *
 * Always connect DIRECTLY to the backend (not through the Vite proxy).
 * VITE_API_URL = "http://localhost:8080/api/v2"
 *   → ws://localhost:8080/api/v2/wss/market
 *
 * This is identical to what Postman uses and avoids Vite WS proxy issues.
 * Spring WebSocket's default origin policy allows all origins when
 * setAllowedOrigins() is not explicitly called, so cross-origin works.
 */
function deriveWsUrl(): string {
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v2';

  if (apiUrl.startsWith('http')) {
    const url = new URL(apiUrl);
    const scheme = url.protocol === 'https:' ? 'wss' : 'ws';
    const pathPrefix = url.pathname.replace(/\/$/, ''); // e.g. "/api/v2"
    return `${scheme}://${url.host}${pathPrefix}/wss/market`;
  }

  // Relative VITE_API_URL — same-origin deployment, use current page's host
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${window.location.host}/api/v2/wss/market`;
}

const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;

interface Subscription {
  mode: TickMode;
  keys: string[];
  refCount: number;
}

class MarketSocketManager {
  private socket: WebSocket | null = null;
  private status: SocketStatus = 'closed';
  private marketClosed = false;

  private subs: Map<string, Subscription> = new Map();
  private tickListeners: Set<TickListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Public API ──

  addTickListener(fn: TickListener): () => void {
    this.tickListeners.add(fn);
    return () => this.tickListeners.delete(fn);
  }

  addStatusListener(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    fn(this.status); // notify immediately of current state
    return () => this.statusListeners.delete(fn);
  }

  getStatus(): SocketStatus {
    return this.status;
  }

  isMarketClosed(): boolean {
    return this.marketClosed;
  }

  /**
   * Subscribe to instrument keys. Returns an unsubscribe function.
   * Ref-counted: multiple components can subscribe to the same keys safely.
   * When the last subscriber unmounts the unsub message is sent to the backend.
   */
  subscribe(keys: string[], mode: TickMode): () => void {
    if (keys.length === 0) return () => {};

    const subKey = `${mode}:${[...keys].sort().join(',')}`;

    if (this.subs.has(subKey)) {
      this.subs.get(subKey)!.refCount += 1;
    } else {
      this.subs.set(subKey, { mode, keys, refCount: 1 });
    }

    this.ensureConnected();

    // Socket already open — send immediately; otherwise resubscribeAll() fires on onopen
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendSubscribeMsg(keys, mode);
    }

    return () => {
      const sub = this.subs.get(subKey);
      if (!sub) return;
      sub.refCount -= 1;
      if (sub.refCount <= 0) {
        this.subs.delete(subKey);
        // Send unsub to backend — BroadcastHandler checks method === "unsub"
        // and removes this session from instrumentSubscribers for these keys.
        this.sendUnsubMsg(sub.keys, sub.mode);
      }
    };
  }

  destroy() {
    this.clearReconnectTimer();
    this.subs.clear();
    this.closeSocket(false);
    this.setStatus('closed');
  }

  // ── Internals ──

  private ensureConnected() {
    if (this.marketClosed) return;
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    this.openSocket();
  }

  private openSocket() {
    if (this.marketClosed) return;

    const url = deriveWsUrl();
    console.debug('[MarketSocket] Connecting to', url);
    this.setStatus('connecting');

    const ws = new WebSocket(url);
    this.socket = ws;

    ws.onopen = () => {
      console.debug('[MarketSocket] Connected');
      this.reconnectAttempt = 0;
      this.setStatus('open');
      // Re-send all active subscriptions (important on reconnect)
      this.resubscribeAll();
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as TickMessage;
        if (data?.instrumentKey) {
          this.tickListeners.forEach(fn => fn(data));
        }
      } catch {
        // Ignore malformed frames
      }
    };

    ws.onclose = (event: CloseEvent) => {
      console.debug('[MarketSocket] Closed — code:', event.code, 'reason:', event.reason);
      this.socket = null;
      if (event.code === 4000) {
        this.marketClosed = true;
        this.setStatus('market_closed');
        console.info('[MarketSocket] Market is closed (code 4000). Will not retry.');
      } else {
        this.scheduleReconnect();
      }
    };

    ws.onerror = (e) => {
      console.warn('[MarketSocket] WebSocket error:', e);
      // onclose fires after onerror — let it drive reconnect
    };
  }

  private closeSocket(notify = true) {
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.onopen = null;
      this.socket.close();
      this.socket = null;
    }
    if (notify) this.setStatus('closed');
  }

  private scheduleReconnect() {
    this.setStatus('reconnecting');
    this.clearReconnectTimer();
    const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, this.reconnectAttempt), MAX_BACKOFF_MS);
    console.debug(`[MarketSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1})`);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      if (!this.marketClosed && this.subs.size > 0) {
        this.openSocket();
      }
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Subscribe message shape — must match UpstoxSubscribeRequest:
   *   { guid, method: "sub", data: { mode, instrumentKeys } }
   * BroadcastHandler.handleTextMessage reads:
   *   subscribeRequest = mapper.readValue(payload, UpstoxSubscribeRequest.class)
   *   subscribeData    = subscribeRequest.getData()
   */
  private sendSubscribeMsg(keys: string[], mode: TickMode) {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    const msg = {
      guid: crypto.randomUUID(),
      method: 'sub',
      data: { mode, instrumentKeys: keys },
    };
    console.debug('[MarketSocket] Sending sub:', msg);
    this.socket.send(JSON.stringify(msg));
  }

  /**
   * Unsub message shape — BroadcastHandler checks:
   *   "unsub".equalsIgnoreCase(subscribeRequest.getMethod())
   * So method must be "unsub"; data contains the keys to unsubscribe.
   */
  private sendUnsubMsg(keys: string[], mode: TickMode) {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    const msg = {
      guid: crypto.randomUUID(),
      method: 'unsub',
      data: { mode, instrumentKeys: keys },
    };
    console.debug('[MarketSocket] Sending unsub:', msg);
    this.socket.send(JSON.stringify(msg));
  }

  private resubscribeAll() {
    // Group keys by mode for batched subscribe messages
    const byMode = new Map<TickMode, string[]>();
    for (const sub of this.subs.values()) {
      byMode.set(sub.mode, [...(byMode.get(sub.mode) ?? []), ...sub.keys]);
    }
    for (const [mode, keys] of byMode.entries()) {
      this.sendSubscribeMsg([...new Set(keys)], mode);
    }
  }

  private setStatus(status: SocketStatus) {
    this.status = status;
    this.statusListeners.forEach(fn => fn(status));
  }
}

export const marketSocket = new MarketSocketManager();
