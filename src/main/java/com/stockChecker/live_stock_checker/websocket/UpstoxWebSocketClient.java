package com.stockChecker.live_stock_checker.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.exceptions.UpstoxFeedException;
import com.stockChecker.live_stock_checker.payload.UpstoxPayload.UpstoxSubscribeData;
import com.stockChecker.live_stock_checker.payload.UpstoxPayload.UpstoxSubscribeRequest;
import com.stockChecker.live_stock_checker.service.MarketStatusService;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
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
    private final MarketStatusService marketStatusService;

    private WebSocket activeWebSocketObject;

//    runs initially when the application starts
//    @PostConstruct
//    public void init() {
//        log.info("Initializing Upstox WebSocket connection on startup...");
//        connectWebsocketToUpstox();
//    }

    @Scheduled(fixedDelay = 60000)
    public void maintainConnection() {
        if (activeWebSocketObject != null && !activeWebSocketObject.isOutputClosed()) {
            return;
        }
        if (!marketStatusService.isMarketOpen().getIsOpen()) {
            return;
        }
        try {
            connectWebsocketToUpstox();
        } catch (Exception ignored) {
        }
    }

    public void connectWebsocketToUpstox() {
        log.info("Attempting to connect to Upstox WebSocket...");
        HttpClient httpClient = HttpClient.newBuilder().build();
        CompletableFuture<WebSocket> webSocketConnectionObject = httpClient.newWebSocketBuilder()
                .buildAsync(getWssURL(), marketDataHandler);
        try {
            activeWebSocketObject = webSocketConnectionObject.join();
            log.info("Upstox WebSocket connection established successfully.");
        } catch (Exception e) {
            log.warn("Failed to establish Websocket connection: {}", e.getMessage());
            throw new UpstoxFeedException("Failed to establish WebSocket connection: " + e.getMessage());
        }
    }

    public void onSubscribe(List<String> instrumentKeyList, String method, String mode) {
        UpstoxSubscribeRequest upstoxSubscribeRequest = UpstoxSubscribeRequest.builder()
                .guid(UUID.randomUUID().toString())
                .method(method)
                .data(UpstoxSubscribeData.builder()
                        .mode(mode)
                        .instrumentKeys(instrumentKeyList)
                        .build()
                )
                .build();
        try {
            byte[] jsonString = objectMapper.writeValueAsBytes(upstoxSubscribeRequest);
            log.info("Subscribing {} instruments in {} mode. Method: {}", instrumentKeyList.size(), mode, method);
            activeWebSocketObject.sendBinary(ByteBuffer.wrap(jsonString), true);
        } catch (JsonProcessingException e) {
            throw new UpstoxFeedException("Failed to serialize subscribe request: " + e.getMessage());
        }
    }

    private URI getWssURL() {
        try {
            log.debug("Fetching Upstox WebSocket authorization URL...");
            String response = restClient.get()
                    .uri("v3/feed/market-data-feed/authorize")
                    .retrieve()
                    .body(String.class);
            JsonNode responseNode = objectMapper.readTree(response);
            if (!responseNode.get("status").asText().equals("success")) {
                throw new UpstoxFeedException("Upstox WebSocket authorization failed");
            }
            URI wssURL = URI.create(responseNode.get("data").get("authorizedRedirectUri").asText());
            log.debug("Authorization URL fetched successfully.");
            return wssURL;
        } catch (JsonProcessingException e) {
            throw new UpstoxFeedException("Invalid response format from Upstox authorization" + e.getMessage());
        } catch (Exception e) {
            throw new UpstoxFeedException("Failed to fetch WebSocket URL from Upstox" + e.getMessage());
        }
    }

    @PreDestroy
    public void gracefulShutdown() {
        log.info("Application shutting down. Closing Upstox WebSocket...");
        if (activeWebSocketObject != null && !activeWebSocketObject.isOutputClosed()) {
            activeWebSocketObject.sendClose(WebSocket.NORMAL_CLOSURE, "shutdown").join();
            log.info("WebSocket closed successfully.");
        }
    }

    public WebSocket getActiveWebsocket() {
        return activeWebSocketObject;
    }
}
