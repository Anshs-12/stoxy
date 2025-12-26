package com.stockChecker.live_stock_checker.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class StockDetailResponseDTO {

    private String stockSymbol;
    private String stockName;
    private String aboutStock;
    private String listedExchangeName;
    private String stockWebsite;
}
