package com.stoxyfinance.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

// this response is used to provide the list of NSE trading holidays
public class MarketHolidayResponse {

    String date;
    String holidayName;
}