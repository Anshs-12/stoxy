package com.stockChecker.live_stock_checker.security;

import com.stockChecker.live_stock_checker.security.JWT.AuthEntryPoint;
import com.stockChecker.live_stock_checker.security.JWT.AuthTokenFilter;
import com.stockChecker.live_stock_checker.security.JWT.JwtUtils;
import com.stockChecker.live_stock_checker.security.oAuth2.OAuth2SuccessHandler;
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
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // csrf disabling
        http.csrf((eachCheck) -> eachCheck.disable());

        http.authorizeHttpRequests((eachRequest) -> eachRequest
                .requestMatchers("/api/v1/stocks/**").permitAll()
                .requestMatchers("/api/v1/indices/**").permitAll()
                .requestMatchers("/oauth2/**").permitAll()
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


        http.addFilterBefore(authTokenFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
