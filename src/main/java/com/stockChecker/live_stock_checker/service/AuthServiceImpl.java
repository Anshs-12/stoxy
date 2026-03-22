package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.model.User;
import com.stockChecker.live_stock_checker.payload.UserInfoResponseDTO;
import com.stockChecker.live_stock_checker.repository.UserRepository;
import com.stockChecker.live_stock_checker.security.JWT.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;

    private final JwtUtils jwtUtils;

    private final HttpServletRequest request;

    @Override
    public UserInfoResponseDTO getUserInfo(String email) {
        User user = userRepository.findByUserMailId(email)
                .orElseThrow(() -> new RuntimeException("User doesn't not exists!"));
        log.info("Fetching user info for email: {}", email);
        return UserInfoResponseDTO.builder()
                .userEmailId(user.getUserMailId())
                .userName(user.getName())
                .providerType(user.getAuthProvider().toString())
                .jwtToken(jwtUtils.getJwtFromCookie(request))
                .build();
    }
}
