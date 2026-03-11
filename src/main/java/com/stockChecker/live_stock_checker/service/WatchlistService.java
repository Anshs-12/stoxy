package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.WatchlistPayload.CreateWatchRequestDTO;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.WatchlistResponseDTO;

public interface WatchlistService {
    WatchlistResponseDTO createWatchlist(String userEmail, CreateWatchRequestDTO createWatchRequestDTO);
}
