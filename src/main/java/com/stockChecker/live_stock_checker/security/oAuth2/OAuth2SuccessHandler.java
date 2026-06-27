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
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.frontend.url}")
    private String frontendUrl;

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
        response.sendRedirect(frontendUrl);
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


/*
    Entire Flow of OAuth2 Login:
        Users go here first /oauth2/authorization/google for logging in
        then after selecting their account and logging in via their account on google,
        google checks and after validating sends them to this callback url
        callbackURL: /login/oauth2/code/google

        This callback url is catched by SpringSecurity and inturns then runs our backend
        which is basically what we defined this class for OAuth2SuccessHandler

        Now our handler runs and does all the job from creating the JWT, filling and setting up the
        cookies to the response and then Redirect is issued from here to the URL we want to send the user
        to mostly its the home page of the frontend.

        Browser receives all this response
            Set-Cookie: jwt=abc
            Location: /api/v1/swagger-ui/index.html

        Now comes the major part of understanding the cookies section as we are still on the callback url and
        not yet redirected:


        Cookies Behavior in OAuth2 Flow:

        After the user is redirected back to the callback URL (`/login/oauth2/code/google`),
        the backend processes the authentication and sends a single response to the browser.
        This response contains both the `Set-Cookie` header (which includes the JWT token) and
        a redirect instruction (`Location: /api/v1/swagger-ui/index.html`).

        At this exact moment, the browser has not yet followed the redirect.
        Instead, it first processes the response it just received from the backend.

        The browser examines the `Set-Cookie` header and decides whether the cookie
        should be stored or rejected based on its security rules (such as `SameSite`, `Secure`, etc.)
        and the context of the request.

        In this OAuth2 flow, the request to `/login/oauth2/code/google` is considered a top-level navigation,
        meaning the user is being directly redirected to the application after logging in.
        Because the cookie is configured with `SameSite=Lax`, the browser allows the cookie to be
        stored in this scenario, since Lax permits cookies during top-level navigations.

        Once the browser accepts and stores the cookie, it then proceeds to follow t
        he redirect to `/api/v1/swagger-ui/index.html`. By the time the Swagger UI page loads,
        the cookie is already present in the browser and will be included in subsequent requests to
        the backend (provided the request path matches the cookie’s path).

        Thus, the cookie is not set after reaching Swagger UI,
        but rather during the callback response itself, before the redirect is executed.


*/