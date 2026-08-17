ansh@fedora:~/Desktop/live-stock-checker$ cat src/main/java/com/stockChecker/live_stock_checker/config/CacheConfig.java
package com.stockChecker.live_stock_checker.config;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
@RequiredArgsConstructor
public class CacheConfig {

    private final RedisConnectionFactory redisConnection;

    @Bean
    public RedisTemplate<String, Object> getMarketDataRedisTemplate(RedisConnectionFactory redisConnection) {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnection);
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setDefaultSerializer(new GenericJackson2JsonRedisSerializer());
        return redisTemplate;
    }

    @Bean
    public CacheManager cacheManager() {
        /*
            # Caffeine
            CaffeineCacheManager (one config for all cacheNames/values)
            SimpleCacheManager (different configs for different cacheNames/values.)

            SimpleCacheManager simpleCacheManager = new SimpleCacheManager();
            List<CaffeineCache> cacheList = new ArrayList<>();
               simpleCacheManager.setCaches(cacheList);
            return simpleCacheManager;

            Caffeine flow —
                1. Create a list
                2. Add CaffeineCache objects to list (each with name + TTL)
                3. Give list to SimpleCacheManager
                4. Return SimpleCacheManager

            # Redis


            Redis flow —
                1. Create a Map
                2. Add cacheName → TTL config pairs to Map
                3. Give Map to RedisCacheManager (along with ConnectionFactory)
                4. Return RedisCacheManager
        */
        Map<String, RedisCacheConfiguration> redisCacheConfigMap = new HashMap<>();
        RedisCacheConfiguration defaultCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(60))
                .serializeValuesWith(
                        RedisSerializationContext
                                .SerializationPair
                                .fromSerializer(new GenericJackson2JsonRedisSerializer())
                );
        // serializing the values to store them a proper JSON format, so that it's easier to read

        // ----------------------------- Index Caching -----------------------------
        redisCacheConfigMap.put("indicesLive", defaultCacheConfig.entryTtl(Duration.ofSeconds(15)));
        redisCacheConfigMap.put("indicesWeekDayClosed", defaultCacheConfig.entryTtl(Duration.ofMinutes(1065)));
        redisCacheConfigMap.put("indicesWeekendClosed", defaultCacheConfig.entryTtl(Duration.ofMinutes(3945)));

        // ----------------------------- Stocks Caching -----------------------------
        redisCacheConfigMap.put("stockLive", defaultCacheConfig.entryTtl(Duration.ofSeconds(15)));
        redisCacheConfigMap.put("stockWeekDayClosed", defaultCacheConfig.entryTtl(Duration.ofMinutes(1065)));
        redisCacheConfigMap.put("stockWeekendClosed", defaultCacheConfig.entryTtl(Duration.ofMinutes(3945)));

        // assigning the map to RedisCacheManger
        return RedisCacheManager.builder(redisConnection)
                .cacheDefaults(defaultCacheConfig)
                .withInitialCacheConfigurations(redisCacheConfigMap)
                .build();
    }

}

