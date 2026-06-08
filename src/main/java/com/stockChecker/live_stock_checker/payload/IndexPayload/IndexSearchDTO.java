package com.stockChecker.live_stock_checker.payload.IndexPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class IndexSearchDTO {
    private String indexName;
    private String indexSymbol;
    private String exchange;
    private String segment;
    private String instrumentKey;
}
