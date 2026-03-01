package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.model.User;
import com.stockChecker.live_stock_checker.payload.UserInfoResponseDTO;
import com.stockChecker.live_stock_checker.repository.UserRepository;
import com.stockChecker.live_stock_checker.security.JWT.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;

    private final JwtUtils jwtUtils;

    @Override
    public UserInfoResponseDTO getUserInfo(String email) {
        User user = userRepository.findByUserMailId(email)
                .orElseThrow(() -> new RuntimeException("User doesn't not exists!"));
        return UserInfoResponseDTO.builder()
                .userEmailId(user.getUserMailId())
                .userName(user.getName())
                .providerType(user.getAuthProvider().toString())
                .jwtToken(jwtUtils.generateJwtTokenFromEmail(email))
                .build();
    }
}