/*
Why RemoteBucketState instead of Bucket:
Bucket4j has two modes: 1. Local mode — Bucket lives directly in your app memory.
Simple, but no cache integration.

        2.Distributed/Proxy mode — designed to work with external caches like Caffeine, Redis, etc.
        In this mode Bucket4j serializes the bucket state into RemoteBucketState to store it in the cache.
        This way it can survive across cache reads/writes properly.


        CaffeineProxyManager is the proxy mode.
        It requires RemoteBucketState as the cache value — that's just how it's designed internally.

        Also without CaffeineProxyManager, and doing everything manually from creating a bucket to using it using ConcurrentHashMap.
        The problem is that ConcurrentHashMap never evicts.
        Every unique IP ever seen stays in memory forever.
        In production that's a memory leak.
        Caffeine solves this with TTL and max size eviction.

        ProxyManager — why is it necessary?

        Imagine you have 3 servers running your app:
        User IP: 192.168.1.1
        → Request 1 hits Server A → bucket has 19 tokens
        → Request 2 hits Server B → bucket has 20 tokens (fresh, knows nothing about Server A)
        → Request 3 hits Server C → bucket has 20 tokens (fresh, knows nothing about Server A or B)

        Each server has its own Caffeine cache in its own memory. They don't talk to each other.
        So the same IP gets 20 tokens on every server — your rate limit is completely broken.

        ProxyManager solves this by using a shared external store like Redis:
        User IP: 192.168.1.1
        → Request 1 hits Server A → checks Redis → 19 tokens
        → Request 2 hits Server B → checks the same Redis → 18 tokens
        → Request 3 hits Server C → checks the same Redis → 17 tokens
        All servers share one source of truth. Rate limiting works correctly across all servers.
        That's the ONLY reason ProxyManager exists — shared state across multiple servers.


        Redis Docs:

            What is `defaultCacheConfig` actually doing?

            It's a fallback. Imagine tomorrow you add a new `@Cacheable("screeningResults")` somewhere in your service but forget to add it to your Map in `CacheConfig`. Without a default, Redis has no TTL for it — it would cache forever. With a default of 60 seconds, it automatically gets 60 seconds TTL as fallback.

            That's the only purpose.


            What if you remove it?

            Then `RedisCacheManager` has no fallback config. Any cache name not in your Map gets no TTL — cached forever until Redis server restarts or you manually delete it. That's dangerous.


            Why does `defaultCacheConfig.entryTtl(...)` work on each cache?

            This is the important part you're missing —

            `RedisCacheConfiguration` is immutable. Every time you call `.entryTtl()` on it, it doesn't modify the original. It returns a brand new `RedisCacheConfiguration` object with that TTL.

            So this —

            ```java
                defaultCacheConfig.entryTtl(Duration.ofSeconds(15))
            ```

            Does NOT change `defaultCacheConfig`. It creates a new object with 15 seconds TTL.
            `defaultCacheConfig` still stays at 60 seconds.

            That's why you can reuse it for every `put` call safely.


            Summary —

            - `defaultCacheConfig` → 60 second fallback, stays unchanged always
            - Each `put` → creates a brand-new config object with its own TTL
            - Remove it → dangerous, unconfigured caches live forever


        RedisCacheManager
            Basically, we want to return our cacheManager, so we build using a builder,
            the values it takes are


              return RedisCacheManager.builder(connectionFactory) // calling the builderMethod with the connectionFactory
                .cacheDefaults(defaultCacheConfig) // assigning a fallback default cacheConfig
                .withInitialCacheConfigurations(redisCacheConfigMap) // this is essentially a map, which has the list of the caches we defined
                .build();

        cacheDefaults, we are defining a default cache to save from infinite memory being utilized on the Redis server/cloud
        as by default we have no option to set the maxMemory being utilized in Redis unlike CaffeineCache

        InitialCacheConfigurations -
            "Initial" just means — load these cache configurations at startup.
            You're handing your entire Map to RedisCacheManager here.
            It reads through it at startup and registers each cache name with its TTL.
            So when @Cacheable("stockLive") fires, it already knows — 15 seconds TTL for this one.

*/ansh@fedora:~/Desktop/live-stock-checker$ casrc/main/java/com/stockChecker/live_stock_checker/service/StockCacheService.javava
package com.stockChecker.live_stock_checker.service;

