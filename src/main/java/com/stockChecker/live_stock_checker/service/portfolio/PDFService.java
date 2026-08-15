package com.stockChecker.live_stock_checker.service.portfolio;

import com.stockChecker.live_stock_checker.payload.PortfolioPayload.TransactionResponseDTO;

import java.util.List;

public interface PDFService {
    byte[] generateTransactionsPDF(List<TransactionResponseDTO> transactionsList);
}
