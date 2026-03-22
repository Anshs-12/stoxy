package com.stockChecker.live_stock_checker.payload.PortfolioPayload;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BuyStockRequestDTO {

    @NotBlank
    private String stockSymbol;
    @NotNull
    @Min(1)
    private Integer quantity;

}
