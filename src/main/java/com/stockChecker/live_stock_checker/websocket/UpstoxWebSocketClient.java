package com.stockChecker.live_stock_checker.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.exceptions.UpstoxFeedException;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;
import com.stockChecker.live_stock_checker.payload.UpstoxPayload.UpstoxSubscribeData;
import com.stockChecker.live_stock_checker.payload.UpstoxPayload.UpstoxSubscribeRequest;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.ByteBuffer;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

// Responsibility of this class - Fetch WSS URL from authorize endpoint + maintains Upstox connection
@Service
@RequiredArgsConstructor
@Slf4j
public class UpstoxWebSocketClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final MarketDataHandler marketDataHandler;

    private WebSocket activeWebSocketObject;

    // runs initially when the application starts
    @PostConstruct
    public void init() {
        connectWebsocketToUpstox();
    }

    public void connectWebsocketToUpstox() {
        HttpClient httpClient = HttpClient.newBuilder().build();
        CompletableFuture<WebSocket> webSocketConnectionObject = httpClient.newWebSocketBuilder()
                .buildAsync(getWssURL(), marketDataHandler);
        activeWebSocketObject = webSocketConnectionObject.join();
    }

    public void onSubscribe(List<StockSearchDTO> stockRequestList, String method, String mode) {
        UpstoxSubscribeRequest upstoxSubscribeRequest = UpstoxSubscribeRequest.builder()
                .guid(UUID.randomUUID().toString())
                .method(method)
                .data(UpstoxSubscribeData.builder()
                        .mode(mode)
                        .instrumentKeys(getInstrumentKeyList(stockRequestList))
                        .build()
                )
                .build();
        try {
            byte[] jsonString = objectMapper.writeValueAsBytes(upstoxSubscribeRequest);
            activeWebSocketObject.sendBinary(ByteBuffer.wrap(jsonString), true);

        } catch (JsonProcessingException e) {
            throw new UpstoxFeedException("Failed to serialize subscribe request: " + e.getMessage());
        }
    }

    private List<String> getInstrumentKeyList(List<StockSearchDTO> stockRequestList) {
        return stockRequestList.stream()
                .map((eachItem) -> eachItem.getInstrumentKey())
                .toList();
    }


    private URI getWssURL() {
        try {
            String response = restClient.get()
                    .uri("v3/feed/market-data-feed/authorize")
                    .retrieve()
                    .body(String.class);
            JsonNode responseNode = objectMapper.readTree(response);
            if (!responseNode.get("status").asText().equals("success")) {
                throw new UpstoxFeedException("Upstox WebSocket authorization failed");
            }
            return URI.create(responseNode.get("data").get("authorizedRedirectUri").asText());
        } catch (JsonProcessingException e) {
            throw new UpstoxFeedException("Invalid response format from Upstox authorization" + e.getMessage());
        } catch (Exception e) {
            throw new UpstoxFeedException("Failed to fetch WebSocket URL from Upstox" + e.getMessage());
        }
    }

    public WebSocket getActiveWebsocket() {
        return activeWebSocketObject;
    }
}
