package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.payload.WatchlistPayload.CreateWatchRequestDTO;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.WatchlistResponseDTO;
import com.stockChecker.live_stock_checker.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/watchlist")
@Slf4j
@RequiredArgsConstructor

public class WatchlistController {

    private final WatchlistService watchlistService;

    @PostMapping("/create")
    public ResponseEntity<WatchlistResponseDTO> createWatchlist(
            @RequestBody CreateWatchRequestDTO createWatchRequestDTO
    ) {
        String userEmail = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal()
                .toString();
        WatchlistResponseDTO watchlistResponseDTO = watchlistService.createWatchlist(userEmail, createWatchRequestDTO);
        return new ResponseEntity<>(watchlistResponseDTO, HttpStatus.CREATED);
    }
}
