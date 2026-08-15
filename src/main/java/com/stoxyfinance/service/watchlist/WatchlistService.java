package com.stoxyfinance.service.watchlist;

import com.stoxyfinance.payload.WatchlistPayload.*;
import com.stoxyfinance.payload.WatchlistPayload.*;

import java.util.List;

public interface WatchlistService {
    WatchlistResponseDTO createWatchlist(String userEmail, CreateWatchRequestDTO createWatchRequestDTO);

    // getting all Watchlists of the loggedInUser!
    List<WatchlistSummaryDTO> getAllWatchlists(String userEmail);

    WatchlistStockResponseDTO addStockToWatchlist(String userEmail, Long watchlistId, WatchlistStockRequestDTO watchlistStockRequestDTO);

    void deleteStockFromWatchlist(String userEmail, Long watchlistId, String instrumentKey);

    WatchlistResponseDTO getWatchlistById(String userEmail, Long watchlistId);

    void deleteWatchlistById(String userEmail, Long watchlistId);
}
