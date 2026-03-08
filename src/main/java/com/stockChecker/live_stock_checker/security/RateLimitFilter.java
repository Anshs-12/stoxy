package com.stockChecker.live_stock_checker.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.stockChecker.live_stock_checker.payload.APIResponse;
import com.stockChecker.live_stock_checker.payload.ErrorCode;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.caffeine.Bucket4jCaffeine;
import io.github.bucket4j.caffeine.CaffeineProxyManager;
import io.github.bucket4j.distributed.remote.RemoteBucketState;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {


    private final CaffeineProxyManager<String> authProxyManager = Bucket4jCaffeine.<String>builderFor(
            Caffeine.<String, RemoteBucketState>newBuilder()
                    .maximumSize(1500)
    ).build();

    private final CaffeineProxyManager<String> generalProxyManager = Bucket4jCaffeine.<String>builderFor(
            Caffeine.<String, RemoteBucketState>newBuilder()
                    .maximumSize(1500)
    ).build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String ipAddress = request.getRemoteAddr();
        String requestURI = request.getRequestURI(); // by this we can know which cache to use.
        if (requestURI.contains("/auth")) {
            // use authProxyManager, which is authRateLimiter cache
            Bucket authBucket = authProxyManager.getProxy(ipAddress, () ->
                    BucketConfiguration.builder()
                            .addLimit(Bandwidth.builder()
                                    .capacity(5)
                                    .refillGreedy(5, Duration.ofMinutes(1))
                                    .build())
                            .build());

            if (authBucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                sendRateLimitResponse(request, response);
            }

        } else {
            // use generalProxyManager, which is a generalRateLimiter cache
            Bucket generalBucket = generalProxyManager.getProxy(ipAddress, () ->
                    BucketConfiguration.builder()
                            .addLimit(Bandwidth.builder()
                                    .capacity(20)
                                    .refillGreedy(20, Duration.ofMinutes(1))
                                    .build())
                            .build());

            if (generalBucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                sendRateLimitResponse(request, response);
            }
        }
    }

    private void sendRateLimitResponse(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        // your 429 error logics here
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(429);

        APIResponse apiResponse = APIResponse.builder()
                .success(false)
                .message("Too Many Requests")
                .error(ErrorCode.RATE_LIMIT_EXCEEDED)
                .path(request.getServletPath())
                .build();
        objectMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}


/*
     NOTES

        Understanding Bucket Internals:
            tokens = 7      # This is the current number of available tokens.
            capacity = 10   # The maximum tokens the bucket can hold
            lastRefill = t1 # This stores the last time tokens were refilled.


        Bucket → rate limit logic
        RemoteBucketState → stored state
        Cache → storage + TTL
        ProxyManager → glue between them

        getRemoteAddr() — the IP of whoever sent the request.
        getLocalAddr() — the IP of your own server. Where the request arrived.

        Normally whenever a user sends in a request, it has all kinds of values which can be
        used by the server or the backend; one such is that every request has an IP address
        from where it's coming, so we can actually get the ip using request.getRemoteAddr()

        This would give the IP address but suppose a load balancer exists and the request
        is first reached to the load balancer, then to our spring boot server, so in this way,
        the IP address is hidden in a header called "X-Forwarded-For," which should be checked
        first when working in a production environment;

        Here @Qualifier can be directly used in the case of constructor injection.
        However, it is not the most preferred choice as spring should manage this RateLimitFilter.java class
        by declaring it as a Component only then it works, where as this method of constructor
        injection is the cleanest and safest practice out there.

        Testing also becomes hard when classes are managed by Spring!

        Caffeine = storage
        Bucket4j core = rate limiting logic
        bucket4j-caffeine = bridge between both.


        BucketConfiguration -
            Basically one has to create a bucket each time when a user hits out endpoint if it didn't exist
            It would work like Bucket userBucket = new Bucket()...

            This is a tedious and heavy task, rather Bucket4j has BucketConfiguration, which is basically a
            blueprint describing how buckets should be created if they don't exist.

        Expiry confusion:
            Bucket4jCaffeine.builderFor() internally calls expireAfter() on Caffeine to manage its own TTL logic.
            When you also set expireAfterWrite() — Caffeine throws because you can't use both simultaneously. They conflict.
            Bucket4j handles eviction itself — we don't need to set it.
            maximumSize is still fine — that just limits how many IPs are tracked.


        When a request arrives:

        Step 1
        proxyManager.getProxy(ip)

        ProxyManager checks cache.

        Case 1 — IP exists:

        load RemoteBucketState
        build bucket

        Case 2 — new IP:

        create the initial state (full tokens)
        build bucket

        Then:

        bucket.tryConsume(1)

        Then:

        updated state saved back to cache

        Later:

        IP is inactive for 2 minutes → cache removes entry

        Done.
*/

/*
    ================== OLD Deprecated Version Code===================
    private final Cache<String, RemoteBucketState> authRateLimitCache;
        private final Cache<String, RemoteBucketState> generalRateLimitCache;
        private final CaffeineProxyManager<String> authProxyManager;
        private final CaffeineProxyManager<String> generalProxyManager;

        RateLimitFilter(Cache<String, RemoteBucketState> authRateLimitCache,
                        Cache<String, RemoteBucketState> generalRateLimitCache) {
            this.authRateLimitCache = authRateLimitCache;
            this.generalRateLimitCache = generalRateLimitCache;

            this.authProxyManager = new CaffeineProxyManager <>(authRateLimitCache, Duration.ofMinutes(2));
            this.generalProxyManager = new CaffeineProxyManager <>(generalRateLimitCache, Duration.ofMinutes(2));
        }
*/