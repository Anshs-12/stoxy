package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.config.AuthUtils;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.CreateWatchRequestDTO;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.WatchlistResponseDTO;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.WatchlistSummaryDTO;
import com.stockChecker.live_stock_checker.repository.StockRepository;
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
        String userEmail = authUtils.getLoggedInUserEmail();
        WatchlistResponseDTO watchlistResponseDTO = watchlistService.createWatchlist(userEmail, createWatchRequestDTO);
        return new ResponseEntity<>(watchlistResponseDTO, HttpStatus.CREATED);
    }

    @GetMapping("/")
    public ResponseEntity<List<WatchlistSummaryDTO>> getAllWatchlists() {
        String userEmail = authUtils.getLoggedInUserEmail();
        List<WatchlistSummaryDTO> allWatchlists = watchlistService.getAllWatchlists(userEmail);
        return new ResponseEntity<>(allWatchlists, HttpStatus.OK);
    }
}
