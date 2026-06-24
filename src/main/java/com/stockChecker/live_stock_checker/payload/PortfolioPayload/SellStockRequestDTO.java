package com.stockChecker.live_stock_checker.payload.PortfolioPayload;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SellStockRequestDTO {

    @NotBlank
    private String stockSymbol;
    @NotNull
    @Min(1)
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 10000, message = "Quantity cannot exceed 10,000")
    private Integer quantity;
    @NotNull
    private String instrumentKey;
    @NotNull
    @Positive(message = "Selling price must be strictly greater than zero")
    @DecimalMin(value = "0.01", message = "Selling price must be greater than 0")
    @DecimalMax(value = "100000.00", message = "Selling price cannot exceed 1,00,000")
    private BigDecimal sellingPrice;

}
