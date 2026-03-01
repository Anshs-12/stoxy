package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.payload.UserInfoResponseDTO;
import com.stockChecker.live_stock_checker.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/oauth2")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/login")
    public ResponseEntity<UserInfoResponseDTO> login() {
        String userEmail =
                SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        UserInfoResponseDTO userInfoResponseDTO = authService.getUserInfo(userEmail);
        return new ResponseEntity<>(userInfoResponseDTO, HttpStatus.OK);
    }
}
