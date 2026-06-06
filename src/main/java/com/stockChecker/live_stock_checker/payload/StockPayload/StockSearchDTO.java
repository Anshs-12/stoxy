package com.stockChecker.live_stock_checker.payload.StockPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StockSearchDTO {
    String stockName;
    String stockSymbol;
    String companyName;
    String exchange;
    String instrumentKey;
    String isin;
}
