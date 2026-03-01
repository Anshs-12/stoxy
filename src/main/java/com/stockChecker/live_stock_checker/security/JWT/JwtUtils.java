package com.stockChecker.live_stock_checker.security.JWT;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;


@Component
@Slf4j
@RequiredArgsConstructor
public class JwtUtils {

    @Value("${spring.app.jwtExpirationsMS}")
    private Integer jwtExpirations;

    @Value("${spring.app.jwtSecretKey}")
    private String jwtSecretKey;

    @Value("${spring.app.jwtCookieName}")
    private String jwtCookieName;

    // cookie-based JWT
    public String getJwtFromCookie(HttpServletRequest request) {
        Cookie myCookie = WebUtils.getCookie(request, jwtCookieName);
        if (myCookie != null) {
            return myCookie.getValue();
        }
        return null;
    }

    // header-based JWT
    public String getJwtFromHeader(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    // generate a JwtCookieFromEmail
    public ResponseCookie generateJwtCookieFromEmail(String email) {
        String jwtToken = generateJwtTokenFromEmail(email);
        return ResponseCookie.from(jwtCookieName, jwtToken)
                .path("/api")
                .maxAge(259200) // 3-day total cookie expirationTime
                .httpOnly(true)
                .sameSite("Strict")
                .secure(true)
                .build();
    }


    // generate JwtToken for the user with received email.
    public String generateJwtTokenFromEmail(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(new Date().getTime() + jwtExpirations))
                .signWith(generateKey())
                .compact();
    }

    // get email from JwtToken
    public String getEmailFromToken(String jwtToken) {
        return Jwts.parser()
                .verifyWith((SecretKey) generateKey())
                .build()
                .parseSignedClaims(jwtToken)
                .getPayload()
                .getSubject();
    }

    // generating a clean cookie / sign-out endpoint
    public ResponseCookie generateCleanJwtCookie() {
        return ResponseCookie
                .from(jwtCookieName, "")
                .path("/api")
                .build();
    }

    public Key generateKey() {
        return Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(jwtSecretKey)
        );
    }

    // Validate JWT Token
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser()
                    .verifyWith((SecretKey) generateKey())
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT Token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT Token is Expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT Token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims String is empty: {}", e.getMessage());
        }
        return false;
    }

}
