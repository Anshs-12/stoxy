package com.stockChecker.live_stock_checker.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        /*
            CaffeineCacheManager (one config for all cacheNames/values)
            SimpleCacheManager (different configs for different cacheNames/values.)
        */
        SimpleCacheManager simpleCacheManager = new SimpleCacheManager();
        List<CaffeineCache> cacheList = new ArrayList<>();


        // ----------------------------- Index Caching -----------------------------
        // configuring first cacheName.
        cacheList.add(new CaffeineCache("indicesLive",
                Caffeine.newBuilder()
                        .expireAfterWrite(15, TimeUnit.SECONDS)
                        .maximumSize(100)
                        .build()));

        // configuring offline caching
        cacheList.add(new CaffeineCache("indicesWeekDayClosed",
                Caffeine.newBuilder()
                        .expireAfterWrite(1065, TimeUnit.MINUTES)
                        .maximumSize(100)
                        .build()));

        cacheList.add(new CaffeineCache("indicesWeekendClosed",
                Caffeine.newBuilder()
                        .expireAfterWrite(3945, TimeUnit.MINUTES)
                        .maximumSize(100)
                        .build()));

        // ----------------------------- Stocks Caching -----------------------------
        // configuring second cacheName.
        cacheList.add(new CaffeineCache("stockLive",
                Caffeine.newBuilder()
                        .expireAfterWrite(1, TimeUnit.MINUTES)
                        .maximumSize(5000)
                        .build()));

        cacheList.add(new CaffeineCache("stockWeekDayClosed",
                Caffeine.newBuilder()
                        .expireAfterWrite(1065, TimeUnit.MINUTES)
                        .maximumSize(100)
                        .build()));

        cacheList.add(new CaffeineCache("stockWeekendClosed",
                Caffeine.newBuilder()
                        .expireAfterWrite(3945, TimeUnit.MINUTES)
                        .maximumSize(100)
                        .build()));

        // assigning the list to SimpleCacheManager
        simpleCacheManager.setCaches(cacheList);
        return simpleCacheManager;
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
*/