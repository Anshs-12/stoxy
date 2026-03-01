package com.stockChecker.live_stock_checker.security.JWT;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
public class AuthTokenFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            String jwtToken = jwtUtils.getJwtFromHeader(request);
            if (jwtToken == null) {
                jwtToken = jwtUtils.getJwtFromCookie(request);
            }
            if (jwtToken != null && jwtUtils.validateJwtToken(jwtToken)) {
                // this helps in maintaining proper checking across as we are
                // going to set the SecurityContext here,so maintaining all the checks

                String email = jwtUtils.getEmailFromToken(jwtToken);
                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken =
                        new UsernamePasswordAuthenticationToken(email, null, List.of());
                usernamePasswordAuthenticationToken.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
                log.debug("JWT validated, email set in SecurityContext: {}", email);
            }
        } catch (Exception ex) {
            log.error("Cannot set user authentication: {}", ex.getMessage());

        }

        filterChain.doFilter(request, response);
    }
}
