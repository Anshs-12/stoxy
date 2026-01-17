package com.stockChecker.live_stock_checker.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

// this response is used to provide the status of the market
public class MarketStatusResponse {

    Boolean isOpen;
    LocalTime nextOpeningTime;
    String nextOpeningDay;
    LocalTime lastClosingTime;
    String lastClosingDay;

}
