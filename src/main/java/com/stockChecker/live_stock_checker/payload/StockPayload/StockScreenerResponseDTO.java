package com.stockChecker.live_stock_checker.payload.StockPayload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockScreenerResponseDTO {

    // This response is used for sending in the screenerResponse
    // and not using the LivePrice as more 20 Api calls per request is a lot

    private String stockName;
    private String stockSymbol;
    private CompanyResponseDTO companyResponseDTO;
    private StockFinancialsDTO stockFinancialsDTO;

}
