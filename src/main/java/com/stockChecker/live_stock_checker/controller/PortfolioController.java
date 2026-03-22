package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.config.AuthUtils;
import com.stockChecker.live_stock_checker.payload.PortfolioPayload.BuyStockRequestDTO;
import com.stockChecker.live_stock_checker.payload.PortfolioPayload.PortfolioResponseDTO;
import com.stockChecker.live_stock_checker.service.PortfolioService;
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
    public ResponseEntity<String> buyStock(@RequestBody BuyStockRequestDTO buyStockRequestDTO) {
        String userEmail = getUserEmail();
        String message = portfolioService.buyStock(userEmail, buyStockRequestDTO);
        return new ResponseEntity<>(message, HttpStatus.OK);

    }

    private String getUserEmail() {
        return authUtils.getLoggedInUserEmail();
    }
}
