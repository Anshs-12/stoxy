package com.stockChecker.live_stock_checker.payload.PortfolioPayload;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BuyStockRequestDTO {

    @NotBlank
    private String stockSymbol;
    @NotNull
    @Min(1)
    private Integer quantity;
    @NotNull
    @Positive(message = "Buying price must be strictly greater than zero")
    private BigDecimal buyPrice;
    @NotNull
    private String instrumentKey;
    @NotNull
    private String isin;
}
