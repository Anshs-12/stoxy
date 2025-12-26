package com.stockChecker.live_stock_checker.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockSearchResponseDTO {
    String stockName;
    String stockSymbol;
}
