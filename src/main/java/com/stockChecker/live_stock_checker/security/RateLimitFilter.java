package com.stockChecker.live_stock_checker.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.payload.APIResponse;
import com.stockChecker.live_stock_checker.payload.ErrorCode;
import com.stockChecker.live_stock_checker.service.RateLimitService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String ipAddress = request.getRemoteAddr();
        String requestURI = request.getRequestURI(); // by this we can know which cache to use.

        if (rateLimitService.isRequestAllowed(ipAddress, requestURI)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded - IP: {}, path: {}", ipAddress, requestURI);
            sendRateLimitResponse(request, response);
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

        // objectMapper (from Jackson library) converts the Java object(POJO) → JSON
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


        BucketConfiguration -
            Basically one has to create a bucket each time when a user hits out endpoint if it didn't exist
            It would work like Bucket userBucket = new Bucket()...

            This is a tedious and heavy task, rather Bucket4j has BucketConfiguration, which is basically a
            blueprint describing how buckets should be created if they don't exist.


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