package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.payload.UserInfoResponseDTO;
import com.stockChecker.live_stock_checker.security.JWT.JwtUtils;
import com.stockChecker.live_stock_checker.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    /*
        /oauth2/authorization/google → this IS the login, handled by Spring automatically
        /oauth2/user → returns user info after login
        /oauth2/logout → clears token
    */
    private final AuthService authService;
    private final JwtUtils jwtUtils;

    @GetMapping("/userInfo")
    public ResponseEntity<UserInfoResponseDTO> userInfo() {

        String userEmail =
                SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        UserInfoResponseDTO userInfoResponseDTO = authService.getUserInfo(userEmail);
        log.info("User info request - email: {}", userEmail);
        return new ResponseEntity<>(userInfoResponseDTO, HttpStatus.OK);
    }

    @GetMapping("/logout")
    public ResponseEntity<String> logout() {
        ResponseCookie cleanCookie = jwtUtils.generateCleanJwtCookie();
        log.info("Logout request received");
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleanCookie.toString())
                .body("User has been logout!");
    }
}
