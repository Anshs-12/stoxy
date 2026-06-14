package com.stockChecker.live_stock_checker.security;

import com.stockChecker.live_stock_checker.security.JWT.AuthEntryPoint;
import com.stockChecker.live_stock_checker.security.JWT.AuthTokenFilter;
import com.stockChecker.live_stock_checker.security.JWT.JwtUtils;
import com.stockChecker.live_stock_checker.security.oAuth2.OAuth2SuccessHandler;
import com.stockChecker.live_stock_checker.service.RateLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true)
@RequiredArgsConstructor
public class WebSecurityConfig {

    private final AuthEntryPoint authEntryPointJwt;
    private final JwtUtils jwtUtils;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Bean
    public AuthTokenFilter authTokenFilter() {
        return new AuthTokenFilter(jwtUtils);
    }

    @Bean
    public RateLimitFilter rateLimitFilter(RateLimitService rateLimitService) {
        return new RateLimitFilter(rateLimitService);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, RateLimitFilter rateLimitFilter) throws Exception {

        // csrf disabling
        http.csrf((eachCheck) -> eachCheck.disable());

        http.authorizeHttpRequests((eachRequest) -> eachRequest
                .requestMatchers("/stocks/**").permitAll()
                .requestMatchers("/index/**").permitAll()
                .requestMatchers("/ticker/live/**").permitAll()
                .requestMatchers("/auth/userInfo").authenticated()
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/login/**").permitAll()
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
        );

        http.sessionManagement(eachSession -> eachSession
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        http.exceptionHandling(exception ->
                exception.authenticationEntryPoint(authEntryPointJwt));

        http.headers(header -> header
                .frameOptions(eachFrame -> eachFrame.sameOrigin()));

        http.oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2SuccessHandler)
                .loginPage("/oauth2/authorization/google")
        );

        http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(authTokenFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
/*
    ENTIRE FLOW OF THE OAuth2 and JWT :

    User clicks Login with Google button
    → redirected to Google
    → Google authenticates user
    → Google sends code back to your backend (not frontend)
    → Spring exchanges code for user info automatically
    → OAuth2SuccessHandler fires → saves user → generates YOUR JWT
    → JWT sent back in response headers (cookie + Authorization)
    → frontend stores the JWT
    → every future request → frontend sends JWT
    → AuthTokenFilter validates JWT → sets SecurityContext
    → request reaches controller


    No — JavaScript origins are different from redirect URI.

    Redirect URI (`/api/v1/login/oauth2/code/google`) → Google sends the code here → this is your backend.
    Spring handles it, exchanges code for user info, runs `OAuth2SuccessHandler`, generates JWT.

    After that — you configure in `OAuth2SuccessHandler` where to redirect the user next.
    Right now you're not redirecting anywhere, just sending JWT in headers.

    In a real app you'd add in `OAuth2SuccessHandler`:
        response.sendRedirect("http://localhost:3000/dashboard");


    Frontend receives the redirect with JWT in the cookie.
    the user lands on the dashboard page logged in.

    JavaScript origins — just tells Google which domains are allowed to make OAuth requests from browser JavaScript.
    Not related to redirect flow.
*/

// When the spring boot application starts, spring sees the configuration class and
// creates and stores all the @Bean inside its context.
// Now whichever method or parameter or object requires it, it injects it in the place
// like here spring creates and injects the authRateLimitCache, generalRateLimitCache
    /*
        What if parameter names were different?

        Example:

        @Bean
        public RateLimitFilter rateLimitFilter(
                Cache<String, Bucket> a,
                Cache<String, Bucket> b
        )

        Now Spring cannot match names.

        Then you must use:

        @Qualifier

        like:

        @Bean
        public RateLimitFilter rateLimitFilter(
                @Qualifier("authRateLimitCache") Cache<String, Bucket> a,
                @Qualifier("generalRateLimitCache") Cache<String, Bucket> b
        )
    */