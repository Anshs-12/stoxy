package com.stockChecker.live_stock_checker.config;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
@RequiredArgsConstructor
public class CacheConfig {

    private final RedisConnectionFactory redisConnection;

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
        RedisCacheConfiguration defaultCacheConfig = RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofSeconds(60)).serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));
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
        return RedisCacheManager.builder(redisConnection).cacheDefaults(defaultCacheConfig).withInitialCacheConfigurations(redisCacheConfigMap).build();
    }
}


/*
    Why RemoteBucketState instead of Bucket:
    Bucket4j has two modes:
        1. Local mode — Bucket lives directly in your app memory.
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



*/