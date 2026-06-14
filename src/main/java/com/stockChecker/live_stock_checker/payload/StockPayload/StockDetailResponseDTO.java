package com.stockChecker.live_stock_checker.payload.StockPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

// used to send all the details of the stock, when clicked on a specific stock
public class StockDetailResponseDTO {
    private String stockName;
    private String stockSymbol;
    private String exchange;
    private String isin;
    private String instrumentKey;
    private StockFinancialsDTO stockFinancialsDTO;
    private CompanyResponseDTO companyResponseDTO;
}


