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


        // configuring first cacheName.
        cacheList.add(new CaffeineCache("indicesLive",
                Caffeine.newBuilder()
                        .expireAfterWrite(15, TimeUnit.SECONDS)
                        .maximumSize(100)
                        .build()));

        // configuring second cacheName.
        cacheList.add(new CaffeineCache("stocksLive",
                Caffeine.newBuilder()
                        .expireAfterWrite(1, TimeUnit.MINUTES)
                        .maximumSize(5000)
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
