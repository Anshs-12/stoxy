package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.PortfolioPayload.*;

import java.util.List;

public interface PortfolioService {
    PortfolioResponseDTO getPortfolio(String userEmail);

    BuyStockResponseDTO buyStock(String userEmail, BuyStockRequestDTO buyStockRequestDTO);

    SellStockResponseDTO sellStock(String userEmail, SellStockRequestDTO sellStockRequestDTO);

    List<TransactionResponseDTO> getTransactionsByStock(String userEmail, String stockSymbol);

    List<TransactionResponseDTO> getTransactionHistory(String userEmail);
}
