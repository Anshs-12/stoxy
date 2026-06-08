//package com.stockChecker.live_stock_checker.controller;
//
//import com.stockChecker.live_stock_checker.config.AuthUtils;
//import com.stockChecker.live_stock_checker.payload.WatchlistPayload.*;
//import com.stockChecker.live_stock_checker.service.WatchlistService;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//
//@RestController
//@RequestMapping("/watchlist")
//@Slf4j
//@RequiredArgsConstructor
//
//public class WatchlistController {
//
//    private final WatchlistService watchlistService;
//
//    private final AuthUtils authUtils;
//
//    @PostMapping("/create")
//    public ResponseEntity<WatchlistResponseDTO> createWatchlist(
//            @RequestBody CreateWatchRequestDTO createWatchRequestDTO
//    ) {
//        String userEmail = getEmail();
//        log.info("Creating watchlist - user: {}, name: {}", userEmail, createWatchRequestDTO.getWatchlistName());
//        WatchlistResponseDTO watchlistResponseDTO = watchlistService.createWatchlist(userEmail, createWatchRequestDTO);
//        return new ResponseEntity<>(watchlistResponseDTO, HttpStatus.CREATED);
//    }
//
//    @GetMapping("/")
//    public ResponseEntity<List<WatchlistSummaryDTO>> getAllWatchlists() {
//        String userEmail = getEmail();
//        log.info("Fetching all watchlists - user: {}", userEmail);
//        List<WatchlistSummaryDTO> allWatchlists = watchlistService.getAllWatchlists(userEmail);
//        return new ResponseEntity<>(allWatchlists, HttpStatus.OK);
//    }
//
//    @PostMapping("/{watchlistId}/stocks")
//    public ResponseEntity<WatchlistStockResponseDTO> addStockToWatchlist(
//            @PathVariable Long watchlistId, @RequestBody WatchlistStockRequestDTO watchlistStockRequestDTO) {
//        String userEmail = getEmail();
//        log.info("Adding stock to watchlist - user: {}, watchlistId: {}, symbol: {}", userEmail, watchlistId, watchlistStockRequestDTO.getStockSymbol());
//        WatchlistStockResponseDTO watchlistStockResponseDTO =
//                watchlistService.addStockToWatchlist(userEmail, watchlistId, watchlistStockRequestDTO);
//        return new ResponseEntity<>(watchlistStockResponseDTO, HttpStatus.OK);
//    }
//
//    @DeleteMapping("/{watchlistId}/stocks")
//    public ResponseEntity<Void> deleteStockFromWatchlist(
//            @PathVariable Long watchlistId, @RequestBody WatchlistStockRequestDTO watchlistStockRequestDTO
//    ) {
//        String userEmail = getEmail();
//        log.info("Removing stock from watchlist - user: {}, watchlistId: {}, symbol: {}", userEmail, watchlistId, watchlistStockRequestDTO.getStockSymbol());
//        watchlistService.deleteStockFromWatchlist(userEmail, watchlistId, watchlistStockRequestDTO);
//        return ResponseEntity.noContent().build();
//    }
//
//    @GetMapping("/{watchlistId}")
//    public ResponseEntity<WatchlistResponseDTO> getWatchlistById(
//            @PathVariable Long watchlistId) {
//        String userEmail = getEmail();
//        log.info("Fetching watchlist - user: {}, watchlistId: {}", userEmail, watchlistId);
//        WatchlistResponseDTO watchlistResponseDTO =
//                watchlistService.getWatchlistById(userEmail, watchlistId);
//        return new ResponseEntity<>(watchlistResponseDTO, HttpStatus.OK);
//    }
//
//    @DeleteMapping("/{watchlistId}")
//    public ResponseEntity<Void> deleteWatchlistById(@PathVariable Long watchlistId) {
//        String userEmail = getEmail();
//        log.info("Deleting watchlist - user: {}, watchlistId: {}", userEmail, watchlistId);
//        watchlistService.deleteWatchlistById(userEmail, watchlistId);
//        return ResponseEntity.noContent().build();
//    }
//
//    private String getEmail() {
//        return authUtils.getLoggedInUserEmail();
//
//    }
//}
