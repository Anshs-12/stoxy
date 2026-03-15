package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.config.AuthUtils;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.*;
import com.stockChecker.live_stock_checker.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/watchlist")
@Slf4j
@RequiredArgsConstructor

public class WatchlistController {

    private final WatchlistService watchlistService;

    private final AuthUtils authUtils;

    @PostMapping("/create")
    public ResponseEntity<WatchlistResponseDTO> createWatchlist(
            @RequestBody CreateWatchRequestDTO createWatchRequestDTO
    ) {
        String userEmail = getEmail();
        WatchlistResponseDTO watchlistResponseDTO = watchlistService.createWatchlist(userEmail, createWatchRequestDTO);
        return new ResponseEntity<>(watchlistResponseDTO, HttpStatus.CREATED);
    }

    @GetMapping("/")
    public ResponseEntity<List<WatchlistSummaryDTO>> getAllWatchlists() {
        String userEmail = getEmail();
        List<WatchlistSummaryDTO> allWatchlists = watchlistService.getAllWatchlists(userEmail);
        return new ResponseEntity<>(allWatchlists, HttpStatus.OK);
    }

    @PostMapping("/{watchlistId}/stocks")
    public ResponseEntity<WatchlistStockResponseDTO> addStockToWatchlist(
            @PathVariable Long watchlistId, @RequestBody WatchlistStockRequestDTO watchlistStockRequestDTO) {
        String userEmail = getEmail();
        WatchlistStockResponseDTO watchlistStockResponseDTO =
                watchlistService.addStockToWatchlist(userEmail, watchlistId, watchlistStockRequestDTO);
        return new ResponseEntity<>(watchlistStockResponseDTO, HttpStatus.OK);
    }

    @DeleteMapping("/{watchlistId}/stocks")
    public ResponseEntity<Void> deleteStockFromWatchlist(
            @PathVariable Long watchlistId, @RequestBody WatchlistStockRequestDTO watchlistStockRequestDTO
    ) {
        String userEmail = getEmail();
        watchlistService.deleteStockFromWatchlist(userEmail, watchlistId, watchlistStockRequestDTO);
        return ResponseEntity.noContent().build();
    }

    private String getEmail() {
        return authUtils.getLoggedInUserEmail();

    }
}
