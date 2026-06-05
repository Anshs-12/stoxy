package com.stockChecker.live_stock_checker.websocket;

import com.stockChecker.live_stock_checker.payload.UpstoxPayload.UpstoxSubscribeRequest;

import java.net.http.WebSocket;
import java.nio.ByteBuffer;
import java.util.List;
import java.util.concurrent.CompletionStage;

public class MarketDataHandler implements WebSocket.Listener {

    @Override
    public void onOpen(WebSocket webSocket) {
        webSocket.request(1);
        // upstox subscribe logic
        webSocket.sendText(new UpstoxSubscribeRequest().toString(), true);
    }

    @Override
    public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {

    }

    @Override
    public CompletionStage<?> onBinary(WebSocket webSocket,
                                       ByteBuffer data,
                                       boolean last) {
        return null;
    }

    @Override
    public void onError(WebSocket webSocket, Throwable error) {

    }

    private List<String> getAllMajorIndices() {
        return List.of("NSE_INDEX|Nifty 50",
                "NSE_INDEX|Nifty Bank",
                "NSE_INDEX|Nifty IT",
                "NSE_INDEX|Nifty Midcap 100",
                "NSE_INDEX|Nifty Next 50",
                "NSE_INDEX|Nifty FMCG",
                "NSE_INDEX|Nifty Auto",
                "NSE_INDEX|Nifty Pharma",
                "NSE_INDEX|Nifty Realty",
                "NSE_INDEX|Nifty Metal",
                "NSE_INDEX|Nifty Energy",
                "NSE_INDEX|Nifty Infrastructure",
                "NSE_INDEX|Nifty PSE",
                "NSE_INDEX|Nifty Commodities",
                "NSE_INDEX|Nifty Media",
                "NSE_INDEX|Nifty Private Bank",
                "NSE_INDEX|Nifty Financial Services",
                "BSE_INDEX|Sensex",
                "BSE_INDEX|Sensex 50",
                "BSE_INDEX|BSE 10",
                "GLOBAL_INDEX|SGX NIFTY");
    }
}
