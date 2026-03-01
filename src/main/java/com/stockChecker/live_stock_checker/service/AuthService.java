package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.UserInfoResponseDTO;

public interface AuthService {
    UserInfoResponseDTO getUserInfo(String email);
}
