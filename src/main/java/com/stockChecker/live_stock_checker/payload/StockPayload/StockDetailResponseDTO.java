package com.stockChecker.live_stock_checker.payload.StockPayload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

// used to send all the details of the stock, when clicked on a specific stock
public class StockDetailResponseDTO {
    private String stockName;
    private String stockSymbol;
    private String listedExchangeName;
    private String stockWebsite;
    private StockPriceInfoDTO stockPriceInfoDTO;
    private StockFinancialsDTO stockFinancialsDTO;
    private CompanyResponseDTO companyResponseDTO;
}


