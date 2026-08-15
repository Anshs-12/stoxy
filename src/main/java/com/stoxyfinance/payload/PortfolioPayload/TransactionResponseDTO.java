package com.stoxyfinance.payload.PortfolioPayload;

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
