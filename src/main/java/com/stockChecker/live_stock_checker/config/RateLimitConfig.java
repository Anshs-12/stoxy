package com.stockChecker.live_stock_checker.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.redis.lettuce.Bucket4jLettuce;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

import java.time.Duration;

@Configuration
@RequiredArgsConstructor
public class RateLimitConfig {

    private final RedisConnectionFactory redisConnectionFactory;

    @Bean
    public LettuceBasedProxyManager<byte[]> rateLimitProxyManager() {
        RedisClient lettuceClient = (RedisClient) getLettuceConnectionFactory().getNativeClient();
        if (lettuceClient == null) {
            throw new IllegalStateException("Lettuce RedisClient is null");
        }
        return Bucket4jLettuce
                .casBasedBuilder(lettuceClient)
                .expirationAfterWrite(ExpirationAfterWriteStrategy.fixedTimeToLive(Duration.ofMinutes(2)))
                .build();
    }

    private LettuceConnectionFactory getLettuceConnectionFactory() {
        return (LettuceConnectionFactory) redisConnectionFactory;
    }
}

/*
    Bucket4J is a purely Java based rateLimiting library, which has no idea about
    spring at all, so bucket4j cannot just make a connection with the running Redis instance at all.

    ConnectionFactory-
        Spring doesn't want you dealing with raw clients directly.
        So it wraps whichever client you're using(Jedis/Lettuce) behind one interface called RedisConnectionFactory.
        Inside that wrapper is the actual client doing the real work.

    Lettuce / Jedis
        They are Redis clients, these are Java libraries that know how to talk to a Redis server.
        Send commands, get responses just like JDBC which is reponsible for all the database related tasks!
        - Lettuce = async, non-blocking
        - Jedis = sync, blocking

    The core problem:
    Spring holds the box which is a connectionFactory and names it RedisConnectionFactory, which inturn are the RedisClients
    being used from the project or which are defined. It internally manages these RedisClients(default Lettuce).

    Now Bucket4j as mentioned earlier doesn't happen to work with spring, so it requires actual RedisClient
    which is being used in this project, such as raw Lettuce RedisClient which lives inside the LettuceConnectionFactory.

    (Note: It can be Jedis even if Jedis is being used as a connection to connect to Redis)

    So now we need to give raw Lettuce to Bucket4j builder to help establish a connection.

    LettuceConnectionFactory exists because Spring wants to manage the connection pool, lifecycle, and configuration for you.
    Without it, you'd have to manually create and manage Lettuce connections yourself.

    RedisConnectionFactory interface exists so Spring code works regardless of whether you're using Lettuce or Jedis underneath.
    Your CacheConfig uses RedisConnectionFactory — it doesn't care if it's Lettuce or Jedis. Swap tomorrow, nothing breaks.

*/