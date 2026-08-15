package com.stoxyfinance.service.portfolio;

import com.stoxyfinance.payload.PortfolioPayload.TransactionResponseDTO;

import java.util.List;

public interface PDFService {
    byte[] generateTransactionsPDF(List<TransactionResponseDTO> transactionsList);
}
