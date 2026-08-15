package com.stoxyfinance.service.portfolio;

import com.stoxyfinance.payload.PortfolioPayload.*;
import com.stoxyfinance.payload.PortfolioPayload.*;

import java.util.List;

public interface PortfolioService {
    PortfolioResponseDTO getPortfolio(String userEmail);

    BuyStockResponseDTO buyStock(String userEmail, BuyStockRequestDTO buyStockRequestDTO);

    SellStockResponseDTO sellStock(String userEmail, SellStockRequestDTO sellStockRequestDTO);

    List<TransactionResponseDTO> getTransactionsByStock(String userEmail, String stockSymbol);

    List<TransactionResponseDTO> getTransactionHistory(String userEmail);

    byte[] getTransactionHistoryPDF(String userEmail);
}
