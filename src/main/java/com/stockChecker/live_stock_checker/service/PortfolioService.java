package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.PortfolioPayload.BuyStockRequestDTO;
import com.stockChecker.live_stock_checker.payload.PortfolioPayload.PortfolioResponseDTO;

public interface PortfolioService {
    PortfolioResponseDTO getPortfolio(String userEmail);

    String buyStock(String userEmail, BuyStockRequestDTO buyStockRequestDTO);
}