import model.com.stoxyfinance.Stock;
import model.com.stoxyfinance.StockFinancials;
import StockPayload.payload.com.stoxyfinance.CompanyResponseDTO;
import StockPayload.payload.com.stoxyfinance.StockDetailResponseDTO;
import StockPayload.payload.com.stoxyfinance.StockFinancialsDTO;
import StockPayload.payload.com.stoxyfinance.StockSearchDTO;
import repository.com.stoxyfinance.StockRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class StockCacheService {

    private final StockRepository stockRepository;
    private final ModelMapper modelMapper;
    private final StockDBService stockDBService;

    // ----------------------------- Stock Live Caching -----------------------------
    @Cacheable(
            cacheNames = "stockLive",
            key = "#stockRequest.instrumentKey",
            condition = "#stockRequest.instrumentKey != null",
            unless = "#result == null"
    )
    public StockDetailResponseDTO getStockLive(StockSearchDTO stockRequest) {
        log.info("Fetching LIVE stock data for: {}", stockRequest.getStockName());
        return fetchCompleteStockData(stockRequest);
    }

    // ----------------------------- Stock Weekday Caching -----------------------------
    @Cacheable(
            cacheNames = "stockWeekDayClosed",
            key = "#stockRequest.instrumentKey",
            condition = "#stockRequest.instrumentKey != null",
            unless = "#result == null"
    )
    public StockDetailResponseDTO getStockWeekdayClosed(StockSearchDTO stockRequest) {
        log.info("Fetching WEEKDAY CLOSED stock data for: {}", stockRequest.getStockName());
        return fetchCompleteStockData(stockRequest);
    }

    // ----------------------------- Stock Weekend Caching -----------------------------
    @Cacheable(
            cacheNames = "stockWeekendClosed",
            key = "#stockRequest.instrumentKey",
            condition = "#stockRequest.instrumentKey != null",
            unless = "#result == null"
    )
    public StockDetailResponseDTO getStockWeekendClosed(StockSearchDTO stockRequest) {
        log.info("Fetching WEEKEND CLOSED stock data for: {}", stockRequest.getStockName());
        return fetchCompleteStockData(stockRequest);
    }

    @Transactional
    public StockDetailResponseDTO fetchCompleteStockData(StockSearchDTO stockRequest) {
        log.info("Assembling complete stock data for: {} ({})", stockRequest.getStockSymbol(), stockRequest.getIsin());

        //checking database first.
        Stock stock = stockRepository.findByUpstoxInstrumentKey(stockRequest.getInstrumentKey())
                .orElseGet(() -> stockDBService.saveAllStockExchanges(stockRequest));

        // creating a DTO of the stock.
        StockDetailResponseDTO stockDTO = StockDetailResponseDTO.builder()
                .stockName(stock.getStockName())
                .stockSymbol(stock.getStockSymbol())
                .exchange(stock.getExchange())
                .isin(stock.getIsin())
                .instrumentKey(stock.getUpstoxInstrumentKey())
                .build();

        // attaching the companyInfo to the stock.
        stockDTO.setCompanyResponseDTO(mapCompanyDTO(stock));
        // attaching stockFinancials Info to the stock.
        stockDTO.setStockFinancialsDTO(mapStockFinancialsDTO(stock));
        // Combined stored metadata with real-time price data and returning complete StockFoundDTO
        return stockDTO;
    }

    private CompanyResponseDTO mapCompanyDTO(Stock stock) {
        if (stock.getCompany() == null) return null;
        return modelMapper.map(stock.getCompany(), CompanyResponseDTO.class);
    }

    private StockFinancialsDTO mapStockFinancialsDTO(Stock stock) {
        log.debug("StockFinancials from stock: {}", stock.getStockFinancials());
        if (stock.getStockFinancials() == null) return null;
        StockFinancials financials = stock.getStockFinancials();

// BigDecimal marketCap = new BigDecimal(priceInfoNode.get("lastPrice").asText())
// .multiply(new BigDecimal(financials.getIssuedSize()));
return StockFinancialsDTO.builder()
.pe(financials.getPe())
.sectorPe(financials.getSectorPe())
.pb(financials.getPb())
.sectorPb(financials.getSectorPb())
.roa(financials.getRoa())
.sectorRoa(financials.getSectorRoa())
.roe(financials.getRoe())
.sectorRoe(financials.getSectorRoe())
.build();
}
}

//====================================================================================
// ---------------------NOTES-------------------------
//====================================================================================

/*
checking if the stock is valid or not as both invalid and valid response's have 200 status codes.
Now, to fix this, we would manually check if the error field exists->throw Exception

    Otherwise, if the "error" field doesn't exist, then it's a valid stockSymbol, and we got a valid
    realTime stock response.

*/

/*
Understanding Mono<T> in SpringBoot

    So whenever you use a webClient, the output of it is always Mono, which can have different values like
    Mono<String> or Mono<ResponseEntity<String>> so on.

    understand mono to be a container, since the webclient is reactive in nature, allowing non-blocking asynchronous
    calling/execution of requests, so the value is empty first which is mono, but later on when the response is
    received, it has to be assigned somewhere again, so it gets filled in that mono container which was assigned
    to our variable.

    Initially, Mono is assigned until the response is received back, and as we get so, it gets filled by the response
    basically a container holding/reserving a place for the response to be kept in later when it's received.

*/ansh@fedora:~/Desktop/live-stock-checker$ casrc/main/java/com/stockChecker/live_stock_checker/websocket/UpstoxWebSocketClient.javava
package com.stockChecker.live_stock_checker.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import exceptions.com.stoxyfinance.UpstoxFeedException;
import UpstoxPayload.payload.com.stoxyfinance.UpstoxSubscribeData;
import UpstoxPayload.payload.com.stoxyfinance.UpstoxSubscribeRequest;
import service.com.stoxyfinance.MarketStatusService;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.net.http.WebSocketHandshakeException;
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

