package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.config.AuthUtils;
import com.stockChecker.live_stock_checker.payload.PortfolioPayload.*;
import com.stockChecker.live_stock_checker.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/portfolio")
@RequiredArgsConstructor
@Slf4j
public class PortfolioController {

    private final PortfolioService portfolioService;

    private final AuthUtils authUtils;

    @GetMapping("/")
    public ResponseEntity<PortfolioResponseDTO> getPortfolio() {
        String userEmail = getUserEmail();
        log.info("Fetching portfolio - user: {}", userEmail);
        PortfolioResponseDTO portfolioResponseDTO = portfolioService.getPortfolio(userEmail);
        return new ResponseEntity<>(portfolioResponseDTO, HttpStatus.OK);
    }

    @PostMapping("/buyStock")
    public ResponseEntity<BuyStockResponseDTO> buyStock(@Valid @RequestBody BuyStockRequestDTO buyStockRequestDTO) {
        String userEmail = getUserEmail();
        log.info("Buying stock - user: {}, symbol: {}, quantity: {}",
                userEmail, buyStockRequestDTO.getStockSymbol(), buyStockRequestDTO.getQuantity());
        BuyStockResponseDTO buyStockResponseDTO = portfolioService.buyStock(userEmail, buyStockRequestDTO);
        return new ResponseEntity<>(buyStockResponseDTO, HttpStatus.OK);

    }

    @PostMapping("/sellStock")
    public ResponseEntity<SellStockResponseDTO> sellStock(@Valid @RequestBody SellStockRequestDTO sellStockRequestDTO) {
        String userEmail = getUserEmail();
        log.info("Selling stock - user: {}, symbol: {}, quantity: {}",
                userEmail, sellStockRequestDTO.getStockSymbol(), sellStockRequestDTO.getQuantity());
        SellStockResponseDTO sellStockResponseDTO = portfolioService.sellStock(userEmail, sellStockRequestDTO);
        return new ResponseEntity<>(sellStockResponseDTO, HttpStatus.OK);
    }

    // returns the user transactional information regarding each stock!
    @GetMapping("/transaction/{stockSymbol}")
    public ResponseEntity<List<TransactionResponseDTO>> getTransactionsByStock(@PathVariable String stockSymbol) {
        String userEmail = getUserEmail();
        log.info("Fetching transactions for stock - user: {}, symbol: {}", userEmail, stockSymbol);
        List<TransactionResponseDTO> transactionResponseDTOList = portfolioService.getTransactionsByStock(userEmail, stockSymbol);
        return new ResponseEntity<>(transactionResponseDTOList, HttpStatus.OK);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<TransactionResponseDTO>> getTransactionHistory() {
        String userEmail = getUserEmail();
        log.info("Fetching transaction history - user: {}", userEmail);
        List<TransactionResponseDTO> transactionHistory = portfolioService.getTransactionHistory(userEmail);
        return new ResponseEntity<>(transactionHistory, HttpStatus.OK);
    }

    @GetMapping("/transactions/export")
    public ResponseEntity<byte[]> returnTransactionHistoryPDF() {
        String userEmail = getUserEmail();
        log.info("Exporting transaction history as PDF - user: {}", userEmail);
        byte[] transactionPDF = portfolioService.getTransactionHistoryPDF(userEmail);
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"transactions.pdf\"")
                .body(transactionPDF);
    }

    private String getUserEmail() {
        return authUtils.getLoggedInUserEmail();
    }
}
