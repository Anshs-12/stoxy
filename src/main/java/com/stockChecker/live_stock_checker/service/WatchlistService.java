package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.WatchlistPayload.CreateWatchRequestDTO;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.WatchlistResponseDTO;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.WatchlistSummaryDTO;

import java.util.List;

public interface WatchlistService {
    WatchlistResponseDTO createWatchlist(String userEmail, CreateWatchRequestDTO createWatchRequestDTO);

    // getting all Watchlists of the loggedInUser!
    List<WatchlistSummaryDTO> getAllWatchlists(String userEmail);
}
