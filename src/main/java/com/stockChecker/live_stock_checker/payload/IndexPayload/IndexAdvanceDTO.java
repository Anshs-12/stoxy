package com.stockChecker.live_stock_checker.payload.IndexPayload;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class IndexAdvanceDTO {
    private Integer declines;
    private Integer advances;
    private Integer unChanged;
}
