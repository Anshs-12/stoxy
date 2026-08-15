package com.stoxyfinance.service.auth;

import com.stoxyfinance.payload.UserInfoResponseDTO;

public interface AuthService {
    UserInfoResponseDTO getUserInfo(String email);
}
