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
        PortfolioResponseDTO portfolioResponseDTO = portfolioService.getPortfolio(userEmail);
        return new ResponseEntity<>(portfolioResponseDTO, HttpStatus.OK);
    }

    @PostMapping("/buyStock")
    public ResponseEntity<BuyStockResponseDTO> buyStock(@Valid @RequestBody BuyStockRequestDTO buyStockRequestDTO) {
        String userEmail = getUserEmail();
        BuyStockResponseDTO buyStockResponseDTO = portfolioService.buyStock(userEmail, buyStockRequestDTO);
        return new ResponseEntity<>(buyStockResponseDTO, HttpStatus.OK);

    }

    @PostMapping("/sellStock")
    public ResponseEntity<SellStockResponseDTO> sellStock(@Valid @RequestBody SellStockRequestDTO sellStockRequestDTO) {
        String userEmail = getUserEmail();
        SellStockResponseDTO sellStockResponseDTO = portfolioService.sellStock(userEmail, sellStockRequestDTO);
        return new ResponseEntity<>(sellStockResponseDTO, HttpStatus.OK);
    }

    private String getUserEmail() {
        return authUtils.getLoggedInUserEmail();
    }
}
