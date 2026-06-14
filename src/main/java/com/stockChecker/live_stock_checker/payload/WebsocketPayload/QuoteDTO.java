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
public class QuoteDTO {
    @JsonProperty("bidQ")
    private long bidQuantity;

    @JsonProperty("bidP")
    private BigDecimal bidPrice;

    @JsonProperty("askQ")
    private long askQuantity;

    @JsonProperty("askP")
    private BigDecimal askPrice;
}
