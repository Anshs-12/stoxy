package com.stockChecker.live_stock_checker.security.oAuth2;

import com.stockChecker.live_stock_checker.model.OAuth2Provider;
import com.stockChecker.live_stock_checker.model.User;
import com.stockChecker.live_stock_checker.repository.UserRepository;
import com.stockChecker.live_stock_checker.security.JWT.JwtUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        String provider = oauthToken.getAuthorizedClientRegistrationId(); // returns "google" or "facebook" etc

        String email = oAuth2User.getAttribute("email");
        if (email == null)
            throw new RuntimeException("Email not received!");
        log.info("OAuth2 login - provider: {}, email: {}", provider, email);

        User findUserOrCreate = userRepository.findByUserMailId(email)
                .orElseGet(() -> saveUserInDB(oAuth2User, provider));

        log.info("User found or created - email: {}", findUserOrCreate.getUserMailId());

        String jwtToken = jwtUtils.generateJwtTokenFromEmail(email);
        ResponseCookie jwtTokenCookie = jwtUtils.generateJwtCookieFromEmail(email);

        log.info("JWT generated and sent for email: {}", email);

        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_OK);
        response.addHeader("Set-Cookie", jwtTokenCookie.toString());
        response.addHeader("Authorization", "Bearer " + jwtToken);

    }

    private User saveUserInDB(OAuth2User oAuth2User, String provider) {
        User newUser = User.builder()
                .userMailId(oAuth2User.getAttribute("email"))
                .name(oAuth2User.getAttribute("name"))
                .authProvider(getProvider(provider))
                .build();
        userRepository.save(newUser);
        return newUser;
    }

    private OAuth2Provider getProvider(String provider) {
        if (provider.equalsIgnoreCase("google")) return OAuth2Provider.GOOGLE;
        if (provider.equalsIgnoreCase("x")) return OAuth2Provider.X;
        throw new RuntimeException("Unsupported provider: " + provider);
    }
}
