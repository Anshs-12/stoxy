package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.WatchlistPayload.*;

import java.util.List;

public interface WatchlistService {
    WatchlistResponseDTO createWatchlist(String userEmail, CreateWatchRequestDTO createWatchRequestDTO);

    // getting all Watchlists of the loggedInUser!
    List<WatchlistSummaryDTO> getAllWatchlists(String userEmail);

    WatchlistStockResponseDTO addStockToWatchlist(String userEmail, Long watchlistId, AddStockRequestDTO addStockRequestDTO);
}
