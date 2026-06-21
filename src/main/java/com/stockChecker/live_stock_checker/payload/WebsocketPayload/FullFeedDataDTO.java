package com.stockChecker.live_stock_checker.payload.WebsocketPayload;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FullFeedDataDTO {

    private String instrumentKey;

    // --- Core Price Data (LTPC) ---
    @JsonProperty("ltp")
    private BigDecimal lastTradedPrice;

    @JsonProperty("ltt")
    private long lastTradedTime;

    @JsonProperty("cp")
    private BigDecimal closePrice;

    // --- Market Depth (Order Book) ---
    // We use a List to hold the 5 rows of buyers and sellers
    @JsonProperty("marketLevel")
    private List<QuoteDTO> marketLevel;

    // --- Market Statistics ---
    @JsonProperty("atp")
    private BigDecimal averageTradedPrice;

    @JsonProperty("vtt")
    private long volumeTradedToday;

    @JsonProperty("oi")
    private BigDecimal openInterest;

    @JsonProperty("iv")
    private BigDecimal impliedVolatility;

    @JsonProperty("tbq")
    private long totalBuyQuantity;

    @JsonProperty("tsq")
    private long totalSellQuantity;

    @JsonProperty("upper_circuit")
    private double upperCircuit;

    @JsonProperty("lower_circuit")
    private double lowerCircuit;
}