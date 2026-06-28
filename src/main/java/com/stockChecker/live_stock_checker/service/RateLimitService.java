package com.stockChecker.live_stock_checker.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final LettuceBasedProxyManager<byte[]> proxyManager;

    public Boolean isRequestAllowed(String ipAddress, String requestType) {
        String requestKey = ipAddress.concat(":").concat(requestType);
        byte[] requestByteKey = requestKey.getBytes(StandardCharsets.UTF_8);
        Bucket bucket;
        if (requestType.contains("/auth")) {
            // getting authBucket from Redis.
            bucket = proxyManager.getProxy(requestByteKey, () -> getAuthBucketConfiguration());
        } else {
            // getting generalBucket from Redis
            bucket = proxyManager.getProxy(requestByteKey, () -> getGeneralBucketConfiguration());
        }
        return bucket.tryConsume(1);
    }

    private BucketConfiguration getAuthBucketConfiguration() {
        return BucketConfiguration.builder()
                .addLimit(
                        Bandwidth.builder()
                                .capacity(5)
                                .refillGreedy(5, Duration.ofMinutes(1))
                                .build())
                .build();
    }

    private BucketConfiguration getGeneralBucketConfiguration() {
        return BucketConfiguration.builder()
                .addLimit(
                        Bandwidth.builder()
                                .capacity(100)
                                .refillGreedy(100, Duration.ofMinutes(1))
                                .build())
                .build();
    }
}

/*
    In Caffeine which is an inMemoryCache we usually maintained two separate
    buckets for storing each of the cache type like general and auth for each of the rateLimiter.

    Now, we are using Redis which is distributed so has only one store and consists of different
    keys and values.

    Therefore, we tend to store the key:value.
    Here the key is made by combining the respective ipAddress and its requestType, if it auths related
    then retrieve authBucket or if its general then retrieve the generalBucket.

    key -> "ipAddress:requestType"
    Example:  "192.173.42.31:auth" or "192.173.42.31:general"

    This way an ip address would have two keys associated one for general purpose and another for
    auth purpose!

*/
