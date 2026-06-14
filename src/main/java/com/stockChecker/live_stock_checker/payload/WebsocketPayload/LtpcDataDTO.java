package com.stockChecker.live_stock_checker.payload.WebsocketPayload;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class LtpcDataDTO {

    private String instrumentKey;

    // Java sees 'lastTradedPrice', React receives '{"ltp": 48500.50}'
    @JsonProperty("ltp")
    private BigDecimal lastTradedPrice;

    @JsonProperty("ltt")
    private long lastTradedTime;

    @JsonProperty("cp")
    private BigDecimal closePrice;
}