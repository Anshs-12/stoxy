package com.stockChecker.live_stock_checker.payload.PortfolioPayload;

import com.stockChecker.live_stock_checker.model.TransactionType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class TransactionResponseDTO {

    private Long portfolioId;

    private String stockSymbol;

    private Integer quantity;

    private BigDecimal price;

    private String type;

    private LocalDateTime transactionAt;
}