// runs initially when the application starts
// @PostConstruct
// public void init() {
// log.info("Initializing Upstox WebSocket connection on startup...");
// connectWebsocketToUpstox();
// }

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
            if (e.getCause() instanceof WebSocketHandshakeException wshe) {
                log.warn("Handshake failed. Status: {}, Response: {}",
                        wshe.getResponse().statusCode(), wshe.getResponse().body());
            }
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
ansh@fedora:~/Desktop/live-stock-checker$ cat src/main/resources/application.yaml
spring:

# application name

main:
allow-circular-references: true
application:
name: live-stock-checker

# database

datasource:
url: ${database_url}
    username: ${database_username}
password: ${database_password} # refer to notes below 1.
driver-class-name: org.postgresql.Driver

# redis credentials

data:
redis:
host: ${redis_host}
      port: ${redis_port}
username: ${redis_username}
      password: ${redis_password}

app:
jwtExpirationsMS: ${jwtExpirationsMS}
    jwtSecretKey: ${jwtSecretKey}
jwtCookieName: ${jwtCookieName}

security:
oauth2:
client:
registration:
google:
client-id: ${google_auth_clientId}
            client-secret: ${google_auth_clientSecret}
scope: - email - profile

jpa: # show-sql: true # logging to show the queries being executed
hibernate: # with this, the database isn't created each time but rather the changes are updated. # refer to notes 2.
ddl-auto: update
properties:
hibernate: # format_sql: true # make the executed SQL queries in a proper format when logging # refer notes 3. # database-platform: org.hibernate.dialect.PostgreSQLDialect # byDefault Spring keeps the database connection alive for the entire during of webRequests # even when a database is not required anymore, wastes connections and performance issues # setting it to false means DB connection is only held during database operations.
open-in-view: false

app:
frontend:
url: ${frontend_url}
server:
servlet:
context-path: /api/v2 # currently version 2 of the api

logging:
level:
org.springframework.web.servlet.resource: ERROR

    #1. logging.level: You’re telling Spring:
    #“For this part of the system, only log messages at this level or higher”

    #2. org.springframework.web.servlet.resource
    # This is the exact module that serves:

    #CSS files
    #JS files
    #Swagger UI assets
    # This is the same component throwing your .css.map error.

    # 3. = ERROR This means: “Only show serious problems (ERROR), ignore smaller ones”

# Notes:

# 1.driver-class-name:

# Every database has a JDBC driver that allows Java programs to communicate with it.

# driver-class-name tells Spring Boot, which driver is to load to connect to your database.

# For PostgreSQL: org.postgresql.Driver → official PostgreSQL JDBC driver class.

# For MySQL: com.mysql.cj.jdbc.Driver, etc.

# Spring Boot must know which driver to use to open a connection if we have multiple databases.

# here we explicitly mention it to avoid ambiguity and errors overtime otherwise

# Sometimes Spring Boot auto-detects the driver if you have only one DB dependency.

# 2.jpa.hibernate.ddl-auto

# Controls how Hibernate manages your database schema.

# Options (most common):

# none → do nothing (DB schema must exist manually)

# validate → check if DB schema matches entities (no changes made)

# update → update DB schema to match entities without dropping data

# create → drop tables if exist and create new ones

# create-drop → same as create, but drops tables when the session ends

# Why it’s needed:

# Hibernate maps your Java entities to database tables.

# ddl-auto controls if Hibernate auto-creates / updates tables.

# In dev environment: update is convenient → tables created automatically, no data loss.

# In production: usually validate or none → you don’t want Hibernate messing with your live DB.

# 3.jpa.database-platform

# What it is:

# Hibernate uses a dialect to generate SQL for the specific database.

# Each DB has slightly different SQL syntax and types.

# PostgreSQLDialect tells Hibernate:

# “Generate SQL suitable for PostgreSQL”

# Handles types like BOOLEAN, SERIAL, TEXT, etc.

# Knows how to paginate, limit, handle sequences, etc.

# Why it’s necessary:

# Hibernate is database-agnostic, but it must translate Java types to DB types.

# Dialect ensures generated SQL is valid for your chosen database.

# Without it, Hibernate might produce SQL that PostgreSQL cannot understand.

ansh@fedora:~/Desktop/live-stock-checker$
